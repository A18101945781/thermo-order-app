// 云函数入口文件 - 库存单子（半成品/SKU 库存表）双端同步
//
// 背景（2026-10-03）：
//   `inventory` 是订货页顶部「📦 库存订货」区那张表的 storage key（形如 [{ name, stock }]），
//   与「原料的 curStock」是两套数据。此前它是纯本地（wx.storage 每设备独立沙箱）→ 电脑手机各改各的。
//   本函数把它搬到云上，实现双端同步。
//
// 集合选择说明：
//   复用 `dishStock` 集合，用**独立文档** `_id = 'inventory'` 存放（整表存一个数组）。
//   `dishStock` 原本只被 stockManage（菜品剩几份，doc `_id = 'global'`）使用，而该云函数前端从未调用；
//   两个文档互不干扰。这样做的好处是**用户无需再新建集合**（上次建 6 个集合已够折腾）。
//
// 数据形状：list = [{ name: string, stock: number }]
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const COL = 'dishStock'
const GID = 'inventory'

const success = (data) => ({ code: 0, data, message: 'success' })
const fail = (msg) => ({ code: -1, data: null, message: msg })

exports.main = async (event) => {
  const action = event && event.action
  try {
    switch (action) {
      case 'list':
        return await doList()
      case 'set':
        return await doSet(event)
      case 'updateStock':
        return await doUpdateStock(event)
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('inventoryManage 异常:', e)
    return fail((e && e.message) || '服务器异常')
  }
}

/** 读取整表；文档不存在（首次使用）→ 返回空数组 */
async function doList() {
  try {
    const res = await db.collection(COL).doc(GID).get()
    const list = (res.data && res.data.list) || []
    return success(Array.isArray(list) ? list : [])
  } catch (e) {
    return success([])
  }
}

/** 覆盖式写入整表（迁移 / 批量粘贴导入用） */
async function doSet(event) {
  const raw = Array.isArray(event && event.list) ? event.list : []
  const clean = sanitize(raw)
  await db.collection(COL).doc(GID).set({
    data: { list: clean, updatedAt: Date.now() },
  })
  return success(clean)
}

/**
 * 单项 upsert（订货页直接点数字改库存用）
 * 单文档读-改-写：6 人内部工具，并发冲突概率可忽略。
 */
async function doUpdateStock(event) {
  const name = String((event && event.name) || '').trim()
  const stock = Number((event && event.stock) || 0)
  if (!name) return fail('缺少品名')

  let list = []
  try {
    const res = await db.collection(COL).doc(GID).get()
    list = (res.data && res.data.list) || []
  } catch (e) {
    list = []
  }
  if (!Array.isArray(list)) list = []

  let found = false
  const next = list.map((it) => {
    if (it && it.name === name) {
      found = true
      return Object.assign({}, it, { stock: stock })
    }
    return it
  })
  if (!found) next.push({ name: name, stock: stock })

  await db.collection(COL).doc(GID).set({
    data: { list: next, updatedAt: Date.now() },
  })
  return success(next)
}

/** 清洗：只保留 { name, stock }，品名去空、数量转数字（半成品与原料同名不合并，保持 1:1） */
function sanitize(raw) {
  const out = []
  raw.forEach((it) => {
    if (!it) return
    const name = String(it.name || '').trim()
    if (!name) return
    out.push({ name: name, stock: Number(it.stock) || 0 })
  })
  return out
}
