// 云函数入口文件 - 用户认证
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
      case 'login':
        return await doLogin(event, context)
      case 'getUser':
        return await doGetUser(event)
      case 'saveUser':
        return await doSaveUser(event)
      case 'list':
        return await doList(event)
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('userAuth 异常:', e)
    return fail(e.message || '服务器异常')
  }
}

/**
 * 微信登录 - 从云函数上下文获取 openid
 * @returns {Object} { openid, userInfo }
 */
async function doLogin(event, context) {
  // 微信云开发会自动注入用户的 OPENID
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return fail('未获取到 openid，请确认是否在微信环境中调用')
  }

  // 检查是否已有用户记录
  const userRes = await db.collection('user').where({ openid }).limit(1).get()

  let userInfo = null
  if (userRes.data.length > 0) {
    userInfo = userRes.data[0]
  } else {
    // 新用户：自动创建记录
    const newUser = {
      openid,
      nickname: '',
      role: 'user', // 默认角色
      createTime: new Date().toISOString()
    }
    const addRes = await db.collection('user').add({ data: newUser })
    userInfo = { _id: addRes._id, ...newUser }
  }

  return success({ openid, userInfo })
}

/**
 * 根据 openid 获取用户信息
 * @param {String} event.openid
 */
async function doGetUser(event) {
  const { openid } = event
  if (!openid) return fail('缺少参数 openid')

  const res = await db.collection('user').where({ openid }).limit(1).get()
  if (res.data.length === 0) {
    return fail('用户不存在')
  }

  return success(res.data[0])
}

/**
 * 保存/更新用户信息（昵称和角色）
 * @param {String} event.openid
 * @param {String} event.nickname
 * @param {String} event.role - admin | user
 */
async function doSaveUser(event) {
  const { openid, nickname, role } = event
  if (!openid) return fail('缺少参数 openid')

  const updateData = {}
  if (nickname !== undefined) updateData.nickname = nickname
  if (role !== undefined) updateData.role = role

  if (Object.keys(updateData).length === 0) {
    return fail('没有需要更新的数据')
  }

  // 查找用户，存在则更新，不存在则创建
  const existRes = await db.collection('user').where({ openid }).limit(1).get()

  if (existRes.data.length > 0) {
    // 更新现有用户
    await db.collection('user').doc(existRes.data[0]._id).update({ data: updateData })
    return success({ _id: existRes.data[0]._id, updated: true })
  } else {
    // 创建新用户
    const newUser = {
      openid,
      nickname: nickname || '',
      role: role || 'user',
      createTime: new Date().toISOString()
    }
    const addRes = await db.collection('user').add({ data: newUser })
    return success({ _id: addRes._id, updated: false })
  }
}

/** 查询用户列表 */
async function doList(event) {
  // 🔴 2026-10-11：补 limit —— 云函数端单次 get() 默认只回 100 条（现 6 人，防患）
  const res = await db.collection('user').orderBy('createTime', 'desc').limit(1000).get()
  return success(res.data)
}
