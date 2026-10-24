/**
 * storage.js — 双模统一存储API
 * 封装云端数据库 + 本地缓存增删改查，页面无感知切换
 * 数据模型含供应商(supplier)和库存(stock)字段
 */

// 出厂库存表（1.11 库存兜底用；seed.js 无任何 require，不会形成循环依赖）
var seed = require('./seed.js')

// ========== 存储模式检测 ==========

/** 是否使用云端数据库 */
function isCloudMode() {
  try {
    var app = getApp()
    return app && app.globalData && app.globalData.cloudReady && wx.cloud
  } catch (e) {
    return false
  }
}

/**
 * 云函数返回值校验 + 拆包（2026-10-04）
 * 云函数统一返回 { code: 0|-1, data, message }。原先前端只取 res.result.data，
 * 云函数内部出错时返回的 code:-1 / data:null 会被当成「空数据」 ⇒ 页面显示「暂无数据」，
 * 且「数据上云」还会虚报成功（本次「批量导入的预定找不到」的帮凶之一）。
 * 这里把非 0 的 code 直接抛错，让各调用点的 catch 能给出可见提示。
 * 兼容：未带 code 字段的老响应（如探针 mock）按成功处理。
 */
function unwrapCloud(res) {
  var r = res && res.result
  if (r && typeof r.code === 'number' && r.code !== 0) {
    throw new Error(r.message || ('云端返回错误 code=' + r.code))
  }
  return r ? r.data : null
}

/**
 * 调用云函数：把 wx.cloud.callFunction 的 reject（形如 {errMsg:'cloud.callFunction:fail ...', errCode}）
 * 统一转成带可读 message 的 Error（2026-10-04）。原先前端 catch 只显示「请重试」，
 * 而 reject 对象没有 message 字段 ⇒ 错误被吞。现在 errMsg 会被提升成 message，
 * 让「云函数未部署(-404011)」「集合不存在」等能直接呈现在弹窗里。
 */
function callCloud(name, data) {
  return wx.cloud.callFunction({ name: name, data: data }).catch(function (err) {
    var m = (err && (err.errMsg || err.message)) || ('云函数 ' + name + ' 调用失败')
    var e = new Error(m)
    e.errCode = err && err.errCode
    throw e
  })
}

// ========== 本地缓存 Key ==========

var KEYS = {
  MATERIAL: 'materials',
  DISH: 'dishes',
  ORDER: 'orders',
  SETMEAL: 'setMeals',
  ADULT_MEAL: 'adultMeals',   // 成人套餐预定独立 key
  SETMEAL_OVERRIDE: 'setMealOverrides',  // 套餐组成自定义覆盖层（用户在设置里改的换菜结果）
  SPOT_SALE: 'spotSales',   // 散点销量：单品/单人套餐每日实际售出份数（按天一条）
  PRICE_LOG: 'priceLogs'    // 价格变更历史（2026-10-13 新增，方案 M5 留痕）
}

// ========== 原料 CRUD ==========

/** 获取原料列表 */
function getMaterialList(filter) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'materialManage',
      data: { action: 'list', category: filter && filter.category, supplier: filter && filter.supplier },
    }).then(function(res) {
      return res.result.data || []
    })
  }
  var list = wx.getStorageSync(KEYS.MATERIAL) || []
  if (filter && filter.category && filter.category !== '全部') {
    list = list.filter(function(m) { return m.category === filter.category })
  }
  if (filter && filter.supplier && filter.supplier !== '全部') {
    list = list.filter(function(m) { return m.supplier === filter.supplier })
  }
  if (filter && filter.keyword) {
    var kw = filter.keyword.toLowerCase()
    list = list.filter(function(m) { return m.name.toLowerCase().indexOf(kw) !== -1 })
  }
  return Promise.resolve(list)
}

/** 新增原料 */
function addMaterial(data) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'materialManage',
      data: { action: 'add', data: data },
    }).then(function(res) { return res.result.data })
  }
  var list = wx.getStorageSync(KEYS.MATERIAL) || []
  if (!data._id) {
    data._id = 'mat_' + Date.now()
  }
  data.createTime = Date.now()
  list.push(data)
  wx.setStorageSync(KEYS.MATERIAL, list)
  return Promise.resolve(data)
}

/** 更新原料 */
function updateMaterial(id, data) {
  if (isCloudMode()) {
    /* 云模式：先从本地镜像取旧值，好写价格留痕（镜像不一定有，取不到就不记） */
    var mirror = []
    try { mirror = wx.getStorageSync(KEYS.MATERIAL) || [] } catch (e) { mirror = [] }
    var oldInMirror = null
    for (var k = 0; k < mirror.length; k++) {
      if (mirror[k]._id === id) { oldInMirror = mirror[k]; break }
    }
    return wx.cloud.callFunction({
      name: 'materialManage',
      data: { action: 'update', id: id, data: data },
    }).then(function(res) {
      _logMaterialPrice(oldInMirror, data)
      return res.result.data
    })
  }
  var list = wx.getStorageSync(KEYS.MATERIAL) || []
  for (var i = 0; i < list.length; i++) {
    if (list[i]._id === id) {
      _logMaterialPrice(list[i], data)
      Object.assign(list[i], data)
      break
    }
  }
  wx.setStorageSync(KEYS.MATERIAL, list)
  return Promise.resolve(true)
}

/* ============================================================================
 *  价格变更历史（方案 M5「记录何时、哪个原料、从多少改到多少、谁改的」）
 *
 *  存储：本机。这是审计流水，当前单机使用，暂不上云（避免新增云函数部署负担，
 *       也避免云模式还没部署时整条改价链路失败）。日后要多端共享再扩展。
 *  上限：PRICE_LOG_MAX 条，超出丢最旧的，防止无限增长撑爆本地存储。
 * ========================================================================== */

var PRICE_LOG_MAX = 500

/**
 * 记一条价格变更。价格没变、或新旧值非法时静默跳过（不记噪音）。
 * @param {Object} r { materialId, name, fromPrice, toPrice, operator, affectedDishCount, source }
 * @returns {Promise<Object|null>} 写入的记录
 */
function addPriceLog(r) {
  if (!r || !r.name) return Promise.resolve(null)
  var from = Number(r.fromPrice)
  var to = Number(r.toPrice)
  if (!isFinite(from) || !isFinite(to) || from === to) return Promise.resolve(null)

  var list = []
  try { list = wx.getStorageSync(KEYS.PRICE_LOG) || [] } catch (e) { list = [] }
  var rec = {
    _id: 'pl_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    materialId: r.materialId || '',
    name: r.name,
    fromPrice: from,
    toPrice: to,
    // 涨跌幅：旧价为 0 时无法算比例（从 0 起涨），留 0 并靠 fromPrice=0 识别
    deltaPct: from > 0 ? Math.round((to - from) / from * 10000) / 10000 : 0,
    affectedDishCount: Number(r.affectedDishCount) || 0,
    operator: r.operator || '',
    source: r.source || 'manual',
    time: Date.now()
  }
  list.unshift(rec)
  if (list.length > PRICE_LOG_MAX) list = list.slice(0, PRICE_LOG_MAX)
  try { wx.setStorageSync(KEYS.PRICE_LOG, list) } catch (e) { /* 写失败不阻断改价 */ }
  return Promise.resolve(rec)
}

/**
 * 读价格变更历史（新的在前）
 * @param {Object} [filter] { name, since, limit }
 * @returns {Promise<Array>}
 */
function getPriceLogList(filter) {
  var list = []
  try { list = wx.getStorageSync(KEYS.PRICE_LOG) || [] } catch (e) { list = [] }
  if (filter && filter.name) list = list.filter(function (r) { return r.name === filter.name })
  if (filter && filter.since) list = list.filter(function (r) { return r.time >= filter.since })
  if (filter && filter.limit) list = list.slice(0, filter.limit)
  return Promise.resolve(list)
}

/** 清空价格变更历史 */
function clearPriceLog() {
  try { wx.removeStorageSync(KEYS.PRICE_LOG) } catch (e) { /* 忽略 */ }
  return Promise.resolve(true)
}

/**
 * 内部：把「原料改价」这个动作写进留痕。
 * patch 里没有 price 字段（即没改价）时直接跳过。
 */
function _logMaterialPrice(before, patch) {
  if (!before || !patch || patch.price === undefined) return
  var from = Number(before.price) || 0
  var to = Number(patch.price) || 0
  if (from === to) return
  addPriceLog({
    materialId: before._id,
    name: before.name,
    fromPrice: from,
    toPrice: to,
    source: 'material-update'
  })
}

/** 删除原料 */
function deleteMaterial(id) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'materialManage',
      data: { action: 'delete', id: id },
    }).then(function(res) { return true })
  }
  var list = wx.getStorageSync(KEYS.MATERIAL) || []
  list = list.filter(function(m) { return m._id !== id })
  wx.setStorageSync(KEYS.MATERIAL, list)
  return Promise.resolve(true)
}

/**
 * 批量按名称更新原料供应商（本地模式可直接用，不依赖云开发）
 * @param {Object} normMap - 规范化键(name 小写去空格) -> 供应商名称
 * @returns {Promise<{total:number, matched:number}>}
 */
function batchUpdateSupplier(normMap) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'materialManage',
      data: { action: 'batchUpdateSupplier', map: normMap },
    }).then(function(res) { return res.result.data })
  }
  var list = wx.getStorageSync(KEYS.MATERIAL) || []
  var matched = 0
  list.forEach(function(m) {
    var key = (m.name || '').trim().toLowerCase()
    var sup = normMap[key]
    if (sup !== undefined && sup !== null && sup !== '') {
      m.supplier = sup
      matched++
    }
  })
  wx.setStorageSync(KEYS.MATERIAL, list)
  return Promise.resolve({ total: list.length, matched: matched })
}

/** 批量导入原料 */
function batchImportMaterial(list, mode) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'materialManage',
      data: { action: 'batchImport', list: list, mode: mode },
    }).then(function(res) { return res.result.data })
  }
  if (mode === 'overwrite') {
    wx.setStorageSync(KEYS.MATERIAL, list)
  } else {
    var existing = wx.getStorageSync(KEYS.MATERIAL) || []
    existing = existing.concat(list)
    wx.setStorageSync(KEYS.MATERIAL, existing)
  }
  return Promise.resolve(list.length)
}

// ========== 菜品 CRUD ==========

/** 获取菜品列表 */
function getDishList(filter) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'dishBomCalc',
      data: { action: 'list', packageType: filter && filter.packageType },
    }).then(function(res) { return res.result.data || [] })
  }
  var list = wx.getStorageSync(KEYS.DISH) || []
  if (filter && filter.packageType && filter.packageType !== '全部') {
    list = list.filter(function(d) { return d.packageType === filter.packageType })
  }
  if (filter && filter.keyword) {
    var kw = filter.keyword.toLowerCase()
    list = list.filter(function(d) { return d.dishName.toLowerCase().indexOf(kw) !== -1 })
  }
  return Promise.resolve(list)
}

/** 获取单个菜品 */
function getDish(id) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'dishBomCalc',
      data: { action: 'get', id: id },
    }).then(function(res) { return res.result.data })
  }
  var list = wx.getStorageSync(KEYS.DISH) || []
  var dish = list.find(function(d) { return d._id === id })
  return Promise.resolve(dish)
}

/** 新增菜品 */
function addDish(data) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'dishBomCalc',
      data: { action: 'add', data: data },
    }).then(function(res) { return res.result.data })
  }
  var list = wx.getStorageSync(KEYS.DISH) || []
  if (!data._id) {
    data._id = 'dish_' + Date.now()
  }
  data.createTime = Date.now()
  list.push(data)
  wx.setStorageSync(KEYS.DISH, list)
  return Promise.resolve(data)
}

/** 更新菜品 */
function updateDish(id, data) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'dishBomCalc',
      data: { action: 'update', id: id, data: data },
    }).then(function(res) { return res.result.data })
  }
  var list = wx.getStorageSync(KEYS.DISH) || []
  for (var i = 0; i < list.length; i++) {
    if (list[i]._id === id) {
      Object.assign(list[i], data)
      break
    }
  }
  wx.setStorageSync(KEYS.DISH, list)
  return Promise.resolve(true)
}

/** 删除菜品 */
function deleteDish(id) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'dishBomCalc',
      data: { action: 'delete', id: id },
    }).then(function(res) { return true })
  }
  var list = wx.getStorageSync(KEYS.DISH) || []
  list = list.filter(function(d) { return d._id !== id })
  wx.setStorageSync(KEYS.DISH, list)
  return Promise.resolve(true)
}

/** 批量导入菜品 */
function batchImportDish(list, mode) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'dishBomCalc',
      data: { action: 'batchImport', list: list, mode: mode },
    }).then(function(res) { return res.result.data })
  }
  if (mode === 'overwrite') {
    wx.setStorageSync(KEYS.DISH, list)
  } else {
    var existing = wx.getStorageSync(KEYS.DISH) || []
    existing = existing.concat(list)
    wx.setStorageSync(KEYS.DISH, existing)
  }
  return Promise.resolve(list.length)
}

// ========== 订货订单 CRUD ==========

/** 获取订单列表（分页） */
function getOrderList(page, size, dateRange) {
  page = page || 0
  size = size || 20
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'recordSave',
      data: { action: 'list', page: page, size: size, startDate: dateRange && dateRange.start, endDate: dateRange && dateRange.end },
    }).then(function(res) { return res.result.data })
  }
  var list = wx.getStorageSync(KEYS.ORDER) || []
  // 日期过滤
  if (dateRange && dateRange.start) {
    var start = new Date(dateRange.start).getTime()
    list = list.filter(function(o) { return o.createTime >= start })
  }
  if (dateRange && dateRange.end) {
    var end = new Date(dateRange.end).getTime() + 86400000
    list = list.filter(function(o) { return o.createTime < end })
  }
  // 倒序
  list.sort(function(a, b) { return b.createTime - a.createTime })
  var total = list.length
  var startIdx = page * size
  var pageList = list.slice(startIdx, startIdx + size)
  return Promise.resolve({ list: pageList, total: total })
}

/** 保存订单 */
function saveOrder(data) {
  data.createTime = Date.now()
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'recordSave',
      data: { action: 'save', data: data },
    }).then(function(res) { return res.result.data })
  }
  var list = wx.getStorageSync(KEYS.ORDER) || []
  if (!data._id) {
    data._id = 'order_' + Date.now()
  }
  list.push(data)
  wx.setStorageSync(KEYS.ORDER, list)
  return Promise.resolve(data)
}

/** 删除订单 */
function deleteOrder(id) {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'recordSave',
      data: { action: 'delete', id: id },
    }).then(function(res) { return true })
  }
  var list = wx.getStorageSync(KEYS.ORDER) || []
  list = list.filter(function(o) { return o._id !== id })
  wx.setStorageSync(KEYS.ORDER, list)
  return Promise.resolve(true)
}

// ========== 套餐 CRUD ==========
// 套餐为配置型数据，统一使用本地缓存（不受云/本地模式切换影响），保证移动端稳定可用

// ---------- 套餐组成覆盖层（override）----------
// 背景：套餐基础数据来自 seed.js，改 seed 需要升注入版本 + 重编译，成人套餐临时换菜太重。
// 方案：用户在「套餐组成设置」页改的组成写入独立 key（setMealOverrides），
//      读取时与基础套餐合并（override 优先），因此：
//      1) 换菜后订货/预定/备货全链路立即生效，不改代码不升版本；
//      2) seed 重注入（升 vN）覆盖的是基础层，用户自定义不会被冲掉；
//      3) 每个套餐可单独「恢复默认」= 删掉该套餐的 override。

/** 获取全部套餐覆盖配置 { mealId: {items, desc, price, updateTime} } */
function getSetMealOverrides() {
  return wx.getStorageSync(KEYS.SETMEAL_OVERRIDE) || {}
}

/** 把覆盖配置合并进套餐列表（override 优先，附带 _overridden 标记） */
function applySetMealOverrides(list) {
  var ov = getSetMealOverrides()
  return (list || []).map(function(m) {
    var o = m && ov[m._id]
    if (!o) return m
    var merged = Object.assign({}, m)
    if (o.items && o.items.length) merged.items = o.items
    if (o.desc) merged.desc = o.desc
    if (typeof o.price === 'number') merged.price = o.price
    merged._overridden = true
    merged._overrideTime = o.updateTime || 0
    return merged
  })
}

/** 保存某套餐的组成覆盖（长期默认生效） */
function saveSetMealOverride(mealId, patch) {
  if (!mealId) return Promise.resolve(false)
  var ov = getSetMealOverrides()
  ov[mealId] = Object.assign({}, ov[mealId] || {}, patch || {}, { updateTime: Date.now() })
  wx.setStorageSync(KEYS.SETMEAL_OVERRIDE, ov)
  return Promise.resolve(ov[mealId])
}

/** 清除覆盖，恢复 seed 默认（不传 mealId 则清全部） */
function clearSetMealOverride(mealId) {
  var ov = getSetMealOverrides()
  if (mealId) {
    delete ov[mealId]
  } else {
    ov = {}
  }
  wx.setStorageSync(KEYS.SETMEAL_OVERRIDE, ov)
  return Promise.resolve(true)
}

/** 获取套餐列表（已合并用户自定义组成） */
function getSetMealList() {
  return Promise.resolve(applySetMealOverrides(wx.getStorageSync(KEYS.SETMEAL) || []))
}

/** 新增/更新套餐 */
function saveSetMeal(data) {
  var list = wx.getStorageSync(KEYS.SETMEAL) || []
  if (!data._id) {
    data._id = 'meal_' + Date.now()
  }
  var idx = -1
  for (var i = 0; i < list.length; i++) {
    if (list[i]._id === data._id) { idx = i; break }
  }
  if (idx >= 0) {
    list[idx] = Object.assign({}, list[idx], data)
  } else {
    list.push(data)
  }
  wx.setStorageSync(KEYS.SETMEAL, list)
  return Promise.resolve(data)
}

/** 删除套餐 */
function deleteSetMeal(id) {
  var list = wx.getStorageSync(KEYS.SETMEAL) || []
  list = list.filter(function(m) { return m._id !== id })
  wx.setStorageSync(KEYS.SETMEAL, list)
  return Promise.resolve(true)
}

// ========== 成人套餐预定 CRUD ==========
// 预定为独立业务，使用独立 storage key（adultMeals），不混订单表；
// 双模：云端模式走 bookingManage 云函数（电脑/手机共用同一云库 → 实时同步），
//       本地模式退回 wx.storage（离线稳定、无云环境时可用）。

/** 获取预定列表（可按 date / customer 过滤） */
function getAdultMealList(filter) {
  if (isCloudMode()) {
    return callCloud('bookingManage', {
      action: 'list', date: filter && filter.date, customer: filter && filter.customer,
    }).then(function (res) { return unwrapCloud(res) || [] })
  }
  var list = wx.getStorageSync(KEYS.ADULT_MEAL) || []
  if (filter) {
    if (filter.date) list = list.filter(function (m) { return m.date === filter.date })
    if (filter.customer) list = list.filter(function (m) { return m.customer === filter.customer })
  }
  return Promise.resolve(list)
}

/** 新增 / 更新预定（自动补 _id 与 createTime；带 _id 则为更新） */
function saveAdultMeal(data) {
  if (isCloudMode()) {
    return callCloud('bookingManage', { action: 'save', data: data })
      .then(function (res) { return unwrapCloud(res) })
  }
  var list = wx.getStorageSync(KEYS.ADULT_MEAL) || []
  if (!data._id) {
    data._id = 'am_' + Date.now()   // 主键前缀 am_，避免与 meal_ 混淆
  }
  data.createTime = Date.now()
  var idx = -1
  for (var i = 0; i < list.length; i++) {
    if (list[i]._id === data._id) { idx = i; break }
  }
  if (idx >= 0) {
    list[idx] = Object.assign({}, list[idx], data)
  } else {
    list.push(data)
  }
  wx.setStorageSync(KEYS.ADULT_MEAL, list)
  return Promise.resolve(data)
}

/** 删除预定 */
function deleteAdultMeal(id) {
  if (isCloudMode()) {
    return callCloud('bookingManage', { action: 'delete', id: id })
      .then(function (res) { unwrapCloud(res); return true })
  }
  var list = wx.getStorageSync(KEYS.ADULT_MEAL) || []
  list = list.filter(function (m) { return m._id !== id })
  wx.setStorageSync(KEYS.ADULT_MEAL, list)
  return Promise.resolve(true)
}

/**
 * 本地预定一次性迁移到云端。
 * 开启云模式后，旧的本地预定不会自动上云；在存有历史预定的设备（通常是电脑）上调用一次即可。
 * 用法（开发者工具 Console）：require('utils/storage.js').migrateLocalBookingsToCloud().then(r=>console.log(r))
 * @returns {Promise<{migrated:number}>}
 */
function migrateLocalBookingsToCloud() {
  if (!isCloudMode()) return Promise.reject(new Error('未开启云模式，无法迁移'))
  var list = wx.getStorageSync(KEYS.ADULT_MEAL) || []
  if (!list.length) return Promise.resolve({ migrated: 0 })
  return Promise.all(list.map(function (m) {
    return callCloud('bookingManage', { action: 'save', data: m })
  })).then(function () { return { migrated: list.length } })
}

/**
 * 首次上云：把本机已有的基础数据批量推到云端（2026-10-03 新增）
 *
 * 背景：云模式下前端一律读云端；新开的云环境集合是空的 ⇒ 必须先在「数据最全的那一端」
 *      （通常是电脑，本机已灌种子）执行一次上传，手机端登录后才能看到数据。
 * 用法：「我的」页 →「数据上云（首次同步）」按钮；或开发者工具 Console：
 *      require('utils/storage.js').migrateLocalDataToCloud().then(r=>console.log(r))
 *
 * 语义（可重复执行，幂等）：
 *   - 原料 / 菜品：**覆盖重建**（云函数 batchImport mode='overwrite' 先清空集合再写入）
 *   - 成人预定：按 _id upsert（bookingManage doSave 是 doc(_id).set ⇒ 不会重复）
 *   - 订单：**不迁移**（recordSave.save 是纯 add，历史订单重复插入风险高；订单从启用云端后新产生的开始双端可见）
 * @returns {Promise<{materials:number,dishes:number,adultMeals:number}>}
 */
function migrateLocalDataToCloud() {
  if (!isCloudMode()) return Promise.reject(new Error('未开启云模式，无法迁移'))
  var mats = wx.getStorageSync(KEYS.MATERIAL) || []
  var dishes = wx.getStorageSync(KEYS.DISH) || []
  var meals = wx.getStorageSync(KEYS.ADULT_MEAL) || []
  var inv = wx.getStorageSync('inventory') || []
  var result = { materials: 0, dishes: 0, adultMeals: 0, adultMealFailed: 0, inventory: 0 }

  var chain = Promise.resolve()
  if (mats.length) {
    chain = chain.then(function () {
      return batchImportMaterial(mats, 'overwrite').then(function () { result.materials = mats.length })
    })
  }
  if (dishes.length) {
    chain = chain.then(function () {
      return batchImportDish(dishes, 'overwrite').then(function () { result.dishes = dishes.length })
    })
  }
  if (meals.length) {
    chain = chain.then(function () {
      // 🔴 2026-10-04：原来不看返回值 ⇒ 云函数内部报错（code:-1）也报「预定 N 条成功」。
      // 现在逐条判真伪：只有 code===0 才计成功，失败的单独计数，页面据此如实提示。
      return Promise.all(meals.map(function (m) {
        return callCloud('bookingManage', { action: 'save', data: m })
          .then(function (res) { unwrapCloud(res); return true })
          .catch(function () { return false })
      })).then(function (oks) {
        result.adultMeals = oks.filter(Boolean).length
        result.adultMealFailed = oks.filter(function (x) { return !x }).length
      })
    })
  }
  if (inv.length) {
    chain = chain.then(function () {
      return setInventoryList(inv).then(function () { result.inventory = inv.length })
    })
  }
  return chain.then(function () { return result })
}

// ========== 散点销量（单品 / 单人套餐每日实际售出份数） ==========

/** 获取全部散点销量记录（按日期倒序） */
function getSpotSaleList() {
  var list = wx.getStorageSync(KEYS.SPOT_SALE) || []
  return Promise.resolve(list.slice().sort(function (a, b) {
    return (b.date || '').localeCompare(a.date || '')
  }))
}

/** 获取指定日期的散点销量（无则 null） */
function getSpotSaleByDate(date) {
  var list = wx.getStorageSync(KEYS.SPOT_SALE) || []
  var hit = null
  list.forEach(function (r) { if (r.date === date) hit = r })
  return Promise.resolve(hit)
}

/** 保存某天的散点销量（按 date 唯一，覆盖式）。items: { dishId 或 mealId: 份数 } */
function saveSpotSale(date, items) {
  var list = wx.getStorageSync(KEYS.SPOT_SALE) || []
  var rec = { _id: 'ss_' + date, date: date, items: items || {}, updatedAt: Date.now() }
  var idx = -1
  for (var i = 0; i < list.length; i++) {
    if (list[i].date === date) { idx = i; break }
  }
  if (idx >= 0) { list[idx] = rec } else { list.push(rec) }
  wx.setStorageSync(KEYS.SPOT_SALE, list)
  return Promise.resolve(rec)
}

/** 删除某天的散点销量 */
function deleteSpotSale(date) {
  var list = wx.getStorageSync(KEYS.SPOT_SALE) || []
  list = list.filter(function (r) { return r.date !== date })
  wx.setStorageSync(KEYS.SPOT_SALE, list)
  return Promise.resolve(true)
}

// ========== 库存单子（来自 seed.js，订货页直接减库存用） ==========
//
// 2026-10-03 起支持云端同步：云模式读/写 `inventoryManage` 云函数（集合 dishStock 的 `_id='inventory'` 文档）；
// 本地 `inventory` 退化为**镜像缓存**（云不可用时兜底，避免页面空白 / 数据丢失）。
// 注意：这是「半成品/SKU 库存表」（36 项），与原料的 `curStock` 是两套数据，勿混。

/** 读取本地镜像（无云时的数据源） */
function _readLocalInventory() {
  return wx.getStorageSync('inventory') || []
}

/**
 * 上一次 getInventoryList() 的库存来源（供页面提示「这数据是不是实时的」）
 * 'cloud' 云端实时 ｜ 'local' 本地镜像 ｜ 'seed' 出厂基线 ｜ 'unknown' 还没读过
 */
var _invSource = 'unknown'
function getInventorySource() { return _invSource }

/**
 * 获取库存单子列表 [{ name, stock }]
 *
 * 🔴 2026-10-11 修复（用户报「鸡根没有看到库存」的根因之一）：
 *   云函数 inventoryManage.doList() 在「文档不存在」（首次使用 / dishStock 集合还没建）时
 *   catch 后返回 `success([])`。原代码判的是 `Array.isArray(r.data)`，**空数组也通过**
 *   ⇒ 用空数组覆盖了本地镜像并返回空 ⇒ 采购单里所有靠库存联动的原料（鸡根/鸡丝…）当前库存全变 0，
 *      而且因为补种标记 seed_injected_v69 还在，本地再也不会被补回来（**永久化**）；
 *      更糟的是「数据上云」上传的正是这份本地镜像 ⇒ 会把空表推上云，从此云端也空、自洽。
 *   ⇒ 规则改为：
 *      ① 云端有数据（非空）→ 用云端并刷新本地镜像（原行为不变）
 *      ② 云端返回空数组 → 视为「云端没有可用数据」，**沿用本地镜像**，不覆盖
 *      ③ 云端空、本地也空 → 退回出厂 SEED_INVENTORY（至少让订货页能显示、能录数），来源标记 seed
 */
function getInventoryList() {
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'inventoryManage',
      data: { action: 'list' },
    }).then(function (res) {
      var r = res && res.result
      if (r && r.code === 0 && Array.isArray(r.data) && r.data.length) {
        wx.setStorageSync('inventory', r.data)   // 顺带刷新本地镜像
        _invSource = 'cloud'
        return r.data
      }
      return _fallbackInventory(r && r.code === 0 ? '云端库存为空' : '云端未返回可用库存')
    }).catch(function (e) {
      console.warn('[storage] 库存云端读取失败，回退本地镜像', e)
      return _fallbackInventory('云端读取失败')
    })
  }
  var local = _readLocalInventory()
  if (local.length) { _invSource = 'local'; return Promise.resolve(local) }
  _invSource = 'seed'
  return Promise.resolve(_seedInventoryCopy())
}

/** 出厂库存表的**浅拷贝元素**副本（避免调用方就地改 stock 污染模块级 SEED_INVENTORY） */
function _seedInventoryCopy() {
  return seed.SEED_INVENTORY.map(function (it) { return { name: it.name, stock: it.stock } })
}

/**
 * 云端拿不到库存时的两级兜底：本地镜像 → 出厂库存表（均打日志，不静默）
 */
function _fallbackInventory(why) {
  var local = _readLocalInventory()
  if (local.length) {
    console.warn('[storage] ' + why + '，沿用本地镜像 ' + local.length + ' 项（不覆盖本地）')
    _invSource = 'local'
    return local
  }
  console.warn('[storage] ' + why + '，且本地镜像为空 → 退回出厂库存表 ' + seed.SEED_INVENTORY.length + ' 项')
  _invSource = 'seed'
  return _seedInventoryCopy()
}

/**
 * 保存整个库存单子列表（批量粘贴导入 / 整表覆盖用）
 * @param {Array} list [{ name, stock }]
 */
function setInventoryList(list) {
  var safe = list || []
  wx.setStorageSync('inventory', safe)   // 始终先写本地镜像，保证本机不丢
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'inventoryManage',
      data: { action: 'set', list: safe },
    }).then(function (res) {
      var r = res && res.result
      return (r && r.code === 0 && Array.isArray(r.data)) ? r.data : safe
    }).catch(function (e) {
      console.warn('[storage] 库存云端写入失败，保留本地', e)
      return safe
    })
  }
  return Promise.resolve(safe)
}

/**
 * 更新单项库存（按品名精确匹配；不存在则追加），返回更新后的列表
 * @param {String} name 品名
 * @param {Number} stock 库存数量
 */
function updateInventoryStock(name, stock) {
  var num = Number(stock) || 0
  // ① 先更本地镜像（UI 已乐观更新，这里保证本机落盘）
  var list = _readLocalInventory()
  var found = false
  var next = list.map(function (it) {
    if (it.name === name) {
      found = true
      return Object.assign({}, it, { stock: num })
    }
    return it
  })
  if (!found) next.push({ name: name, stock: num })
  wx.setStorageSync('inventory', next)

  // ② 云模式再同步到云端（返回云端权威结果）
  if (isCloudMode()) {
    return wx.cloud.callFunction({
      name: 'inventoryManage',
      data: { action: 'updateStock', name: name, stock: num },
    }).then(function (res) {
      var r = res && res.result
      if (r && r.code === 0 && Array.isArray(r.data)) {
        wx.setStorageSync('inventory', r.data)
        return r.data
      }
      return next
    }).catch(function (e) {
      console.warn('[storage] 库存云端写入失败，保留本地', e)
      return next
    })
  }
  return Promise.resolve(next)
}

// ========== 数据维护 ==========

/**
 * 清除所有「种子注入」守卫标记（**通配匹配，免维护**）
 * 覆盖 seed_injected / seed_injected_v66 / seed_meals_injected_v10 / seed_bookings_injected_v1 等全部历史与将来版本。
 *
 * ⚠️ 千万别改回硬编码版本号清单 —— 升版本时必漏，漏了就会「清空缓存后不再重灌 → 小程序变空壳」。
 *    2026-10-01 事故：清理清单停在 seed_injected_v20 / seed_meals_injected_v6，
 *    而当时的守卫已到 v66 / meals_v10 / bookings_v1 → 点「清空缓存」把 materials/dishes/setMeals/adultMeals
 *    全删了，标记却还在，下次启动不重灌，科奇两单也回不来。
 */
function clearSeedMarkers() {
  var cleared = []
  try {
    var info = wx.getStorageInfoSync()
    var keys = (info && info.keys) || []
    keys.forEach(function (k) {
      if (/^seed_.*injected/.test(k)) {
        wx.removeStorageSync(k)
        cleared.push(k)
      }
    })
  } catch (e) {
    console.warn('[storage] clearSeedMarkers 失败:', e)
  }
  return cleared
}

/** 清空本地缓存（含全部种子标记 → 下次启动完整重灌，回到出厂种子） */
function clearAllLocalData() {
  wx.removeStorageSync(KEYS.MATERIAL)
  wx.removeStorageSync(KEYS.DISH)
  wx.removeStorageSync(KEYS.ORDER)
  clearSeedMarkers()
  wx.removeStorageSync(KEYS.SETMEAL)
  wx.removeStorageSync(KEYS.SETMEAL_OVERRIDE)
  wx.removeStorageSync(KEYS.ADULT_MEAL)
  wx.removeStorageSync(KEYS.SPOT_SALE)
}

/** 导出全部数据 */
function exportAllData() {
  return Promise.all([
    getMaterialList(),
    getDishList(),
    getOrderList(0, 9999),
  ]).then(function(results) {
    return {
      materials: results[0],
      dishes: results[1],
      orders: results[2].list || results[2],
      exportTime: Date.now(),
    }
  })
}

module.exports = {
  isCloudMode: isCloudMode,
  getAdultMealList: getAdultMealList,
  saveAdultMeal: saveAdultMeal,
  deleteAdultMeal: deleteAdultMeal,
  migrateLocalBookingsToCloud: migrateLocalBookingsToCloud,
  migrateLocalDataToCloud: migrateLocalDataToCloud,
  getSpotSaleList: getSpotSaleList,
  getSpotSaleByDate: getSpotSaleByDate,
  saveSpotSale: saveSpotSale,
  deleteSpotSale: deleteSpotSale,
  getInventoryList: getInventoryList,
  getInventorySource: getInventorySource,
  setInventoryList: setInventoryList,
  updateInventoryStock: updateInventoryStock,
  getMaterialList: getMaterialList,
  addMaterial: addMaterial,
  updateMaterial: updateMaterial,
  batchUpdateSupplier: batchUpdateSupplier,
  deleteMaterial: deleteMaterial,
  batchImportMaterial: batchImportMaterial,
  getDishList: getDishList,
  getDish: getDish,
  addDish: addDish,
  updateDish: updateDish,
  deleteDish: deleteDish,
  batchImportDish: batchImportDish,
  getOrderList: getOrderList,
  saveOrder: saveOrder,
  deleteOrder: deleteOrder,
  getSetMealList: getSetMealList,
  saveSetMeal: saveSetMeal,
  deleteSetMeal: deleteSetMeal,
  getSetMealOverrides: getSetMealOverrides,
  saveSetMealOverride: saveSetMealOverride,
  clearSetMealOverride: clearSetMealOverride,
  clearSeedMarkers: clearSeedMarkers,
  clearAllLocalData: clearAllLocalData,
  exportAllData: exportAllData,
  /* 价格变更历史（2026-10-13 新增，方案 M5） */
  getPriceLogList: getPriceLogList,
  addPriceLog: addPriceLog,
  clearPriceLog: clearPriceLog,
}
