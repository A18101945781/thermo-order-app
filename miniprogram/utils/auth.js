/**
 * auth.js — 微信登录、用户角色权限校验
 * 纯本地模式，不依赖云函数，确保手机端秒过
 */

/** 权限矩阵 */
var PERMISSIONS = {
  boss: {
    material: { read: true, write: true },
    dish: { read: true, write: true },
    order: { read: true, write: true },
    record: { read: true, write: true },
  },
  purchase: {
    material: { read: true, write: false },
    dish: { read: true, write: false },
    order: { read: true, write: true },
    record: { read: true, write: false },
  },
  kitchen: {
    material: { read: true, write: false },
    dish: { read: true, write: false },
    order: { read: false, write: false },
    record: { read: false, write: false },
  },
}

/**
 * 微信登录（纯本地模式，秒过）
 * @returns {Promise<{openid: string, userInfo: Object}>}
 */
async function wxLogin() {
  // 默认用户信息
  var userInfo = {
    nickName: '热力学用户',
    avatarUrl: '',
  }

  // 尝试读取缓存的用户信息
  try {
    var cached = wx.getStorageSync('temp_userInfo')
    if (cached && cached.nickName) {
      userInfo = cached
    }
  } catch (e) {}

  // 生成本地 openid
  var openid = 'local_' + Date.now()

  // 如果已开通云开发，尝试获取真实 openid（3秒超时保护）
  try {
    var appInstance = getApp()
    if (appInstance && appInstance.globalData && appInstance.globalData.cloudReady && wx.cloud) {
      var res = await Promise.race([
        wx.cloud.callFunction({
          name: 'userAuth',
          data: { action: 'login' },
        }),
        new Promise(function(_, reject) {
          setTimeout(function() { reject(new Error('timeout')) }, 3000)
        }),
      ])
      if (res && res.result && res.result.data && res.result.data.openid) {
        openid = res.result.data.openid
      }
    }
  } catch (e) {
    console.warn('[auth] 云函数登录降级本地模式', e)
  }

  return { openid: openid, userInfo: userInfo }
}

/**
 * 保存用户角色
 */
function saveUserRole(openid, nickname, role) {
  var userInfo = {
    nickName: nickname || '热力学用户',
    avatarUrl: '',
  }
  wx.setStorageSync('temp_userInfo', userInfo)

  try {
    var appInstance = getApp()
    if (appInstance) {
      appInstance.setUserInfo(userInfo, role, openid)
    }
  } catch (e) {
    console.warn('[auth] saveUserRole error', e)
  }
}

/**
 * 权限校验
 * @param {string} role - boss/purchase/kitchen
 * @param {string} action - read/write
 * @param {string} module - material/dish/order/record
 * @returns {boolean}
 */
function checkPermission(role, action, module) {
  if (!role || !PERMISSIONS[role]) return false
  if (!PERMISSIONS[role][module]) return false
  return PERMISSIONS[role][module][action] === true
}

/** 是否为老板 */
function isBoss() {
  try {
    var appInstance = getApp()
    return appInstance && appInstance.globalData && appInstance.globalData.userRole === 'boss'
  } catch (e) {
    return false
  }
}

/** 是否可编辑 */
function canEdit(module) {
  try {
    var appInstance = getApp()
    var role = appInstance && appInstance.globalData ? appInstance.globalData.userRole : ''
    return checkPermission(role, 'write', module)
  } catch (e) {
    return false
  }
}

/** 是否可查看 */
function canRead(module) {
  try {
    var appInstance = getApp()
    var role = appInstance && appInstance.globalData ? appInstance.globalData.userRole : ''
    return checkPermission(role, 'read', module)
  } catch (e) {
    return false
  }
}

/** 获取权限说明表 */
function getPermissionTable() {
  return [
    { role: '鲍勃', dish: 'rw', material: 'rw', order: 'rw', record: 'rw' },
    { role: '采购', dish: 'r', material: 'r', order: 'rw', record: 'r' },
    { role: '后厨', dish: 'r', material: 'r', order: '-', record: '-' },
  ]
}

module.exports = {
  wxLogin: wxLogin,
  saveUserRole: saveUserRole,
  checkPermission: checkPermission,
  isBoss: isBoss,
  canEdit: canEdit,
  canRead: canRead,
  getPermissionTable: getPermissionTable,
}
