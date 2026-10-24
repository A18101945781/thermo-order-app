/**
 * 订货计算器核心页
 * 功能：菜品选量结算、采购汇总（按供应商分组）、损耗率调节、订单保存
 */
const storage = require('../../utils/storage')
const calc = require('../../utils/calc')
const bizCalendar = require('../../utils/bizCalendar')
const auth = require('../../utils/auth')
const excel = require('../../utils/excel')
const seed = require('../../utils/seed')
const { buildFullCsv } = require('../../utils/purchasePlan')
const { withScrollAnchor } = require('../../utils/scrollAnchor')

// 订货/库存数量「防多输一个 0」二次确认阈值：超过此值弹窗确认（2026-09-22 用户要求）
// 正常单菜份数 ≤ 200；误输入的 500/800/1500/5000 都会被拦下。要调整只改这一个数。
const QTY_CONFIRM_ABOVE = 200

Page(withScrollAnchor({
  // orderCalc 主列表是 scroll-view，下方用 scrollview 模式接入科奇可拖动锚点

  data: {
    activeTab: '全部',
    // 顶部标签切换的候选项（原生分段控件渲染用；原来写死在 t-tabs 的 3 个 t-tab-panel 里）
    tabList: ['全部', 'SOP', '单品'],
    allDishes: [],       // 全部菜品
    displayList: [],     // 当前标签页显示的菜品（全量，用于计数/判空）
    visibleList: [],     // 实际渲染的菜品（分页后的片段，避免一次性渲染几十个组件拖慢滚动）
    catGroups: [],       // 紧凑表格用：可见菜品按分类分组 [{ cat, dishes: [] }]，2026-09-22
    dishLimit: 30,       // 当前已渲染条数（每批 +20）；菜单定稿共 27 行，一次性渲染省得下滑加载
    orderMap: {},        // { dishId: count }

    // 库存订货单子：用户提供的盘点表，订货时直接显示库存并自动减库存
    inventoryList: [],       // [{ name, stock }]
    inventorySource: '',     // 库存来源：cloud 云端实时 / local 本地镜像 / seed 出厂基线（页面出橙色提示）
    inventoryOrderMap: {},   // { name: 订货量 }
    inventoryNeedMap: {},    // { name: max(0, 订货量 - 库存) }
    inventoryTotalNeed: 0,   // 需采购总项数（>0 的项数）
    inventorySectionCollapsed: false,  // 库存订货区是否折叠

    totalDishCount: 0,
    estimatedRevenue: 0,
    lossRate: 1.0,       // 损耗率 1.0~2.0
    canSave: false,

    // 套餐快捷输入
    setMeals: [],
    setMealsTeam: [],     // 团队套餐（如 28/38/50/58A/58B/68 元套餐）
    setMealsSingle: [],   // 单人套餐（如 鱼香鸡丝配汤 35、咖喱牛腩饭 55 等）
    mealRows: [],         // 两列布局:每行 {team, single},按价格升序对齐
    mealMap: {},         // { mealId: count }
    mealSectionCollapsed: false,  // 套餐快捷区是否折叠（默认展开）
    salesRef: {},        // { id: { avg7, sameWeekday, lastWeekDate } } 销量参考值
    // ── 预估量预警（2026-09-26 用户 A1：预估量 = 近7天日均）──
    estMap: {},              // { id: 预估量(整数) } 仅收录 avg7>0 的项
    lowEstMap: {},           // { id: true } 填了但低于预估 -> 行内标红
    lowEstList: [],          // [{ id, name, est, actual, type }] 按达成率升序
    lowEstCount: 0,
    estWarnCollapsed: true,  // 预警条默认收起

    // SOP 标准件快速调用
    sopDishes: [],          // SOP 标准件（packageType=SOP）列表，用于顶部快速调用区
    // 默认折叠：SOP 区有 27 个 NumberInput 组件实例，展开会显著拖慢列表滚动（2026-09-12）
    sopSectionCollapsed: true,   // SOP 区是否折叠（默认折叠，点标题展开）

    // 采购汇总弹窗
    showSummaryPopup: false,
    summaryData: [],     // 按供应商分组的汇总数据
    includeBookings: false,      // 采购汇总是否包含今天预定备货（弹窗内可切换）
    summaryMerged: false,        // 当前汇总是否为「散点+预定」合并单
    summarySourceLabel: '',      // 合并单的 CSV 来源标注
    bookingCount: 0,             // 并入的预定单数（含预定开关打开时显示）
    // 并入哪天的预定备货：默认「下次备货日」（周一休息自动跳过），可切「全部」
    bookingDate: '',             // '' 由选项加载时初始化为「下次备货日」；'全部' 表示所有日期
    bookingDateOptions: [],      // ['今天(MM-DD)', '下次备货(MM-DD)', 各预定日期, '全部']
    bookingDateIndex: 0,
    totalMoney: 0,

    // 采购单预览弹窗（导出后展示，只读表格 + 复制全文 + 分享）
    previewVisible: false,
    previewTitle: '',
    previewCsv: '',
    previewFilePath: '',
    previewFileName: '',
    previewSavedHint: '',        // 「已存桌面（带色 xlsx）」提示，未落盘时为空
    previewWarn: '',             // 🆕 原料库查不到某些原料时的红字警告（空 = 没问题）
    previewGroups: [],
    previewTotalMoney: 0,
    previewMenuSummary: [],   // 预定菜单汇总（在原料明细上方，先看菜单再核对数字）
    previewSpotSummary: [],   // 散点菜单汇总（排最前：散点 → 预定 → 原料明细）

    // 批量粘贴导入库存（2026-10-02 用户：每天盘 34 项逐条点太累）
    showImportDialog: false,
    importRaw: '',            // 粘贴框原文
    importPreview: null,      // 解析结果 { matched:[], unmatched:[], skipped:[], changedCount, matchedCount }
    importAddUnmatched: false // 未识别项是否一并新增为库存项
  },

  onLoad() {
    this.setData({ canSave: auth.canEdit('order') })
  },

  onShow() {
    var app = getApp()
    if (!app.checkLogin()) return
    // 并入预定的日期选项：今天 / 下次备货 / 各预定日期 / 全部（动态，按实际预订单生成）
    this._loadBookingDateOptions()
    this.loadDishes()
    this.loadInventory()
    this.loadSalesRef()
    // 预定页生成的备货采购单：自动弹出预览
    var plan = wx.getStorageSync('pendingPurchasePlan')
    if (plan) {
      wx.removeStorageSync('pendingPurchasePlan')
      this._openPreview(plan)
    }
    // 滚动定位锚点的视口/页高测量由 withScrollAnchor 统一处理
  },

  /**
   * 生成「并入哪天预定」的下拉选项
   * ⚠️ 2026-09-13 修复：原先只给「明天 / 全部」两项，导致今天打开时
   *    「明天」= 09-14，而预订单是 09-13 → 匹配不上，合并失效。
   *    改为把**实际有预定的日期**都列出来，用户可手动选；
   *    且明天无预定时，默认自动回退到最近一个有预定的日期。
   */
  _loadBookingDateOptions() {
    var self = this
    storage.getAdultMealList().then(function (meals) {
      var today = self._dateOffset(0)
      // 🆕 2026-10-11：第二项从「死算明天」改成「**下次营业日**」（周一休息自动跳过）。
      //   周日打开时 → 跳过休息的周一 → 落周二；周六打开 → 仍是周日，不跳。
      //   口径见 utils/bizCalendar.js。
      var biz = self._bizDate()
      var dates = Array.from(new Set((meals || [])
        .map(function (m) { return m.date })
        .filter(Boolean))).sort()
      var labels = ['今天 ' + today.slice(5), '下次备货 ' + biz.slice(5)]
      dates.forEach(function (d) {
        if (d !== today && d !== biz) labels.push(d)
      })
      labels.push('全部')

      // 默认：**永远「下次备货日」**（今天下班前采下次营业日的料）。
      // 该日无单 = 无预定 → **不并入任何预定**，用户可手动下拉选其他日期。
      // ⚠️ 2026-09-30 用户拍板：原先「明天无单则回退到最近一个有预定的日期」，
      //    会把远期的团队大单（如 10-05 的 3 张）悄悄并进明天的采购单，用量虚高。
      var defIdx = 1
      // 已有选择且仍在列表中 → 保留用户选择
      var cur = self.data.bookingDate
      var idx = -1
      if (cur) {
        for (var i = 0; i < labels.length; i++) {
          if (self._dateOfLabel(labels[i]) === cur) { idx = i; break }
        }
      }
      if (idx < 0) idx = defIdx
      self.setData({
        bookingDateOptions: labels,
        bookingDateIndex: idx,
        bookingDate: self._dateOfLabel(labels[idx])
      })
      if (self.data.includeBookings) self._recomputeSummary(true)
    }).catch(function () {})
  },

  /** 下拉标签 → 日期字符串（'全部' 原样返回） */
  _dateOfLabel(label) {
    if (!label) return this._bizDate()
    if (label === '全部') return '全部'
    if (label.indexOf('今天') === 0) return this._dateOffset(0)
    if (label.indexOf('下次备货') === 0) return this._bizDate()
    if (label.indexOf('明天') === 0) return this._dateOffset(1)   // 兼容极旧标签（已不再生成）
    return label   // 本身即 YYYY-MM-DD
  },

  /**
   * 下次营业日（周一休息自动跳过；国定假日例外见 utils/bizCalendar.js）
   * 🔴 2026-10-11 前这里全是死算「今天+1」→ 周日打开时默认落到休息的周一，
   *    「下次备货」下拉与单据日期都指向没有预定的空日子。
   */
  _bizDate() {
    return bizCalendar.nextBizDay(this._dateOffset(0))
  },

  /** 相对今天的日期字符串（days=1 为次日；备货默认日请用 _bizDate()，它会跳过休息日） */
  _dateOffset(days) {
    var d = new Date()
    d.setDate(d.getDate() + (days || 0))
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
  },

  /** 切换「并入哪天的预定」：今天 / 下次备货 / 具体日期 / 全部 */
  onBookingDateChange(e) {
    var idx = Number(e.detail.value)
    var opts = this.data.bookingDateOptions
    var label = opts[idx] || ''
    this.setData({ bookingDateIndex: idx, bookingDate: this._dateOfLabel(label) })
    if (this.data.includeBookings) this._recomputeSummary(true)
  },

  /**
   * 加载菜品列表
   */
  loadDishes() {
    storage.getDishList().then(dishes => {
      // SOP 标准件（按价格升序，便于快速调用区展示）
      var sop = (dishes || []).filter(function(d) { return d.packageType === 'SOP' && !d.hideInOrder }).slice().sort(function(a, b) {
        var pa = Number(a.sellPrice) || 0, pb = Number(b.sellPrice) || 0
        if (pa !== pb) return pa - pb
        return (a.dishName || '').localeCompare(b.dishName || '')
      })
      this.setData({ allDishes: dishes || [], sopDishes: sop })
      this.applyTabFilter()
    }).catch(e => {
      console.error('加载菜品失败:', e)
    })
    storage.getSetMealList().then(list => {
      // 套餐按 category 拆分为团队/单人,并各自按价格升序排列
      var sorted = (list || []).slice().sort(function(a, b) {
        return (Number(a.price) || 0) - (Number(b.price) || 0)
      })
      // 团队套餐走「预定」模块录入,订货页只保留单人套餐快捷卡片(2026-09-16 用户:团队套餐取消)
      var single = sorted.filter(function(m) { return m.category === '单人' })
      // 单栏布局:每行仅单人套餐(原团队左/单人右并排已取消团队列)
      var rows = single.map(function(m) { return { single: m } })
      this.setData({
        setMeals: sorted,
        setMealsTeam: [],
        setMealsSingle: single,
        mealRows: rows
      })
    }).catch(e => {
      console.error('加载套餐失败:', e)
    })
  },

  /**
   * 分类标签切换
   */
  onTabChange(e) {
    // 原生分段控件：值在 dataset.tab（原 t-tabs 走 e.detail.value）—— 两者都兼容，防止别处复用
    const val = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.tab)
      || (e && e.detail && e.detail.value)
      || '全部'
    // 切标签重置分页，避免上一批的 limit 残留
    this.setData({ activeTab: val, dishLimit: 30 })
    this.applyTabFilter()
  },

  /**
   * 按套餐类型筛选显示 + 按价格升序
   * 同时产出 visibleList（分页后的可见片段）—— 长列表一次性渲染几十个自定义组件会拖慢滚动
   */
  applyTabFilter() {
    const { activeTab, allDishes, dishLimit } = this.data
    const filtered = activeTab === '全部'
      // 隐藏套餐内部成分菜（如 meal_xj50 的 10 道菜）+ 用户标记不进订货菜单的单品（如鱼香肉丝/咖喱牛腩饭/儿童餐等，2026-09-16）
      // + 隐藏「其他」分类（米饭/时蔬/土豆丝/芝士酱等 17 项 SOP 组件；2026-09-22 用户要求，需要时到「SOP」标签页调用）
      ? allDishes.filter(d => d.packageType !== '_COMPOSE' && !d.hideInOrder && (d.dishCategory || '其他') !== '其他')
      : allDishes.filter(d => d.packageType === activeTab && !d.hideInOrder)
    // 按菜单分类排序（经典主食 > 西式主食 > 现煮面食 > 缤纷小食 > 其他），组内按用户菜单给定顺序
    const catOrder = seed.DISH_CATEGORY_ORDER || ['其他']
    const orderIdx = seed.DISH_ORDER_INDEX || {}
    filtered.sort(function(a, b) {
      var ca = catOrder.indexOf(a.dishCategory || '其他'); if (ca < 0) ca = catOrder.length
      var cb = catOrder.indexOf(b.dishCategory || '其他'); if (cb < 0) cb = catOrder.length
      if (ca !== cb) return ca - cb
      var ia = (a.dishName && orderIdx[a.dishName] != null) ? orderIdx[a.dishName] : 1000
      var ib = (b.dishName && orderIdx[b.dishName] != null) ? orderIdx[b.dishName] : 1000
      if (ia !== ib) return ia - ib
      return (a.dishName || '').localeCompare(b.dishName || '')
    })
    // 给分类首项打头标记（复用采购单 cat-head 渲染），并附带分类色键
    var catKeyMap = {
      '经典主食': 'classic',
      '西式主食': 'western',
      '现煮面食': 'noodle',
      '缤纷小食': 'snack'
    }
    var prevCat = null
    filtered.forEach(function(d) {
      d.catKey = catKeyMap[d.dishCategory] || 'other'
      if ((d.dishCategory || '其他') !== prevCat) {
        d.catFirst = true
        d.catName = d.dishCategory || '其他'
        prevCat = d.dishCategory || '其他'
      } else {
        d.catFirst = false
      }
    })
    const visible = filtered.slice(0, dishLimit || 20)
    this.setData({
      displayList: filtered,
      visibleList: visible,
      catGroups: this._buildCatGroups(visible)
    })
  },

  /**
   * 可见菜品按分类分组（紧凑订货表：左侧分类列做合并单元格效果，2026-09-22）
   * @param {Array} list 已排序的菜品数组
   * @returns {Array} [{ cat, dishes: [] }]
   */
  _buildCatGroups(list) {
    var groups = []
    var cur = null
    ;(list || []).forEach(function (d) {
      var cat = d.dishCategory || '其他'
      if (!cur || cur.cat !== cat) {
        cur = { cat: cat, dishes: [] }
        groups.push(cur)
      }
      cur.dishes.push(d)
    })
    return groups
  },

  /**
   * 菜品列表分页：滚到底再加载下一批（每批 20 个）
   * 目的：避免 48 个 NumberInput 自定义组件一次性渲染，显著提升滚动帧率
   */
  onDishReachBottom() {
    const { displayList, dishLimit } = this.data
    if (!displayList || (dishLimit || 20) >= displayList.length) return
    const next = Math.min((dishLimit || 20) + 20, displayList.length)
    const visible = displayList.slice(0, next)
    this.setData({
      dishLimit: next,
      visibleList: visible,
      catGroups: this._buildCatGroups(visible)
    })
  },

  /**
   * 折叠/展开套餐快捷订货区
   */
  onToggleMealSection() {
    this.setData({ mealSectionCollapsed: !this.data.mealSectionCollapsed })
  },

  /**
   * 折叠/展开 SOP 标准件快速调用区
   */
  onToggleSopSection() {
    this.setData({ sopSectionCollapsed: !this.data.sopSectionCollapsed })
  },

  /**
   * 大数二次确认（防多输一个 0，如 500 输成 5000）
   * 未超阈值直接执行 onOk；超阈值弹窗，确认→onOk、取消→onCancel
   */
  _confirmBigQty(label, val, onOk, onCancel) {
    if (!(val > QTY_CONFIRM_ABOVE)) { onOk(); return }
    wx.showModal({
      title: '数字偏大，请确认',
      content: (label || '该项') + ' 填了 ' + val + '，是否确认无误？',
      confirmText: '确认',
      cancelText: '重填',
      success: function (res) {
        if (res.confirm) { onOk() } else if (onCancel) { onCancel() }
      },
      fail: function () { onOk() }
    })
  },

  /**
   * 菜品数量变更
   */
  onDishCountChange(e) {
    const dishId = e.currentTarget.dataset.id
    const count = Number(e.detail.value) || 0
    const dish = (this.data.allDishes || []).find(function (d) { return d._id === dishId })
    const self = this
    this._confirmBigQty((dish && dish.dishName) || '该菜品', count, function () {
      const newMap = { ...self.data.orderMap }
      if (count > 0) {
        newMap[dishId] = count
      } else {
        delete newMap[dishId]
      }
      self.setData({ orderMap: newMap })
      self.refreshSummary()
    }, function () {
      // 取消：清空该项，输入框回到空白（重填）
      const newMap = { ...self.data.orderMap }
      delete newMap[dishId]
      self.setData({ orderMap: newMap })
      self.refreshSummary()
    })
  },

  /**
   * 折叠/展开库存订货区
   */
  onToggleInventorySection() {
    this.setData({ inventorySectionCollapsed: !this.data.inventorySectionCollapsed })
  },

  /**
   * 读取库存单子（来自 seed.js 的盘点表，本地静态数据）
   */
  loadInventory() {
    var self = this
    storage.getInventoryList().then(function (list) {
      self.setData({
        inventoryList: list || [],
        // 库存来源：cloud 云端实时 / local 本地镜像 / seed 出厂基线（页面据此出橙色提示）
        inventorySource: storage.getInventorySource ? storage.getInventorySource() : ''
      })
      self.refreshInventoryNeed()
    }).catch(function () {})
  },

  /**
   * 库存订货量输入变更
   * dataset: name=品名
   */
  onInventoryOrderChange(e) {
    const name = e.currentTarget.dataset.name
    const val = Number(e.detail.value) || 0
    const self = this
    this._confirmBigQty(name, val, function () {
      const newMap = Object.assign({}, self.data.inventoryOrderMap)
      if (val > 0) {
        newMap[name] = val
      } else {
        delete newMap[name]
      }
      self.setData({ inventoryOrderMap: newMap })
      self.refreshInventoryNeed()
    }, function () {
      // 取消：清空该项，输入框回到空白（重填）
      const newMap = Object.assign({}, self.data.inventoryOrderMap)
      delete newMap[name]
      self.setData({ inventoryOrderMap: newMap })
      self.refreshInventoryNeed()
    })
  },

  /**
   * 应用某项库存值（落 data + 可选持久化）
   */
  _applyInventoryStock(name, val, skipPersist) {
    const list = (this.data.inventoryList || []).map(function (it) {
      return it.name === name ? Object.assign({}, it, { stock: Number(val) || 0 }) : it
    })
    this.setData({ inventoryList: list })
    this.refreshInventoryNeed()
    if (!skipPersist) storage.updateInventoryStock(name, val).catch(function () {})
  },

  /**
   * 库存数量输入变更（用户直接改库存，存本机；采购单扣减同步按新库存，2026-09-20）
   * dataset: name=品名
   */
  onInventoryStockChange(e) {
    const name = e.currentTarget.dataset.name
    const val = Number(e.detail.value) || 0
    const list = this.data.inventoryList || []
    const prevItem = list.find(function (it) { return it.name === name })
    const prevStock = prevItem ? (Number(prevItem.stock) || 0) : 0
    const self = this
    this._confirmBigQty(name + ' 库存', val, function () {
      self._applyInventoryStock(name, val)
    }, function () {
      // 取消：还原为改之前的值
      self._applyInventoryStock(name, prevStock, true)
    })
  },

  /**
   * 重算库存需采购 = max(0, 订货量 - 库存)
   */
  refreshInventoryNeed() {
    const { inventoryList, inventoryOrderMap } = this.data
    const nm = {}
    let total = 0
    ;(inventoryList || []).forEach(function (item) {
      const stock = Number(item.stock) || 0
      const order = Number(inventoryOrderMap[item.name]) || 0
      const need = Math.max(0, order - stock)
      nm[item.name] = need
      if (need > 0) total++
    })
    this.setData({ inventoryNeedMap: nm, inventoryTotalNeed: total })
  },

  // ========== 批量粘贴导入库存（2026-10-02） ==========
  // 用户每天盘点 34 项，逐条点太累 → 从 Excel 复制「品名 + 数量」两列整段粘贴，一次更新。
  // ⚠️ 只做「字符串匹配」，绝不做语义推断（项目铁律）：名字对不上就是「未识别」，列出来给人看。

  /**
   * 品名归一化：全角转半角 + 去空白 + 转小写，用于同名比对
   */
  _normInvName(s) {
    return String(s == null ? '' : s)
      .replace(/[\uFF01-\uFF5E]/g, function (ch) {
        return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
      })
      .replace(/\u3000/g, '')
      .replace(/\s+/g, '')
      .toLowerCase()
  },

  /**
   * 解析粘贴文本 → 预览结果
   * 支持格式（每行一项）：品名<TAB>数量 / 品名,数量 / 品名 数量
   * @returns {{matched:Array, unmatched:Array, skipped:Array, matchedCount:Number, changedCount:Number}}
   */
  _parseInventoryPaste(text, invList) {
    const self = this
    const list = invList || []
    const normMap = {}
    list.forEach(function (it) { normMap[self._normInvName(it.name)] = it.name })
    // 别名表（旧名/简称 → 正式品名，见 seed.SEED_INVENTORY_ALIAS），归一化后建索引
    const aliasMap = {}
    ;((seed && seed.SEED_INVENTORY_ALIAS) || []).forEach(function (a) {
      if (a && a.alias && a.target) aliasMap[self._normInvName(a.alias)] = a.target
    })

    const matched = []
    const unmatched = []
    const skipped = []
    const used = {}
    let changedCount = 0

    String(text || '').split(/\r?\n/).forEach(function (raw, idx) {
      const rawLine = String(raw || '').trim()
      if (!rawLine) return
      // 全角转半角后再解析（Excel/文档偶尔粘出全角数字与括号，如 ５ → 5）
      const line = rawLine.replace(/[\uFF01-\uFF5E]/g, function (ch) {
        return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
      })

      // 拆「品名 / 数量」：优先 TAB（Excel 直接粘贴），其次逗号，再次「末尾数字」
      let name = ''
      let qtyStr = ''
      if (line.indexOf('\t') >= 0) {
        const parts = line.split('\t')
        name = (parts[0] || '').trim()
        qtyStr = (parts[1] || '').trim()
      } else {
        const m = line.match(/^(.*?)[\s,，]+(-?\d+(?:\.\d+)?)$/)
        if (m) { name = m[1].trim(); qtyStr = m[2] } else { name = line }
      }
      if (!name) return

      // 表头行静默跳过（「品名 / 库存数量」这类）
      if (/^(品名|名称|商品名|原料名|产品名)$/.test(name)) return
      if (/^(数量|库存|库存数量|库存数|数目)$/.test(qtyStr)) return

      if (qtyStr === '') {
        skipped.push({ line: idx + 1, name: name, reason: '无数量' })
        return
      }
      const qty = Number(qtyStr)
      if (isNaN(qty)) {
        skipped.push({ line: idx + 1, name: name, reason: '数量非法（' + qtyStr + '）' })
        return
      }

      // ① 归一化精确  →  ② 别名表  →  ③ 唯一包含匹配
      const norm = self._normInvName(name)
      let hit = normMap[norm]
      let viaAlias = false
      if (!hit) {
        const t = aliasMap[norm]
        if (t) {
          const canonical = normMap[self._normInvName(t)]
          if (canonical) { hit = canonical; viaAlias = true }
        }
      }
      if (!hit) {
        const cands = []
        Object.keys(normMap).forEach(function (k) {
          if (k.indexOf(norm) >= 0 || norm.indexOf(k) >= 0) cands.push(normMap[k])
        })
        const uniq = cands.filter(function (v, i) { return cands.indexOf(v) === i })
        if (uniq.length === 1) hit = uniq[0]
      }

      if (!hit) {
        unmatched.push({ name: name, qty: qty })
        return
      }
      if (used[hit]) {
        skipped.push({ line: idx + 1, name: name, reason: '重复项（前文已处理 ' + hit + '）' })
        return
      }
      used[hit] = true
      const oldItem = list.filter(function (it) { return it.name === hit })[0]
      const oldStock = oldItem ? (Number(oldItem.stock) || 0) : 0
      const changed = oldStock !== qty
      if (changed) changedCount++
      matched.push({ name: hit, input: name, oldStock: oldStock, newStock: qty, changed: changed, viaAlias: viaAlias })
    })

    return {
      matched: matched,
      unmatched: unmatched,
      skipped: skipped,
      matchedCount: matched.length,
      changedCount: changedCount,
      aliasCount: matched.filter(function (m) { return m.viaAlias }).length
    }
  },

  /** 打开批量导入弹窗（清空上次输入） */
  onOpenImport() {
    this.setData({ showImportDialog: true, importRaw: '', importPreview: null, importAddUnmatched: false })
  },

  /** 关闭导入弹窗 */
  onCloseImport() {
    this.setData({ showImportDialog: false })
  },

  /** 粘贴框内容变更 → 实时解析预览 */
  onImportInput(e) {
    const text = (e && e.detail && e.detail.value) || ''
    this.setData({ importRaw: text, importPreview: this._parseInventoryPaste(text, this.data.inventoryList) })
  },

  /**
   * 失焦兜底：个别机型/输入法下，粘贴只在失焦时才交出完整文本，
   * 此时补一次解析，避免「粘了但没预览」。（2026-10-02）
   */
  onImportBlur(e) {
    const text = (e && e.detail && e.detail.value) || ''
    if (text && text !== this.data.importRaw) {
      this.setData({ importRaw: text, importPreview: this._parseInventoryPaste(text, this.data.inventoryList) })
    }
  },

  /**
   * 一键读取系统剪贴板并填入（2026-10-02）
   * 为什么加：textarea 长按粘贴在部分机型/输入法下不出「粘贴」菜单，
   * 跨 App 粘贴又会被系统「允许粘贴」弹窗拦；直接调 wx.getClipboardData
   * 可以绕开全部输入层差异 —— 这是「无法粘贴」最可靠的解法。
   */
  onReadClipboard() {
    const self = this
    wx.getClipboardData({
      success(res) {
        const text = String((res && res.data) || '')
        if (!text.trim()) {
          wx.showToast({ title: '剪贴板是空的，请先在表格里复制', icon: 'none' })
          return
        }
        self.setData({
          importRaw: text,
          importPreview: self._parseInventoryPaste(text, self.data.inventoryList)
        })
        wx.showToast({ title: '已读取剪贴板', icon: 'none' })
      },
      fail() {
        wx.showToast({ title: '读取失败，请在框内长按粘贴', icon: 'none' })
      }
    })
  },

  /** 清空粘贴框 */
  onClearImport() {
    this.setData({ importRaw: '', importPreview: null })
  },

  /** 切换「未识别项也一并新增」 */
  onToggleAddUnmatched() {
    this.setData({ importAddUnmatched: !this.data.importAddUnmatched })
  },

  /**
   * 确认导入：一次写入本机（不做逐项 updateInventoryStock，避免 N 次写存储）
   */
  onConfirmImport() {
    const self = this
    const pv = this.data.importPreview
    if (!pv || pv.matchedCount === 0) {
      wx.showToast({ title: '没有可导入的项', icon: 'none' })
      return
    }
    const stockMap = {}
    pv.matched.forEach(function (m) { stockMap[m.name] = m.newStock })

    const next = (this.data.inventoryList || []).map(function (it) {
      return stockMap.hasOwnProperty(it.name) ? Object.assign({}, it, { stock: stockMap[it.name] }) : Object.assign({}, it)
    })
    // 未识别项按用户选择追加（默认不追加，防错别字污染库存表）
    if (this.data.importAddUnmatched && pv.unmatched.length > 0) {
      pv.unmatched.forEach(function (u) { next.push({ name: u.name, stock: u.qty }) })
    }

    storage.setInventoryList(next).then(function () {
      // 导入后整表已是实测值 → 来源标记转为 local，橙色「基线」提示随之消失
      self.setData({
        inventoryList: next,
        inventoryOrderMap: self.data.inventoryOrderMap,
        inventorySource: 'local'
      })
      self.refreshInventoryNeed()
      self.setData({ showImportDialog: false })
      wx.showToast({ title: '已导入 ' + pv.matchedCount + ' 项', icon: 'success' })
    }).catch(function () {
      wx.showToast({ title: '导入失败，请重试', icon: 'none' })
    })
  },

  /**
   * 套餐份数变更（快捷订货）
   */
  onMealCountChange(e) {
    const mealId = e.currentTarget.dataset.id
    const count = Number(e.detail.value) || 0
    const meal = (this.data.setMeals || []).find(function (m) { return m._id === mealId })
    const self = this
    this._confirmBigQty((meal && meal.name) || '该套餐', count, function () {
      const newMap = { ...self.data.mealMap }
      if (count > 0) {
        newMap[mealId] = count
      } else {
        delete newMap[mealId]
      }
      self.setData({ mealMap: newMap })
      self.refreshSummary()
    }, function () {
      // 取消：清空该项，输入框回到空白（重填）
      const newMap = { ...self.data.mealMap }
      delete newMap[mealId]
      self.setData({ mealMap: newMap })
      self.refreshSummary()
    })
  },

  /**
   * 跳转散点销量录入页（单品 / 单人套餐每日实际售出份数）
   */
  onGoSpotSale() {
    wx.navigateTo({ url: '/pages/spotSale/spotSale' })
  },

  /**
   * 载入销量参考值（近7天日均 / 上周同期）
   * 数据来源：spotSales（日常散点销量）
   *
   * ⚠️ 2026-09-26 用户拍板：**团队预定不计入预警阈值/参考值的基准**
   *   adultMeals（成人/团队套餐预定）是一次性大单、且已单独走「预定备货」备料，
   *   若并入日常日均，会把基准拉爆 → 预警阈值虚高、天天误报。
   *   故此处显式传 includeBooking:false（团队预定仍照常在预定模块单独计算）。
   */
  loadSalesRef() {
    var self = this
    var today = this._dateStr()
    Promise.all([
      storage.getSpotSaleList(),
      storage.getAdultMealList()
    ]).then(function (res) {
      var ref = calc.computeSalesRef(res[0], res[1], today, 7, { includeBooking: false })
      // 预估量基准，优先级：真实「近7天日均 avg7」> seed「销量基准 SEED_EST_BASE」
      //   ① 先用 SEED_EST_BASE 打底（2026-09-27 由收银报表「小长假单日实测 ÷5」换算成平日日均）
      //   ② 再让真实散点销量的 avg7 覆盖（有真实记录就听真实的）
      //   只收录 >0，避免给从没卖过的菜报警
      var est = {}
      var seedBase = seed.SEED_EST_BASE || {}
      Object.keys(seedBase).forEach(function (id) {
        var v = Math.round(Number(seedBase[id]) || 0)
        if (v > 0) est[id] = v
      })
      Object.keys(ref).forEach(function (id) {
        var v = Math.round(Number(ref[id].avg7) || 0)
        if (v > 0) est[id] = v
      })
      self.setData({ salesRef: ref, estMap: est }, function () { self.refreshEstWarn() })
    }).catch(function (e) {
      console.error('加载销量参考值失败', e)
    })
  },

  /**
   * 预估量预警（2026-09-26 用户 A1）
   * 预估量 = 近7天日均（四舍五入）；只报「已填 > 0 且 已填 < 预估」的项
   * —— 完全没填的不报：可能今天本来就不做这道菜，避免满屏噪音
   */
  refreshEstWarn() {
    var estMap = this.data.estMap || {}
    if (!Object.keys(estMap).length) {
      if (this.data.lowEstCount !== 0) {
        this.setData({ lowEstMap: {}, lowEstList: [], lowEstCount: 0 })
      }
      return
    }
    var orderMap = this.data.orderMap || {}
    var mealMap = this.data.mealMap || {}
    var lowMap = {}
    var list = []

    ;(this.data.displayList || []).forEach(function (d) {
      var est = estMap[d._id]
      if (!est) return
      var act = Number(orderMap[d._id]) || 0
      if (act > 0 && act < est) {
        lowMap[d._id] = true
        list.push({ id: d._id, name: d.dishName, est: est, actual: act, type: 'dish' })
      }
    })
    var meals = (this.data.setMealsTeam || []).concat(this.data.setMealsSingle || [])
    meals.forEach(function (m) {
      var est = estMap[m._id]
      if (!est) return
      var act = Number(mealMap[m._id]) || 0
      if (act > 0 && act < est) {
        lowMap[m._id] = true
        list.push({ id: m._id, name: m.name, est: est, actual: act, type: 'meal' })
      }
    })
    // 达成率低的排前面（最该先看的在前面）
    list.sort(function (a, b) { return (a.actual / a.est) - (b.actual / b.est) })
    this.setData({ lowEstMap: lowMap, lowEstList: list, lowEstCount: list.length })
  },

  /** 预警条展开 / 收起 */
  onToggleEstWarn() {
    this.setData({ estWarnCollapsed: !this.data.estWarnCollapsed })
  },

  /**
   * 点参考值一键填入份数
   * dataset: id=品项id, type=dish|meal, qty=参考份数
   */
  onFillRef(e) {
    var ds = e.currentTarget.dataset || {}
    var id = ds.id
    var type = ds.type
    var qty = Number(ds.qty) || 0
    if (!id || qty <= 0) return
    var v = Math.round(qty)
    if (type === 'meal') {
      var mealMap = Object.assign({}, this.data.mealMap)
      mealMap[id] = v
      this.setData({ mealMap: mealMap })
    } else {
      var orderMap = Object.assign({}, this.data.orderMap)
      orderMap[id] = v
      this.setData({ orderMap: orderMap })
    }
    this.refreshSummary()
    wx.showToast({ title: '已填入 ' + v + ' 份', icon: 'none', duration: 1200 })
  },

  /**
   * 套餐份数 + 单品份数 合并为有效菜品份数
   */
  getEffectiveOrderMap() {
    const { orderMap, mealMap, setMeals } = this.data
    const merged = calc.expandMealsToDishMap(mealMap, setMeals)
    const eff = Object.assign({}, orderMap)
    Object.keys(merged).forEach(id => {
      eff[id] = (eff[id] || 0) + merged[id]
    })
    return eff
  },

  /**
   * 刷新底部汇总数据
   * 营收计算分两路:
   *   1) 套餐营收 = Σ mealMap[mealId] × meal.price (套餐有独立售价,展开后组件 sellPrice=0)
   *   2) 单品营收 = Σ orderMap[dishId] × dish.sellPrice (用户直接点的单菜)
   * 菜品总数 = 套餐份数 + 单品份数(用户视角的"份",不是展开后的组件件)
   *   采购汇总仍用 getEffectiveOrderMap() 返回的展开组件件做原料聚合
   */
  refreshSummary() {
    this.refreshEstWarn()
    const { allDishes, setMeals, mealMap, orderMap, lossRate } = this.data

    let mealCount = 0
    let dishCount = 0
    let estimatedRevenue = 0

    // 1) 套餐营收 + 套餐份数累加
    Object.keys(mealMap || {}).forEach(mealId => {
      const cnt = Number(mealMap[mealId]) || 0
      if (cnt <= 0) return
      mealCount += cnt
      const meal = (setMeals || []).find(m => m._id === mealId)
      const price = Number(meal && meal.price) || 0
      estimatedRevenue += price * cnt
    })

    // 2) 单品营收 + 单品份数累加
    Object.keys(orderMap || {}).forEach(dishId => {
      const cnt = Number(orderMap[dishId]) || 0
      if (cnt <= 0) return
      dishCount += cnt
      const dish = allDishes.find(d => d._id === dishId)
      if (dish) {
        estimatedRevenue += (Number(dish.sellPrice) || 0) * cnt
      }
    })

    // 用户视角的"份"数(套餐份 + 单品份)
    const totalDishCount = mealCount + dishCount

    this.setData({
      totalDishCount,
      estimatedRevenue: parseFloat(estimatedRevenue.toFixed(2))
    })
  },

  /**
   * 损耗率减少（步长 0.05，最低 1.0）
   */
  onLossDecrease() {
    let rate = this.data.lossRate - 0.05
    if (rate < 1.0) rate = 1.0
    this.setData({ lossRate: parseFloat(rate.toFixed(2)) })
  },

  /**
   * 损耗率增加（步长 0.05，最高 2.0）
   */
  onLossIncrease() {
    let rate = this.data.lossRate + 0.05
    if (rate > 2.0) rate = 2.0
    this.setData({ lossRate: parseFloat(rate.toFixed(2)) })
  },

  /**
   * 核心：构建采购汇总数据（含/不含预定可切换）
   * includeBookings=true 时把今天成人预订单备货并入散点订货一起聚合
   */
  _recomputeSummary(includeBookings) {
    const { allDishes, lossRate } = this.data
    // 完整需求（要卖的份数）= 手填单品 + 套餐展开；菜单汇总按此显示
    const rawDemand = this.getEffectiveOrderMap()
    // 散点菜单汇总：订货计算器直接填份数的菜（含套餐快捷区展开的菜），按份数降序
    // 与「预定菜单汇总」互补，让采购单顶部能同时看到散点和预定各要出什么菜
    this._spotSummary = Object.keys(rawDemand)
      .filter(id => (rawDemand[id] || 0) > 0)
      .map(id => {
        const d = (allDishes || []).find(x => x._id === id)
        return { dishName: d ? (d.dishName || id) : id, qty: rawDemand[id] }
      })
      .sort((a, b) => b.qty - a.qty)
    // sourceMap：{ dishId: { '预定': n, '散点': m } }，按完整需求溯源
    const buildSourceMap = (bookingMap) => {
      const sm = {}
      Object.keys(rawDemand).forEach(id => { sm[id] = { '散点': rawDemand[id] || 0, '预定': 0 } })
      if (bookingMap) {
        Object.keys(bookingMap).forEach(id => {
          sm[id] = sm[id] || { '散点': 0, '预定': 0 }
          sm[id]['预定'] = bookingMap[id] || 0
        })
      }
      return sm
    }
    const commit = (demandMap, sourceMap, bookingN) => {
      storage.getMaterialList().then(materialList => {
        // 🔴 第 3 参 = 出厂库存基线：实时单子缺某项时兜底，不再静默回退成 0
        const invMap = calc.joinInventoryMap(this.data.inventoryList, seed.SEED_INVENTORY_MAP, seed.SEED_INVENTORY)
        const { groups, totalMoney } = calc.buildPurchasePlan(demandMap, allDishes, materialList, lossRate, sourceMap, invMap)
        // 来源标注：没实际并入任何预定单时不能说「合并」（否则「该日无预定」的单会写成
        // 「散点订货 + X 预定（合并）」，与事实不符）——2026-09-30
        const bd = this.data.bookingDate
        const bdText = bd === '全部' ? '全部日期' : bd
        let srcLabel = '（散点订货）'
        if (includeBookings) {
          srcLabel = (bookingN > 0)
            ? ('散点订货 + ' + (bd === '全部' ? '全部预定' : (bd + ' 预定')) + '（合并）')
            : ('（散点订货 · ' + bdText + ' 无预定）')
        }
        this.setData({
          summaryData: groups,
          totalMoney: totalMoney,
          summaryMerged: includeBookings && bookingN > 0,
          summarySourceLabel: srcLabel
        })
      }).catch(e => {
        console.error('生成采购汇总失败:', e)
        wx.showToast({ title: '汇总失败', icon: 'none' })
      })
    }
    if (!includeBookings) {
      this._menuSummary = null   // 不含预定 → 导出不带菜单汇总
      commit(rawDemand, buildSourceMap(null))
      return
    }
    Promise.all([
      storage.getAdultMealList(),
      storage.getSetMealList(),
      storage.getDishList()
    ]).then(([meals, setMeals, dishes]) => {
      // 日期口径：默认「下次营业日」（周一休息自动跳过），可切「全部」。
      // 用户口径（2026-09-12）：散点订货 + 该日预定量合并统计在一张单里。
      const bd = this.data.bookingDate || this._bizDate()
      const bookingMap = calc.expandAdultBookingsToDishMap(meals, setMeals, dishes, bd)
      // 预定菜单汇总：导出 CSV 时插入原料明细之前，方便在 WPS 里对照检查遗漏
      this._menuSummary = calc.buildBookingMenuSummary(meals, setMeals, dishes, bd)
      const picked = (meals || []).filter(function (m) {
        return bd === '全部' ? true : (m.date === bd)
      })
      this.setData({ bookingCount: picked.length })
      // 合并散点+预定需求
      const combinedDemand = Object.assign({}, rawDemand)
      Object.keys(bookingMap).forEach(id => {
        combinedDemand[id] = (combinedDemand[id] || 0) + bookingMap[id]
      })
      commit(combinedDemand, buildSourceMap(bookingMap), picked.length)
    }).catch(e => {
      console.error('合并预定备货失败:', e)
      wx.showToast({ title: '合并失败', icon: 'none' })
    })
  },

  /**
   * 溯源：点原料行展开/收起「哪个菜 × 多少份 × 单份用量」
   * 用于核对采购单里每个数字的来源（如「香菜 100kg 从哪来」）
   */
  onToggleMaterialSource(e) {
    const si = Number(e.currentTarget.dataset.si)
    const mi = Number(e.currentTarget.dataset.mi)
    const group = this.data.summaryData[si]
    if (!group || !group.materials || !group.materials[mi]) return
    const cur = group.materials[mi]._open
    this.setData({ ['summaryData[' + si + '].materials[' + mi + ']._open']: !cur })
  },

  /**
   * 采购单预览弹窗的溯源展开/收起（与采购汇总弹窗同逻辑，作用于 previewGroups）
   * 展开后可见每个原料由「哪个菜 / 单份用量 / 预定·赠送各多少份 / 小计」构成
   */
  onTogglePreviewMaterialSource(e) {
    const si = Number(e.currentTarget.dataset.si)
    const mi = Number(e.currentTarget.dataset.mi)
    const group = this.data.previewGroups[si]
    if (!group || !group.materials || !group.materials[mi]) return
    const cur = group.materials[mi]._open
    this.setData({ ['previewGroups[' + si + '].materials[' + mi + ']._open']: !cur })
  },

  /**
   * 打开采购汇总弹窗（按当前 includeBookings 开关计算）
   */
  onShowSummary() {
    const includeBookings = this.data.includeBookings
    this.setData({ showSummaryPopup: true })
    this._recomputeSummary(includeBookings)
  },

  /**
   * 弹窗内切换「包含预定备货」→ 实时重算当前视图
   */
  onToggleIncludeBookings() {
    const includeBookings = !this.data.includeBookings
    this.setData({ includeBookings })
    this._recomputeSummary(includeBookings)
  },

  /**
   * 关闭采购汇总弹窗
   */
  // 空方法：原生弹层面板的 catchtap 用（阻止冒泡，避免点面板内部时误触遮罩关闭）
  onNoop() {},

  onCloseSummary() {
    this.setData({ showSummaryPopup: false })
  },

  onSummaryPopupChange(e) {
    if (!e.detail.visible) {
      this.setData({ showSummaryPopup: false })
    }
  },

  /**
   * 导出单个供应商的采购单
   * 改为：先在沙箱落盘 → 弹出预览弹窗（只读表格 + 复制全文 + 分享按钮）
   */
  onExportSupplier(e) {
    const index = e.currentTarget.dataset.index
    const group = this.data.summaryData[index]
    if (!group || !group.materials || group.materials.length === 0) {
      wx.showToast({ title: '无数据可导出', icon: 'none' })
      return
    }

    const orderDate = this._orderDate()
    const fileName = '采购单_' + this._sanitizeFileName(group.supplier) + '_' + orderDate + '.csv'
    const totalMoney = parseFloat(group.materials.reduce((s, m) => s + m.suggestCost, 0).toFixed(2))
    const csv = buildFullCsv({
      title: '采购单预览 · ' + group.supplier,
      fileName: fileName,
      groups: [group],
      totalMoney: totalMoney,
      dateLabel: orderDate,
      sourceLabel: this.data.summarySourceLabel || undefined,
      spotSummary: this._spotSummary,
      menuSummary: this.data.includeBookings ? this._menuSummary : undefined
    })
    this._openPreview({
      title: '采购单预览 · ' + group.supplier,
      csv,
      fileName,
      groups: [group],
      totalMoney,
      spotSummary: this._spotSummary,
      menuSummary: this.data.includeBookings ? this._menuSummary : undefined
    })
  },

  /**
   * 构造「全部供应商」采购单 CSV —— 导出与「一键复制」共用同一份数据
   * @returns {Object|null} { csv, groups, fileName, title, groupCount }
   */
  _buildAllCsv() {
    const { summaryData } = this.data
    if (!summaryData || summaryData.length === 0) return null
    // 只取有明细的分组（历史上 groupCount/validGroups 未声明导致此处崩溃）
    const validGroups = summaryData.filter(g => g.materials && g.materials.length > 0)
    if (!validGroups.length) return null

    const groupCount = validGroups.length
    const bookingTag = this.data.includeBookings ? '含预定' : '不含预定'
    const orderDate = this._orderDate()
    const title = '采购单预览 · 全部供应商（' + groupCount + ' 家 · ' + bookingTag + '）'
    const fileName = '采购单_全部供应商_' + bookingTag + '_' + orderDate + '.csv'
    const csv = buildFullCsv({
      title: title,
      fileName: fileName,
      groups: validGroups,
      totalMoney: this.data.totalMoney,
      dateLabel: orderDate,
      sourceLabel: this.data.summarySourceLabel || undefined,
      spotSummary: this._spotSummary,
      menuSummary: this.data.includeBookings ? this._menuSummary : undefined
    })
    return { csv: csv, groups: validGroups, fileName: fileName, title: title, groupCount: groupCount }
  },

  /**
   * 【采购汇总弹窗】一键复制全部采购单
   * 不落盘、不弹预览 —— 直接把 Excel 友好的表格文本塞进剪贴板，粘到 WPS 即成表
   * （2026-09-26 用户要求：查看采购汇总时就能一键复制，不必先导出）
   */
  onSummaryCopy() {
    const built = this._buildAllCsv()
    if (!built) {
      wx.showToast({ title: '无数据可复制', icon: 'none' })
      return
    }
    excel.copyCSVAsTable(built.csv).then(() => {
      wx.showToast({ title: '已复制，可直接粘贴到 WPS', icon: 'success', duration: 2200 })
    }).catch((err) => {
      console.error('复制失败:', err)
      // 降级：复制 CSV 原文
      wx.setClipboardData({
        data: built.csv,
        success: () => wx.showToast({ title: '已复制（CSV，粘到 Excel 需手动分列）', icon: 'none', duration: 3000 }),
      })
    })
  },

  /**
   * 导出全部供应商采购单（合并为一个CSV）
   * 先在沙箱落盘 → 弹出预览弹窗
   */
  onExportAll() {
    const built = this._buildAllCsv()
    if (!built) {
      wx.showToast({ title: '无数据可导出', icon: 'none' })
      return
    }
    this._openPreview({
      title: built.title,
      csv: built.csv,
      fileName: built.fileName,
      groups: built.groups,
      totalMoney: this.data.totalMoney,
      spotSummary: this._spotSummary,
      menuSummary: this.data.includeBookings ? this._menuSummary : undefined
    })
  },

  /**
   * 生成预览：写本地（PC 出带色 XLSX）+ 弹预览弹窗
   */
  _openPreview(opts) {
    const { title, csv, fileName, groups, totalMoney, menuSummary, spotSummary } = opts
    // WXML 不支持复杂 join，这里先把每单的菜单文字拼好
    const ms = (menuSummary || []).map(m => Object.assign({}, m, {
      menuText: (m.menu || []).map(d => d.dishName + '×' + d.qty).join(' + '),
      // 🆕 2026-10-11：预定的备注也要显示（菜单汇总已加「备注」列，弹窗同步）
      remarkText: String(m.remark || '')
    }))
    // 带色 XLSX 入参：与 buildFullCsv() 同构，PC 端由本地服务交给 Python 渲染
    const payload = {
      title: title,
      fileName: String(fileName || '').replace(/\.(csv|xlsx)$/i, '') + '.xlsx',
      dateLabel: opts.dateLabel || this._orderDate(),
      sourceLabel: opts.sourceLabel || this.data.summarySourceLabel || '',
      groups: groups || [],
      totalMoney: totalMoney,
      menuSummary: menuSummary || null,
      spotSummary: spotSummary || null
    }
    wx.showLoading({ title: '生成采购单...' })
    // 🆕 2026-10-11：扫出「材料库里找不到」的原料 —— 它们的供应商/单价/规格都是兜底值，
    // 金额不可信（真事故：云端 material 集合少同步了后段原料，采购单把它们算成「未知供应商 ¥0」）。
    const unmatched = []
    ;(groups || []).forEach(g => (g.materials || []).forEach(m => {
      if (m.unmatched) unmatched.push(m.name)
    }))
    excel.savePurchase(payload, fileName, csv).then(filePath => {
      wx.hideLoading()
      // filePath 可能是字符串（沙箱路径）或 {desktopSaved:true,kind,path}（本地服务落盘）
      const saved = filePath && typeof filePath === 'object' && filePath.desktopSaved
      this.setData({
        previewVisible: true,
        previewTitle: title,
        previewCsv: csv,
        previewFilePath: filePath,
        previewFileName: saved ? filePath.fileName : fileName,
        previewSavedHint: saved
          ? (filePath.kind === 'xlsx'
            ? '✅ 带色表格已存到「桌面 → 小程序订货」，按供应商配色'
            : '已存到「桌面 → 小程序订货」')
          : '',
        previewWarn: unmatched.length
          ? '⚠️ 有 ' + unmatched.length + ' 种原料在「原料库」里查不到（' + unmatched.join('、') +
            '），它们的供应商和单价按 0 算 —— 金额偏低，请先在原料库补上这些原料'
          : '',
        previewGroups: groups,
        previewTotalMoney: totalMoney,
        previewMenuSummary: ms,
        previewSpotSummary: spotSummary || []
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('生成预览失败:', err)
      wx.showToast({ title: '生成失败', icon: 'none' })
    })
  },

  /**
   * 预览弹窗关闭
   */
  onPreviewClose() {
    this.setData({ previewVisible: false })
  },

  onPreviewVisibleChange(e) {
    if (!e.detail.visible) {
      this.setData({ previewVisible: false })
    }
  },

  /**
   * 预览弹窗：复制 CSV 全文到剪贴板
   * 走 Excel 友好的 TSV 格式（Tab 分隔 + CRLF + UTF-8 BOM），粘到 Excel/WPS 直接成表格
   */
  onPreviewCopy() {
    if (!this.data.previewCsv) {
      wx.showToast({ title: '无内容可复制', icon: 'none' })
      return
    }
    excel.copyCSVAsTable(this.data.previewCsv).then(() => {
      wx.showToast({ title: '已复制（弹窗全样，含标题与总金额）', icon: 'success', duration: 2200 })
    }).catch((err) => {
      console.error('复制失败:', err)
      // 降级：直接复制 CSV 原文
      wx.setClipboardData({
        data: this.data.previewCsv,
        success: () => wx.showToast({ title: '已复制（CSV 格式，粘到 Excel 需手动分列）', icon: 'none', duration: 3000 }),
      })
    })
  },

  /**
   * 预览弹窗：调起微信分享面板 / 桌面落盘提示
   */
  onPreviewShare() {
    const filePath = this.data.previewFilePath
    if (!filePath) {
      wx.showToast({ title: '请先生成文件', icon: 'none' })
      return
    }
    excel.shareFile(filePath)
  },

  /**
   * 生成日期字符串 YYYY-MM-DD
   */
  _dateStr() {
    const d = new Date()
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
  },

  /**
   * 单据日期（文件名 & CSV「日期：」栏用）= **到货日 = 下次营业日**
   *
   * 口径（2026-09-30 用户拍板）：「今天下午下单、次日到货」，所以单据日期永远写下单的
   * 次一个备货日，**与并入了哪天的预定无关**。并入哪天的预定只影响「用量怎么加总」，
   * 不影响单据上写的到货日。
   *
   * 变更史：
   * - 原口径 = 导出当天 → 09-12 导出「含 09-13 预定」的单显示 09-12，与到货日差一天（2026-09-13 修）。
   * - 修后口径 = 并入的预定日期 → 并入 10-05 的团队单时，日期显示 10-05，
   *   但实际是 09-30 下单、10-01 到货，仍然不对（2026-09-30 再修）。
   * - 🆕 2026-10-11：改走营业日 —— 周一休息，周日下单的货周一到不了（没人收），
   *   所以单据日期顺延到周二；口径见 utils/bizCalendar.js。
   */
  _orderDate() {
    return this._bizDate()
  },

  /**
   * 文件名安全化（去掉特殊字符）
   */
  _sanitizeFileName(name) {
    return (name || '未知供应商').replace(/[\\/:*?"<>|]/g, '_')
  },

  /**
   * 保存订单
   */
  onSaveOrder() {
    if (!auth.canEdit('order')) {
      wx.showToast({ title: '无操作权限', icon: 'none' })
      return
    }

    const { allDishes, lossRate } = this.data
    const orderMap = this.getEffectiveOrderMap()
    const orderIds = Object.keys(orderMap)
    if (orderIds.length === 0) {
      wx.showToast({ title: '请至少选择一种菜品或套餐', icon: 'none' })
      return
    }

    const userInfo = wx.getStorageSync('userInfo') || {}
    wx.showLoading({ title: '计算中...' })
    storage.getMaterialList().then(materialList => {
      const materialAgg = {}
      orderIds.forEach(dishId => {
        const dish = allDishes.find(d => d._id === dishId)
        if (!dish) return
        const count = orderMap[dishId]
        ;(dish.bomList || []).forEach(bom => {
          if (!bom.name) return
          const total = bom.useNum * count * lossRate
          if (!materialAgg[bom.name]) {
            const matRef = materialList.find(m => m.name === bom.name) || {}
            materialAgg[bom.name] = {
              name: bom.name,
              unit: bom.unit || '',
              price: bom.price || 0,
              supplier: matRef.supplier || '未知供应商',
              totalUseNum: 0,
              curStock: matRef.curStock ?? 0,
              suggestBuy: 0,
              suggestCost: 0,
              totalCost: 0
            }
          }
          materialAgg[bom.name].totalUseNum += parseFloat(total.toFixed(3))
        })
      })
      Object.values(materialAgg).forEach(m => {
        m.suggestBuy = Math.ceil(m.totalUseNum - m.curStock)
        if (m.suggestBuy < 0) m.suggestBuy = 0
        m.suggestCost = parseFloat((m.suggestBuy * m.price).toFixed(2))
        m.totalCost = parseFloat((m.totalUseNum * m.price).toFixed(2))
        m.totalUseNum = parseFloat(m.totalUseNum.toFixed(2))
      })
      const totalMoney = Object.values(materialAgg).reduce((s, m) => s + m.suggestCost, 0)
      const totalDish = orderIds.reduce((s, id) => s + orderMap[id], 0)
      wx.hideLoading()
      wx.showModal({
        title: '确认保存',
        content: `共 ${totalDish} 份菜品，预估采购金额 ¥${totalMoney.toFixed(2)}，确认保存？`,
        success: (res) => {
          if (!res.confirm) return
          const orderNum = orderIds.map(dishId => {
            const dish = allDishes.find(d => d._id === dishId)
            return { dishId: dishId, count: orderMap[dishId], bomList: dish ? dish.bomList : [] }
          })
          const orderData = {
            createTime: Date.now(),
            orderNum: orderNum,
            materialTotal: Object.values(materialAgg),
            totalMoney: parseFloat(totalMoney.toFixed(2)),
            lossRate: lossRate,
            operator: userInfo.nickName || userInfo.nickname || '店长'
          }
          storage.saveOrder(orderData).then(() => {
            wx.showToast({ title: '订单保存成功', icon: 'success' })
            setTimeout(() => {
              this.setData({ orderMap: {}, mealMap: {} })
              this.refreshSummary()
            }, 1500)
          }).catch(e => {
            console.error('保存订单失败:', e)
            wx.showToast({ title: '保存失败', icon: 'error' })
          })
        }
      })
    }).catch(e => {
      wx.hideLoading()
      console.error('计算采购汇总失败:', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

}, { mode: 'scrollview', scrollViewClass: '.dish-scroll' }))
