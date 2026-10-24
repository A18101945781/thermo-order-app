// 云函数入口文件 - 文件处理（Excel解析）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const XLSX = require('xlsx')

const success = (data) => ({ code: 0, data, message: 'success' })
const fail = (msg) => ({ code: -1, data: null, message: msg })

exports.main = async (event, context) => {
  const { action } = event

  try {
    switch (action) {
      case 'parse':
        return await doParse(event)
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('fileHandle 异常:', e)
    return fail(e.message || '服务器异常')
  }
}

/**
 * 解析上传的 Excel 文件
 * @param {String} event.fileID - 微信云存储文件ID
 * @returns {Object} { materialList, dishList }
 */
async function doParse(event) {
  const { fileID } = event
  if (!fileID) return fail('缺少参数 fileID')

  // 1. 从云存储下载文件
  const downloadRes = await cloud.downloadFile({ fileID })
  const buffer = downloadRes.fileContent

  // 2. 使用 xlsx 解析工作簿
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  // 3. 定义需要解析的5个工作表
  const sheetConfigs = [
    { name: '采购计划', key: 'purchasePlan' },
    { name: '原料采购清单', key: 'purchaseList' },
    { name: 'SOP配方库', key: 'sopFormula' },
    { name: '原料库存表', key: 'materialStock' },
    { name: '毛利分析', key: 'grossProfit' }
  ]

  const parsedData = {}

  for (const config of sheetConfigs) {
    const sheet = workbook.Sheets[config.name]
    if (!sheet) {
      console.warn(`工作表 "${config.name}" 不存在，跳过`)
      parsedData[config.key] = []
      continue
    }

    // sheet_to_json 将工作表转为 JSON 数组
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    parsedData[config.key] = rows
  }

  // 4. 将解析结果映射为 materialList 和 dishList

  // 原料数据：合并 原料库存表(主) + 原料采购清单 + 采购计划 中的原料信息
  const materialList = []

  // 从原料库存表提取原料
  const stockRows = parsedData.materialStock || []
  stockRows.forEach(row => {
    materialList.push({
      name: row['名称'] || row['原料名称'] || row['name'] || '',
      price: parseFloat(row['单价'] || row['price'] || 0),
      unit: row['单位'] || row['unit'] || '',
      category: row['类别'] || row['category'] || '',
      supplier: row['供应商'] || row['supplier'] || '',
      initStock: parseFloat(row['初始库存'] || row['期初库存'] || row['initStock'] || 0),
      inStock: parseFloat(row['入库'] || row['入库数量'] || row['inStock'] || 0),
      outStock: parseFloat(row['出库'] || row['出库数量'] || row['outStock'] || 0),
      curStock: parseFloat(row['当前库存'] || row['库存'] || row['curStock'] || 0),
      minStock: parseFloat(row['最低库存'] || row['安全库存'] || row['minStock'] || 0),
      remark: row['备注'] || row['remark'] || ''
    })
  })

  // 从原料采购清单补充原料（去重）
  const purchaseRows = parsedData.purchaseList || []
  const existingNames = new Set(materialList.map(m => m.name))
  purchaseRows.forEach(row => {
    const name = row['名称'] || row['原料名称'] || row['name'] || ''
    if (name && !existingNames.has(name)) {
      materialList.push({
        name,
        price: parseFloat(row['单价'] || row['price'] || 0),
        unit: row['单位'] || row['unit'] || '',
        category: row['类别'] || row['category'] || '',
        supplier: row['供应商'] || row['supplier'] || '',
        initStock: 0,
        inStock: 0,
        outStock: 0,
        curStock: 0,
        minStock: 0,
        remark: ''
      })
      existingNames.add(name)
    }
  })

  // 从采购计划提取原料
  const planRows = parsedData.purchasePlan || []
  planRows.forEach(row => {
    const name = row['名称'] || row['原料名称'] || row['name'] || ''
    if (name && !existingNames.has(name)) {
      materialList.push({
        name,
        price: parseFloat(row['单价'] || row['price'] || 0),
        unit: row['单位'] || row['unit'] || '',
        category: '',
        supplier: row['供应商'] || row['supplier'] || '',
        initStock: 0,
        inStock: 0,
        outStock: 0,
        curStock: 0,
        minStock: 0,
        remark: ''
      })
      existingNames.add(name)
    }
  })

  // 菜品数据：从 SOP配方库 + 毛利分析 提取
  const dishList = []

  const formulaRows = parsedData.sopFormula || []
  formulaRows.forEach(row => {
    const dishName = row['菜品名称'] || row['名称'] || row['dishName'] || ''
    if (!dishName) return

    // BOM 列表是复合字段，尝试从行中解析多个原料列
    const bomList = []

    // 尝试多种列名模式解析 BOM
    // 模式1: 原料1,用量1,单位1,单价1 / 原料2,用量2,单位2,单价2 ...
    for (let i = 1; i <= 20; i++) {
      const matName = row[`原料${i}`] || row[`原料名称${i}`]
      if (!matName) break

      bomList.push({
        name: matName || '',
        useNum: parseFloat(row[`用量${i}`] || row[`数量${i}`] || 0),
        unit: row[`单位${i}`] || '',
        price: parseFloat(row[`单价${i}`] || 0),
        cost: 0
      })
    }

    // 模式2: 单行包含全部BOM数据（用逗号分隔）
    if (bomList.length === 0) {
      const bomStr = row['BOM'] || row['bomList'] || row['配方'] || ''
      if (bomStr && typeof bomStr === 'string' && bomStr.trim()) {
        // 尝试解析 JSON
        try {
          const parsed = JSON.parse(bomStr)
          if (Array.isArray(parsed)) {
            parsed.forEach(item => bomList.push({
              name: item.name || item.原料名称 || item['name'] || '',
              useNum: parseFloat(item.useNum || item.用量 || item['useNum'] || 0),
              unit: item.unit || item.单位 || item['unit'] || '',
              price: parseFloat(item.price || item.单价 || item['price'] || 0),
              cost: 0
            }))
          }
        } catch (e) {
          // JSON 解析失败，忽略
          console.warn('BOM JSON 解析失败:', dishName)
        }
      }
    }

    dishList.push({
      dishName,
      packageType: row['包装类型'] || row['规格'] || row['packageType'] || '',
      bomList,
      totalCost: parseFloat(row['总成本'] || row['totalCost'] || 0),
      sellPrice: parseFloat(row['售价'] || row['sellPrice'] || 0),
      grossRate: parseFloat(row['毛利率'] || row['grossRate'] || 0),
      profit: parseFloat(row['利润'] || row['profit'] || 0)
    })
  })

  // 从毛利分析表提取菜品（如果SOP配方库为空）
  const profitRows = parsedData.grossProfit || []
  if (dishList.length === 0) {
    profitRows.forEach(row => {
      const dishName = row['菜品名称'] || row['名称'] || row['name'] || ''
      if (!dishName) return

      dishList.push({
        dishName,
        packageType: row['包装类型'] || row['规格'] || '',
        bomList: [],
        totalCost: parseFloat(row['成本'] || row['总成本'] || row['totalCost'] || 0),
        sellPrice: parseFloat(row['售价'] || row['sellPrice'] || 0),
        grossRate: parseFloat(row['毛利率'] || row['grossRate'] || 0),
        profit: parseFloat(row['利润'] || row['profit'] || 0)
      })
    })
  }

  return success({ materialList, dishList })
}
