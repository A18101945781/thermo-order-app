// 云函数入口文件 - 库存管理（电脑 / 手机双端同步）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 标准响应格式
const success = (data) => ({ code: 0, data, message: 'success' })
const fail = (msg) => ({ code: -1, data: null, message: msg })

// 库存以单文档存储（_id 固定 'global'），两端读写同一文档即自动同步
const COL = 'dishStock'
const GID = 'global'

exports.main = async (event, context) => {
  const { action } = event
  try {
    switch (action) {
      case 'list':
        return await doList()
      case 'save':
        return await doSave(event)
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('stockManage 异常:', e)
    return fail(e.message || '服务器异常')
  }
}

/**
 * 读取库存表 { dishId: 现有库存份数 }
 */
async function doList() {
  try {
    const res = await db.collection(COL).doc(GID).get()
    return success((res.data && res.data.map) || {})
  } catch (e) {
    // 文档尚不存在（首次使用）→ 返回空表
    return success({})
  }
}

/**
 * 保存整张库存表（覆盖式 upsert）
 * 🔴 2026-10-04：data 里不能带保留字段 `_id`（update/set 会报 -501007），文档 id 由 doc(GID) 指定即可。
 */
async function doSave(event) {
  const map = event.map || {}
  await db.collection(COL).doc(GID).set({ data: { map: map, updatedAt: Date.now() } })
  return success(map)
}
