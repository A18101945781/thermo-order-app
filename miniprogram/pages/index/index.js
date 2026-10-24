/**
 * 首页导航页面
 * 功能：四大功能入口导航 + 存储模式/角色显示 + 登录状态检查
 */
const auth = require('../../utils/auth')
const storage = require('../../utils/storage')
const format = require('../../utils/format')
const { withScrollAnchor } = require('../../utils/scrollAnchor')

Page(withScrollAnchor({
  data: {
    isCloud: false,
    roleLabel: '未登录',
    pageReady: false,
  },

  onLoad() {
    // 首次进入先尝试渲染，避免 onShow 异步未到时页面空白
    this.refresh()
  },

  onShow() {
    this.refresh()
  },

  /** 刷新页面数据（登录态 + 角色 + 存储模式） */
  refresh() {
    try {
      var userInfo = wx.getStorageSync('userInfo')
      var userRole = wx.getStorageSync('userRole')
      if (!userInfo || !userRole) {
        wx.reLaunch({ url: '/pages/login/login' })
        return
      }
      this.setData({
        isCloud: storage.isCloudMode(),
        roleLabel: format.roleLabel(userRole),
        pageReady: true,
      })
    } catch (e) {
      console.error('[index] refresh error:', e)
      this.setData({ pageReady: true })
    }
  },

  /**
   * 导航到指定页面
   * @param {Object} e - 事件对象，e.currentTarget.dataset.page 为目标路径
   */
  navigateTo(e) {
    const page = e.currentTarget.dataset.page
    // tabBar 页面列表（与 app.json 一致）
    var tabBarPages = [
      '/pages/index/index',
      '/pages/dishList/dishList',
      '/pages/orderCalc/orderCalc',
      '/pages/mine/mine'
    ]
    if (tabBarPages.indexOf(page) !== -1) {
      wx.switchTab({
        url: page,
        fail: function(err) {
          console.error('[index] switchTab failed:', page, err)
        }
      })
    } else {
      wx.navigateTo({
        url: page,
        fail: function(err) {
          console.error('[index] navigateTo failed:', page, err)
        }
      })
    }
  }
}))
