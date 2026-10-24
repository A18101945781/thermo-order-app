// 云函数入口文件 - 订单计算
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const success = (data) => ({ code: 0, data, message: 'success' })
const fail = (msg) => ({ code: -1, data: null, message: msg })

exports.main = async (event, context) => {
  const { action } = event

  try {
    switch (action) {
      case 'compute':
        return await doCompute(event)
      case 'save':
        return await doSave(event)
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('orderCompute 异常:', e)
    return fail(e.message || '服务器异常')
  }
}

/**
 * 计算订单原料用量
 * @param {Array} event.orderList - 订单列表 [{dishName, quantity}, ...]
 * @param {Number} event.lossRate - 损耗率（百分比，如 5 表示 5%）
 * @returns {Object} { materialTotal, totalMoney }
 */
async function doCompute(event) {
  const { orderList, lossRate = 0 } = event
  if (!orderList || !Array.isArray(orderList) || orderList.length === 0) {
    return fail('缺少参数 orderList 或 orderList 为空')
  }

  const lossFactor = 1 + (lossRate / 100)

  // 1. 收集所有需要的菜品名称
  const dishNames = [...new Set(orderList.map(o => o.dishName))]

  // 2. 从 dish 表获取菜品 BOM 配方
  // 🔴 2026-10-11：补 limit —— 云函数端单次 get() 默认只回 100 条（菜品现 44 道，防患）
  const dishRes = await db.collection('dish').where({
    dishName: _.in(dishNames)
  }).limit(1000).get()

  const dishMap = {}
  dishRes.data.forEach(d => { dishMap[d.dishName] = d })

  // 3. 汇总各原料用量：原料名 → { totalUseNum, unit, price, supplier }
  const materialMap = {}

  for (const order of orderList) {
    const dish = dishMap[order.dishName]
    if (!dish || !dish.bomList) continue

    const qty = order.quantity || 0

    for (const bom of dish.bomList) {
      const name = bom.name
      if (!materialMap[name]) {
        materialMap[name] = {
          name,
          unit: bom.unit || '',
          price: bom.price || 0,
          supplier: '',
          totalUseNum: 0,
          curStock: 0,
          totalCost: 0
        }
      }
      const useNum = (bom.useNum || 0) * qty * lossFactor
      materialMap[name].totalUseNum += useNum
    }
  }

  // 4. 从 material 表获取当前库存和供应商信息
  const materialNames = Object.keys(materialMap)
  if (materialNames.length > 0) {
    // 🔴 2026-10-11：补 limit —— 材料库已 106 条超默认上限；
    //    这里少读到谁，谁的库存/供应商就按空算，采购量会算错
    const materialRes = await db.collection('material').where({
      name: _.in(materialNames)
    }).limit(1000).get()

    materialRes.data.forEach(m => {
      if (materialMap[m.name]) {
        materialMap[m.name].curStock = m.curStock || 0
        materialMap[m.name].supplier = m.supplier || ''
        // 使用原料表中的最新价格
        if (m.price != null) {
          materialMap[m.name].price = m.price
        }
      }
    })
  }

  // 5. 生成 materialTotal 数组
  const materialTotal = Object.values(materialMap).map(item => {
    item.totalCost = item.totalUseNum * item.price
    // 建议采购量 = 总用量 - 当前库存（最小为0）
    const diff = item.totalUseNum - item.curStock
    item.suggestBuy = diff > 0 ? Math.ceil(diff) : 0
    item.suggestCost = item.suggestBuy * item.price
    return item
  })

  // 6. 总金额
  const totalMoney = materialTotal.reduce((sum, item) => sum + item.totalCost, 0)

  return success({ materialTotal, totalMoney })
}

/**
 * 保存订单到 orderRecord 集合
 * @param {Object} event.orderData - 完整的订单数据
 */
async function doSave(event) {
  const { orderData } = event
  if (!orderData) return fail('缺少参数 orderData')

  const record = {
    ...orderData,
    createTime: orderData.createTime || new Date().toISOString()
  }

  // 自动生成订单号
  if (!record.orderNum) {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const h = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const s = String(now.getSeconds()).padStart(2, '0')
    record.orderNum = 'ORD' + y + m + d + h + min + s
  }

  const res = await db.collection('orderRecord').add({ data: record })
  return success({ _id: res._id, orderNum: record.orderNum })
}
