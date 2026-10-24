/**
 * backup.js —— 全部业务数据的「文件搬运」备份 / 还原（跨设备手动同步）
 *
 * 背景（2026-10-03）：
 *   旧 AppID `wx3efea13680aeca10` 是「微信小程序测试号」——**不支持云开发**、也**无法上传发布**。
 *   已换正式号 `wx729fd1a07658848a`（2026-10-03）。
 *   wx.storage 是每设备独立沙箱，天然不同步。在云开发环境接通之前，用
 *   「导出 JSON 文件 → 发到微信聊天 → 另一台设备导入」兜底；云开发接通后本模块退居"离线备用"。
 *
 * 设计要点：
 *   1. **只搬业务数据**：白名单 DATA_SPEC。种子注入标记（seed_*_injected）、登录态（userInfo/openid/…）、
 *      跨页中转（pendingPurchasePlan）一律不导出 —— 后者导出会让另一台设备串号。
 *   2. **导入默认「合并」**：同键以备份为准（备份是"刚搬过来的那一端"），本机独有的记录保留。
 *      另提供「覆盖」：整份替换，本机独有记录会被丢弃。
 *   3. **导入前必预览**：先解析→汇总→展示「新增 N / 更新 M」，用户确认后才写。
 *   4. 坏 JSON / 结构不符 → 直接报错返回，绝不写入（宁可失败也不污染本机数据）。
 */

// ========== 数据清单（白名单） ==========
// idField：合并时的主键字段；kind：'array' 按 idField 逐条合并，'map' 按对象浅合并
var DATA_SPEC = [
  { key: 'materials',        label: '原料库',      kind: 'array', idField: '_id' },
  { key: 'dishes',           label: '菜品/BOM',    kind: 'array', idField: '_id' },
  { key: 'setMeals',         label: '套餐',        kind: 'array', idField: '_id' },
  { key: 'setMealOverrides', label: '套餐换菜',    kind: 'map' },
  { key: 'adultMeals',       label: '成人预定',    kind: 'array', idField: '_id' },
  { key: 'spotSales',        label: '散点销量',    kind: 'array', idField: 'date' },
  { key: 'orders',           label: '订货历史',    kind: 'array', idField: '_id' },
  { key: 'inventory',        label: '库存',        kind: 'array', idField: 'name' },
]

var BACKUP_TAG = 'thermo-order-app'

// ========== 小工具 ==========

function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}

/** 生成 20261003-0817 形式的时间戳（用于文件名） */
function stamp(d) {
  d = d || new Date()
  return '' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) +
    '-' + pad2(d.getHours()) + pad2(d.getMinutes())
}

/** 生成 2026-10-03 08:17 形式的可读时间 */
function readable(ts) {
  var d = ts ? new Date(ts) : new Date()
  return '' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
    ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes())
}

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

/** 安全取数组长度 */
function len(v) {
  if (Array.isArray(v)) return v.length
  if (isPlainObject(v)) return Object.keys(v).length
  return 0
}

/** 取一条记录的主键值；取不到返回 null（→ 视为新增，不去重） */
function keyOf(item, idField) {
  if (!isPlainObject(item)) return null
  if (idField && item[idField] !== undefined && item[idField] !== null && item[idField] !== '') {
    return String(item[idField])
  }
  if (item._id) return String(item._id)
  return null
}

// ========== 采集 ==========

/**
 * 采集本机全部业务数据
 * @returns {Object} { __meta, materials, dishes, ... }（只含 DATA_SPEC 白名单）
 */
function collectAll() {
  var out = {
    __meta: {
      tag: BACKUP_TAG,
      schema: 1,
      exportTime: Date.now(),
      exportTimeText: readable(),
      counts: {},
    },
  }
  DATA_SPEC.forEach(function (spec) {
    var v = {}
    try {
      v = wx.getStorageSync(spec.key)
    } catch (e) {
      console.warn('[backup] 读取失败:', spec.key, e)
      v = {}
    }
    if (spec.kind === 'array') {
      out[spec.key] = Array.isArray(v) ? v : []
    } else {
      out[spec.key] = isPlainObject(v) ? v : {}
    }
    out.__meta.counts[spec.key] = len(out[spec.key])
  })
  return out
}

/**
 * 生成备份对象 + 文件名
 * @returns {{data:Object, fileName:string, json:string}}
 */
function buildBackup() {
  var data = collectAll()
  var fileName = 'thermo-backup-' + stamp() + '.json'
  return { data: data, fileName: fileName, json: JSON.stringify(data) }
}

// ========== 导出到文件 ==========

/**
 * 把备份写到小程序沙箱，返回文件路径
 * @returns {Promise<{filePath:string, fileName:string, bytes:number, counts:Object}>}
 */
function exportToFile() {
  return new Promise(function (resolve, reject) {
    var b
    try {
      b = buildBackup()
    } catch (e) {
      reject(new Error('采集数据失败：' + (e && e.message ? e.message : e)))
      return
    }
    var filePath = wx.env.USER_DATA_PATH + '/' + b.fileName
    wx.getFileSystemManager().writeFile({
      filePath: filePath,
      data: b.json,
      encoding: 'utf-8',
      success: function () {
        resolve({
          filePath: filePath,
          fileName: b.fileName,
          bytes: b.json.length,
          counts: b.data.__meta.counts,
        })
      },
      fail: function (err) {
        reject(new Error('写入文件失败：' + ((err && err.errMsg) || '')))
      },
    })
  })
}

/**
 * 调起微信原生「转发文件」面板（发给文件传输助手 / 自己的另一个设备）
 * @param {string} filePath
 * @param {string} fileName
 * @returns {Promise<boolean>} 是否成功调起
 */
function shareFile(filePath, fileName) {
  return new Promise(function (resolve) {
    if (!wx.shareFileMessage) {
      wx.showModal({
        title: '当前版本不支持转发',
        content: '微信基础库版本过低，无法调起文件转发面板。\n\n文件已生成在：\n' + filePath,
        showCancel: false,
        confirmText: '知道了',
      })
      resolve(false)
      return
    }
    wx.shareFileMessage({
      filePath: filePath,
      fileName: fileName || filePath.split('/').pop(),
      success: function () {
        resolve(true)
      },
      fail: function (err) {
        // 用户主动取消也走 fail，不当成错误弹窗
        console.warn('[backup] shareFileMessage fail:', err)
        resolve(false)
      },
    })
  })
}

// ========== 选择 / 读取备份文件 ==========

/**
 * 从微信聊天记录里选一个备份 JSON
 * @returns {Promise<{path:string, name:string, size:number}>}
 */
function pickBackupFile() {
  return new Promise(function (resolve, reject) {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: function (res) {
        var f = res && res.tempFiles && res.tempFiles[0]
        if (!f) {
          reject(new Error('没有选择文件'))
          return
        }
        resolve({ path: f.path, name: f.name || '', size: f.size || 0 })
      },
      fail: function (err) {
        var msg = (err && err.errMsg) || ''
        // 用户取消不算错误，交给调用方静默处理
        reject(new Error(/cancel/i.test(msg) ? 'CANCELED' : ('选择文件失败：' + msg)))
      },
    })
  })
}

/** 同步读取文本文件 */
function readText(filePath) {
  return new Promise(function (resolve, reject) {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'utf-8',
      success: function (res) { resolve(String(res.data || '')) },
      fail: function (err) { reject(new Error('读取失败：' + ((err && err.errMsg) || ''))) },
    })
  })
}

// ========== 解析 / 预览 ==========

/**
 * 解析备份文本 → 结构化结果（严格校验，坏数据直接拒绝）
 * @param {string} text
 * @returns {{ok:boolean, error?:string, data?:Object, meta?:Object, rows?:Array}}
 */
function parseBackup(text) {
  var raw
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { ok: false, error: '不是有效的 JSON 文件（可能选错了文件）' }
  }
  if (!isPlainObject(raw)) {
    return { ok: false, error: '备份内容格式不对（顶层不是对象）' }
  }
  var meta = isPlainObject(raw.__meta) ? raw.__meta : null
  if (!meta || meta.tag !== BACKUP_TAG) {
    return { ok: false, error: '这不是《热力学餐厅订货》的备份文件' }
  }
  if (meta.schema !== 1) {
    return { ok: false, error: '备份版本不兼容（文件 v' + meta.schema + '，本机支持 v1）' }
  }

  // 结构校验：白名单里出现的字段，kind 必须吻合
  var data = { __meta: meta }
  var bad = []
  DATA_SPEC.forEach(function (spec) {
    var v = raw[spec.key]
    if (v === undefined || v === null) {
      data[spec.key] = spec.kind === 'array' ? [] : {}
      return
    }
    if (spec.kind === 'array' && !Array.isArray(v)) { bad.push(spec.label + '（应为数组）'); return }
    if (spec.kind === 'map' && !isPlainObject(v)) { bad.push(spec.label + '（应为对象）'); return }
    data[spec.key] = v
  })
  if (bad.length) {
    return { ok: false, error: '备份内容结构异常：' + bad.join('、') }
  }
  return { ok: true, data: data, meta: meta }
}

/**
 * 对比备份与本机，生成逐类预览（不写任何数据）
 * @param {Object} data parseBackup 的 data
 * @returns {Array<{key,label,backupCount,localCount,add,update,keep,drop}>}
 */
function previewMerge(data) {
  var rows = []
  DATA_SPEC.forEach(function (spec) {
    var bk = data[spec.key]
    var local = {}
    try {
      local = wx.getStorageSync(spec.key) || (spec.kind === 'array' ? [] : {})
    } catch (e) {
      local = spec.kind === 'array' ? [] : {}
    }
    var row = {
      key: spec.key,
      label: spec.label,
      backupCount: len(bk),
      localCount: len(local),
      add: 0, update: 0, keep: 0, drop: 0,
    }
    if (spec.kind === 'array') {
      var localMap = {}
      ;(Array.isArray(local) ? local : []).forEach(function (it) {
        var k = keyOf(it, spec.idField)
        if (k !== null) localMap[k] = true
      })
      var seen = {}
      ;(Array.isArray(bk) ? bk : []).forEach(function (it) {
        var k = keyOf(it, spec.idField)
        if (k === null) { row.add++; return }
        if (seen[k]) return           // 备份内部重复，只算一次
        seen[k] = true
        if (localMap[k]) row.update++ // 同键 → 以备份为准
        else row.add++
      })
      Object.keys(localMap).forEach(function (k) {
        if (!seen[k]) { row.keep++; row.drop++ }
      })
    } else {
      var lk = isPlainObject(local) ? local : {}
      Object.keys(isPlainObject(bk) ? bk : {}).forEach(function (k) {
        if (lk[k] !== undefined) row.update++
        else row.add++
      })
      Object.keys(lk).forEach(function (k) {
        if (!(isPlainObject(bk) && bk[k] !== undefined)) { row.keep++; row.drop++ }
      })
    }
    rows.push(row)
  })
  return rows
}

/** 预览合计（用于按钮文案 / 摘要条） */
function summarize(rows) {
  var s = { add: 0, update: 0, keep: 0, drop: 0 }
  ;(rows || []).forEach(function (r) {
    s.add += r.add; s.update += r.update; s.keep += r.keep; s.drop += r.drop
  })
  return s
}

// ========== 写入 ==========

/**
 * 应用导入
 * @param {Object} data  parseBackup 的 data
 * @param {string} mode  'merge'（默认，保留本机独有）| 'replace'（整份替换）
 * @returns {{mode:string, written:Array<{key,label,count}>}}
 */
function applyImport(data, mode) {
  mode = mode === 'replace' ? 'replace' : 'merge'
  var written = []
  DATA_SPEC.forEach(function (spec) {
    var bk = data[spec.key]
    if (bk === undefined || bk === null) return
    var next
    if (spec.kind === 'array') {
      var bkArr = Array.isArray(bk) ? bk : []
      if (mode === 'replace') {
        next = bkArr.slice()
      } else {
        var local = []
        try {
          local = wx.getStorageSync(spec.key) || []
        } catch (e) { local = [] }
        if (!Array.isArray(local)) local = []
        var order = []
        var map = {}
        local.forEach(function (it) {
          var k = keyOf(it, spec.idField)
          if (k === null) { order.push(it); return }   // 无主键的本机记录原样保留
          if (map[k] === undefined) order.push(k)
          map[k] = it
        })
        bkArr.forEach(function (it) {
          var k = keyOf(it, spec.idField)
          if (k === null) { order.push(it); return }   // 无主键的备份记录直接追加
          if (map[k] === undefined) order.push(k)
          map[k] = it                                  // 同键 → 备份覆盖本机
        })
        next = order.map(function (o) { return typeof o === 'string' ? map[o] : o })
      }
    } else {
      var bkMap = isPlainObject(bk) ? bk : {}
      if (mode === 'replace') {
        next = Object.assign({}, bkMap)
      } else {
        var l = {}
        try {
          l = wx.getStorageSync(spec.key) || {}
        } catch (e) { l = {} }
        if (!isPlainObject(l)) l = {}
        next = Object.assign({}, l, bkMap)             // 备份优先
      }
    }
    wx.setStorageSync(spec.key, next)
    written.push({ key: spec.key, label: spec.label, count: len(next) })
  })
  return { mode: mode, written: written }
}

module.exports = {
  DATA_SPEC: DATA_SPEC,
  BACKUP_TAG: BACKUP_TAG,
  readable: readable,
  collectAll: collectAll,
  buildBackup: buildBackup,
  exportToFile: exportToFile,
  shareFile: shareFile,
  pickBackupFile: pickBackupFile,
  readText: readText,
  parseBackup: parseBackup,
  previewMerge: previewMerge,
  summarize: summarize,
  applyImport: applyImport,
}
