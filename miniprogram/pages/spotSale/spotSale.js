/**
 * 散点销量录入页
 * 记录每天实际卖出的「单品 / 单人套餐」份数，沉淀为历史数据，
 * 供订货计算器显示「近7天日均 / 上周同期」参考值。
 * 存储：storage spotSales，按天一条 { _id, date, items:{ id: qty }, updatedAt }
 */
const storage = require('../../utils/storage')

/** 今天 YYYY-MM-DD */
function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

/** 日期 → 周几（中文） */
function weekdayCn(dateStr) {
  const p = (dateStr || '').split('-')
  const w = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getDay()
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][w] || ''
}

Page({
  data: {
    date: todayStr(),
    dateWeek: '',
    items: {},          // { dishId 或 mealId: 份数 }
    dishes: [],         // 单品（packageType = 单品）
    singleMeals: [],    // 单人套餐（category = 单人）
    history: [],        // 最近 7 天记录摘要
    historyCollapsed: false,
    saving: false
  },

  onLoad() {
    this.setData({ dateWeek: weekdayCn(this.data.date) })
    this.loadBasis()
  },

  onShow() {
    this.loadRecord()
    this.loadHistory()
  },

  /** 载入可录入的品项：单品 + 单人套餐（均按价格升序） */
  loadBasis() {
    storage.getDishList().then(dishes => {
      const single = (dishes || []).filter(d => d.packageType === '单品').slice().sort(function (a, b) {
        const pa = Number(a.sellPrice) || 0, pb = Number(b.sellPrice) || 0
        if (pa !== pb) return pa - pb
        return (a.dishName || '').localeCompare(b.dishName || '')
      })
      this.setData({ dishes: single })
    }).catch(() => { })

    storage.getSetMealList().then(list => {
      const single = (list || []).filter(m => m.category === '单人').slice().sort(function (a, b) {
        return (Number(a.price) || 0) - (Number(b.price) || 0)
      })
      this.setData({ singleMeals: single })
    }).catch(() => { })
  },

  /** 载入当前选中日期已保存的记录 */
  loadRecord() {
    storage.getSpotSaleByDate(this.data.date).then(rec => {
      const items = {}
      if (rec && rec.items) {
        Object.keys(rec.items).forEach(k => {
          const v = Number(rec.items[k]) || 0
          if (v > 0) items[k] = v
        })
      }
      this.setData({ items: items })
    }).catch(() => { })
  },

  /** 载入最近 7 天历史摘要 */
  loadHistory() {
    storage.getSpotSaleList().then(list => {
      const hist = (list || []).slice(0, 7).map(r => {
        const keys = Object.keys(r.items || {}).filter(k => (Number(r.items[k]) || 0) > 0)
        const total = keys.reduce((s, k) => s + (Number(r.items[k]) || 0), 0)
        return { date: r.date, week: weekdayCn(r.date), kinds: keys.length, total: total }
      })
      this.setData({ history: hist })
    }).catch(() => { })
  },

  /** 切换日期 */
  onDateChange(e) {
    const d = e.detail.value
    this.setData({ date: d, dateWeek: weekdayCn(d) })
    this.loadRecord()
  },

  /** 回到今天 */
  goToday() {
    const d = todayStr()
    this.setData({ date: d, dateWeek: weekdayCn(d) })
    this.loadRecord()
  },

  /** 份数变更 */
  onQtyChange(e) {
    const id = e.currentTarget.dataset.id
    const v = Number(e.detail.value) || 0
    const items = Object.assign({}, this.data.items)
    if (v > 0) { items[id] = v } else { delete items[id] }
    this.setData({ items: items })
  },

  /** 保存当天（按 date 覆盖） */
  onSave() {
    // 防连点：原生按钮没有 t-button 的 loading 态，用 saving 兜住重复提交
    if (this.data.saving) return
    const date = this.data.date
    const items = this.data.items
    const keys = Object.keys(items).filter(k => (Number(items[k]) || 0) > 0)
    if (keys.length === 0) {
      wx.showToast({ title: '请至少填一项份数', icon: 'none' })
      return
    }
    const clean = {}
    keys.forEach(k => { clean[k] = Number(items[k]) || 0 })
    this.setData({ saving: true })
    storage.saveSpotSale(date, clean).then(() => {
      this.setData({ saving: false })
      wx.showToast({ title: '已保存 ' + date, icon: 'success' })
      this.loadHistory()
    }).catch(() => {
      this.setData({ saving: false })
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  /** 清空当前填写（不删已存记录） */
  onClear() {
    const self = this
    wx.showModal({
      title: '清空份数',
      content: '清空 ' + this.data.date + ' 页面上填的全部份数？（已保存的记录不受影响，需再点保存才会覆盖）',
      success(res) {
        if (res.confirm) self.setData({ items: {} })
      }
    })
  },

  /** 删除当天已保存记录 */
  onDelete() {
    const self = this
    const date = this.data.date
    wx.showModal({
      title: '删除记录',
      content: '删除 ' + date + ' 的销量记录？',
      success(res) {
        if (!res.confirm) return
        storage.deleteSpotSale(date).then(() => {
          self.setData({ items: {} })
          wx.showToast({ title: '已删除', icon: 'success' })
          self.loadHistory()
        })
      }
    })
  },

  onToggleHistory() {
    this.setData({ historyCollapsed: !this.data.historyCollapsed })
  }
})
