/**
 * 个人中心页
 * 功能：用户信息展示、数据导出/备份、缓存清理、权限说明、退出登录
 */
const storage = require('../../utils/storage')
const auth = require('../../utils/auth')
const format = require('../../utils/format')
const excel = require('../../utils/excel')
const backup = require('../../utils/backup')
const { withScrollAnchor } = require('../../utils/scrollAnchor')

Page(withScrollAnchor({
  data: {
    nickname: '',
    openid: '',
    roleLabel: '',
    isCloud: false,
    showPermDialog: false,
    permissionContent: '',
    // 导入预览弹窗（2026-10-03）：测试号不支持云开发 → 用备份文件手动搬运
    showImportDialog: false,
    importRows: [],
    importSummary: { add: 0, update: 0, keep: 0, drop: 0 },
    importMode: 'merge',
    importFileName: '',
    importMetaText: ''
  },

  onShow() {
    this.loadUserInfo()
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const userRole = wx.getStorageSync('userRole') || ''
    this.setData({
      nickname: userInfo.nickName || userInfo.nickname || '未登录',
      openid: (userInfo.openid || '').substring(0, 12) + '...',
      roleLabel: format.roleLabel(userRole || userInfo.role || ''),
      isCloud: storage.isCloudMode ? storage.isCloudMode() : false
    })
  },

  /**
   * 进入套餐组成设置（成人套餐换菜，长期生效）
   */
  onSetMealEdit() {
    wx.navigateTo({ url: '/pages/setmealEdit/setmealEdit' })
  },

  /**
   * 进入散点销量录入（单品 / 单人套餐每日实际售出份数）
   */
  onSpotSale() {
    wx.navigateTo({ url: '/pages/spotSale/spotSale' })
  },

  /**
   * 成本看板（2026-10-13 新增）—— 成本核算方案 M7
   * 底部 tabBar 已有 5 项、微信上限即 5，故入口放在这里
   */
  onCostBoard() {
    wx.navigateTo({ url: '/pages/costBoard/costBoard' })
  },

  /**
   * 导出Excel (CSV格式)
   */
  async onExportExcel() {
    wx.showLoading({ title: '正在导出数据...' })
    try {
      const allData = await (storage.exportAllData ? storage.exportAllData() : {})
      const csv = excel.exportToCSV ? excel.exportToCSV(allData) : JSON.stringify(allData)
      const filePath = excel.saveCSV ? excel.saveCSV(csv) : ''
      if (filePath) {
        excel.shareFile ? excel.shareFile(filePath) : wx.showToast({ title: '导出完成', icon: 'success' })
      } else {
        wx.showToast({ title: '导出完成', icon: 'success' })
      }
    } catch (e) {
      console.error('导出Excel失败:', e)
      wx.showToast({ title: '导出失败', icon: 'error' })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 数据备份 —— 导出全部业务数据 JSON，并调起微信「转发文件」面板
   * 2026-10-03：改走 utils/backup.js 的完整白名单（原 storage.exportAllData 只搬 原料/菜品/订单 三类，
   * 库存、套餐、成人预定、散点销量、套餐换菜全都漏了 →「备份了但恢复不出来」）。
   */
  async onBackupData() {
    wx.showLoading({ title: '正在打包...', mask: true })
    let r
    try {
      r = await backup.exportToFile()
    } catch (e) {
      wx.hideLoading()
      console.error('备份失败:', e)
      wx.showToast({ title: (e && e.message) || '备份失败', icon: 'none' })
      return
    }
    wx.hideLoading()

    const counts = r.counts || {}
    const lines = backup.DATA_SPEC
      .filter((s) => counts[s.key] !== undefined)
      .map((s) => `• ${s.label} ${counts[s.key]} 条`)
      .join('\n')

    wx.showModal({
      title: '备份已生成',
      content: `含 ${backup.DATA_SPEC.length} 类数据：\n${lines}\n\n点「去转发」把文件发给「文件传输助手」，另一台设备用「导入数据」还原。`,
      confirmText: '去转发',
      cancelText: '先不发',
      success: (res) => {
        if (res.confirm) backup.shareFile(r.filePath, r.fileName)
      }
    })
  },

  /**
   * 导入数据 —— 从微信聊天记录里选备份 JSON，解析 → 预览 → 确认写入
   * 用户取消选文件 / 文件不是备份 / JSON 坏 → 全程不写任何数据
   */
  async onImportData() {
    let picked
    try {
      picked = await backup.pickBackupFile()
    } catch (e) {
      const msg = (e && e.message) || ''
      if (msg === 'CANCELED') return // 用户取消 → 静默
      wx.showToast({ title: msg || '选择文件失败', icon: 'none' })
      return
    }

    wx.showLoading({ title: '正在读取...', mask: true })
    let text = ''
    try {
      text = await backup.readText(picked.path)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: (e && e.message) || '读取失败', icon: 'none' })
      return
    }
    wx.hideLoading()

    const parsed = backup.parseBackup(text)
    if (!parsed.ok) {
      wx.showModal({ title: '无法导入', content: parsed.error, showCancel: false, confirmText: '知道了' })
      return
    }

    const rows = backup.previewMerge(parsed.data)
    this._importData = parsed.data
    this.setData({
      showImportDialog: true,
      importMode: 'merge',
      importRows: rows,
      importSummary: backup.summarize(rows),
      importFileName: picked.name || '备份文件',
      importMetaText: '备份时间：' + (parsed.meta.exportTimeText || backup.readable(parsed.meta.exportTime))
    })
  },

  /** 切换导入模式（合并 / 整份覆盖） */
  onImportModeChange(e) {
    const mode = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.mode
    if (!mode || mode === this.data.importMode) return
    this.setData({ importMode: mode === 'replace' ? 'replace' : 'merge' })
  },

  /** 关闭导入弹窗（不写数据） */
  onCloseImport() {
    this._importData = null
    this.setData({ showImportDialog: false })
  },

  /** 确认导入 */
  onConfirmImport() {
    const data = this._importData
    if (!data) {
      this.onCloseImport()
      return
    }
    const doIt = () => {
      try {
        backup.applyImport(data, this.data.importMode)
      } catch (e) {
        console.error('导入失败:', e)
        wx.showToast({ title: '导入失败', icon: 'none' })
        return
      }
      this._importData = null
      this.setData({ showImportDialog: false })
      wx.showToast({ title: '导入完成', icon: 'success' })
      // 全部页面重新加载，避免旧内存态继续显示过期数据
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' })
      }, 1500)
    }

    // 整份覆盖会丢本机独有记录 → 二次确认
    if (this.data.importMode === 'replace' && this.data.importSummary.drop > 0) {
      wx.showModal({
        title: '确认整份覆盖？',
        content: `本机有 ${this.data.importSummary.drop} 条记录不在备份里，覆盖后会被删除且无法恢复。`,
        confirmText: '确认覆盖',
        confirmColor: '#FA5151',
        success: (res) => {
          if (res.confirm) doIt()
        }
      })
    } else {
      doIt()
    }
  },

  /**
   * 数据上云 —— 把本机基础数据推到云端（首次同步，云模式专用）2026-10-03
   * 语义：原料/菜品覆盖重建、预定 upsert；订单不迁。可重复点（幂等）。
   */
  onMigrateToCloud() {
    if (!(storage.isCloudMode && storage.isCloudMode())) {
      wx.showModal({
        title: '当前是本地模式',
        content: '还没连上云开发环境，本机数据无需上传。',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }
    if (!storage.migrateLocalDataToCloud) {
      wx.showToast({ title: '当前版本暂不支持', icon: 'none' })
      return
    }

    wx.showModal({
      title: '上传本机数据到云端？',
      content: '会按本机的 原料 / 菜品 / 预定 重建云端数据，手机端登录后即可看到。\n\n⚠️ 请只在「数据最全的那台设备」上点一次。',
      confirmText: '开始上传',
      success: (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '上传中...', mask: true })
        storage.migrateLocalDataToCloud().then((r) => {
          wx.hideLoading()
          wx.showModal({
            title: '上传完成',
            content: '原料 ' + r.materials + ' 条\n菜品 ' + r.dishes + ' 条\n预定 ' + r.adultMeals + ' 条' + (r.adultMealFailed ? '（失败 ' + r.adultMealFailed + ' 条）' : '') + '\n库存 ' + (r.inventory || 0) + ' 项\n\n现在用手机打开小程序登录，就能看到同一份数据了。',
            showCancel: false,
            confirmText: '知道了'
          })
        }).catch((e) => {
          wx.hideLoading()
          console.error('数据上云失败:', e)
          const msg = (e && (e.errMsg || e.message)) || '未知错误'
          wx.showModal({
            title: '上传失败',
            content: msg + '\n\n请确认：① cloudfunctions 已右键「上传并部署」；② 云开发控制台已建好集合 material / dish / adultMeal。',
            showCancel: false,
            confirmText: '知道了'
          })
        })
      }
    })
  },

  /**
   * 清空本地缓存 - 双重确认
   */
  onClearCache() {
    wx.showModal({
      title: '危险操作',
      content: '确认清空所有本地数据？\n\n此操作将删除：\n• 所有原料数据\n• 所有菜品数据\n• 所有订单记录\n• 用户登录信息\n\n此操作不可恢复！',
      confirmText: '确认清空',
      confirmColor: '#FA5151',
      success: (res) => {
        if (!res.confirm) return
        // 二次确认
        wx.showModal({
          title: '再次确认',
          content: '数据清空后无法恢复，确定继续？',
          confirmText: '确定清空',
          confirmColor: '#FA5151',
          success: (res2) => {
            if (!res2.confirm) return
            this.doClearCache()
          }
        })
      }
    })
  },

  /**
   * 执行清空操作
   */
  doClearCache() {
    try {
      // 清除所有本地数据 + 所有种子注入标记（clearAllLocalData 内部通配清除 seed_*_injected，勿再手写版本号清单）
      // ⇒ 「清空缓存」= 回到出厂种子：下次启动会完整重灌原料/菜品/套餐/预定（含科奇两单）
      if (storage.clearAllLocalData) {
        storage.clearAllLocalData()
      } else {
        wx.clearStorageSync()
      }

      wx.showToast({ title: '缓存已清空', icon: 'success' })

      // 清空后跳转到登录页
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/login/login' })
      }, 1500)
    } catch (e) {
      console.error('清空缓存失败:', e)
      wx.showToast({ title: '操作失败', icon: 'error' })
    }
  },

  /**
   * 显示权限说明
   */
  onShowPermissions() {
    const permTable = auth.getPermissionTable ? auth.getPermissionTable() : null
    const userInfo = wx.getStorageSync('userInfo') || {}
    const roleName = format.roleLabel ? format.roleLabel(userInfo.role) : userInfo.role

    let content = `当前角色：${roleName}\n\n`
    if (permTable) {
      content += JSON.stringify(permTable, null, 2)
    } else {
      // 默认权限说明
      const role = userInfo.role
      if (role === 'boss') {
        content += '👔 鲍勃 (老板)\n━━━━━━━━━━━\n• 菜品：查看+编辑\n• 原料：查看+编辑\n• 订货：查看+编辑\n• 报表：查看\n• 导出：允许'
      } else if (role === 'purchase') {
        content += '🛒 采购\n━━━━━━━━━━━\n• 菜品：查看\n• 原料：查看+编辑\n• 订货：查看+编辑\n• 报表：查看\n• 导出：允许'
      } else if (role === 'kitchen') {
        content += '👨‍🍳 后厨\n━━━━━━━━━━━\n• 菜品：查看\n• 原料：查看\n• 订货：查看\n• 报表：查看\n• 导出：不允许'
      }
    }

    this.setData({
      showPermDialog: true,
      permissionContent: content
    })
  },

  /**
   * 关闭权限弹窗
   */
  onClosePermDialog() {
    this.setData({ showPermDialog: false })
  },

  /**
   * 空方法：给弹层面板 catchtap 用，阻止点击面板时冒泡到遮罩导致关闭
   */
  onNoop() {},

  /**
   * 关于系统
   */
  onAbout() {
    wx.showModal({
      title: '关于系统',
      content: '热力学餐厅订货管理系统\n\n版本：v1.0.0\n功能：菜品管理、原料管理、订货计算、历史报表\n\n技术栈：微信小程序 + TDesign\n存储模式：本地缓存 / 云端数据库',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确认退出当前账号？',
      confirmText: '确认退出',
      confirmColor: '#FA5151',
      success: (res) => {
        if (!res.confirm) return
        // 清除用户登录信息
        wx.removeStorageSync('userInfo')
        wx.removeStorageSync('userRole')
        wx.removeStorageSync('openid')
        // 清除 app globalData
        var app = getApp()
        if (app && app.clearUserInfo) {
          app.clearUserInfo()
        }
        // 跳转登录页
        wx.reLaunch({ url: '/pages/login/login' })
      }
    })
  }
}))
