// 云函数入口文件 - Excel导出
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const XLSX = require('xlsx')

const success = (data) => ({ code: 0, data, message: 'success' })
const fail = (msg) => ({ code: -1, data: null, message: msg })

exports.main = async (event, context) => {
  const { action } = event

  try {
    switch (action) {
      case 'generate':
        return await doGenerate(event)
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('exportExcel 异常:', e)
    return fail(e.message || '服务器异常')
  }
}

/**
 * 生成 Excel 并上传到云存储
 * @param {Array} event.materialList - 原料列表
 * @param {Array} event.dishList - 菜品列表
 * @returns {Object} { fileID, cloudPath }
 */
async function doGenerate(event) {
  const { materialList = [], dishList = [] } = event

  // 1. 创建工作簿
  const workbook = XLSX.utils.book_new()

  // 2. 生成"采购计划"工作表
  const purchaseData = materialList.map(m => ({
    '原料名称': m.name || '',
    '单位': m.unit || '',
    '单价': m.price || 0,
    '供应商': m.supplier || '',
    '当前库存': m.curStock || 0,
    '最低库存': m.minStock || 0,
    '建议采购量': m.suggestBuy != null ? m.suggestBuy : Math.max(0, (m.minStock || 0) - (m.curStock || 0)),
    '建议采购金额': m.suggestCost != null ? m.suggestCost : 0,
    '备注': m.remark || ''
  }))

  const purchaseSheet = XLSX.utils.json_to_sheet(purchaseData)

  // 设置列宽
  purchaseSheet['!cols'] = [
    { wch: 16 }, { wch: 8 }, { wch: 10 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 20 }
  ]

  XLSX.utils.book_append_sheet(workbook, purchaseSheet, '采购计划')

  // 3. 生成"原料库存表"工作表
  const stockData = materialList.map((m, index) => ({
    '序号': index + 1,
    '原料名称': m.name || '',
    '单位': m.unit || '',
    '单价': m.price || 0,
    '类别': m.category || '',
    '供应商': m.supplier || '',
    '初始库存': m.initStock || 0,
    '入库数量': m.inStock || 0,
    '出库数量': m.outStock || 0,
    '当前库存': m.curStock || 0,
    '最低库存': m.minStock || 0,
    '备注': m.remark || ''
  }))

  const stockSheet = XLSX.utils.json_to_sheet(stockData)
  stockSheet['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 8 }, { wch: 10 },
    { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 }
  ]

  XLSX.utils.book_append_sheet(workbook, stockSheet, '原料库存表')

  // 4. 生成"毛利分析"工作表
  const profitData = dishList.map((d, index) => {
    // 展开 BOM 清单为文本
    let bomStr = ''
    if (d.bomList && d.bomList.length > 0) {
      bomStr = d.bomList.map(b =>
        `${b.name || ''}(${(b.useNum || 0)}${b.unit || ''},${(b.price || 0).toFixed(2)}元)`
      ).join('; ')
    }

    const totalCost = d.totalCost || 0
    const sellPrice = d.sellPrice || 0
    const profit = d.profit != null ? d.profit : (sellPrice - totalCost)
    const grossRate = d.grossRate != null ? d.grossRate : (sellPrice > 0 ? (profit / sellPrice * 100).toFixed(2) : 0)

    return {
      '序号': index + 1,
      '菜品名称': d.dishName || '',
      '包装类型': d.packageType || '',
      'BOM配方': bomStr,
      '总成本': totalCost.toFixed(2),
      '售价': sellPrice.toFixed(2),
      '利润': profit.toFixed(2),
      '毛利率(%)': grossRate
    }
  })

  const profitSheet = XLSX.utils.json_to_sheet(profitData)
  profitSheet['!cols'] = [
    { wch: 6 }, { wch: 18 }, { wch: 12 }, { wch: 50 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }
  ]

  XLSX.utils.book_append_sheet(workbook, profitSheet, '毛利分析')

  // 5. 将工作簿转为 Buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  // 6. 上传到云存储
  const timestamp = Date.now()
  const fileName = `export_${timestamp}.xlsx`
  const cloudPath = `exports/${fileName}`

  const uploadRes = await cloud.uploadFile({
    cloudPath,
    fileContent: buffer
  })

  return success({
    fileID: uploadRes.fileID,
    cloudPath
  })
}
