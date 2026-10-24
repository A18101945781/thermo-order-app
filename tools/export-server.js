/**
 * export-server.js — 采购单自动落盘服务
 *
 * 作用：小程序（IDE 模拟器 / PC 客户端）点「导出采购单」时，
 *      ① POST /xlsx  → 调 Python 生成**带供应商配色的 .xlsx** 写到桌面（首选）
 *      ② POST /save  → 纯文本 CSV 落盘（降级兜底，剪贴板/老链路仍用）
 *
 * 启动：双击 tools/start-export-server.bat
 * 端口：7788（被占用可改 PORT 环境变量）
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec, execFile, execFileSync } = require('child_process')

const PORT = Number(process.env.PORT) || 7788

// ── 采购单 XLSX 生成器（Python + openpyxl）──────────────────────────
// 生成脚本：D:\ai\_gen_purchase_xlsx.py；样式库：D:\ai\_xlsx_style.py
const GEN_SCRIPT = process.env.EXPORT_GEN || 'D:\\ai\\_gen_purchase_xlsx.py'
const IS_WIN = process.platform === 'win32'

/**
 * 找到能跑 openpyxl 的 Python。
 * managed python 不带 openpyxl，必须用 venv；都找不到才退回裸 python。
 */
function resolvePython() {
  if (process.env.EXPORT_PYTHON) return process.env.EXPORT_PYTHON
  const cands = [
    'C:\\Users\\Administrator\\.workbuddy\\binaries\\python\\envs\\default\\Scripts\\python.exe',
    'D:\\Python313\\python.exe',
  ]
  for (const c of cands) {
    if (fs.existsSync(c)) return c
  }
  return IS_WIN ? 'python' : 'python3'
}

/**
 * 调 Python 脚本把 payload JSON 渲染成带色 XLSX
 * @param {string} jsonPath 已写好的入参 JSON
 * @param {string} outPath  目标 .xlsx 绝对路径
 * @param {(err:string|null, out?:string)=>void} cb
 */
function genXlsx(jsonPath, outPath, cb) {
  if (!fs.existsSync(GEN_SCRIPT)) return cb('生成脚本不存在: ' + GEN_SCRIPT)
  const py = resolvePython()
  execFile(py, [GEN_SCRIPT, jsonPath, outPath], { timeout: 90000, encoding: 'utf8' },
    (err, stdout, stderr) => {
      if (err) {
        const detail = String(stderr || err.message || err).trim().slice(0, 500)
        return cb(detail || '生成脚本执行失败')
      }
      if (!fs.existsSync(outPath)) return cb('脚本已退出但未生成文件')
      cb(null, String(stdout || '').trim())
    })
}

// 输出目录：桌面/小程序订货
//
// 🔴 2026-10-11 修复：本机「桌面」被重定向到 D:\UserData\Desktop（注册表 User Shell Folders），
//    而 C:\Users\Administrator\Desktop 是旧位置留下的空壳目录（依然 exists）。
//    老代码按 os.homedir()\Desktop 拼路径 ⇒ 文件全写进那个看不见的空壳里，
//    用户点导出后「桌面上什么都没出现」。
//    ⇒ 一律以注册表里的真实 Desktop 为准，其次才退回 homedir()\Desktop / OneDrive\Desktop。
const SUB_DIR = '小程序订货'

/** 读注册表取真实「桌面」路径（Windows 专用）；取不到返回 '' */
function shellDesktopDir() {
  if (process.platform !== 'win32') return ''
  // ① 首选 reg.exe（最快）
  try {
    const out = execFileSync('reg', ['query',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders',
      '/v', 'Desktop'], { encoding: 'utf8', timeout: 5000 })
    const m = out.match(/Desktop\s+REG_(?:EXPAND_)?SZ\s+(.+?)\s*$/m)
    if (m) return expandEnvVars(m[1].trim())
  } catch (e) { /* reg 不可用（黑名单/权限）→ 走 ② */ }
  // ② PowerShell 的 shell API（reg.exe 被安全策略挡住时的备份通路）
  try {
    const out = execFileSync('powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', "[Environment]::GetFolderPath('Desktop')"],
      { encoding: 'utf8', timeout: 8000 })
    const p = String(out || '').trim()
    if (p && /^[A-Za-z]:\\/.test(p)) return p
  } catch (e) { /* 都取不到就走默认 */ }
  return ''
}

/** 展开 %USERPROFILE% 之类的环境变量占位 */
function expandEnvVars(p) {
  return String(p).replace(/%([^%]+)%/g, (s, name) => process.env[name] || s)
}

function resolveOutDir() {
  if (process.env.EXPORT_DIR) return process.env.EXPORT_DIR
  // ① 配置文件可硬指定（桌面在别处时不用改代码）
  try {
    const cfgPath = path.join(__dirname, 'export-server.config.json')
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
      if (cfg && cfg.outDir) return String(cfg.outDir)
    }
  } catch (e) { /* 配置坏了就往下走自动探测 */ }
  const home = os.homedir()
  const candidates = []
  const real = shellDesktopDir()
  if (real) candidates.push(path.join(real, SUB_DIR))          // ② 系统真实桌面
  candidates.push(path.join(home, 'Desktop', SUB_DIR))         // ③ 默认桌面
  candidates.push(path.join(home, 'OneDrive', 'Desktop', SUB_DIR))  // ④ OneDrive 重定向
  // 🔴 判据必须是「父级桌面目录存在」，**不能**用「子目录已存在」——
  //    空壳桌面 C:\...\Desktop 下早就建过 小程序订货，用子目录存在与否来选会一直选中它。
  for (const c of candidates) {
    if (fs.existsSync(path.dirname(c))) return c
  }
  return candidates[0]
}

const OUT_DIR = resolveOutDir()

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    log('已创建目录: ' + dir)
  }
}

function log(msg) {
  const t = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  console.log('[' + t + '] ' + msg)
}

// 保存后自动在文件管理器中定位文件（仅本机桌面场景有意义）
// 路径由服务端生成（在 OUT_DIR 内），非客户端传入，故无注入风险
function openInExplorer(filePath) {
  // 自检/自动化场景置 EXPORT_NO_OPEN=1，避免弹一堆资源管理器窗口
  if (process.env.EXPORT_NO_OPEN === '1') return
  try {
    const p = filePath.replace(/\//g, '\\')
    if (process.platform === 'win32') {
      // /select, 会在资源管理器中高亮该文件
      exec('explorer.exe /select,"' + p + '"', (err) => {
        if (err) log('打开资源管理器失败: ' + err.message)
      })
    } else if (process.platform === 'darwin') {
      exec('open -R "' + filePath + '"', () => {})
    } else if (process.platform === 'linux') {
      exec('xdg-open "' + path.dirname(filePath) + '"', () => {})
    }
  } catch (e) {
    log('打开资源管理器异常: ' + e.message)
  }
}

// 文件名安全化：去掉路径分隔符与非法字符，防目录穿越
// @param {string} name 原始名
// @param {string} defExt 没有扩展名时补的（默认 .csv）
// @param {string} forceExt 传入则强制改成该扩展名（/save 只收 .csv，/xlsx 只收 .xlsx）
function safeFileName(name, defExt, forceExt) {
  defExt = defExt || '.csv'
  let f = String(name || '').replace(/[\\/:*?"<>|\r\n]/g, '_').trim()
  f = f.replace(/^\.+/, '')
  if (!f) return 'export_' + Date.now() + defExt
  if (forceExt) {
    f = f.replace(/\.(csv|xlsx)$/i, '') + forceExt
  } else if (!/\.(csv|xlsx)$/i.test(f)) {
    f += defExt
  }
  return f.slice(0, 120)
}

// 同名文件加序号，不覆盖
function uniquePath(dir, fileName) {
  let p = path.join(dir, fileName)
  if (!fs.existsSync(p)) return p
  const ext = path.extname(fileName)
  const base = path.basename(fileName, ext)
  for (let i = 2; i < 1000; i++) {
    p = path.join(dir, base + '(' + i + ')' + ext)
    if (!fs.existsSync(p)) return p
  }
  return path.join(dir, base + '_' + Date.now() + ext)
}

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

const server = http.createServer((req, res) => {
  // 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    return res.end()
  }

  // 健康检查：小程序先探测服务是否在跑
  if (req.method === 'GET' && (req.url === '/ping' || req.url === '/')) {
    return sendJSON(res, 200, {
      ok: true,
      dir: OUT_DIR,
      xlsx: fs.existsSync(GEN_SCRIPT),
      gen: GEN_SCRIPT,
      python: resolvePython(),
    })
  }

  // ① 带色 XLSX：body = { fileName, payload|data }，payload 与 buildFullCsv() 入参同构
  if (req.method === 'POST' && req.url === '/xlsx') {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 20 * 1024 * 1024) req.destroy()
    })
    req.on('end', () => {
      let tmpJson = ''
      const cleanupTmp = () => {
        if (!tmpJson) return
        try { fs.unlinkSync(tmpJson) } catch (e) { /* 忽略 */ }
        tmpJson = ''
      }
      try {
        const body = JSON.parse(raw)
        const data = body.payload || body.data
        if (!data || !Array.isArray(data.groups) || !data.groups.length) {
          return sendJSON(res, 400, { ok: false, msg: '缺少采购分组数据（payload.groups 为空）' })
        }
        const fileName = safeFileName(body.fileName, '.xlsx', '.xlsx')
        ensureDir(OUT_DIR)
        const target = uniquePath(OUT_DIR, fileName)
        tmpJson = path.join(os.tmpdir(),
          'purchase_' + Date.now() + '_' + Math.floor(Math.random() * 1e6) + '.json')
        fs.writeFileSync(tmpJson, JSON.stringify(data), 'utf8')

        genXlsx(tmpJson, target, (err) => {
          cleanupTmp()
          if (err) {
            log('❌ XLSX 生成失败: ' + err)
            return sendJSON(res, 500, { ok: false, msg: err })
          }
          openInExplorer(target)
          log('✅ 已生成带色表格: ' + path.basename(target))
          sendJSON(res, 200, {
            ok: true, kind: 'xlsx', path: target, fileName: path.basename(target),
          })
        })
      } catch (e) {
        cleanupTmp()
        log('❌ XLSX 请求异常: ' + e.message)
        sendJSON(res, 500, { ok: false, msg: e.message })
      }
    })
    return
  }

  if (req.method === 'POST' && req.url === '/save') {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 20 * 1024 * 1024) {
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        const payload = JSON.parse(raw)
        const fileName = safeFileName(payload.fileName, '.csv', '.csv')
        const content = String(payload.content || '')
        if (!content) return sendJSON(res, 400, { ok: false, msg: '内容为空' })

        ensureDir(OUT_DIR)
        const target = uniquePath(OUT_DIR, fileName)
        // BOM 头确保 Excel 不乱码（内容里没有才补）
        const bom = '\uFEFF'
        const data = content.charCodeAt(0) === 0xfeff ? content : bom + content
        fs.writeFileSync(target, data, 'utf8')
        openInExplorer(target)

        log('✅ 已保存: ' + path.basename(target) + '  (' + data.length + ' 字符)')
        sendJSON(res, 200, { ok: true, kind: 'csv', path: target, fileName: path.basename(target) })
      } catch (e) {
        log('❌ 保存失败: ' + e.message)
        sendJSON(res, 500, { ok: false, msg: e.message })
      }
    })
    return
  }

  sendJSON(res, 404, { ok: false, msg: 'not found' })
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('\n❌ 端口 ' + PORT + ' 已被占用。')
    console.log('   可能服务已经在运行了，先关掉旧窗口再启动。\n')
  } else {
    console.log('\n❌ 服务启动失败: ' + err.message + '\n')
  }
  setTimeout(() => process.exit(1), 100)
})

server.listen(PORT, '127.0.0.1', () => {
  ensureDir(OUT_DIR)
  const hasGen = fs.existsSync(GEN_SCRIPT)
  console.log('')
  console.log('  ┌───────────────────────────────────────────┐')
  console.log('  │   采购单自动落盘服务  已启动               │')
  console.log('  └───────────────────────────────────────────┘')
  console.log('')
  console.log('   监听地址 : http://127.0.0.1:' + PORT)
  console.log('   保存目录 : ' + OUT_DIR)
  console.log('')
  console.log('   接口     : POST /xlsx  生成带供应商配色的 Excel（首选）')
  console.log('              POST /save  纯文本 CSV 落盘（降级）')
  console.log('')
  if (!hasGen) {
    console.log('   ⚠️ 未找到 XLSX 生成脚本，/xlsx 会失败：' + GEN_SCRIPT)
  }
  console.log('   现在去小程序点「导出采购单」，带色表格会自动出现在上面这个文件夹，')
  console.log('   并显示在资源管理器中（自动定位到该文件）。')
  console.log('   ⚠️ 开发者工具需勾选：详情 → 本地设置 → 不校验合法域名')
  console.log('   关闭本窗口即停止服务。')
  console.log('')
})
