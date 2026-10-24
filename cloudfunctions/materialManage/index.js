// 云函数入口文件 - 原料管理
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 标准响应格式
const success = (data) => ({ code: 0, data, message: 'success' })
const fail = (msg) => ({ code: -1, data: null, message: msg })

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
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('materialManage 异常:', e)
    return fail(e.message || '服务器异常')
  }
}

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

/**
 * 查询原料列表，支持按 category / supplier 筛选
 *
 * 🔴 2026-10-11 修：原为裸 `.get()`。云函数端单次查询**默认只返回 100 条**，
 *    而材料库有 106 条 ⇒ 排在后段的原料被静默吞掉，
 *    前端 `calc.buildPurchasePlan` 按名字找不到它们 ⇒ 采购单里这些原料的
 *    供应商变成「未知供应商」、单价和规格全变 0
 *    （实例：意大利通心形（弯管）面 mat_108，seed 里是 好生活 ¥20.6/kg，
 *     采购单却算成 未知供应商 ¥0，金额直接少算）。
 *    云函数端 limit 上限 1000，这里显式给足以避免默认截断。
 */
async function doList(event) {
  const { category, supplier } = event
  const where = {}
  if (category) where.category = category
  if (supplier) where.supplier = supplier

  const res = await db.collection('material').where(where).orderBy('createTime', 'desc').limit(1000).get()
  return success(res.data)
}

/**
 * 根据 _id 获取单个原料
 */
async function doGet(event) {
  const { id } = event
  if (!id) return fail('缺少参数 id')
  const res = await db.collection('material').doc(id).get()
  return success(res.data)
}

/**
 * 新增原料
 */
async function doAdd(event) {
  const { data } = event
  if (!data || !data.name) return fail('缺少参数 data.name')

  const record = {
    ...data,
    createTime: new Date().toISOString()
  }

  // 自动计算 curStock
  if (record.initStock != null) {
    record.inStock = record.inStock || 0
    record.outStock = record.outStock || 0
    record.curStock = record.initStock + record.inStock - record.outStock
  }

  const res = await db.collection('material').add({ data: record })
  return success({ _id: res._id })
}

/**
 * 更新原料
 */
async function doUpdate(event) {
  const { id, data } = event
  if (!id || !data) return fail('缺少参数 id 或 data')

  // 自动重新计算 curStock
  if (data.initStock != null || data.inStock != null || data.outStock != null) {
    // 先取当前记录，合并未传字段后再算
    const current = await db.collection('material').doc(id).get()
    const merged = { ...current.data, ...data }
    data.curStock = (merged.initStock || 0) + (merged.inStock || 0) - (merged.outStock || 0)
  }

  await db.collection('material').doc(id).update({ data })
  return success({ _id: id })
}

/**
 * 删除原料
 */
async function doDelete(event) {
  const { id } = event
  if (!id) return fail('缺少参数 id')
  await db.collection('material').doc(id).remove()
  return success({ _id: id })
}

/**
 * 批量导入原料
 * mode: 'overwrite' 覆盖现有数据 | 'append' 追加
 */
async function doBatchImport(event) {
  const { list, mode } = event
  if (!list || !Array.isArray(list) || list.length === 0) {
    return fail('缺少参数 list 或 list 为空')
  }

  const now = new Date().toISOString()

  if (mode === 'overwrite') {
    // 覆盖模式：先清空所有数据，再批量写入
    // 🔴 2026-10-11 修：原 `db.collection('material').get()` 同样受 100 条上限影响 ——
    //    只能删掉前 100 条，剩下的留在库里；随后按原 _id 重新 add 会 _id 冲突报错、
    //    或造成同一原料两条记录。改为循环分页删干净。
    await clearCollection('material')
  }

  // 批量添加（云函数单次最多插入1000条，分批处理）
  const records = list.map(item => ({
    ...item,
    createTime: item.createTime || now,
    inStock: item.inStock || 0,
    outStock: item.outStock || 0,
    curStock: (item.initStock || 0) + (item.inStock || 0) - (item.outStock || 0)
  }))

  const batchSize = 100
  const result = []
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const addTasks = batch.map(rec => db.collection('material').add({ data: rec }))
    const resArr = await Promise.all(addTasks)
    resArr.forEach(r => result.push(r._id))
  }

  return success({ count: result.length, ids: result })
}
