/**
 * 菜品菜单页
 * 功能：二态切换 菜品(售卖单品) / 套餐 + SOP录入入口 + 搜索
 */
const storage = require('../../utils/storage')
const auth = require('../../utils/auth')
const seed = require('../../utils/seed')
const { withScrollAnchor } = require('../../utils/scrollAnchor')

Page(withScrollAnchor({
  data: {
    activeType: 'dish',  // dish=菜品(售卖单品) / meal=套餐
    searchText: '',
    allList: [],
    filteredList: [],
    catTabs: [],      // 分类快捷筛选条 [{name, count}]（2026-10-02）
    activeCat: '全部', // 当前选中分类，'全部'=不过滤
    mealList: [],
    mealRows: [],   // 两列布局:每行 {left:团队, right:单人}
    dishCount: 0,
    mealCount: 0,
    loading: true,
    canAdd: false,
    pageReady: false,
  },

  onLoad() {
    this.setData({ canAdd: auth.canEdit('dish') })
  },

  onShow() {
    var app = getApp()
    if (!app.checkLogin()) return
    this.loadData()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载菜品(售卖单品) + 套餐
   */
  async loadData() {
    this.setData({ loading: true, pageReady: false })
    try {
      const [dishList, mealList] = await Promise.all([
        storage.getDishList(),
        storage.getSetMealList()
      ])
      // 菜品tab展示：单品 + SOP（排除套餐内部成分_COMPOSE + 团队套餐(走预定) + 用户标记不进菜单的单品 hideInOrder, 如鱼香肉丝/咖喱牛腩饭/儿童餐等, 2026-09-16 用户选A:菜单展示页也隐藏）
      // 2026-10-02 用户：恢复展示「现煮面食」「缤纷小食」两类（2026-09-19 曾要求隐藏，现改回），并新增分类快捷筛选条
      const sellableDishes = (dishList || []).filter(d => d.packageType !== '_COMPOSE' && d.packageType !== '团队套餐' && !d.hideInOrder)
      // 套餐排序:价格升序(团队套餐走预定,菜单页只展示单人套餐,2026-09-16 用户:团队套餐取消)
      const sortedMeals = (mealList || []).slice().sort((a, b) => {
        return (a.price || 0) - (b.price || 0)
      })
      // 单栏布局:仅单人套餐(原左团队/右单人并排已取消团队列)
      const singleMeals = sortedMeals.filter(m => m.category === '单人')
      const mealRows = singleMeals.map(m => ({ right: m }))
      // 分类快捷筛选条（2026-10-02）：只列出「实际有菜」的分类，顺序按 DISH_CATEGORY_ORDER
      const catOrder = seed.DISH_CATEGORY_ORDER || []
      const catCount = {}
      sellableDishes.forEach(d => {
        const c = d.dishCategory || '其他'
        catCount[c] = (catCount[c] || 0) + 1
      })
      const catTabs = [{ name: '全部', count: sellableDishes.length }]
      catOrder.forEach(c => { if (catCount[c]) catTabs.push({ name: c, count: catCount[c] }) })
      // 兜底：不在顺序表内的分类追加末尾（'其他' 已在顺序表内，不会重复）
      Object.keys(catCount).forEach(c => {
        if (catOrder.indexOf(c) < 0) catTabs.push({ name: c, count: catCount[c] })
      })
      // 校验当前选中分类仍存在（防数据变动后筛选空白）
      const curCat = this.data.activeCat
      const validCat = catTabs.some(t => t.name === curCat) ? curCat : '全部'
      console.log('[dishList] 售卖菜品:', sellableDishes.length, '/ 单人套餐:', singleMeals.length, '/ 分类:', catTabs.map(t => t.name + '(' + t.count + ')').join(' '))
      this.setData({
        allList: sellableDishes,
        catTabs: catTabs,
        activeCat: validCat,
        mealList: sortedMeals,
        mealRows: mealRows,
        dishCount: sellableDishes.length,
        mealCount: singleMeals.length,
        pageReady: true,
      })
      this.applyFilter()
    } catch (e) {
      console.error('[dishList] 加载失败:', e)
      wx.showToast({ title: '加载失败:' + (e.message || '未知错误'), icon: 'none' })
      this.setData({ pageReady: true })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 二态切换
   */
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.activeType) return
    this.setData({ activeType: type })
  },

  /**
   * 搜索
   */
  onSearch(e) {
    this.setData({ searchText: e.detail })
    this.applyFilter()
  },

  onSearchClear() {
    this.setData({ searchText: '' })
    this.applyFilter()
  },

  /**
   * 筛选(菜品态)
   */
  applyFilter() {
    const { searchText, allList, activeCat } = this.data
    let result = allList
    // 2026-10-02 分类快捷筛选（'全部' = 不过滤）
    if (activeCat && activeCat !== '全部') {
      result = result.filter(d => (d.dishCategory || '其他') === activeCat)
    }
    if (searchText) {
      const keyword = searchText.toLowerCase()
      result = result.filter(d =>
        (d.dishName || '').toLowerCase().includes(keyword) ||
        (d.remark || '').toLowerCase().includes(keyword)
      )
    }
    // 按菜单分类排序（经典主食 > 西式主食 > 现煮面食 > 缤纷小食 > 其他），组内按用户菜单给定顺序
    const catOrder = seed.DISH_CATEGORY_ORDER || ['其他']
    const orderIdx = seed.DISH_ORDER_INDEX || {}
    result = result.slice().sort(function (a, b) {
      var ca = catOrder.indexOf(a.dishCategory || '其他'); if (ca < 0) ca = catOrder.length
      var cb = catOrder.indexOf(b.dishCategory || '其他'); if (cb < 0) cb = catOrder.length
      if (ca !== cb) return ca - cb
      var ia = (a.dishName && orderIdx[a.dishName] != null) ? orderIdx[a.dishName] : 1000
      var ib = (b.dishName && orderIdx[b.dishName] != null) ? orderIdx[b.dishName] : 1000
      if (ia !== ib) return ia - ib
      return (a.dishName || '').localeCompare(b.dishName || '')
    })
    // 分组头：仅「全部」视图显示（单看一类时标题冗余）2026-10-02
    const showGroupHead = !activeCat || activeCat === '全部'
    let prevCat = null
    result.forEach(function (d) {
      const c = d.dishCategory || '其他'
      if (showGroupHead && c !== prevCat) {
        d.catFirst = true
        d.catName = c
        prevCat = c
      } else {
        d.catFirst = false
      }
    })
    this.setData({ filteredList: result })
  },

  /**
   * 分类快捷筛选（2026-10-02）
   */
  onCatChange(e) {
    const cat = e.currentTarget.dataset.cat
    if (cat === this.data.activeCat) return
    this.setData({ activeCat: cat })
    this.applyFilter()
  },

  /**
   * 点击菜品卡片 → 详情
   */
  onTapDish(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/dishDetail/dishDetail?_id=${id}` })
  },

  /**
   * 点击套餐卡片 → 跳详情(暂用 dishDetail 复用,后续可独立)
   */
  onTapMeal(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/dishDetail/dishDetail?_id=${id}&type=meal` })
  },

  /**
   * 新增菜品(单品) → 跳详情
   */
  onAddDish() {
    if (!auth.canEdit('dish')) return
    wx.navigateTo({ url: '/pages/dishDetail/dishDetail' })
  },

  /**
   * 录入SOP → 跳详情(SOP模板模式)
   * 详情页将识别 ?mode=sop,自动按 SOP 录入样式展示
   */
  onAddSop() {
    if (!auth.canEdit('dish')) return
    wx.navigateTo({ url: '/pages/dishDetail/dishDetail?mode=sop' })
  }
}))