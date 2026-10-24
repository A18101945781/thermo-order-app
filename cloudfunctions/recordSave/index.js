// 云函数入口文件 - 订单记录管理
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
      case 'save':
        return await doSave(event)
      case 'list':
        return await doList(event)
      case 'get':
        return await doGet(event)
      case 'delete':
        return await doDelete(event)
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('recordSave 异常:', e)
    return fail(e.message || '服务器异常')
  }
}

/**
 * 保存订单记录
 */
async function doSave(event) {
  const { data } = event
  if (!data) return fail('缺少参数 data')

  const record = {
    ...data,
    createTime: data.createTime || new Date().toISOString()
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

/**
 * 分页查询订单记录，支持日期筛选
 * @param {Number} event.page - 页码，从1开始，默认1
 * @param {Number} event.pageSize - 每页条数，默认20
 * @param {String} event.startDate - 开始日期 (YYYY-MM-DD)
 * @param {String} event.endDate - 结束日期 (YYYY-MM-DD)
 */
async function doList(event) {
  const { page = 1, pageSize = 20, startDate, endDate } = event

  // 构建查询条件
  const where = {}
  if (startDate || endDate) {
    where.createTime = {}
    if (startDate) {
      where.createTime = _.gte(new Date(startDate + 'T00:00:00').toISOString())
    }
    if (endDate) {
      where.createTime = startDate
        ? _.and(_.gte(new Date(startDate + 'T00:00:00').toISOString()), _.lte(new Date(endDate + 'T23:59:59').toISOString()))
        : _.lte(new Date(endDate + 'T23:59:59').toISOString())
    }
  }

  // 查询总数
  const countRes = await db.collection('orderRecord').where(where).count()
  const total = countRes.total

  // 分页查询
  const skip = (page - 1) * pageSize
  const res = await db.collection('orderRecord')
    .where(where)
    .orderBy('createTime', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  return success({
    list: res.data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  })
}

/** 获取单个订单记录 */
async function doGet(event) {
  const { id } = event
  if (!id) return fail('缺少参数 id')
  const res = await db.collection('orderRecord').doc(id).get()
  return success(res.data)
}

/** 删除订单记录 */
async function doDelete(event) {
  const { id } = event
  if (!id) return fail('缺少参数 id')
  await db.collection('orderRecord').doc(id).remove()
  return success({ _id: id })
}
