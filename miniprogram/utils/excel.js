/**
 * excel.js — 小程序端 Excel 解析与导出
 * 适配 采购计划/原料采购清单/SOP配方库/原料库存表/毛利分析 五张表
 */

var format = require('./format.js')

/**
 * 选择 Excel 文件
 * @returns {Promise<string>} tempFilePath
 */
function chooseExcelFile() {
  return new Promise(function(resolve, reject) {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls'],
      success: function(res) {
        if (res.tempFiles && res.tempFiles.length > 0) {
          resolve(res.tempFiles[0].path)
        } else {
          reject(new Error('未选择文件'))
        }
      },
      fail: function(err) {
        reject(err)
      },
    })
  })
}

/**
 * 上传文件到云存储并解析（需云开发）
 * 本地模式下返回空数据，提示用户手动录入
 */
function uploadAndParse(tempFilePath) {
  var app = getApp()
  if (!app || !app.globalData || !app.globalData.cloudReady) {
    return Promise.reject(new Error('本地缓存模式不支持Excel导入，请开通云开发'))
  }
  var cloudPath = 'excel/' + Date.now() + '.xlsx'
  return wx.cloud.uploadFile({
    cloudPath: cloudPath,
    filePath: tempFilePath,
  }).then(function(uploadRes) {
    return wx.cloud.callFunction({
      name: 'fileHandle',
      data: { action: 'parse', fileID: uploadRes.fileID },
    })
  }).then(function(res) {
    if (res.result && res.result.code === 0) {
      return res.result.data
    }
    throw new Error(res.result ? res.result.message : '解析失败')
  })
}

/**
 * 导出数据为 CSV 字符串（本地模式可用）
 * @param {Object} data - {materials, dishes}
 * @returns {string}
 */
function exportToCSV(data) {
  var csv = ''

  // 原料清单
  csv += '原料名称,供应商,分类,单位,单价,当前库存,最低库存\n'
  if (data.materials) {
    data.materials.forEach(function(m) {
      csv += [m.name, m.supplier || '', m.category, m.unit, m.price, m.curStock || 0, m.minStock || 0].join(',') + '\n'
    })
  }

  csv += '\n'

  // 菜品列表
  csv += '菜品名称,套餐类型,售价,每份成本,毛利,毛利率\n'
  if (data.dishes) {
    data.dishes.forEach(function(d) {
      csv += [d.dishName, format.packageLabel(d.packageType), d.sellPrice, d.totalCost, d.profit, (d.grossRate * 100).toFixed(1) + '%'].join(',') + '\n'
    })
  }

  return csv
}

// 本地落盘服务地址（由 tools/start-export-server.bat 启动）
var LOCAL_SAVE_URL = 'http://127.0.0.1:7788/save'
// 带色 XLSX 生成接口（同一服务，内部调 Python + openpyxl）
var LOCAL_XLSX_URL = 'http://127.0.0.1:7788/xlsx'

/**
 * 当前是否 PC 环境（只有 PC 才可能连上 127.0.0.1 本地服务）
 * @returns {boolean}
 */
function isPCPlatform() {
  try {
    var p = (wx.getSystemInfoSync() || {}).platform || ''
    return p === 'devtools' || p === 'windows' || p === 'mac'
  } catch (e) {
    return false
  }
}

/**
 * 尝试让本地服务生成「带供应商配色」的 XLSX 并写到桌面
 * 仅 PC 有意义；服务没开 / 生成失败都返回 {saved:false}，永不 reject
 * @param {Object} payload 与 purchasePlan.buildFullCsv() 入参同构
 *        {title,fileName,dateLabel,sourceLabel,groups,totalMoney,menuSummary,spotSummary}
 * @param {string} fileName 建议文件名（.xlsx）
 * @returns {Promise<{saved:boolean, path?:string, fileName?:string}>}
 */
function trySaveXlsxToDesktop(payload, fileName) {
  return new Promise(function(resolve) {
    wx.request({
      url: LOCAL_XLSX_URL,
      method: 'POST',
      // Python 首次启动 + openpyxl 导入需要点时间，给足 20 秒
      timeout: 20000,
      header: { 'content-type': 'application/json' },
      data: { fileName: fileName, payload: payload },
      success: function(res) {
        if (res.statusCode === 200 && res.data && res.data.ok) {
          console.log('[excel] 带色表格已保存到桌面:', res.data.path)
          resolve({ saved: true, path: res.data.path, fileName: res.data.fileName })
        } else {
          console.warn('[excel] XLSX 接口返回异常:', res.statusCode, res.data)
          resolve({ saved: false })
        }
      },
      fail: function(err) {
        console.warn('[excel] XLSX 接口不可用，降级 CSV:', err.errMsg)
        resolve({ saved: false })
      },
    })
  })
}

/**
 * 保存采购单：PC 优先让本地服务生成**带色 .xlsx**；不可用则原样降级 CSV
 * 复制全文 / 真机分享仍走 CSV（纯文本剪切板存不下颜色）
 * @param {Object} payload 见 trySaveXlsxToDesktop
 * @param {string} fileName 建议文件名（后缀 .csv 会自动换成 .xlsx）
 * @param {string} csvContent 降级用 CSV 全文
 * @returns {Promise<Object|string>} {desktopSaved:true,kind:'xlsx'|'csv',...} 或沙箱路径
 */
function savePurchase(payload, fileName, csvContent) {
  var base = String(fileName || '').replace(/\.(csv|xlsx)$/i, '')
  if (!isPCPlatform()) {
    // 真机连不上本机 127.0.0.1，保持原 CSV 链路（分享给供应商）
    return saveCSV(csvContent, base ? base + '.csv' : undefined)
  }
  return trySaveXlsxToDesktop(payload, (base || '采购单_' + Date.now()) + '.xlsx')
    .then(function(r) {
      if (r.saved) {
        return { desktopSaved: true, kind: 'xlsx', fileName: r.fileName, path: r.path }
      }
      return saveCSV(csvContent, base ? base + '.csv' : undefined)
    })
}

/**
 * 尝试通过本地服务把 CSV 直接写到桌面「小程序订货」文件夹
 * 仅 PC 环境（devtools / windows / mac）尝试；真机不走这条路
 * @returns {Promise<{saved:boolean, fileName?:string, path?:string}>} 永不 reject
 */
function trySaveToDesktop(csvContent, fileName) {
  return new Promise(function(resolve) {
    wx.request({
      url: LOCAL_SAVE_URL,
      method: 'POST',
      timeout: 3000,
      header: { 'content-type': 'application/json' },
      data: { fileName: fileName, content: csvContent },
      success: function(res) {
        if (res.statusCode === 200 && res.data && res.data.ok) {
          console.log('[excel] 已自动保存到桌面:', res.data.path)
          resolve({ saved: true, fileName: res.data.fileName, path: res.data.path })
        } else {
          console.warn('[excel] 本地服务返回异常:', res.statusCode, res.data)
          resolve({ saved: false })
        }
      },
      fail: function(err) {
        console.warn('[excel] 本地落盘服务未启动，走降级方案:', err.errMsg)
        resolve({ saved: false })
      },
    })
  })
}

/**
 * 保存 CSV 文件
 * PC 环境优先调本地服务写到桌面「小程序订货」；服务没开则降级打印 Console
 * 真机走沙箱文件 + 微信分享面板
 * @param {string} csvContent
 * @param {string} [suggestedFileName] - 可选，建议文件名（不含路径）
 * @returns {Promise<string|{desktopSaved:true, fileName:string, path:string}>}
 */
function saveCSV(csvContent, suggestedFileName) {
  var fs = wx.getFileSystemManager()
  var fileName = suggestedFileName || ('export_' + Date.now() + '.csv')
  var filePath = wx.env.USER_DATA_PATH + '/' + fileName
  // 加 BOM 头确保 Excel 正确识别 UTF-8
  var bom = '\uFEFF'

  var platform = 'unknown'
  try {
    var sys = wx.getSystemInfoSync()
    platform = sys.platform || 'unknown'
  } catch (e) {}

  var isPC = platform === 'devtools' || platform === 'windows' || platform === 'mac'

  // 沙箱写入（真机分享必需，PC 也留一份兜底）
  function writeSandbox() {
    return new Promise(function(resolve) {
      fs.writeFile({
        filePath: filePath,
        data: bom + csvContent,
        encoding: 'utf-8',
        success: function() { resolve(filePath) },
        fail: function(err) {
          console.warn('[excel] 沙箱写入失败:', err.errMsg)
          resolve(null)
        },
      })
    })
  }

  if (!isPC) {
    // 真机：必须拿到沙箱路径才能调分享面板
    return writeSandbox().then(function(p) {
      if (!p) throw new Error('文件写入失败')
      return p
    })
  }

  // PC：先试本地服务自动落盘
  return trySaveToDesktop(csvContent, fileName).then(function(r) {
    if (r.saved) {
      return { desktopSaved: true, fileName: r.fileName, path: r.path }
    }
    // 降级：打印到 Console 供复制
    console.log('\n========== 导出文件 ' + fileName + ' ==========')
    console.log(bom + csvContent)
    console.log('========== END (' + (bom + csvContent).length + ' chars) ==========\n')
    return writeSandbox().then(function(p) {
      if (!p) throw new Error('文件写入失败')
      return p
    })
  })
}

/**
 * 分享/打开文件
 * 优先 wx.shareFileMessage 调起微信原生分享面板（可发给文件传输助手/供应商）
 * 失败降级 wx.openDocument 在小程序内预览
 * 再失败 → 复制路径 + 根据 platform 给操作指引
 */
function shareFile(filePath) {
  // 情况一：已由本地服务写入桌面「小程序订货」，无需再分享，直接告知
  if (filePath && typeof filePath === 'object' && filePath.desktopSaved) {
    var isXlsx = filePath.kind === 'xlsx'
    wx.showModal({
      title: '已保存到桌面',
      content: '文件：' + filePath.fileName +
        '\n\n位置：桌面 → 小程序订货 文件夹\n\n' +
        (isXlsx
          ? '表格已按供应商配色（好生活浅蓝 ／ 松食配送浅绿 ／ 赛大厨浅杏），打开即用。\n\n'
          : '') +
        '直接拖进微信发给供应商。',
      showCancel: false,
      confirmText: '好的',
    })
    return
  }

  if (!filePath || typeof filePath !== 'string') {
    wx.showToast({ title: '导出结果异常', icon: 'none' })
    return
  }

  var fileName = filePath.split('/').pop()

  // 1) 优先调起微信原生分享（最直观：直接发给供应商/文件传输助手）
  if (wx.shareFileMessage) {
    wx.shareFileMessage({
      filePath: filePath,
      fileName: fileName,
      success: function() {
        console.log('[excel] shareFileMessage 成功')
      },
      fail: function(err) {
        console.warn('[excel] shareFileMessage 失败，降级 openDocument:', err)
        tryOpenDocument(filePath, fileName)
      },
    })
  } else {
    tryOpenDocument(filePath, fileName)
  }
}

function tryOpenDocument(filePath, fileName) {
  wx.openDocument({
    filePath: filePath,
    showMenu: true,
    fileType: 'csv',
    success: function() {
      console.log('[excel] openDocument 成功:', filePath)
    },
    fail: function(err) {
      console.error('[excel] openDocument 也失败，降级复制路径:', err)
      fallbackCopyPath(filePath, fileName)
    },
  })
}

function fallbackCopyPath(filePath, fileName) {
  wx.setClipboardData({
    data: filePath,
    success: function() {
      var platform = 'unknown'
      try {
        var sys = wx.getSystemInfoSync()
        platform = sys.platform || 'unknown'
      } catch (e) {}
      var hint = getPlatformHint(platform, filePath, fileName)
      wx.showModal({
        title: '文件已生成',
        content: hint,
        showCancel: false,
        confirmText: '我知道了',
      })
    },
    fail: function() {
      wx.showModal({
        title: '文件已生成',
        content: '导出成功，但复制路径失败。\n文件路径：' + filePath,
        showCancel: false,
      })
    },
  })
}

/**
 * 把 CSV 转成 Excel 友好的 TSV 格式并复制到剪贴板
 * 转换要点：
 *   - 行分隔 \n → \r\n（Excel/WPS 粘贴时正确分行）
 *   - 字段分隔 , → \t（Excel/WPS 粘贴时按 Tab 分列）
 *   - 加 UTF-8 BOM（确保中文不乱码）
 *   - 🔴 2026-10-06：换成**按行、按字段的解析**，识别双引号包裹与 "" 转义。
 *     原先直接 line.split(',').join('\t') ⇒ 只要有个字段值含逗号（如备注写「松食 285元/箱, 1.425元/根」），
 *     该行就会被切成多列、整行往后错位一位。当前数据虽未触发，但迟早会踩。
 * @param {string} csv - 标准 CSV 内容
 * @returns {Promise<boolean>}
 */
function csvLineToTsv(line) {
  var cells = []
  var cur = ''
  var inQuote = false
  for (var i = 0; i < line.length; i++) {
    var ch = line.charAt(i)
    if (inQuote) {
      if (ch === '"') {
        if (line.charAt(i + 1) === '"') { cur += '"'; i++ }   // "" = 转义的双引号
        else { inQuote = false }
      } else { cur += ch }
    } else if (ch === '"') {
      inQuote = true
    } else if (ch === ',') {
      cells.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  cells.push(cur)
  return cells.join('\t')
}

function copyCSVAsTable(csv) {
  if (!csv) return Promise.reject(new Error('无内容'))
  // 标准化换行：先 \r\n → \n，再统一 \n → \r\n
  var normalized = csv.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n')
  // 按行拆分，逐行按 CSV 规则解析后再以 Tab 拼接
  var lines = normalized.split('\r\n')
  var tsv = lines.map(function(line) {
    if (!line) return line
    return csvLineToTsv(line)
  }).join('\r\n')
  var data = '\uFEFF' + tsv
  return new Promise(function(resolve, reject) {
    wx.setClipboardData({
      data: data,
      success: function() { resolve(true) },
      fail: function(err) { reject(err) },
    })
  })
}

function getPlatformHint(platform, filePath, fileName) {
  // 路径特征判断：wxfile:// 是真机沙箱路径。开发者工具真机调试模式下
  // wx.getSystemInfoSync().platform 可能误报为 'windows'/'mac'，导致误导用户。
  // 因此优先用路径前缀判定真机，再 fallback 到 platform。
  var looksLikeMobile = filePath && filePath.indexOf('wxfile://') === 0

  if (looksLikeMobile || platform === 'ios' || platform === 'android') {
    return '文件已保存，但微信分享面板调起失败。\n\n文件路径：' + filePath + '\n\n可尝试：1) 在小程序内重新点导出走「复制全文」；2) 重新进入小程序再导出一次。'
  }
  if (platform === 'devtools') {
    return 'IDE 模拟器无法保存文件到 PC 真实磁盘。\n\nCSV 内容已输出到 IDE「调试器 → Console」控制台，请从控制台复制并保存为 .csv 文件。\n\n要直接发给供应商，请扫码真机调试后重试。'
  }
  if (platform === 'windows' || platform === 'mac') {
    return '文件已保存，路径已复制到剪贴板。\n\n请打开「文件资源管理器」(Win) 或「访达」(Mac) 粘贴路径查找文件。\n路径：' + filePath
  }
  return '文件已生成，路径已复制到剪贴板。\n路径：' + filePath
}

module.exports = {
  chooseExcelFile: chooseExcelFile,
  uploadAndParse: uploadAndParse,
  exportToCSV: exportToCSV,
  saveCSV: saveCSV,
  savePurchase: savePurchase,
  isPCPlatform: isPCPlatform,
  shareFile: shareFile,
  copyCSVAsTable: copyCSVAsTable,
}
