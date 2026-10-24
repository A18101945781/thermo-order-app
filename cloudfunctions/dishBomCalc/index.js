// 云函数入口文件 - 菜品BOM配方计算
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const success = (data) => ({ code: 0, data, message: 'success' })
const fail = (msg) => ({ code: -1, data: null, message: msg })

/**
 * 清空集合（循环分页，规避云函数端单次 get() 默认 100 条上限）2026-10-11
 */
async function clearCollection(coll) {
  const MAX = 1000
  for (;;) {
    const res = await db.collection(coll).limit(MAX).get()
    if (!res.data.length) return 0
    await Promise.all(res.data.map(item => db.collection(coll).doc(item._id).remove()))
    if (res.data.length < MAX) return res.data.length
  }
}

exports.main = async (event, context) => {
  const { action } = event

  try {
    switch (action) {
      case 'list':
        return await doList(event)
      case 'get':
        return await doGet(event)
      case 'add':
        return await doAdd(event)
      case 'update':
        return await doUpdate(event)
      case 'delete':
        return await doDelete(event)
      case 'batchImport':
        return await doBatchImport(event)
      case 'recalc':
        return await doRecalc(event)
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('dishBomCalc 异常:', e)
    return fail(e.message || '服务器异常')
  }
}

/**
 * 计算单个菜品的成本与利润
 * @param {Object} dish - 菜品对象（含 bomList）
 * @returns {Object} 更新了 totalCost / grossRate / profit 的菜品对象
 */
function calcDish(dish) {
  if (!dish.bomList || dish.bomList.length === 0) {
    dish.totalCost = 0
    dish.grossRate = 0
    dish.profit = 0
    return dish
  }

  // 总成本 = 各原料(price * useNum)之和
  dish.totalCost = dish.bomList.reduce((sum, item) => {
    const cost = (item.price || 0) * (item.useNum || 0)
    item.cost = cost // 同时更新每条原料的行成本
    return sum + cost
  }, 0)

  dish.sellPrice = dish.sellPrice || 0
  dish.profit = dish.sellPrice - dish.totalCost
  // 毛利率 = 利润 / 售价
  dish.grossRate = dish.sellPrice > 0 ? (dish.profit / dish.sellPrice * 100).toFixed(2) : 0

  return dish
}

/** 查询菜品列表 */
async function doList(event) {
  // 🔴 2026-10-11：补 limit —— 云函数端单次 get() 默认只回 100 条（菜品现 44 道，暂未越界，防患）
  const res = await db.collection('dish').orderBy('createTime', 'desc').limit(1000).get()
  return success(res.data)
}

/** 获取单个菜品 */
async function doGet(event) {
  const { id } = event
  if (!id) return fail('缺少参数 id')
  const res = await db.collection('dish').doc(id).get()
  return success(res.data)
}

/** 新增菜品（自动计算成本） */
async function doAdd(event) {
  const { data } = event
  if (!data || !data.dishName) return fail('缺少参数 data.dishName')

  calcDish(data)
  data.createTime = data.createTime || new Date().toISOString()

  const res = await db.collection('dish').add({ data })
  return success({ _id: res._id })
}

/** 更新菜品（自动重算成本） */
async function doUpdate(event) {
  const { id, data } = event
  if (!id || !data) return fail('缺少参数 id 或 data')

  // 先获取当前记录合并
  const current = await db.collection('dish').doc(id).get()
  const merged = { ...current.data, ...data }
  calcDish(merged)

  await db.collection('dish').doc(id).update({ data: merged })
  return success({ _id: id })
}

/** 删除菜品 */
async function doDelete(event) {
  const { id } = event
  if (!id) return fail('缺少参数 id')
  await db.collection('dish').doc(id).remove()
  return success({ _id: id })
}

/** 批量导入菜品（自动重算成本） */
async function doBatchImport(event) {
  const { list, mode } = event
  if (!list || !Array.isArray(list) || list.length === 0) {
    return fail('缺少参数 list 或 list 为空')
  }

  if (mode === 'overwrite') {
    // 🔴 2026-10-11：改循环分页删除，规避单次 get() 的 100 条上限（原写法删不干净 ⇒ _id 冲突）
    await clearCollection('dish')
  }

  const now = new Date().toISOString()
  const records = list.map(item => {
    item.createTime = item.createTime || now
    return calcDish(item)
  })

  const batchSize = 100
  const result = []
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const addTasks = batch.map(rec => db.collection('dish').add({ data: rec }))
    const resArr = await Promise.all(addTasks)
    resArr.forEach(r => result.push(r._id))
  }

  return success({ count: result.length, ids: result })
}

/**
 * 重算所有含指定原料的菜品
 * @param {String} event.materialName - 原料名称
 */
async function doRecalc(event) {
  const { materialName } = event
  if (!materialName) return fail('缺少参数 materialName')

  // 查找所有 bomList 中包含该原料名称的菜品
  // 由于云数据库不支持数组内字段模糊查询，先查出所有菜品再内存过滤
  // 🔴 2026-10-11：补 limit —— 否则「按原料反查使用它的菜品」只扫前 100 道（菜品现 44 道，防患）
  const allDishes = await db.collection('dish').limit(1000).get()
  const matched = allDishes.data.filter(d => {
    return d.bomList && d.bomList.some(item => item.name === materialName)
  })

  if (matched.length === 0) {
    return success({ updated: 0, message: '没有菜品使用该原料' })
  }

  // 更新原料价格：从 material 表读取最新价格
  // 按名取单价：业务上唯一，limit(1) 明确语义（同时规避默认 100 上限）
  const materialRes = await db.collection('material').where({ name: materialName }).limit(1).get()
  const newPrice = materialRes.data.length > 0 ? (materialRes.data[0].price || 0) : null

  const updateTasks = matched.map(async dish => {
    // 更新 bomList 中对应原料的价格
    if (newPrice !== null) {
      dish.bomList.forEach(item => {
        if (item.name === materialName) {
          item.price = newPrice
        }
      })
    }
    // 重新计算成本
    calcDish(dish)
    return db.collection('dish').doc(dish._id).update({ data: dish })
  })

  await Promise.all(updateTasks)

  return success({ updated: matched.length })
}
