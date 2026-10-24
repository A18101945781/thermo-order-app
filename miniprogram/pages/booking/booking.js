const storage = require('../../utils/storage')
const { SEED_SETMEALS, SEED_DISHES, SEED_INVENTORY_MAP, SEED_INVENTORY } = require('../../utils/seed.js')
const calc = require('../../utils/calc')
const bizCalendar = require('../../utils/bizCalendar')
const { buildFullCsv } = require('../../utils/purchasePlan')
const { withScrollAnchor } = require('../../utils/scrollAnchor')

// ── 同日同色（2026-09-30 用户要求）────────────────────────────
// 色板刻意避开品牌红 #FA5151：红色在本页已用于「客源」「金额」等强调信息，
// 日期再用红会糊成一片。按「日期去重升序」的序号取色 ——
// 同一天的预定不管几条、几点，颜色恒一致，一眼看出「这几条是同一场」。
const DATE_COLORS = [
  '#2A6BF2', // 蓝
  '#07A35A', // 绿
  '#F5A623', // 橙
  '#8C6EEF', // 紫
  '#00A6A6', // 青
  '#E8622C', // 砖橙
  '#C2185B', // 玫红
  '#5B8C00'  // 橄榄
]

// ── 自定义餐标（2026-10-07 用户拍板）────────────────────────────
// 用于「按桌 / 按斤 / 一口价」等**非标准套餐**的预定（如「上海紫龙国旅 105人 258/桌」）：
//   ① 不绑标准套餐 ⇒ 没有菜品组成 ⇒ **不参与自动备货**；
//   ② 单价可手填（也可留空），金额 = 单价 × 订购数；
//   ③ 备注自由写（如「258/桌」）；
//   ④ 因为不参与备货，列表卡片与生成采购单都会**明确提醒「需手动备货」**，避免漏备。
const CUSTOM_MEAL_ID = 'custom'
const CUSTOM_MEAL_NAME = '自定义餐标'
const CUSTOM_MEAL_LABEL = '自定义餐标（手填单价/备注）'
// 判定「看起来像餐标而不是份数」：含 / 元 桌 斤 人 位 等量词，且含数字（如「258/桌」「50元/位」）
const CUSTOM_PRICE_HINT = /[\/／]|元|桌|斤|公斤|人|位/

/** #RRGGBB → rgba(r,g,b,alpha)，给日期配同色浅底 */
function hexWithAlpha(hex, alpha) {
  const h = String(hex || '').replace('#', '')
  if (h.length !== 6) return 'rgba(0,0,0,' + alpha + ')'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
}

Page(withScrollAnchor({
  data: {
    list: [],
    summary: { byDate: [], byCustomer: [] },
    // 下次备货看板（2026-10-10 建；2026-10-11 起按「营业日」算：周一休息自动跳过）
    bizBoard: { date: '', label: '', skipText: '', count: 0, portions: 0, amountText: '0.00', customCount: 0, items: [] },
    boardExpand: false,
    showAddPopup: false,
    showImportDialog: false,     // 批量粘贴导入弹窗（2026-10-03）
    importRaw: '',               // 粘贴原文
    importPreview: null,         // 解析预览 {rows, okCount, dupCount, errCount}
    importPicks: {},             // 金额有歧义的行，用户点选的套餐 {行号: mealId}
    importTime: '12:00',         // 统一取餐时间（导入的记录共用）
    editingId: '',               // 非空表示编辑态（更改已有预定）
    setmealOptions: [],          // [{label, value:_id, name, price}]
    setmealIndex: -1,
    purchaseDate: '全部',         // 备货日期筛选：全部 / 指定日期
    purchaseDateIndex: 0,
    purchaseDateOptions: ['全部'],
    swapExpand: false,           // 换菜面板是否展开
    swapFromOptions: [],         // 当前套餐含的菜（可替换的原菜）
    swapFromIndex: -1,
    swapToOptions: [],           // 所有 SOP 菜（兜底候选，主候选见 addOnOptions）
    swapToIndex: -1,
    swapQty: '',                 // 留空 = 整道菜全部替换（默认口径）；填数字 = 只换该份数
    swapQtyTouched: false,       // 用户是否手动填过换菜份数（默认留空=全换，不跟随订购数）
    addOnExpand: false,          // 加菜面板是否展开
    addOnIndex: -1,
    addOnQty: '1',
    addOnQtyTouched: false,      // 用户是否手动改过加菜份数（未改则自动跟随订购数）
    addOnOptions: [],            // 加菜 / 换菜「新菜」候选：成人套餐用得到的单品菜
    fieldErrors: {},             // 保存校验：{date|time|customer|setmeal|orderQty: '缺什么'}
    lastCustomer: '',            // 上次输入的客源（持久化，新单弹窗可一键带入）
    timeShortcuts: [             // 常用取餐时间快捷：午餐 / 晚餐
      { label: '午餐', time: '11:30' },
      { label: '晚餐', time: '17:30' }
    ],
    form: {
      date: '', time: '12:00',
      customer: '',
      setmealId: '', setmealName: '', unitPrice: '',
      orderQty: '', giftQty: '0',
      typeRemark: '',
      dishSwaps: [],             // [{fromDishId,fromDishName,toDishId,toDishName,qty}] 仅此单换菜
      extraDishes: []            // [{dishId,dishName,qtyPerSet}] 套餐外加菜（份/套，保留原组成）
    }
  },

  onLoad() {
    // 上次客源持久化（如「锦江」）：新单弹窗默认带入 + 一键恢复快捷
    try {
      const lc = wx.getStorageSync('lastCustomer') || ''
      if (lc) this.setData({ lastCustomer: lc })
    } catch (e) { /* 静默吞掉 */ }
    // 套餐下拉：以 SEED_SETMEALS 中 category=团队 的套餐为「权威基准」，
    // 保证标准套餐（含 28/38/50/58/68 元）一定出现；
    // 再合并 storage 中可能存在的用户自定义/修改的团队套餐（按 _id，storage 优先）。
    // 这样即便本地 storage 的 setMeals 是旧版（缺 meal_28），下拉也不会漏掉标准套餐。
    const buildAdultOptions = (list) => {
      const map = {}
      // 1) 先放入 storage 中的团队套餐（用户可能改过名称/单价）
      ;(list || []).forEach(m => { if (m && m.category === '团队') map[m._id] = m })
      // 2) 用 seed 的团队套餐补齐缺失项（标准套餐始终保留）
      ;(SEED_SETMEALS || []).forEach(m => { if (m && m.category === '团队' && !map[m._id]) map[m._id] = m })
      // 28元成人套餐(meal_28) 固定排第一，其余按价格升序
      const all = Object.values(map)
      const head = all.filter(m => m._id === 'meal_28')
      const tail = all.filter(m => m._id !== 'meal_28').sort((a, b) => (a.price || 0) - (b.price || 0))
      const opts = head.concat(tail).map(m => ({
        label: m.name + '（¥' + m.price + '）',
        value: m._id, name: m.name, price: m.price
      }))
      // 🆕 末尾追加「自定义餐标」：不绑标准套餐、单价手填、备注自由（2026-10-07 用户拍板）
      opts.push({ label: CUSTOM_MEAL_LABEL, value: CUSTOM_MEAL_ID, name: CUSTOM_MEAL_NAME, price: 0, isCustom: true })
      return opts
    }
    this._buildAdultOptions = buildAdultOptions
    // 成人套餐（团队类）id 集合：用于构建「成人套餐单品菜」候选池
    this._adultMealIds = {}
    ;(SEED_SETMEALS || []).forEach(m => { if (m && m.category === '团队') this._adultMealIds[m._id] = true })
    // 构建菜品/套餐成分映射（供“仅此单换菜”使用）
    this._dishMap = Object.fromEntries((SEED_DISHES || []).map(d => [d._id, d]))
    this._setmealItemsMap = Object.fromEntries((SEED_SETMEALS || []).map(m => [m._id, m.items || []]))
    this.loadSetMeals()
    const sopDishes = (SEED_DISHES || []).filter(d => d.packageType === 'SOP')
    this.setData({
      swapToOptions: sopDishes.map(d => ({ label: d.dishName, value: d._id }))
    })
    this._purchaseInit = false   // 仅首次进页面默认选中「次日（明天）」
    this.loadList()
  },

  onShow() {
    this.loadSetMeals()   // 从「套餐组成设置」改完组成返回时，下拉与换菜列表随即刷新
    this.loadList()
  },

  // 载入套餐：storage（含用户在设置里改的组成 override）优先，seed 兜底
  loadSetMeals() {
    const build = this._buildAdultOptions
    return storage.getSetMealList().then(meals => {
      ;(meals || []).forEach(m => {
        if (m && m.items && m.items.length) this._setmealItemsMap[m._id] = m.items
        if (m && m.category === '团队' && this._adultMealIds) this._adultMealIds[m._id] = true
      })
      if (build) this.setData({ setmealOptions: build(meals) })
      // 菜品名可能被改过，用 storage 的最新菜品刷新映射，保证候选显示正确名称
      return storage.getDishList().then(dishes => {
        if (dishes && dishes.length) {
          this._dishMap = Object.fromEntries(dishes.map(d => [d._id, d]))
        }
        this.setData({ addOnOptions: this._buildAddOnOptions() })
        return meals
      }).catch(() => meals)
    }).catch(e => {
      console.error('加载套餐失败', e)
      if (build) this.setData({ setmealOptions: build([]) })
      return []
    })
  },

  /**
   * 当前套餐 items → 「换菜原菜」选项 [{label,value}]
   */
  _buildFromOptions(setmealId) {
    const items = (this._setmealItemsMap || {})[setmealId] || []
    const dishMap = this._dishMap || {}
    return items.map(it => ({
      label: (dishMap[it.dishId] || {}).dishName || it.dishId,
      value: it.dishId
    }))
  },

  /**
   * 「加菜 / 换菜新菜」候选池：
   * 1) 当前套餐 items 里的菜（置顶，最常用）
   * 2) 其他成人套餐（团队类）用过的单品菜（去重补充，保证能加到番茄炒蛋这类菜）
   */
  _buildAddOnOptions(setmealId) {
    const dishMap = this._dishMap || {}
    const nameOf = id => (dishMap[id] || {}).dishName || id
    const cur = setmealId || this.data.form.setmealId
    const seen = {}
    const opts = []
    const push = id => {
      if (!id || seen[id]) return
      seen[id] = true
      opts.push({ label: nameOf(id), value: id })
    }
    // 1) 当前套餐内的菜
    ;((this._setmealItemsMap || {})[cur] || []).forEach(it => push(it.dishId))
    // 2) 其他成人套餐里出现过的单品菜
    const adultIds = this._adultMealIds || {}
    Object.keys(this._setmealItemsMap || {}).forEach(mid => {
      if (mid === cur || !adultIds[mid]) return
      ;((this._setmealItemsMap[mid] || [])).forEach(it => push(it.dishId))
    })
    // 兜底：套餐 items 全缺失时退回 SOP 全量，保证下拉不为空
    return opts.length ? opts : (this.data.swapToOptions || [])
  },

  // 载入列表 + 刷新汇总
  loadList() {
    storage.getAdultMealList().then(list => {
      // 自动清理过期预定（取餐日 < 今天）
      const today = this._today()
      const expired = list.filter(it => it.date && it.date < today)
      if (expired.length) {
        expired.forEach(it => { const p = storage.deleteAdultMeal(it._id); if (p && p.catch) p.catch(() => {}) })
        console.log('[booking] 自动清理过期预定 ' + expired.length + ' 条')
        wx.showToast({ title: '已清理 ' + expired.length + ' 条过期预定', icon: 'none', duration: 1500 })
      }
      const active = list.filter(it => !it.date || it.date >= today)

      active.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      // 🆕 2026-10-11：备货目标日 = **下次营业日**（不再是死算的「今天+1」）。
      //   周日打开时 → 跳过休息的周一 → 落周二；周六打开 → 仍是周日，不跳。
      const bizDate = this._bizDate()
      const dates = Array.from(new Set(active.map(it => it.date).filter(Boolean))).sort()
      // ── 同一天同色：按「日期去重升序」的序号取色板 ──
      // 用浅拷贝写入颜色，**不原地改 storage 里取出的对象**（避免颜色字段被一起存回预定数据）
      const colorOf = {}
      dates.forEach((d, i) => { colorOf[d] = DATE_COLORS[i % DATE_COLORS.length] })
      // colorBg = 卡片整块底色（同一天同色 → 一眼成组）；colorBorder = 同色描边，避免底色太浅糊在灰底页面上
      const colored = active.map(it => {
        const hex = colorOf[it.date] || '#9AA0A6'
        // 🆕 2026-10-11：「待填套餐/份数」的行（导入时只给了日期+客源）—— 卡片要明说还缺什么。
        //   判据取自数据本身（套餐空 或 份数≤0），**不新增字段、不改云函数**，历史数据同样受益。
        //   自定义餐标除外：它的份数（桌数）本来就允许后补，卡片已有「需手动备货」提醒。
        const isCustom = it.setmealId === CUSTOM_MEAL_ID
        const needFill = !isCustom && (!it.setmealId || !(Number(it.orderQty) > 0))
        return Object.assign({}, it, {
          colorHex: hex,
          colorBg: hexWithAlpha(hex, 0.14),
          colorBorder: hexWithAlpha(hex, 0.34),
          needFill: needFill,
          setmealText: it.setmealName || '（待填套餐）'
        })
      })
      // 下次备货日作为常驻选项（去重），始终出现在下拉里，不依赖预定列表里有没有这天的预定
      const opts = ['全部'].concat(Array.from(new Set([bizDate, ...dates])))
      let pd = this.data.purchaseDate
      if (!this._purchaseInit) { pd = bizDate; this._purchaseInit = true }  // 首次默认下次备货日
      if (opts.indexOf(pd) < 0) pd = '全部'                                 // 容错：所选不在选项则回退
      const pidx = opts.indexOf(pd)
      // ── 下次备货看板（2026-10-10 建；2026-10-11 改按营业日算）──
      //    只统计「取餐日 = 下次备货日」的预定，供次日进货用
      const tmr = active.filter(it => it.date === bizDate)
      const tbItems = tmr.map(it => ({
        _id: it._id,
        time: it.time || '',
        customer: it.customer || '',
        // 🆕 2026-10-11：套餐为空（待填）时给个可见的占位，别让看板上出现空白行
        setmealName: it.setmealName || '（待填套餐）',
        needFill: it.setmealId !== CUSTOM_MEAL_ID && (!it.setmealId || !(Number(it.orderQty) > 0)),
        remark: it.typeRemark || '',
        orderQty: Number(it.orderQty) || 0,
        giftQty: Number(it.giftQty) || 0,
        isCustom: !!it.isCustom
      }))
      const tbPortions = tbItems.reduce((s, x) => s + x.orderQty + x.giftQty, 0)
      const tbAmount = tmr.reduce((s, it) => s + (Number(it.orderQty) || 0) * (Number(it.unitPrice) || 0), 0)
      const board = {
        date: bizDate,
        label: this._boardLabel(bizDate),
        // 「跳过了哪几天」——只有真的顺延才非空（周日打开 → '10/12 周一'），不跳则为空串
        skipText: bizCalendar.skippedText(this._today(), bizDate),
        count: tbItems.length,
        portions: tbPortions,
        amountText: tbAmount.toFixed(2),
        customCount: tbItems.filter(x => x.isCustom).length,
        items: tbItems
      }
      this.setData({ list: colored, purchaseDateOptions: opts, purchaseDate: pd, purchaseDateIndex: pidx, bizBoard: board })
      this.computeSummary(colored)
    }).catch(e => {
      console.error('加载预定失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 汇总：按日期 + 按客源；份数=订购+赠送，金额=订购×单价（不含赠送金额）
  computeSummary(list) {
    const byDate = {}, byCustomer = {}
    list.forEach(it => {
      const portions = (Number(it.orderQty) || 0) + (Number(it.giftQty) || 0)
      const amount = (Number(it.orderQty) || 0) * (Number(it.unitPrice) || 0)
      if (it.date) {
        if (!byDate[it.date]) byDate[it.date] = { portions: 0, amount: 0 }
        byDate[it.date].portions += portions
        byDate[it.date].amount += amount
      }
      if (it.customer) {
        if (!byCustomer[it.customer]) byCustomer[it.customer] = { portions: 0, amount: 0 }
        byCustomer[it.customer].portions += portions
        byCustomer[it.customer].amount += amount
      }
    })
    // 金额展示统一 2 位小数（写入展示副本 amountText，不改数据层数值）
    const dateSummary = Object.keys(byDate).sort()
      .map(d => ({ key: d, portions: byDate[d].portions, amount: byDate[d].amount, amountText: (byDate[d].amount || 0).toFixed(2) }))
    const customerSummary = Object.keys(byCustomer)
      .map(c => ({ key: c, portions: byCustomer[c].portions, amount: byCustomer[c].amount, amountText: (byCustomer[c].amount || 0).toFixed(2) }))
    this.setData({ summary: { byDate: dateSummary, byCustomer: customerSummary } })
  },

  // 打开新增弹窗，预填今天日期 + 上次客源
  openAdd() {
    const lc = (this.data.lastCustomer || '').trim()
    this.setData({
      showAddPopup: true,
      editingId: '',
      form: {
        date: this._today(), time: '12:00',
        customer: lc,                       // 上次客源持久化带入
        setmealId: '', setmealName: '', unitPrice: '',
        orderQty: '', giftQty: '0', typeRemark: '',
        dishSwaps: [],
        extraDishes: []
      },
      setmealIndex: -1,
      swapExpand: false,
      swapFromOptions: [],
      swapFromIndex: -1,
      swapToIndex: -1,
      swapQty: '',
      swapQtyTouched: false,
      addOnExpand: false,
      addOnIndex: -1,
      addOnQty: '1',
      addOnQtyTouched: false,
      fieldErrors: {}
    })
  },

  // 客源一键恢复上次输入（form 已被清空时仍能 1 秒恢复）
  onPickLastCustomer() {
    const lc = (this.data.lastCustomer || '').trim()
    if (!lc) { wx.showToast({ title: '暂无历史客源', icon: 'none' }); return }
    const patch = { 'form.customer': lc }
    if (this.data.fieldErrors.customer) patch['fieldErrors.customer'] = ''
    this.setData(patch)
  },

  // 取餐时间快捷：午餐 11:30 / 晚餐 17:30（也可自定义）
  onTimeShortcut(e) {
    const t = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.time
    if (!t) return
    const patch = { 'form.time': t }
    if (this.data.fieldErrors.time) patch['fieldErrors.time'] = ''
    this.setData(patch)
  },

  // 2026-09-30：弹窗由 t-popup 改为自绘原生弹层，不再有 visible-change 事件，
  // 本方法现在只被「遮罩 / ✕ / 取消」三处 bindtap 调用 → 直接关闭即可。
  onPopupClose() {
    this.setData({ showAddPopup: false })
  },

  // 空方法：给面板 catchtap 用来阻止冒泡（防止点面板内部时误触遮罩关闭）
  onNoop() {},

  // 更改已有预定：回填该记录到表单，并标记 editingId（保存时原地更新）
  /**
   * 从当前列表按 id 取预订单
   * ⚠️ 2026-09-27：卡片按钮原来用 data-item="{{item}}" 传**整个对象**（含 mealItems 快照数组），
   *    体积大且一旦序列化失败 → onEdit 里 `if (!item) return` **静默无反应**。
   *    改为只传 _id、在这里按 id 查，并在查不到时给出提示（不再静默）。
   */
  _findBooking(e) {
    const ds = (e && e.currentTarget && e.currentTarget.dataset) || {}
    const id = ds.id
    if (!id) return null
    return (this.data.list || []).find(it => it._id === id) || null
  },

  onEdit(e) {
    const item = this._findBooking(e)
    if (!item) {
      console.warn('[booking] onEdit 取不到预定，dataset =', (e && e.currentTarget && e.currentTarget.dataset) || null)
      wx.showToast({ title: '没找到这条预定，请下拉刷新后重试', icon: 'none', duration: 2000 })
      return
    }
    const idx = this.data.setmealOptions.findIndex(o => o.value === item.setmealId)
    const fromOpts = this._buildFromOptions(item.setmealId)
    this.setData({
      showAddPopup: true,
      editingId: item._id,
      setmealIndex: idx >= 0 ? idx : -1,
      swapExpand: true,
      swapFromOptions: fromOpts,
      swapFromIndex: -1,
      swapToIndex: -1,
      swapQty: '',
      swapQtyTouched: false,
      addOnExpand: true,
      addOnIndex: -1,
      addOnQty: (item.orderQty || '').toString() || '1',
      addOnQtyTouched: false,
      addOnOptions: this._buildAddOnOptions(item.setmealId),
      fieldErrors: {},
      form: {
        date: item.date,
        time: item.time,
        customer: item.customer,
        setmealId: item.setmealId,
        setmealName: item.setmealName,
        unitPrice: String(item.unitPrice),
        orderQty: String(item.orderQty),
        giftQty: String(item.giftQty || 0),
        typeRemark: item.typeRemark || '',
        dishSwaps: (item.dishSwaps || []).map(s => Object.assign({}, s)),
        extraDishes: (item.extraDishes || []).map(s => Object.assign({}, s))
      }
    })
  },

  // 文本/数字字段绑定（t-input 的 bind:change 给 e.detail.value）
  onFormChange(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    const patch = { ['form.' + field]: e.detail.value }
    if (this.data.fieldErrors[field]) patch['fieldErrors.' + field] = ''
    // ⚠️ 2026-09-27：这里原来在「订购数」变化时**额外 setData 了 addOnQty**，
    //   使输入框每打一个字就被受控回写一次 → 表现成**订购数无法输入**。
    //   而 addOnQty 早已不参与计算（onAddAddOn 直接用 form.orderQty；展开时由
    //   onToggleAddOnExpand 联动），所以这里不再联动，输入只改一个字段。
    this.setData(patch)
  },

  onDateChange(e) {
    const patch = { 'form.date': e.detail.value }
    if (this.data.fieldErrors.date) patch['fieldErrors.date'] = ''
    this.setData(patch)
  },
  onTimeChange(e) {
    const patch = { 'form.time': e.detail.value }
    if (this.data.fieldErrors.time) patch['fieldErrors.time'] = ''
    this.setData(patch)
  },

  // 选套餐：原生 picker 返回选中项下标，带出名称与单价
  onPickSetMeal(e) {
    const idx = Number(e.detail.value)
    const meal = this.data.setmealOptions[idx]
    if (!meal) return
    // 重建可替换原菜列表（套餐内成分），并清空已有换菜（换套餐后旧的失效）
    const isCustom = meal.value === CUSTOM_MEAL_ID
    const items = (this._setmealItemsMap && this._setmealItemsMap[meal.value]) || []
    const fromOpts = isCustom ? [] : this._buildFromOptions(meal.value)
    this.setData({
      setmealIndex: idx,
      'form.setmealId': meal.value,
      'form.setmealName': meal.name,
      // 自定义餐标：单价留空待手填（也可留空 → 金额按 0 记）；标准套餐：带出套餐单价
      'form.unitPrice': isCustom ? '' : String(meal.price),
      'form.dishSwaps': [],
      'form.extraDishes': [],
      swapFromOptions: fromOpts,
      swapFromIndex: -1,
      swapToIndex: -1,
      swapQty: '',
      swapQtyTouched: false,
      addOnOptions: this._buildAddOnOptions(meal.value),
      addOnIndex: -1,
      addOnQty: (this.data.form.orderQty || '').trim() || '1',
      addOnQtyTouched: false,
      fieldErrors: Object.assign({}, this.data.fieldErrors, { setmeal: '' })
    })
  },

  // ===== 仅此单换菜（套餐定义不变，挂在这条预定记录上）=====
  onToggleSwapExpand() {
    // 换菜默认「整道菜全换」= 份数留空（qty:null）。此处不做份数预填，
    // 避免历史上默认 '1' 导致「只换 1 份」的漏换事故。
    this.setData({ swapExpand: !this.data.swapExpand })
  },
  onSwapFromChange(e) { this.setData({ swapFromIndex: Number(e.detail.value) }) },
  onSwapToChange(e) { this.setData({ swapToIndex: Number(e.detail.value) }) },
  onSwapQtyChange(e) { this.setData({ swapQty: e.detail.value, swapQtyTouched: true }) },
  // 一键把换菜份数设为订购数（用于「只换其中 N 份」的场景；默认留空是全换）
  onSwapSameAsOrder() {
    const q = (this.data.form.orderQty || '').trim()
    if (!q || Number(q) <= 0) { wx.showToast({ title: '请先填订购数', icon: 'none' }); return }
    this.setData({ swapQty: q, swapQtyTouched: true })
  },
  // 一键「整道菜全部替换」= 清空份数（留空在 applySwaps 中等同全换），回到默认口径
  onSwapAll() {
    this.setData({ swapQty: '', swapQtyTouched: false })
  },
  onAddSwap() {
    const d = this.data
    const fromOpt = d.swapFromOptions[d.swapFromIndex]
    const toOpt = d.addOnOptions[d.swapToIndex]
    if (!fromOpt || !toOpt) { wx.showToast({ title: '请选择原菜和新菜', icon: 'none' }); return }
    if (fromOpt.value === toOpt.value) { wx.showToast({ title: '原菜与新菜不能相同', icon: 'none' }); return }
    // 数量留空 = 整道菜全部替换；填数字 = 只替换该数量的份数
    const rawQty = (d.swapQty || '').trim()
    const qty = rawQty === '' ? null : Number(rawQty)
    if (qty !== null && (isNaN(qty) || qty <= 0)) { wx.showToast({ title: '换菜数量需大于 0', icon: 'none' }); return }
    const swaps = d.form.dishSwaps.concat([{
      fromDishId: fromOpt.value, fromDishName: fromOpt.label,
      toDishId: toOpt.value, toDishName: toOpt.label, qty: qty
    }])
    // 添加后回到默认「整道菜全换」（留空），避免残留数字造成下一条漏换
    this.setData({
      'form.dishSwaps': swaps, swapFromIndex: -1, swapToIndex: -1,
      swapQty: '', swapQtyTouched: false
    })
  },
  onRemoveSwap(e) {
    const idx = Number(e.currentTarget.dataset.index)
    const swaps = this.data.form.dishSwaps.slice()
    if (idx >= 0 && idx < swaps.length) swaps.splice(idx, 1)
    this.setData({ 'form.dishSwaps': swaps })
  },

  // ===== 套餐外加菜（保留原组成，额外追加；份数=总份数，不乘订购数）=====
  onToggleAddOnExpand() {
    const open = !this.data.addOnExpand
    const patch = { addOnExpand: open }
    // 展开加菜面板时，若没手改过 → 默认份数 = 订购数
    if (open && !this.data.addOnQtyTouched) {
      patch.addOnQty = (this.data.form.orderQty || '').trim() || '1'
    }
    this.setData(patch)
  },
  onAddOnChange(e) { this.setData({ addOnIndex: Number(e.detail.value) }) },
  onAddOnQtyChange(e) { this.setData({ addOnQty: e.detail.value, addOnQtyTouched: true }) },
  // 一键把加菜份数设为订购数（UI 已无手填输入框，此处仅作显式回归 + 状态同步）
  onAddOnSameAsOrder() {
    const q = (this.data.form.orderQty || '').trim()
    if (!q || Number(q) <= 0) { wx.showToast({ title: '请先填订购数', icon: 'none' }); return }
    this.setData({ addOnQty: q, addOnQtyTouched: false })
  },
  onAddAddOn() {
    const d = this.data
    const opt = d.addOnOptions[d.addOnIndex]
    if (!opt) { wx.showToast({ title: '请选择加菜', icon: 'none' }); return }
    // 口径（2026-09-12 用户拍板）：加菜份数固定 = 订购数，不提供手填入口
    // 不再读 addOnQty 输入框，避免误填成 1 份之类的漏加事故
    const qty = Number(d.form.orderQty) || 0
    if (qty <= 0) { wx.showToast({ title: '请先填订购数', icon: 'none' }); return }
    const extras = d.form.extraDishes.concat([{
      dishId: opt.value, dishName: opt.label,
      qty: qty, qtyPerSet: qty   // 存「总份数」：订 100 就加 100 份
    }])
    this.setData({
      'form.extraDishes': extras, addOnIndex: -1,
      addOnQty: String(qty), addOnQtyTouched: false
    })
  },
  onRemoveAddOn(e) {
    const idx = Number(e.currentTarget.dataset.index)
    const extras = this.data.form.extraDishes.slice()
    if (idx >= 0 && idx < extras.length) extras.splice(idx, 1)
    this.setData({ 'form.extraDishes': extras })
  },

  // 保存：校验（逐字段红字提示）-> 计算金额 -> 写 storage -> 刷新
  /**
   * 编辑态：在弹窗里直接删除这条预定（2026-09-27 用户反馈「找不到删除入口」补）
   */
  onDeleteEditing() {
    const id = this.data.editingId
    if (!id) return
    const item = (this.data.list || []).find(it => it._id === id)
    const label = item ? item.date + ' ' + (item.setmealName || '') : ''
    wx.showModal({
      title: '确认删除',
      content: '确定删除「' + label + '」这条预定吗？',
      success: res => {
        if (!res.confirm) return
        storage.deleteAdultMeal(id).then(() => {
          wx.showToast({ title: '已删除', icon: 'success' })
          this.setData({ showAddPopup: false, editingId: '' })
          this.loadList()
        })
      }
    })
  },

  onSave() {
    const f = this.data.form
    const orderQty = Number(f.orderQty)
    const errs = {}
    if (!f.date || !f.time) { errs.date = '请选择预定日期'; errs.time = '请选择取餐时间' }
    if (!(f.customer || '').trim()) errs.customer = '请输入客源'
    if (!f.setmealId) errs.setmeal = '请选择套餐'
    if (!orderQty || orderQty <= 0) errs.orderQty = '订购数需大于 0'
    if (Object.keys(errs).length) {
      this.setData({ fieldErrors: errs })
      wx.showToast({ title: '请补全红字标出的必填项', icon: 'none' })
      return
    }
    this.setData({ fieldErrors: {} })

    const unitPrice = Number(f.unitPrice) || 0
    const giftQty = Number(f.giftQty) || 0
    // 组成快照：把「下单当时」的套餐组成固化到这条预定上。
    // 之后在设置里改了套餐默认组成，历史预定仍按当时组成备货，便于对账。
    const snapItems = ((this._setmealItemsMap || {})[f.setmealId] || []).map(it => ({
      dishId: it.dishId,
      qty: Number(it.qty) || 1,
      dishName: ((this._dishMap || {})[it.dishId] || {}).dishName || it.dishId
    }))
    const data = {
      _id: this.data.editingId,   // 编辑态带 _id → 原地更新；新增态为空 → 生成新 id
      date: f.date,
      time: f.time,
      customer: (f.customer || '').trim(),
      setmealId: f.setmealId,
      setmealName: f.setmealName,
      unitPrice: unitPrice,
      orderQty: orderQty,
      giftQty: giftQty,
      typeRemark: (f.typeRemark || '').trim(),
      dishSwaps: (f.dishSwaps || []).map(s => Object.assign({}, s)),
      extraDishes: (f.extraDishes || []).map(s => Object.assign({}, s)),
      mealItems: snapItems,               // 组成快照（下单当时的套餐组成）；自定义餐标恒为空
      isCustom: f.setmealId === CUSTOM_MEAL_ID,   // 🆕 自定义餐标标记（用于「需手动备货」提醒）
      totalAmount: orderQty * unitPrice   // 金额仅按订购数算，赠送不计费
    }
    storage.saveAdultMeal(data).then(() => {
      // 客源持久化：记住用户最近录入的客源，新单弹窗可一键带入
      try { wx.setStorageSync('lastCustomer', data.customer) } catch (e) { /* 静默吞掉 */ }
      this.setData({ lastCustomer: data.customer })
      this.setData({ showAddPopup: false, editingId: '' })
      this.loadList()
      wx.showToast({ title: '保存成功', icon: 'success' })
    }).catch(e => {
      console.error('保存预定失败', e)
      wx.showToast({ title: '保存失败', icon: 'error' })
    })
  },

  // 备货日期选择（全部 / 指定日期）
  onPurchaseDateChange(e) {
    const idx = Number(e.detail.value)
    const opts = this.data.purchaseDateOptions
    this.setData({ purchaseDateIndex: idx, purchaseDate: opts[idx] || '全部' })
  },

  // 按选定日期（或全部）生成采购单：预定 -> 套餐(订购+赠送全做) -> 菜品 -> 原料缺口，产出 CSV 跳订货页预览
  onGeneratePurchase() {
    const filterDate = this.data.purchaseDate
    Promise.all([
      storage.getAdultMealList(),
      storage.getSetMealList(),
      storage.getDishList(),
      storage.getMaterialList(),
      storage.getInventoryList()   // 🔴 2026-10-06：原先此处绕过 storage、直接读本机镜像，
                                   //    ⇒ 手机上改了库存，本机镜像仍是旧值 → 采购单按旧库存扣减。
                                   //    改走 storage.getInventoryList()（云模式读云端，本地仅兜底）。
    ]).then(([meals, setMeals, dishes, materials, inventoryList]) => {
      // 1) 逐单展开（支持换菜）：预定 -> 套餐(订购+赠送) -> 菜品（复用公共函数，与合并采购单口径一致）
      //    同时产出 sourceMap，供采购单预览溯源把每个菜拆成「预定 / 赠送」两栏
      const { dishMap, sourceMap } = calc.expandAdultBookingsWithSource(meals, setMeals, dishes, filterDate)
      // 🆕 自定义餐标单没有菜品组成、不参与自动备货 → 统计条数，「生成前 / 无需求时」都要提醒（2026-10-07 用户拍板）
      const customCnt = (meals || []).filter(function (m) {
        return m && m.setmealId === CUSTOM_MEAL_ID && (filterDate === '全部' || m.date === filterDate)
      }).length
      if (!Object.keys(dishMap).length) {
        if (customCnt) {
          wx.showModal({
            title: '没有可自动备货的菜品',
            content: '该范围内只有 ' + customCnt + ' 条「自定义餐标」预定。它们没有菜品组成、不参与自动备货，请按实际菜单手动备货。',
            showCancel: false, confirmText: '知道了'
          })
        } else {
          wx.showToast({ title: filterDate === '全部' ? '无预定' : '该日期无预定', icon: 'none' })
        }
        return
      }
      // 2) 预定菜单汇总：每单的套餐 / 份数 / 实际出餐菜单（含换菜、加菜），先于采购明细展示
      const menuSummary = calc.buildBookingMenuSummary(meals, setMeals, dishes, filterDate)
      // 3) 菜品 -> 原料聚合（损耗率 1.0，含库存缺口、按供应商分组；复用 buildPurchasePlan）
      // 🔴 第 3 参 = 出厂库存基线：实时单子（云端/本地镜像）缺某项时用它兜底，
      //    不再像以前那样静默回退成 0（见 calc.joinInventoryMap 注释）
      const invMap = calc.joinInventoryMap(inventoryList || [], SEED_INVENTORY_MAP, SEED_INVENTORY)
      const { groups, totalMoney } = calc.buildPurchasePlan(dishMap, dishes, materials, 1.0, sourceMap, invMap)
      if (!groups.length) { wx.showToast({ title: '无原料需求', icon: 'none' }); return }
      // 5) 构建 CSV（多供应商合并 + 弹窗全样格式：顶部标题/文件名 + 各片 + 底部总金额）
      const dateStr = this._today().replace(/-/g, '')
      const dateLabel = filterDate === '全部' ? '全部预定' : filterDate
      const fileName = '采购单_预定备货_' + (filterDate === '全部' ? '全部' : filterDate) + '_' + dateStr + '.csv'
      const title = '采购单预览 · 预定备货（' + (filterDate === '全部' ? '全部日期' : filterDate) + '）'
      const csv = buildFullCsv({
        title: title,
        fileName: fileName,
        groups: groups,
        totalMoney: parseFloat(totalMoney.toFixed(2)),
        dateLabel: dateLabel,
        sourceLabel: '预定备货（订购+赠送）',
        menuSummary: menuSummary      // 顶部先出「预定菜单汇总」，再出原料明细
      })
      const plan = {
        title: title,
        csv: csv, fileName: fileName, groups: groups, totalMoney: parseFloat(totalMoney.toFixed(2)),
        menuSummary: menuSummary,
        dateLabel: dateLabel,                    // 带色 XLSX 副标题/口径页要用
        sourceLabel: '预定备货（订购+赠送）'
      }
      wx.setStorageSync('pendingPurchasePlan', plan)
      const goCalc = function () { wx.switchTab({ url: '/pages/orderCalc/orderCalc' }) }
      if (customCnt) {
        // 生成前提醒：自定义餐标单不在本采购单里，别漏备货
        wx.showModal({
          title: '⚠️ 别忘了手动备货',
          content: '另有 ' + customCnt + ' 条「自定义餐标」预定不参与自动备货，本采购单里不含它们，请另外按实际菜单备货。',
          showCancel: false, confirmText: '知道了', success: goCalc
        })
      } else {
        goCalc()
      }
    }).catch(e => {
      console.error('生成采购单失败', e)
      wx.showToast({ title: '生成失败', icon: 'none' })
    })
  },

  // 删除确认
  onDelete(e) {
    const item = this._findBooking(e)
    if (!item) {
      wx.showToast({ title: '没找到这条预定，请下拉刷新后重试', icon: 'none', duration: 2000 })
      return
    }
    wx.showModal({
      title: '确认删除',
      content: '确定删除「' + item.date + ' ' + item.setmealName + '」这条预定吗？',
      success: res => {
        if (res.confirm) {
          storage.deleteAdultMeal(item._id).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadList()
          })
        }
      }
    })
  },

  // 本地预定 → 云同步（免 Console）：仅云端模式（cloudConfig.envId 已填 + 已部署云函数）可用
  onMigrateCloud() {
    const app = getApp()
    if (!app || !app.globalData || !app.globalData.cloudReady) {
      wx.showModal({
        title: '尚未开启云模式',
        content: '请先在 miniprogram/utils/cloudConfig.js 填入云开发环境 ID，并在开发者工具「上传并部署」云函数后再试。',
        showCancel: false
      })
      return
    }
    wx.showLoading({ title: '同步中...' })
    storage.migrateLocalBookingsToCloud()
      .then(r => {
        wx.hideLoading()
        const n = (r && r.migrated) || 0
        wx.showToast({ title: '已同步 ' + n + ' 条到云端', icon: 'success' })
        this.loadList()
      })
      .catch(e => {
        wx.hideLoading()
        console.error('迁移失败', e)
        wx.showModal({
          title: '同步失败',
          content: (e && e.message) || '请确认已开通云开发、已部署 bookingManage 云函数、网络正常。',
          showCancel: false
        })
      })
  },

  // ===== 批量粘贴导入预定（2026-10-03）=====
  // 用户把预定信息整段粘进来，一次录入多条。支持三种写法（自动识别）：
  //   ① 中文短句一行一条：10.4 靖江行知 18份（送一份）38元
  //   ② 表格列（从 Excel 复制，TAB 或逗号分隔）：日期 , 客源 , 套餐 , 订购 , 赠送 , 备注
  //   ③ 🔴 跨行续写（2026-10-03 补）：日期/份数一行、餐标另起一行、末尾再跟一行就餐时间说明，并成同一条
  //        10.5 科奇 30份 送2份 / 餐标50元 / 都是12点左右吃饭   → 一条（12:00）
  // 🔴 只做「格式解析 + 精确匹配」，金额对应多个套餐时**不猜**，列出来让用户点选（项目铁律）；
  //    唯一例外：同一客源历史用过其中一个 → 按历史预选（数据派生），仍可在行内改。

  /** 全角 → 半角（数字/括号/标点），中文原样保留 */
  _toHalf(s) {
    return String(s == null ? '' : s)
      .replace(/[\uFF01-\uFF5E]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0) })
      .replace(/\u3000/g, ' ')
  },

  /** 中文数字 → 阿拉伯（0-99 够用），认不出返回 NaN */
  _cn2num(s) {
    const t = String(s == null ? '' : s).trim()
    if (/^[0-9]+$/.test(t)) return Number(t)
    const M = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
    if (t === '十') return 10
    if (/^十[一二三四五六七八九]$/.test(t)) return 10 + M[t[1]]
    if (/^[一二三四五六七八九]十$/.test(t)) return M[t[0]] * 10
    if (/^[一二三四五六七八九]十[一二三四五六七八九]$/.test(t)) return M[t[0]] * 10 + M[t[2]]
    if (M[t] !== undefined) return M[t]
    return NaN
  },

  /** 日期归一化：10.4 / 10-04 / 2026-10-04 / 10月4日 → 2026-10-04（无年份按今年），认不出返回 '' */
  _normBookingDate(raw) {
    const s = String(raw == null ? '' : raw).trim()
    let y = null, m = null, d = null, mt = null
    if ((mt = s.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/))) { y = +mt[1]; m = +mt[2]; d = +mt[3] }
    else if ((mt = s.match(/(\d{1,2})[-./](\d{1,2})/))) { m = +mt[1]; d = +mt[2] }
    else if ((mt = s.match(/(\d{1,2})月(\d{1,2})日?/))) { m = +mt[1]; d = +mt[2] }
    if (m == null || d == null) return ''
    if (y == null) y = new Date().getFullYear()
    if (m < 1 || m > 12 || d < 1 || d > 31) return ''
    const p = n => (n < 10 ? '0' : '') + n
    return y + '-' + p(m) + '-' + p(d)
  },

  /**
   * 从片段中抠出就餐时间 → { time:'HH:MM', rest:'剩余片段' }
   * 认 12:30 / 12点半 以外的写法：12点 / 12点左右 / 中午12点 等（中文描述由调用方清洗）
   */
  _takeTime(s) {
    let t = String(s == null ? '' : s)
    const pad = n => (n < 10 ? '0' : '') + n
    let m = t.match(/(\d{1,2})\s*[:：]\s*(\d{1,2})/)
    if (m) {
      const h = +m[1], mi = +m[2]
      if (h < 24 && mi < 60) return { time: pad(h) + ':' + pad(mi), rest: t.replace(m[0], ' ') }
    }
    m = t.match(/(\d{1,2})\s*点\s*(\d{1,2})?\s*分?/)
    if (m) {
      const h = +m[1], mi = m[2] ? +m[2] : 0
      if (h < 24 && mi < 60) return { time: pad(h) + ':' + pad(mi), rest: t.replace(m[0], ' ') }
    }
    return { time: '', rest: t }
  },

  /**
   * 🔴 表格列「套餐 / 订购」列序对齐（2026-10-07）
   * Excel 粘来的表来源不统一，第 3/4 列常见两种写法：
   *   ① 约定列序：套餐 | 订购        ② 手写习惯：份数 | 餐标(元)
   * 判据 = **确定性匹配**（哪一列能精确命中套餐），不是语义猜测。
   * 只在「第 3 列认不出套餐、第 4 列认得出」时交换；两列都认得出（如 50|50）
   * 或都认不出 → 维持约定列序，绝不猜。
   * @returns {{setmeal:String, qty:Number, swapped:Boolean}}
   */
  _alignSetmealQty(col2, col3) {
    const a = String(col2 == null ? '' : col2).trim()
    const b = String(col3 == null ? '' : col3).trim()
    const toQty = s => Number(String(s == null ? '' : s).replace(/[^0-9.]/g, '')) || 0
    const ok = s => {
      if (!s) return false
      const r = this._resolveSetmeal(s)
      return !!r.meal || !!r.candidates
    }
    if (!ok(a) && ok(b)) return { setmeal: b, qty: toQty(a), swapped: true }
    // 🆕 2026-10-07：两列都不命中标准套餐时，若其中一列「看起来是餐标」（含 / 元 桌 斤 人等 + 数字），
    //   判定为「自定义餐标」行 → 交给上层把该列原文写进备注、订购数留空，不再报「没有 ¥X 的套餐」。
    //   🔴 判据是**字符特征（确定性）**，不是语义联想；两列都像/都不像 → 维持原列序（保持既有报错，不猜）。
    if (!ok(a) && !ok(b)) {
      const priceLike = s => !!s && CUSTOM_PRICE_HINT.test(s) && /[0-9]/.test(s)
      const qtyLike = s => !!s && !CUSTOM_PRICE_HINT.test(s)
      if (priceLike(b) && qtyLike(a)) return { custom: true, label: b, qty: toQty(a), swapped: false }
      if (priceLike(a) && qtyLike(b)) return { custom: true, label: a, qty: toQty(b), swapped: true }
    }
    return { setmeal: a, qty: toQty(b), swapped: false }
  },

  /**
   * 解析一行 → 原始字段（不做套餐匹配）
   * @returns {{date,customer,setmealRaw,orderQty,giftQty,remark,error,colSwapped}}
   */
  _parseBookingLine(line) {
    const half = String(this._toHalf(line) || '').trim()
    const out = { date: '', customer: '', setmealRaw: '', orderQty: 0, giftQty: 0, remark: '', error: '', colSwapped: false, isCustom: false }

    // ── 表格列模式：含 TAB，或含 ≥2 个逗号 ──
    const byTab = half.indexOf('\t') >= 0
    const commaCnt = (half.match(/[,，]/g) || []).length
    if (byTab || commaCnt >= 2) {
      const parts = half.split(byTab ? '\t' : /[,，]/).map(function (x) { return String(x).trim() })
      out.date = parts[0] || ''
      out.customer = parts[1] || ''
      // 🔴 第 3/4 列列序自适应（2026-10-07）：兼容「套餐|订购」与「份数|餐标」两种写法
      const cols = this._alignSetmealQty(parts[2], parts[3])
      out.colSwapped = cols.swapped
      if (cols.custom) {
        // 🆕 自定义餐标行（如「105 | 258/桌」）：不绑套餐、餐标原文进备注、订购数留空（按桌数由用户填）
        out.isCustom = true
        out.setmealRaw = CUSTOM_MEAL_ID
        out.orderQty = 0
        out.remark = cols.label
      } else {
        out.setmealRaw = cols.setmeal
        out.orderQty = cols.qty
        out.giftQty = Number(parts[4]) || 0
        out.remark = parts[5] || ''
      }
      if (!out.date) out.error = '缺日期'
      else if (!out.customer) out.error = '缺客源'
      return out
    }

    // ── 中文短句模式：按 token 逐个抠出，顺序无关 ──
    let rest = half
    let m = rest.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}[-./]\d{1,2}|\d{1,2}月\d{1,2}日?)/)
    if (m) { out.date = m[0]; rest = rest.replace(m[0], ' ') }
    m = rest.match(/([0-9]+(?:\.[0-9]+)?)\s*元/) || rest.match(/[¥￥]\s*([0-9]+(?:\.[0-9]+)?)/)
    if (m) { out.setmealRaw = m[1]; rest = rest.replace(m[0], ' ') }
    m = rest.match(/送\s*([0-9]+|[零一二两三四五六七八九十]+)\s*份?/)
    if (m) { const g = this._cn2num(m[1]); out.giftQty = isNaN(g) ? 0 : g; rest = rest.replace(m[0], ' ') }
    m = rest.match(/([0-9]+)\s*份/) || rest.match(/订(?:购)?\s*([0-9]+)/)
    if (m) { out.orderQty = Number(m[1]) || 0; rest = rest.replace(m[0], ' ') }
    out.customer = rest.replace(/[()（）\[\]【】{}<>《》,，、。;；:：!！?？\-—/\\|+*#]/g, ' ').replace(/\s+/g, '')

    if (!out.date) out.error = '没读出日期'
    else if (!out.customer) out.error = '没读出客源'
    else if (!out.orderQty) out.error = '没读出订购数'
    else if (!out.setmealRaw) out.error = '没读出套餐/金额'
    return out
  },

  /** 套餐匹配：① _id ② 名称 ③ 金额。金额命中多个 → 返回 candidates（交给用户点选，不猜） */
  _resolveSetmeal(raw) {
    const options = this.data.setmealOptions || []
    const r = String(raw == null ? '' : raw).trim()
    if (!r) return { none: true, msg: '缺套餐' }
    const norm = s => String(s || '').replace(/\s+/g, '').toLowerCase()
    let hit = options.filter(function (o) { return o.value === r })[0]
    if (hit) return { meal: hit }
    hit = options.filter(function (o) { return norm(o.name) === norm(r) })[0]
    if (hit) return { meal: hit }
    const price = Number(String(r).replace(/[^0-9.]/g, ''))
    if (!isNaN(price) && price > 0) {
      const cands = options.filter(function (o) { return Number(o.price) === price })
      if (cands.length === 1) return { meal: cands[0] }
      if (cands.length > 1) return { candidates: cands }
      return { none: true, msg: '没有 ¥' + price + ' 的套餐' }
    }
    return { none: true, msg: '认不出套餐「' + r + '」' }
  },

  /**
   * 解析整段粘贴文本 → 预览
   * 支持「跨行续写」：日期/份数在一行、餐标另起一行、末尾再跟一行就餐时间说明，都能并成同一条
   * 🆕 2026-10-11（用户拍板）：**只写了日期 + 客源**的行也算可导入（`needFill` 标记），
   *    套餐/份数留空，导入后点卡片「更改」补 —— 不再报「没读出订购数」拒收。
   * @param {String} text 粘贴原文
   * @param {Object} picks 金额歧义行的点选 {行号: mealId}
   * @returns {{rows:Array, okCount, dupCount, errCount, timeHint}}
   */
  _parseBookingPaste(text, picks) {
    const self = this
    const pick = picks || {}
    const rows = []

    // 已有预定的业务键：日期|客源|套餐
    // 🆕 2026-10-11：套餐可空（「待填套餐/份数」的行），键里用 '' 占位，保证重复粘贴能判重
    const seen = {}
    ;(this.data.list || []).forEach(function (it) {
      if (it && it.date && it.customer) seen[[it.date, it.customer, it.setmealId || ''].join('|')] = true
    })
    const batchSeen = {}

    // 中文描述词：用来判断「这行只是说明，不是预订单」
    // 注意：多字词必须排在单字前（如「吃饭」先于「吃」），否则会剩下半个词导致说明行认不出
    const NOTE_WORDS = /(都|是|左右|前后|大约|大概|约|吃饭|吃|用餐|就餐|取餐|送到|中午|上午|下午|晚上|早上|时间|统一)/g
    const FILL_WORDS = /(餐标|餐费|单价|标价|标准|每位|每人|每份|每桌|备注|说明|套餐|元|份|点)/g
    const clean = s => String(s == null ? '' : s)
      .replace(/[()（）\[\]【】{}<>《》,，、。;；:：!！?？\-—/\\|+*#]/g, ' ')
      .replace(/\s+/g, '')
    const stripAll = s => String(s || '').replace(NOTE_WORDS, '').replace(FILL_WORDS, '').replace(/[0-9]/g, '')

    // ── 第 1 遍：逐行分类 + 跨行合并 ──
    const recs = []
    let cur = null
    let timeHint = ''

    String(text || '').split(/\r?\n/).forEach(function (raw, idx) {
      const line = String(raw || '').trim()
      if (!line) return
      const half = self._toHalf(line)
      // 表头行静默跳过（含列名且完全没有数字）
      if (!/[0-9]/.test(half) && /(日期|客源|客户|套餐|订购|赠送|备注|序号|时间)/.test(half)) return

      // ── 表格列模式：含 TAB，或含 ≥2 个逗号 → 独立成条，不参与跨行合并 ──
      if (half.indexOf('\t') >= 0 || (half.match(/[,，]/g) || []).length >= 2) {
        const p = self._parseBookingLine(half)
        recs.push({ line: idx + 1, raw: line, date: p.date, customer: p.customer, setmealRaw: p.setmealRaw, orderQty: p.orderQty, giftQty: p.giftQty, remark: p.remark, time: '', error: p.error, isCustom: !!p.isCustom })
        cur = null
        return
      }

      // ── 中文短句：逐 token 抠，顺序无关 ──
      let rest = half
      let dateRaw = '', amountRaw = '', giftQty = 0, orderQty = 0
      let m = rest.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}[-./]\d{1,2}|\d{1,2}月\d{1,2}日?)/)
      if (m) { dateRaw = m[0]; rest = rest.replace(m[0], ' ') }
      const tk = self._takeTime(rest)
      const time = tk.time
      rest = tk.rest
      m = rest.match(/([0-9]+(?:\.[0-9]+)?)\s*元/) || rest.match(/[¥￥]\s*([0-9]+(?:\.[0-9]+)?)/)
      if (m) { amountRaw = m[1]; rest = rest.replace(m[0], ' ') }
      m = rest.match(/送\s*([0-9]+|[零一二两三四五六七八九十]+)\s*份?/)
      if (m) { const g = self._cn2num(m[1]); giftQty = isNaN(g) ? 0 : g; rest = rest.replace(m[0], ' ') }
      m = rest.match(/([0-9]+)\s*份/) || rest.match(/订(?:购)?\s*([0-9]+)/)
      if (m) { orderQty = Number(m[1]) || 0; rest = rest.replace(m[0], ' ') }

      const leftover = clean(rest)
      const leftoverPlain = stripAll(leftover)
      // 纯「就餐时间说明」行：有规律的时间 + 无金额/份数 + 去掉描述词后什么都不剩（如「都是12点左右吃饭」）
      const isTimeNote = !!time && !amountRaw && !orderQty && !giftQty && !leftoverPlain

      if (dateRaw) {
        cur = {
          line: idx + 1, raw: line, date: dateRaw, customer: leftover,
          setmealRaw: amountRaw, orderQty: orderQty, giftQty: giftQty, remark: '', time: time, error: ''
        }
        recs.push(cur)
        return
      }

      if (isTimeNote) { timeHint = time; return }

      if (cur) {
        // 续写行：把上一条缺的字段补上（餐标 / 份数 / 赠送 / 时间），多出来的文字当备注
        if (!cur.setmealRaw && amountRaw) cur.setmealRaw = amountRaw
        if (!cur.orderQty && orderQty) cur.orderQty = orderQty
        if (!cur.giftQty && giftQty) cur.giftQty = giftQty
        if (!cur.time && time) cur.time = time
        const extra = clean(rest).replace(NOTE_WORDS, '').replace(FILL_WORDS, '').replace(/[0-9]/g, '').trim()
        if (extra) cur.remark = (cur.remark ? cur.remark + ' ' : '') + extra
        return
      }

      // 既没日期、上一条也没有 → 单列成「缺日期」的错行，让用户看得见
      recs.push({ line: idx + 1, raw: line, date: '', customer: leftover, setmealRaw: amountRaw, orderQty: orderQty, giftQty: giftQty, remark: '', time: '', error: '没读出日期' })
    })

    // ── 第 2 遍：校验 + 套餐匹配 + 判重 ──
    recs.forEach(function (rec) {
      const row = { line: rec.line, raw: rec.raw, status: 'ok', msg: '', candidates: [], pickIndex: -1, pickedLabel: '', time: rec.time || '' }

      if (rec.error) { row.status = 'err'; row.msg = rec.error; rows.push(row); return }

      const date = self._normBookingDate(rec.date)
      if (!date) { row.status = 'err'; row.msg = '日期认不出（' + rec.date + '）'; rows.push(row); return }
      if (!rec.customer) { row.status = 'err'; row.msg = '没读出客源'; rows.push(row); return }

      // 🆕 自定义餐标行（2026-10-07 用户拍板）：不绑套餐、不参与备货；
      //   订购数允许为空（按桌数由用户后续补），餐标原文进备注。
      if (rec.isCustom) {
        row.date = date
        row.customer = rec.customer
        row.orderQty = rec.orderQty || 0
        row.giftQty = 0
        row.remark = rec.remark || ''
        row.isCustom = true
        row.setmealId = CUSTOM_MEAL_ID
        row.setmealName = CUSTOM_MEAL_NAME
        row.unitPrice = 0
        row.totalAmount = 0
        row.status = 'ok'
        row.msg = '自定义餐标（不参与备货）'
        const ckey = [date, row.customer, CUSTOM_MEAL_ID].join('|')
        if (seen[ckey] || batchSeen[ckey]) { row.status = 'dup'; row.msg = '已存在（日期+客源相同），跳过' }
        else batchSeen[ckey] = true
        rows.push(row)
        return
      }

      // 🆕 2026-10-11（用户拍板）：「日期 + 客源」这类**没读岀份数**的行不再当错行丢掉 ——
      //   典型场景：从群消息里抄一行 `2026-10-15	工会赵叶静`（只有两列），以前报「没读出订购数」直接拒收，
      //   用户得手动逐条录。现在先收进来，套餐/份数留空，卡片标「⚠️ 待填套餐/份数」，
      //   之后再点卡片「更改」补 —— 备货链路天然不受影响（orderQty=0 的单一律不参与展开计算）。
      //   判据：日期、客源都认得出 + 份数没读出来（套餐认不认得都算）。
      if (!rec.orderQty) {
        row.date = date
        row.customer = rec.customer
        row.orderQty = 0
        row.giftQty = 0
        row.remark = rec.remark || ''
        row.needFill = true
        const res0 = rec.setmealRaw ? self._resolveSetmeal(rec.setmealRaw) : null
        if (res0 && res0.meal) {
          // 套餐认得出、只缺份数
          row.setmealId = res0.meal.value
          row.setmealName = res0.meal.name
          row.unitPrice = res0.meal.price
          row.pickedLabel = res0.meal.label
          row.msg = '套餐已认出「' + res0.meal.name + '」，待填份数'
        } else {
          // 第 3 列不是能认出的套餐 → 当备注收着（与「续写行多出来的文字进备注」同一约定，不丢字）
          if (rec.setmealRaw) row.remark = (row.remark ? row.remark + ' ' : '') + rec.setmealRaw
          row.setmealId = ''
          row.setmealName = ''
          row.unitPrice = 0
          row.msg = '待填套餐 / 份数'
        }
        row.totalAmount = 0
        const fkey = [date, row.customer, row.setmealId].join('|')
        if (seen[fkey] || batchSeen[fkey]) { row.status = 'dup'; row.msg = '已存在（日期+客源相同），跳过' }
        else batchSeen[fkey] = true
        rows.push(row)
        return
      }
      if (!rec.setmealRaw) { row.status = 'err'; row.msg = '没读出套餐/金额'; rows.push(row); return }

      row.date = date
      row.customer = rec.customer
      row.orderQty = rec.orderQty
      row.giftQty = rec.giftQty || 0
      row.remark = rec.remark || ''

      const res = self._resolveSetmeal(rec.setmealRaw)
      if (res.candidates) {
        row.candidates = res.candidates
        let chosen = pick[row.line]
        // ① 没点选时：若**同一客源**历史用过其中某一个 → 按历史预选（数据派生，不做语义猜测），仍可在行内改
        if (!chosen) {
          const hist = {}
          ;(self.data.list || []).forEach(function (it) {
            if (it && it.customer === rec.customer && it.setmealId) hist[it.setmealId] = true
          })
          const matched = res.candidates.filter(function (o) { return hist[o.value] })
          if (matched.length === 1) {
            chosen = matched[0].value
            row.autoPicked = true
            row.autoHint = '已按该客源历史预选「' + matched[0].name + '」，可点下方更改'
          }
        }
        // ② 仍没点选：同价套餐里若**只有一个是标准命名**「N元成人套餐」→ 默认选它（2026-10-07 用户拍板）
        //   典型：¥50 = 50元成人套餐C（标准） + 新疆团套餐（特例名）→ 默认选标准那个；
        //   ¥58 = 58元成人套餐A + 58元成人套餐B（两个都标准）→ 仍不猜，要求点选。
        //   判据是**名称命名规则**（确定性），不是语义联想；且行内 picker 仍在，随时可改。
        if (!chosen) {
          const std = res.candidates.filter(function (o) { return /^\d+元成人套餐/.test(String(o.name || '')) })
          if (std.length === 1) {
            chosen = std[0].value
            row.autoPicked = true
            row.autoHint = '同价的 ' + res.candidates.length + ' 个套餐里「' + std[0].name + '」是标准套餐，已默认选它，可点下方更改'
          }
        }
        const mm = chosen ? res.candidates.filter(function (o) { return o.value === chosen })[0] : null
        if (mm) {
          row.setmealId = mm.value; row.setmealName = mm.name; row.unitPrice = mm.price
          row.pickIndex = res.candidates.findIndex(function (o) { return o.value === chosen })
          row.pickedLabel = mm.label
        } else {
          row.status = 'err'
          row.msg = '金额 ¥' + res.candidates[0].price + ' 对应 ' + res.candidates.length + ' 个套餐，请点选'
        }
      } else if (res.meal) {
        row.setmealId = res.meal.value; row.setmealName = res.meal.name; row.unitPrice = res.meal.price
        row.pickedLabel = res.meal.label
      } else {
        row.status = 'err'; row.msg = res.msg || '认不出套餐'
      }

      if (row.status === 'ok') {
        const key = [date, row.customer, row.setmealId].join('|')
        if (seen[key] || batchSeen[key]) {
          row.status = 'dup'; row.msg = '已存在（日期+客源+套餐相同），跳过'
        } else {
          batchSeen[key] = true
          row.totalAmount = row.orderQty * (Number(row.unitPrice) || 0)
        }
      }
      rows.push(row)
    })

    // 🔴 2026-10-07：「需处理」其实分两种，必须分开计数，否则提示会误导用户去手工录入
    //   pickCount = 金额对应多个套餐、点一下 picker 就能解决的（行内有 candidates）
    //   errCount - pickCount = 真的没认出格式、只能手动录入的
    let okCount = 0, dupCount = 0, errCount = 0, pickCount = 0
    rows.forEach(function (r) {
      if (r.status === 'ok') okCount++
      else if (r.status === 'dup') dupCount++
      else { errCount++; if (r.candidates && r.candidates.length) pickCount++ }
    })
    return { rows: rows, okCount: okCount, dupCount: dupCount, errCount: errCount, pickCount: pickCount, timeHint: timeHint }
  },

  /** 解析并落到 data（含「就餐时间说明」联动统一取餐时间） */
  _refreshImportPreview(text, picks) {
    const pv = this._parseBookingPaste(text, picks)
    const patch = { importRaw: text, importPreview: pv, importPicks: picks || this.data.importPicks || {} }
    if (pv.timeHint) patch.importTime = pv.timeHint
    this.setData(patch)
    return pv
  },

  /** 打开批量导入弹窗（清空上次输入） */
  onOpenImport() {
    this.setData({
      showImportDialog: true,
      importRaw: '', importPreview: null, importPicks: {}, importTime: '12:00'
    })
  },

  /** 关闭导入弹窗 */
  onCloseImport() {
    this.setData({ showImportDialog: false })
  },

  /** 粘贴框内容变更 → 实时解析 */
  onImportInput(e) {
    const text = (e && e.detail && e.detail.value) || ''
    this._refreshImportPreview(text, this.data.importPicks)
  },

  /** 失焦兜底：个别机型/输入法只在失焦时才交出完整文本 */
  onImportBlur(e) {
    const text = (e && e.detail && e.detail.value) || ''
    if (text && text !== this.data.importRaw) this._refreshImportPreview(text, this.data.importPicks)
  },

  /** 一键读取系统剪贴板（绕开 textarea 长按粘贴的机型差异） */
  onReadClipboard() {
    const self = this
    wx.getClipboardData({
      success(res) {
        const text = String((res && res.data) || '')
        if (!text.trim()) { wx.showToast({ title: '剪贴板是空的，请先复制预定信息', icon: 'none' }); return }
        self._refreshImportPreview(text, self.data.importPicks)
        wx.showToast({ title: '已读取剪贴板', icon: 'none' })
      },
      fail() { wx.showToast({ title: '读取失败，请在框内长按粘贴', icon: 'none' }) }
    })
  },

  /** 清空粘贴框 */
  onClearImport() {
    this.setData({ importRaw: '', importPreview: null, importPicks: {} })
  },

  /** 统一取餐时间变更 */
  onImportTimeChange(e) {
    this.setData({ importTime: e.detail.value })
  },

  /** 金额歧义行：点选套餐 */
  onPickImportMeal(e) {
    const line = Number(e.currentTarget.dataset.line)
    const idx = Number(e.detail.value)
    const rows = (this.data.importPreview && this.data.importPreview.rows) || []
    const row = rows.filter(function (r) { return r.line === line })[0]
    if (!row || !row.candidates[idx]) return
    const picks = Object.assign({}, this.data.importPicks)
    picks[line] = row.candidates[idx].value
    this._refreshImportPreview(this.data.importRaw, picks)
  },

  /** 确认导入：逐条写库（云端模式自动上云），同「日期+客源+套餐」再判一次重防连点两次重复写 */
  onConfirmImport() {
    const self = this
    // 🔴 防连点（2026-10-04 血案）：原实现 wx.showLoading 不带 mask，写入是云调用（几百毫秒），
    //   用户手快再点一次「确认导入」时，第一次还没写完 ⇒ 二次判重读不到 ⇒ 落下两条一模一样的预定。
    if (this._importing) return
    const pv = this.data.importPreview
    const okRows = ((pv && pv.rows) || []).filter(function (r) { return r.status === 'ok' })
    if (!okRows.length) {
      // 🔴 2026-10-07：一条都导不进时，说清「为什么」和「怎么办」，别只丢一句「没有可导入的预定」。
      //   ⚠️「需处理」要拆成两类说：待点选（点一下就行）≠ 认不出（才要手动录入），
      //   否则用户会把只需点选的金额歧义行也当成「格式错了」去手工录，白干活。
      const pickN0 = (pv && pv.pickCount) || 0
      const failN0 = ((pv && pv.errCount) || 0) - pickN0
      if (pickN0 || failN0) {
        const segs = []
        if (pickN0) segs.push(pickN0 + ' 条要选套餐（金额对应了两个套餐，在行内点一下即可）')
        if (failN0) segs.push(failN0 + ' 条没认出格式（需手动录入：点左下角「+」逐条新增）')
        wx.showModal({
          title: '还没有可导入的预定',
          content: segs.join('；') + '。',
          showCancel: false, confirmText: '知道了'
        })
      } else {
        wx.showToast({ title: '没有可导入的预定', icon: 'none' })
      }
      return
    }
    this._importing = true
    wx.showLoading({ title: '导入中...', mask: true })   // 🔴 mask:true 挡住重复点击
    storage.getAdultMealList().then(function (list) {
      const seen = {}
      ;(list || []).forEach(function (it) {
        // 🆕 2026-10-11：允许 setmealId 为空（「待填套餐/份数」的行），键里用 '' 占位
        if (it && it.date && it.customer) seen[[it.date, it.customer, it.setmealId || ''].join('|')] = true
      })
      const records = []
      okRows.forEach(function (r) {
        const key = [r.date, r.customer, r.setmealId].join('|')
        if (seen[key]) return
        seen[key] = true
        const items = ((self._setmealItemsMap || {})[r.setmealId] || []).map(function (it) {
          return {
            dishId: it.dishId,
            qty: Number(it.qty) || 1,
            dishName: ((self._dishMap || {})[it.dishId] || {}).dishName || it.dishId
          }
        })
        records.push({
          // 🔴 确定性 id（2026-10-04）：同「日期+客源+套餐」恒定同一 _id ⇒ 云函数 doSave 的
          //   「先 update 再 add」把重复提交变成幂等覆盖，杜绝「一模一样的两条预定」。
          _id: self._bookingBizId(r.date, r.customer, r.setmealId),
          date: r.date,
          time: r.time || self.data.importTime || '12:00',
          customer: r.customer,
          setmealId: r.setmealId,
          setmealName: r.setmealName,
          unitPrice: Number(r.unitPrice) || 0,
          orderQty: r.orderQty,
          giftQty: r.giftQty || 0,
          typeRemark: r.remark || '',
          dishSwaps: [],
          extraDishes: [],
          mealItems: items,                  // 组成快照（下单当时的套餐组成）；自定义餐标恒为空
          isCustom: !!r.isCustom,            // 🆕 自定义餐标（不参与备货）
          totalAmount: r.orderQty * (Number(r.unitPrice) || 0)
        })
      })
      if (!records.length) {
        wx.hideLoading()
        self._importing = false
        const dupN = (pv && pv.dupCount) || 0
        wx.showToast({ title: dupN ? ('这 ' + dupN + ' 条日期+客源+套餐都一样，已存在') : '没有可导入的预定', icon: 'none' })
        return
      }
      let chain = Promise.resolve()
      records.forEach(function (rec) { chain = chain.then(function () { return storage.saveAdultMeal(rec) }) })
      return chain.then(function () {
        wx.hideLoading()
        self._importing = false
        self.setData({ showImportDialog: false })
        const errN = (pv && pv.errCount) || 0
        const pickN = (pv && pv.pickCount) || 0
        const failN = errN - pickN
        if (errN > 0) {
          // 🔴 2026-10-07：导入完成但要提醒「还有几条没进来」，并区分「待点选」与「认不出」
          const segs = []
          if (pickN) segs.push(pickN + ' 条待点选套餐')
          if (failN) segs.push(failN + ' 条没认出格式')
          wx.showModal({
            title: '已导入 ' + records.length + ' 条',
            content: '另有 ' + segs.join('、') + ' 未导入：待点选的回导入页行内点一下；没认出的在预定页点左下角「+」手动新增。',
            showCancel: false, confirmText: '知道了'
          })
        } else {
          wx.showToast({ title: '已导入 ' + records.length + ' 条预定', icon: 'success' })
        }
        self.loadList()
      })
    }).catch(function (e) {
      console.error('批量导入预定失败', e)
      wx.hideLoading()
      self._importing = false
      // 🔴 2026-10-04：原先只弹「导入失败，请重试」⇒ 无法分辨是云函数未部署 / 集合不存在 /
      //   字段非法 / 网络问题。改为把云端真实错误原样显示（errMsg 来自 callFunction reject，
      //   message 来自云函数 code:-1 抛错），用户截图即可定位。
      let msg = (e && (e.errMsg || e.message)) || ''
      if (!msg && e && e.errCode) msg = '错误码 ' + e.errCode
      if (!msg) { try { msg = JSON.stringify(e) } catch (_) { msg = '未知错误' } }
      wx.showModal({
        title: '导入失败',
        content: String(msg).slice(0, 300),
        showCancel: false,
        confirmText: '知道了'
      })
    })
  },

  /**
   * 业务键 → 确定性 _id（2026-10-04）
   * 同一「日期+客源+套餐」永远得到同一个 _id ⇒ 即使并发/连点重复提交，
   * 云函数 doSave 的「先 update 再 add」也会把第二次变成**幂等覆盖**，
   * 不会再像原来的 'am_' + Date.now() 那样每次新 id、落下两条一模一样的预定。
   * 形如 am_20261005_1f3k9q（日期段纯数字 + 业务键哈希 base36）。
   */
  _bookingBizId(date, customer, setmealId) {
    const s = [date, customer, setmealId].join('|')
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return 'am_' + String(date || '').replace(/\D/g, '') + '_' + h.toString(36)
  },

  // 下次备货看板：展开 / 收起明细
  onToggleBoard() {
    this.setData({ boardExpand: !this.data.boardExpand })
  },

  // ISO 日期串 → 看板标签（如 10/11 周六）
  _boardLabel(dateStr) {
    if (!dateStr) return ''
    const d = new Date(String(dateStr).replace(/-/g, '/'))
    if (isNaN(d.getTime())) return String(dateStr)
    const wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + wd
  },

  _today() {
    const d = new Date()
    const p = n => (n < 10 ? '0' : '') + n
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
  },

  /**
   * 下次备货日 = 从「明天」起算的第一个**营业日**（周一休息自动跳过）
   * 🔴 2026-10-11 前这里是死算「今天+1」：周日打开时，明天落在休息的周一
   *    ⇒ 备货看板空的、采购单默认日期也是空的。口径见 utils/bizCalendar.js
   *    用户拍板：只顺延到下一个营业日，不做区间合并（周日那单只为周二备）
   */
  _bizDate() {
    return bizCalendar.nextBizDay(this._today())
  }
}))
