/**
 * 微信授权登录页 — 纯本地模式，不涉及云开发
 * 流程：点登录 → 选角色 → 确认 → 进首页
 */
var auth = require('../../utils/auth')
const { withScrollAnchor } = require('../../utils/scrollAnchor')

Page(withScrollAnchor({
  data: {
    step: 'login',     // 'login' | 'role'
    selectedRole: '',
    openid: '',
    nickName: '',
  },

  /** 微信一键登录 */
  onWxLogin() {
    var that = this
    auth.wxLogin().then(function(res) {
      that.setData({
        step: 'role',
        openid: res.openid,
        nickName: (res.userInfo && res.userInfo.nickName) || '热力学用户',
      })
    }).catch(function(err) {
      console.error('登录失败:', err)
      // 失败也进角色选择，不阻塞
      that.setData({
        step: 'role',
        openid: 'local_' + Date.now(),
        nickName: '热力学用户',
      })
    })
  },

  /** 选择角色 */
  onSelectRole(e) {
    this.setData({ selectedRole: e.currentTarget.dataset.role })
  },

  /** 确认角色，保存并跳转首页 */
  onConfirmRole() {
    if (!this.data.selectedRole) {
      wx.showToast({ title: '请先选择角色', icon: 'none' })
      return
    }

    var that = this
    var role = this.data.selectedRole
    var openid = this.data.openid
    var nickName = this.data.nickName

    // 保存到 app + storage
    auth.saveUserRole(openid, nickName, role)

    // 额外存一份完整用户信息（兼容页面读取）
    wx.setStorageSync('userInfo', {
      openid: openid,
      nickName: nickName,
      role: role,
    })
    wx.setStorageSync('userRole', role)

    wx.showToast({ title: '登录成功', icon: 'success' })

    setTimeout(function() {
      wx.reLaunch({ url: '/pages/index/index' })
    }, 600)
  },
}))
