// 云函数入口文件 - 成人套餐预定管理（电脑 / 手机双端同步）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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
      case 'save':
        return await doSave(event)
      case 'delete':
        return await doDelete(event)
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('bookingManage 异常:', e)
    return fail(e.message || '服务器异常')
  }
}

/**
 * 查询预定列表，支持按 date / customer 筛选；默认按 日期+时间 升序
 */
async function doList(event) {
  const { date, customer } = event
  const cond = {}
  if (date) cond.date = date
  if (customer) cond.customer = customer

  // 🔴 2026-10-04：不要用 .where({})（空条件）+ 双 orderBy —— 个别基础库对空 where / 链式排序会报错，
  // 而前端把 fail 当空数组 ⇒ 页面显示「暂无数据」且毫无提示（本次「找不到导入信息」的帮凶）。
  // 改为：无筛选条件就不调 where，排序放在内存做，彻底避开这条风险。
  let q = db.collection('adultMeal')
  if (Object.keys(cond).length) q = q.where(cond)
  const res = await q.limit(1000).get()
  const list = (res.data || []).slice().sort((a, b) =>
    String(a.date || '').localeCompare(String(b.date || '')) ||
    String(a.time || '').localeCompare(String(b.time || ''))
  )
  return success(list)
}

/**
 * 根据 _id 获取单条预定
 */
async function doGet(event) {
  const { id } = event
  if (!id) return fail('缺少参数 id')
  const res = await db.collection('adultMeal').doc(id).get()
  return success(res.data)
}

/**
 * 新增 / 更新预定（upsert）：
 * 带 data._id 则原地更新，否则云端生成 am_ 前缀 _id；返回完整记录（含 _id）供前端续用
 *
 * 🔴 2026-10-04 修复（本次「批量导入的信息找不到」根因）：
 *   原实现 `doc(_id).set({ data: { ..._id, ... } })` —— 微信云数据库的 **data 里不允许出现保留字段
 *   `_id` / `_openid`**（update / set 共用同一套校验，报 `-501007 invalid parameters | Invalid Key Name: _id`）。
 *   只有 `add()` 允许自定义 `_id`。原写法会让每次写入都抛错 ⇒ 云函数 try/catch 兜成 fail 返回，
 *   而前端只看 `res.result.data`（=null）当空数组 ⇒ 云端永远存不进预定，页面永远「暂无数据」。
 *   现在改为「先 update、没命中再 add」的组合 upsert：两种操作都不带保留字段，且仍保持自定义 _id 幂等。
 */
async function doSave(event) {
  const data = event.data
  if (!data) return fail('缺少参数 data')
  const _id = data._id || 'am_' + Date.now() + '_' + Math.floor(Math.random() * 1000)

  // data 副本：剔除 _id / _openid（保留字段，禁止写进 data）
  const doc = Object.assign({}, data, { createTime: Date.now() })
  delete doc._id
  delete doc._openid

  let updated = 0
  try {
    const up = await db.collection('adultMeal').doc(_id).update({ data: doc })
    updated = (up && up.stats && up.stats.updated) || 0
  } catch (e) {
    updated = 0        // 文档不存在时部分基础库会抛错，视作「需新建」
  }

  if (!updated) {
    // add() 允许自定义 _id（官方：开发者可以自定义 _id，但不可自定义 _openid）
    await db.collection('adultMeal').add({ data: Object.assign({}, doc, { _id: _id }) })
  }

  return success(Object.assign({}, doc, { _id: _id }))
}

/**
 * 删除预定
 */
async function doDelete(event) {
  const { id } = event
  if (!id) return fail('缺少参数 id')
  await db.collection('adultMeal').doc(id).remove()
  return success({ _id: id })
}
