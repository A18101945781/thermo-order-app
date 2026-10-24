/**
 * calc.js — 餐饮专用计算工具
 * 菜品成本、毛利、订货汇总、损耗核算、库存建议采购量
 */

// 容器类采购单位：允许「建议采购量」出现小数（如 100个 ÷ 80个/箱 = 1.25箱）
// 离散件（块 / 个 / 根 / 条 …）仍进整，避免出现「104.17块」这种不可采购的数
const CONTAINER_UNITS = ['箱', '桶', '袋', '包', '瓶', '罐', '盒', '提', '卷', '板', '筐', '件']

/**
 * 计算单个菜品BOM成本
 * @param {Array} bomList - [{name, useNum, price, unit, cost}]
 * @param {Array} materialList - 原料列表（可选，用于查最新单价）
 * @returns {{bomList: Array, totalCost: number}}
 */
function calcDishCost(bomList, materialList) {
  var priceMap = {}
  var unitMap = {}
  if (materialList) {
    materialList.forEach(function(m) {
      priceMap[m.name] = m.price
      unitMap[m.name] = m.unit
    })
  }
  var newBom = bomList.map(function(b) {
    var price = priceMap[b.name] !== undefined ? priceMap[b.name] : b.price
    var unit = unitMap[b.name] || b.unit || ''
    return {
      name: b.name,
      useNum: Number(b.useNum) || 0,
      price: Number(price) || 0,
      unit: unit,
      cost: round((Number(b.useNum) || 0) * (Number(price) || 0), 4),
    }
  })
  var totalCost = round(newBom.reduce(function(sum, b) { return sum + b.cost }, 0), 4)
  return { bomList: newBom, totalCost: totalCost }
}

/**
 * 计算毛利和毛利率
 * @param {number} sellPrice
 * @param {number} totalCost
 * @returns {{profit: number, grossRate: number}}
 */
function calcGrossProfit(sellPrice, totalCost) {
  sellPrice = Number(sellPrice) || 0
  totalCost = Number(totalCost) || 0
  var profit = round(sellPrice - totalCost, 4)
  var grossRate = sellPrice > 0 ? round(profit / sellPrice, 4) : 0
  return { profit: profit, grossRate: grossRate }
}

/**
 * 原料单价变化时，重算所有关联菜品
 * @param {Array} dishList
 * @param {Array} materialList
 * @param {string} materialName - 变化的原料名（可选，不传则全部重算）
 * @returns {Array} 更新后的 dishList
 */
function recalcAllDishes(dishList, materialList, materialName) {
  return dishList.map(function(dish) {
    // 如果指定了原料名，只重算包含该原料的菜品
    if (materialName) {
      var hasMat = dish.bomList.some(function(b) { return b.name === materialName })
      if (!hasMat) return dish
    }
    var result = calcDishCost(dish.bomList, materialList)
    var profit = calcGrossProfit(dish.sellPrice, result.totalCost)
    return Object.assign({}, dish, {
      bomList: result.bomList,
      totalCost: result.totalCost,
      profit: profit.profit,
      grossRate: profit.grossRate,
    })
  })
}

/**
 * 订货汇总：根据各菜品份数计算原料需求总量
 * @param {Array} orderList - [{dishId, count, bomList}]
 * @param {number} lossRate - 损耗系数（1.0=无损耗，1.1=10%损耗）
 * @param {Array} materialList - 原料列表（含curStock，用于计算建议采购量）
 * @returns {{materialTotal: Array, totalMoney: number}}
 */
function calcOrderSummary(orderList, lossRate, materialList) {
  lossRate = Number(lossRate) || 1.0
  var materialMap = {} // name → {name, unit, price, totalUseNum, totalCost, supplier}

  // 构建原料信息映射
  if (materialList) {
    materialList.forEach(function(m) {
      materialMap[m.name] = {
        name: m.name,
        unit: m.unit || '',
        price: Number(m.price) || 0,
        supplier: m.supplier || '',
        curStock: Number(m.curStock) || 0,
        totalUseNum: 0,
        totalCost: 0,
      }
    })
  }

  orderList.forEach(function(order) {
    var count = Number(order.count) || 0
    if (count === 0) return
    var bomList = order.bomList || []
    bomList.forEach(function(b) {
      if (!materialMap[b.name]) {
        materialMap[b.name] = {
          name: b.name,
          unit: b.unit || '',
          price: Number(b.price) || 0,
          supplier: '',
          curStock: 0,
          totalUseNum: 0,
          totalCost: 0,
        }
      }
      var useNum = (Number(b.useNum) || 0) * count * lossRate
      materialMap[b.name].totalUseNum += useNum
    })
  })

  // 计算总成本和建议采购量
  var materialTotal = []
  var totalMoney = 0
  Object.keys(materialMap).forEach(function(name) {
    var m = materialMap[name]
    if (m.totalUseNum > 0) {
      m.totalUseNum = round(m.totalUseNum, 4)
      m.totalCost = round(m.totalUseNum * m.price, 2)
      m.suggestBuy = round(Math.max(0, m.totalUseNum - m.curStock), 4)
      m.suggestCost = round(m.suggestBuy * m.price, 2)
      totalMoney += m.suggestCost
      materialTotal.push(m)
    }
  })

  // 按供应商分组排序
  materialTotal.sort(function(a, b) {
    if (a.supplier !== b.supplier) {
      return a.supplier.localeCompare(b.supplier)
    }
    return b.totalCost - a.totalCost
  })

  return {
    materialTotal: materialTotal,
    totalMoney: round(totalMoney, 2),
  }
}

/**
 * 毛利率分档（四档）—— 2026-10-13 按方案口径改造
 *
 * 方案 M7 要求四档：「低于 70%、70% 至 80%、80% 至 85%、85% 及以上」。
 * 旧实现是三档（≥80 高 / ≥60 中 / <60 低），与方案不符，故改造。
 *
 * 阈值不写死：预警线 / 优秀线取自 utils/costParams.js（默认 0.70 / 0.85），
 * 由调用方传入；未传时用同一组默认值，保证老调用点行为可控。
 * 中间档 0.80 为方案固定分界，不是可调参数。
 *
 * @param {number} grossRate 毛利率（小数，0.829 = 82.9%）
 * @param {Object} [params] costParams（可省略）
 * @returns {{level: string, class: string}}
 */
function getGrossRateLevel(grossRate, params) {
  var p = params || {}
  var warn = (typeof p.warnRate === 'number' && isFinite(p.warnRate)) ? p.warnRate : 0.70
  var good = (typeof p.goodRate === 'number' && isFinite(p.goodRate)) ? p.goodRate : 0.85
  var r = Number(grossRate) || 0
  if (r >= good) return { level: '优秀', class: 'tag-rate-good' }
  if (r >= 0.80) return { level: '良好', class: 'tag-rate-ok' }
  if (r >= warn) return { level: '达标', class: 'tag-rate-warn' }
  return { level: '偏低', class: 'tag-rate-low' }
}

/**
 * 判断是否高成本原料
 * @param {number} price
 * @returns {boolean}
 */
function isHighCostMaterial(price) {
  return (Number(price) || 0) >= 30
}

/**
 * 判断库存是否不足
 * @param {Object} material
 * @returns {boolean}
 */
function isLowStock(material) {
  var cur = Number(material.curStock) || 0
  var min = Number(material.minStock) || 0
  return cur <= min && min > 0
}

/** 获取库存状态文字 */
function getStockStatus(material) {
  var cur = Number(material.curStock) || 0
  var min = Number(material.minStock) || 0
  if (min > 0 && cur <= min) return { text: '库存不足', class: 'text-danger' }
  if (cur === 0) return { text: '无库存', class: 'text-warning' }
  return { text: '正常', class: 'text-success' }
}

/** 四舍五入到指定小数位 */
function round(num, decimals) {
  decimals = decimals || 2
  var factor = Math.pow(10, decimals)
  return Math.round(num * factor) / factor
}

/**
 * 套餐展开：把套餐份数映射展开成「菜品份数合计」
 * 套餐与单品份数在此合并为统一的菜品用量，供 BOM 展开使用
 * @param {Object} mealMap - { mealId: count }
 * @param {Array} mealList - [{ _id, items: [{ dishId, qty }] }]
 * @returns {Object} { dishId: totalCount }
 */
function expandMealsToDishMap(mealMap, mealList) {
  var merged = {}
  Object.keys(mealMap || {}).forEach(function(mealId) {
    var cnt = Number(mealMap[mealId]) || 0
    if (cnt <= 0) return
    var meal = (mealList || []).filter(function(m) { return m._id === mealId })[0]
    if (!meal || !meal.items) return
    meal.items.forEach(function(it) {
      var dishId = it.dishId
      var qty = Number(it.qty) || 1
      merged[dishId] = (merged[dishId] || 0) + qty * cnt
    })
  })
  return merged
}

/* ============ 销量参考值（供订货计算器展示「近 N 天日均 / 上周同期」） ============ */

/** 'YYYY-MM-DD' → Date */
function _parseYmd(s) {
  var p = (s || '').split('-')
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
}

/** Date → 'YYYY-MM-DD' */
function _fmtYmd(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

/**
 * 计算每个单品 / 单人套餐 / 成人套餐的销量参考值
 * 口径：
 *   avg7        = 目标日之前 N 天（不含目标日当天）内有记录的天数平均值（保留 1 位小数）
 *   sameWeekday = 上周同一天（目标日 -7 天）的实际份数，无记录为 0
 * 成人套餐取预订单「订购 + 赠送」= 实际出餐份数，与预定汇总口径一致
 *
 * ⚠️ 团队预定是否计入基准（2026-09-26 用户拍板）：
 *   默认 includeBooking=true 会合并成人套餐预定；
 *   但**预警阈值 / 参考值的基准必须排除团队预定**（opts.includeBooking=false）——
 *   团队预定是「已知的一次性大单、单独备货」，混进日常日均会把基准拉爆
 *   （例：散点日均 5 份，某天接了 100 份团队 → avg7 被抬到 19，日常预警全失真）。
 *
 * @param {Array}  spotSales  散点销量 [{date, items:{id:qty}}]
 * @param {Array}  adultMeals 成人套餐预订单 [{date, setmealId, orderQty, giftQty}]
 * @param {String} targetDate YYYY-MM-DD
 * @param {Number} days       近 N 天窗口，默认 7
 * @param {Object} opts       { includeBooking: Boolean } 默认 true（即含团队预定）
 * @returns {Object} { id: { avg7, sameWeekday, lastWeekDate } }
 */
function computeSalesRef(spotSales, adultMeals, targetDate, days, opts) {
  days = days || 7
  opts = opts || {}
  var includeBooking = opts.includeBooking !== false   // 默认 true，向后兼容
  var daily = {}   // date -> { id: qty }

  ;(spotSales || []).forEach(function (r) {
    var d = r.date
    if (!d) return
    if (!daily[d]) daily[d] = {}
    Object.keys(r.items || {}).forEach(function (id) {
      daily[d][id] = (daily[d][id] || 0) + (Number(r.items[id]) || 0)
    })
  })

  // 成人套餐（团队）预定：按日期聚合（出餐份数 = 订购 + 赠送）
  // includeBooking=false 时整段跳过 → 基准只反映日常散点销量（2026-09-26 用户拍板）
  if (includeBooking) {
    ;(adultMeals || []).forEach(function (m) {
      if (!m || !m.date || !m.setmealId) return
      if (!daily[m.date]) daily[m.date] = {}
      var qty = (Number(m.orderQty) || 0) + (Number(m.giftQty) || 0)
      daily[m.date][m.setmealId] = (daily[m.date][m.setmealId] || 0) + qty
    })
  }

  var target = _parseYmd(targetDate)
  var acc = {}          // id -> {sum, days}
  var ids = {}

  for (var i = 1; i <= days; i++) {
    var d = new Date(target.getTime())
    d.setDate(d.getDate() - i)
    var rec = daily[_fmtYmd(d)]
    if (!rec) continue
    Object.keys(rec).forEach(function (id) {
      ids[id] = true
      if (!acc[id]) acc[id] = { sum: 0, days: 0 }
      acc[id].sum += rec[id]
      acc[id].days += 1
    })
  }

  // 上周同期
  var lastWeek = new Date(target.getTime())
  lastWeek.setDate(lastWeek.getDate() - 7)
  var lastWeekKey = _fmtYmd(lastWeek)
  var lastWeekRec = daily[lastWeekKey] || {}
  Object.keys(lastWeekRec).forEach(function (id) { ids[id] = true })

  var out = {}
  Object.keys(ids).forEach(function (id) {
    var a = acc[id] || { sum: 0, days: 0 }
    out[id] = {
      avg7: a.days ? Math.round((a.sum / a.days) * 10) / 10 : 0,
      sameWeekday: Number(lastWeekRec[id]) || 0,
      lastWeekDate: lastWeekKey
    }
  })
  return out
}

/**
 * 按某条预定的下单时组成快照（mealItems）展开成 { dishId: qty * mul }
 * 优先用 mealItems（保存时固化），缺则回退到实时 setMeals 展开
 */
function expandMealItemsCore(m, setMeals, mul) {
  if (mul <= 0) return {}
  if (m.mealItems && m.mealItems.length) {
    var o = {}
    m.mealItems.forEach(function (it) {
      var q = (Number(it.qty) || 1) * mul
      o[it.dishId] = (o[it.dishId] || 0) + q
    })
    return o
  }
  var tmp = {}; tmp[m.setmealId] = mul
  return expandMealsToDishMap(tmp, setMeals)
}

/**
 * 在「订购」展开的 dishMap 上应用本单换菜
 * 赠送部分不参与换菜（标准版）
 */
function applySwaps(dishMap, swaps) {
  for (var i = 0; i < swaps.length; i++) {
    var sw = swaps[i]
    var fromQty = dishMap[sw.fromDishId] || 0
    if (fromQty <= 0) continue
    var move = Math.min(fromQty, Number(sw.qty) || fromQty)
    dishMap[sw.fromDishId] = fromQty - move
    if (dishMap[sw.fromDishId] <= 0) delete dishMap[sw.fromDishId]
    dishMap[sw.toDishId] = (dishMap[sw.toDishId] || 0) + move
  }
}

/**
 * 在「订购」展开的 dishMap 上叠加套餐外加菜
 * 赠送部分不参与加菜（赠送吃标准版，不额外送加的菜）
 * 口径（2026-09-09 定）：ex.qty / ex.qtyPerSet 存的就是「总份数」，
 *   输入 100 = 总共加 100 份，不再乘订购数（避免 100套×100/套=10000 的翻倍事故）。
 *   旧记录里的 qtyPerSet 原意为"份/套"，口径切换后按总份数解释 → 事故单自动"愈合"为小数值。
 */
function applyExtraDishes(dishMap, extras) {
  for (var k = 0; k < extras.length; k++) {
    var ex = extras[k]
    var eq = Number(ex.qty) || Number(ex.qtyPerSet) || 0
    if (eq <= 0) continue
    dishMap[ex.dishId] = (dishMap[ex.dishId] || 0) + eq
  }
}

/**
 * 把成人套餐预定列表展开成「菜品级份数」映射 { dishId: count }
 * 支持下单时的组成快照（mealItems）与单笔换菜（dishSwaps）
 * @param {Array}  bookings   成人套餐预定记录（storage.getAdultMealList()）
 * @param {Array}  setMeals   合并 override 后的套餐列表
 * @param {Array}  dishes     菜品列表（用于校验 dishId 存在性）
 * @param {string} filterDate '全部' 或具体日期（'YYYY-MM-DD'），非全部则只展开该日期预定
 * @returns {Object} { dishId: count }
 */
function expandAdultBookingsToDishMap(bookings, setMeals, dishes, filterDate) {
  var dishMap = {}
  var dishSet = {}
  ;(dishes || []).forEach(function (d) { dishSet[d._id] = true })
  ;(bookings || []).forEach(function (m) {
    if (filterDate && filterDate !== '全部' && m.date !== filterDate) return
    var orderQty = Number(m.orderQty) || 0
    var giftQty = Number(m.giftQty) || 0
    if (orderQty <= 0 && giftQty <= 0) return
    // 1) 赠送部分：仅原套餐组成（不参与加菜 / 换菜，赠送吃标准版）
    var giftMap = expandMealItemsCore(m, setMeals, giftQty)
    // 2) 订购部分：原套餐组成 + 换菜 + 加菜
    var orderMap = expandMealItemsCore(m, setMeals, orderQty)
    applySwaps(orderMap, m.dishSwaps || [])
    applyExtraDishes(orderMap, m.extraDishes || [])
    // 合并赠送 + 订购，再累加到全局 dishMap
    var bm = orderMap
    for (var gid in giftMap) {
      bm[gid] = (bm[gid] || 0) + giftMap[gid]
    }
    for (var did in bm) {
      if (!dishSet[did]) continue
      dishMap[did] = (dishMap[did] || 0) + bm[did]
    }
  })
  return dishMap
}

/**
 * 与 expandAdultBookingsToDishMap 同口径，但额外输出溯源 sourceMap
 * 便于采购单预览里把每个菜的份数拆成「预定（订购+换菜+加菜）」/「赠送」两栏
 * 口径说明：
 *   - 『预定』= 订购数展开后的组成（含换菜后的替换菜 + 套餐外加菜）
 *   - 『赠送』= 赠送数展开的原套餐组成（赠送吃标准版，不参与换菜/加菜）
 * @param {Array}  bookings   成人套餐预定记录
 * @param {Array}  setMeals   合并 override 后的套餐列表
 * @param {Array}  dishes     菜品列表（用于校验 dishId 存在性）
 * @param {string} filterDate '全部' 或具体日期
 * @returns {Object} { dishMap: {dishId: count}, sourceMap: { dishId: { '预定': n, '赠送': m } } }
 */
function expandAdultBookingsWithSource(bookings, setMeals, dishes, filterDate) {
  var dishMap = {}
  var sourceMap = {}
  var dishSet = {}
  ;(dishes || []).forEach(function (d) { dishSet[d._id] = true })
  ;(bookings || []).forEach(function (m) {
    if (filterDate && filterDate !== '全部' && m.date !== filterDate) return
    var orderQty = Number(m.orderQty) || 0
    var giftQty = Number(m.giftQty) || 0
    if (orderQty <= 0 && giftQty <= 0) return
    // 1) 赠送部分：仅原套餐组成（不参与加菜 / 换菜，赠送吃标准版）
    var giftMap = expandMealItemsCore(m, setMeals, giftQty)
    // 2) 订购部分：原套餐组成 + 换菜 + 加菜
    var orderMap = expandMealItemsCore(m, setMeals, orderQty)
    applySwaps(orderMap, m.dishSwaps || [])
    applyExtraDishes(orderMap, m.extraDishes || [])

    // 溯源：先记录订购 / 赠送各自贡献（此时 orderMap 尚未并入 giftMap）
    var bm = orderMap
    var ids = {}
    Object.keys(bm).forEach(function (id) { ids[id] = true })
    Object.keys(giftMap).forEach(function (id) { ids[id] = true })
    Object.keys(ids).forEach(function (id) {
      if (!dishSet[id]) return
      var oq = Number(bm[id]) || 0
      var gq = Number(giftMap[id]) || 0
      if (!sourceMap[id]) sourceMap[id] = { '预定': 0, '赠送': 0 }
      sourceMap[id]['预定'] += oq
      sourceMap[id]['赠送'] += gq
    })

    // 合并赠送 + 订购，再累加到全局 dishMap
    for (var gid in giftMap) {
      bm[gid] = (bm[gid] || 0) + giftMap[gid]
    }
    for (var did in bm) {
      if (!dishSet[did]) continue
      dishMap[did] = (dishMap[did] || 0) + bm[did]
    }
  })
  return { dishMap: dishMap, sourceMap: sourceMap }
}

/**
 * 采购单原料品类排序（2026-09-12 用户拍板）
 * 蔬菜 → 肉类 → 干货 → 奶制品和鸡蛋 → 调料 → 其他
 * 说明：seed.js 里 category 有 15 种取值，这里按采购习惯归并；未列出的品类排最后（rank 99）
 * 调整归类只需改这张表，不用动排序逻辑
 */
var MATERIAL_CATEGORY_ORDER = [
  { key: '蔬菜', categories: ['蔬菜'] },
  { key: '肉类', categories: ['肉类', '冻品', '海鲜', '禽类'] },   // 牛筋肉/培根(冻品)、虾仁(海鲜)都算荤
  { key: '干货', categories: ['调味品', '豆制品'] },                 // 葡萄干/白芝麻/花生碎/八角/黑木耳/云丝
  { key: '奶制品和鸡蛋', categories: ['饮品', '禽类', '奶制品'], names: ['鸡蛋'] },    // 牛奶/酸奶 + 鸡蛋（category 是"禽类"）+ 芝士/黄油/奶油等
  { key: '主食及其他', categories: ['主食', '水果', '未分类', '包装', '其他', '甜品', '饮品原料'] },
  { key: '调料', categories: ['调料'] }                              // 调料排在最后（第 6 组）
]
var MATERIAL_OTHER_RANK = 99

/**
 * 采购单「供应商片区」固定顺序（2026-10-11 用户拍板）
 * 好生活 → 松食配送 → 赛大厨
 * 说明：未列入本表的供应商（如「瑞淮」「申美」「未知供应商」）保持聚合时的原有相对顺序，
 *       统一排在清单之后，保证输出稳定、不因遍历顺序漂移。调整顺序只改这张表。
 */
var SUPPLIER_ORDER = ['好生活', '松食配送', '赛大厨']

/** 原料品类排序权重：同名特例（如鸡蛋）优先，其次按 category 归并 */
function categoryRank(mat) {
  var name = (mat && mat.name) || ''
  var cat = (mat && mat.category) || ''
  var i, g
  // ① 先全局匹配「名称特例」——必须优先于 category，否则会被前面的组抢先捕获
  //    （2026-09-13 踩坑：鸡蛋 category='禽类' 被归进"肉类"，因为肉类 categories 含"禽类"）
  for (i = 0; i < MATERIAL_CATEGORY_ORDER.length; i++) {
    g = MATERIAL_CATEGORY_ORDER[i]
    if (g.names && g.names.indexOf(name) >= 0) return i + 1
  }
  // ② 再按 category 归并
  for (i = 0; i < MATERIAL_CATEGORY_ORDER.length; i++) {
    g = MATERIAL_CATEGORY_ORDER[i]
    if (g.categories && g.categories.indexOf(cat) >= 0) return i + 1
  }
  return MATERIAL_OTHER_RANK
}

/**
 * 生成「预定菜单汇总」：把每单预定的套餐、份数、实际出餐菜单（含换菜 / 加菜）列出来
 * 放在采购单顶部，便于一眼看懂下面的每个原料数字来自哪道菜
 * 口径与 expandAdultBookingsToDishMap 完全一致（订购=原组成+换菜+加菜；赠送=原组成）
 * @param {Array}  bookings   成人套餐预定记录
 * @param {Array}  setMeals   合并 override 后的套餐列表
 * @param {Array}  dishes     菜品列表（用于取 dishName）
 * @param {string} filterDate '全部' 或具体日期
 * @returns {Array} [{ date, customer, setmealName, orderQty, giftQty, totalQty,
 *                     menu:[{dishName, qty}], swaps:[{from,to,qty}], extras:[{dishName,qty}] }]
 */
function buildBookingMenuSummary(bookings, setMeals, dishes, filterDate) {
  var nameOf = {}
  ;(dishes || []).forEach(function (d) { nameOf[d._id] = d.dishName || d._id })
  var out = []
  ;(bookings || []).forEach(function (m) {
    if (filterDate && filterDate !== '全部' && m.date !== filterDate) return
    var orderQty = Number(m.orderQty) || 0
    var giftQty = Number(m.giftQty) || 0
    if (orderQty <= 0 && giftQty <= 0) return
    // 实际组成：订购（原组成 + 换菜 + 加菜） + 赠送（原组成）
    var orderMap = expandMealItemsCore(m, setMeals, orderQty)
    applySwaps(orderMap, m.dishSwaps || [])
    applyExtraDishes(orderMap, m.extraDishes || [])
    var giftMap = expandMealItemsCore(m, setMeals, giftQty)
    var merged = {}
    Object.keys(orderMap).forEach(function (id) { merged[id] = (merged[id] || 0) + orderMap[id] })
    Object.keys(giftMap).forEach(function (id) { merged[id] = (merged[id] || 0) + giftMap[id] })
    var menu = Object.keys(merged)
      .filter(function (id) { return merged[id] > 0 })
      .map(function (id) {
        return { dishName: nameOf[id] || id, qty: merged[id] }
      })
    out.push({
      date: m.date || '',
      customer: m.customer || '',
      setmealName: m.setmealName || '',
      // 🆕 2026-10-11（用户拍板）：采购单的「菜单汇总」要显示每单预定时填的备注。
      //   原先这里只带 套餐/份数/菜单，typeRemark 到卡片为止 ⇒ 导出的表里一个字都没有。
      remark: String(m.typeRemark || ''),
      orderQty: orderQty,
      giftQty: giftQty,
      totalQty: orderQty + giftQty,
      menu: menu,
      swaps: (m.dishSwaps || []).map(function (s) {
        return { from: s.fromDishName || s.fromDishId, to: s.toDishName || s.toDishId, qty: s.qty }
      }),   // qty 为 null = 整道全换
      extras: (m.extraDishes || []).map(function (e) {
        return { dishName: e.dishName || e.dishId, qty: Number(e.qty) || Number(e.qtyPerSet) || 0 }
      })
    })
  })
  return out
}

/**
 * 生成采购单「备注（规格）」文本（2026-10-01 用户要求：采购单在「总用量」后加一列规格）
 * 二者合一：优先原料库 spec 原文（如「纯猪肉 1.7kg*8包」「120克/块」）；
 *          spec 缺失、或是历史遗留的「价格串」（含「元」，如「13.4元/kg」）时，
 *          回退用箱规拼成「1箱=10kg」「1块=0.12kg」；两者都没有则留空。
 * @param {Object} matRef 原料库记录（含 spec / specQty / orderUnit）
 * @param {string} unit   库存单位（如 kg / 个 / 根）
 * @returns {string}
 */
function buildSpecLabel(matRef, unit) {
  var spec = String((matRef && matRef.spec) || '').trim()
  var sq = Number(matRef && matRef.specQty) || 0
  var ou = (matRef && matRef.orderUnit) || ''
  var boxLabel = (sq > 0 && ou) ? ('1' + ou + '=' + sq + unit) : ''
  // spec 里含「元」= 价格备注，不是规格，跳过（历史遗留，建议后续清洗进 remark）
  if (spec && spec.indexOf('元') < 0) return spec
  return boxLabel
}

/**
 * 由「菜品级份数」生成采购单（原料聚合 + 按供应商分组 + 扣库存算建议采购量）
 * 订货页 / 预定页 / 合并采购单 共用此函数，保证口径一致
 * @param {Object} orderMap     { dishId: count }
 * @param {Array}  allDishes    菜品列表（含 bomList）
 * @param {Array}  materialList 原料列表（含 price/supplier/curStock）
 * @param {number} lossRate     损耗率（订货页用可调值；预定页原写死 1.0）
 * @returns {Object} { materialAgg, groups, totalMoney }
 */
function buildPurchasePlan(orderMap, allDishes, materialList, lossRate, sourceMap, invMap) {
  var orderList = Object.keys(orderMap || {}).map(function (dishId) {
    var dish = (allDishes || []).find(function (d) { return d._id === dishId })
    return {
      dishId: dishId,
      dishName: dish ? dish.dishName : '',
      count: orderMap[dishId],
      bomList: dish ? dish.bomList : []
    }
  })

  var materialAgg = {}
  var unmatchedMaterialNames = []   // 🆕 材料库按名字找不到的原料（供应商/单价/规格会是兜底值）

  orderList.forEach(function (order) {
    ;(order.bomList || []).forEach(function (bom) {
      if (!bom.name) return
      var total = (Number(bom.useNum) || 0) * order.count * lossRate
      if (!materialAgg[bom.name]) {
        var matFound = (materialList || []).find(function (mm) { return mm.name === bom.name })
        var matRef = matFound || {}
        // 🆕 2026-10-11：材料库里**根本没这条**时打标记。
        // 典型病因：云端 material 集合没同步全（云函数单次查询曾默认只回 100 条，
        // 材料 106 条 ⇒ 后段原料在前端按名字找不到），于是供应商变「未知供应商」、
        // 单价和规格全变 0 —— 采购金额悄悄少算，页面却看不出来。这里留痕供页面报警。
        if (!matFound) unmatchedMaterialNames.push(bom.name)
        materialAgg[bom.name] = {
          name: bom.name,
          unit: bom.unit || '',
          price: Number(matRef.price) || 0,
          supplier: matRef.supplier || '未知供应商',
          category: matRef.category || '',   // 供采购单按品类排序（蔬菜→肉类→干货→奶蛋→调料）
          curStock: Number(matRef.curStock) || 0,
          unmatched: !matFound,              // true = 材料库里没有这条（上述兜底值不可信）
          // 采购规格：1 个采购单位(orderUnit)含多少库存单位(unit)。例：五花肉 1 块 = 0.12 kg
          // 配了 specQty 才按规格换算采购量（如 12kg ÷ 0.12 = 100 块）；没配则走原「ceil 到整数」
          specQty: Number(matRef.specQty) || 0,
          orderUnit: matRef.orderUnit || '',
          // 备注（规格，2026-10-01 用户要求：采购单「总用量」后加一列规格）
          specLabel: buildSpecLabel(matRef, bom.unit || matRef.unit || ''),
          totalUseNum: 0,
          suggestBuy: 0,
          suggestCost: 0,
          totalCost: 0,
          sources: []          // 溯源：该原料由哪些菜、各多少份、单份用量贡献
        }
      }
      // 记录来源（同菜同原料只会出现一次，orderMap 已按 dishId 去重）
      // sourceMap 可选：{ dishId: { '预定': n, '散点': m } }，用于拆分「预定 / 散点」各贡献多少份
      var useNum = Number(bom.useNum) || 0
      var parts = []
      var sm = (sourceMap && sourceMap[order.dishId]) || null
      if (sm) {
        Object.keys(sm).forEach(function (k) {
          var c = Number(sm[k]) || 0
          if (c > 0) parts.push({ from: k, count: c, amount: round(useNum * c * lossRate, 4) })
        })
      }
      if (!parts.length) parts.push({ from: '', count: order.count, amount: round(useNum * order.count * lossRate, 4) })
      materialAgg[bom.name].sources.push({
        dishName: order.dishName,
        count: order.count,
        useNum: useNum,
        unit: bom.unit || '',
        amount: total,
        parts: parts
      })
      materialAgg[bom.name].totalUseNum += total
    })
  })

  // 库存联动：把「库存单子」的半成品库存，按 SEED_INVENTORY_MAP 扣减对应 BOM 原料的 curStock
  // factor 为 null/0 的项（单位换算待确认）不扣减，避免算错采购量；本期未订货的原料自动跳过
  // 🔴 2026-10-11：同时把每条的来源（live/default）打到 m.stockSrc，并对「用了出厂基线」的项告警
  //   —— 基线是 2026-09-20 的值，可能早就过期；不吭声地拿它算采购量会误导（用户报的「鸡根」就是这种）
  var stockBaselineNames = []
  ;(invMap || []).forEach(function (im) {
    if (!im || !im.target || !(im.factor > 0)) return
    var m = materialAgg[im.target]
    if (!m) return
    m.curStock = Number(m.curStock || 0) + Number(im.stock || 0) * Number(im.factor)
    if (im.src === 'live') {
      m.stockSrc = 'live'
    } else if (im.src === 'default') {
      if (Number(im.stock) > 0) stockBaselineNames.push(im.target)
      if (m.stockSrc !== 'live') m.stockSrc = 'default'
    }
  })
  if (stockBaselineNames.length) {
    console.warn('[calc] ⚠️ 以下原料的「当前库存」用的是**出厂基线**（实时库存单子里没有它们），' +
      '数值可能已过期，建议去订货页「📦 库存订货」补录实际库存：' + stockBaselineNames.join('、'))
  }

  var vals = Object.values(materialAgg)
  vals.forEach(function (m) {
    var need = m.totalUseNum - m.curStock
    if (need < 0) need = 0
    if (m.specQty > 0) {
      // 按采购规格换算：例 12kg ÷ 0.12kg/块 = 100 块
      // toFixed(6) 兜底浮点误差（12/0.12 = 100.00000000000001 → ceil 会错成 101）
      // 容器单位（箱/袋/包…）保留 2 位小数：100个 ÷ 80个/箱 = 1.25箱（2026-09-22 用户要求，不再进整成 2 箱）
      var rawBuy = parseFloat((need / m.specQty).toFixed(6))
      if (CONTAINER_UNITS.indexOf(m.orderUnit || '') >= 0) {
        m.suggestBuy = parseFloat(rawBuy.toFixed(2))
      } else {
        m.suggestBuy = Math.ceil(rawBuy)
      }
      m.buyUnit = m.orderUnit || m.unit
      m.suggestCost = parseFloat((m.suggestBuy * m.specQty * m.price).toFixed(2))
    } else {
      m.suggestBuy = Math.ceil(need)
      m.buyUnit = m.unit
      m.suggestCost = parseFloat((m.suggestBuy * m.price).toFixed(2))
    }
    m.totalCost = parseFloat((m.totalUseNum * m.price).toFixed(2))
    m.totalUseNum = parseFloat(m.totalUseNum.toFixed(2))
  })

  var supplierMap = {}
  vals.forEach(function (m) {
    if (!supplierMap[m.supplier]) supplierMap[m.supplier] = { supplier: m.supplier, materials: [] }
    supplierMap[m.supplier].materials.push(m)
  })
  var groups = Object.values(supplierMap)
  // 🔴 供应商片区顺序（2026-10-11 用户拍板）：好生活 → 松食配送 → 赛大厨
  //    未列入 SUPPLIER_ORDER 的供应商保持原有相对顺序（oi 稳定排序），统一排在后面；
  //    ⇒ 输出与原料聚合顺序解耦，同一份数据每次导出顺序一致。
  groups = groups.map(function (g, i) { return { g: g, oi: i } })
    .sort(function (a, b) {
      var ra = SUPPLIER_ORDER.indexOf(a.g.supplier)
      var rb = SUPPLIER_ORDER.indexOf(b.g.supplier)
      if (ra < 0) ra = SUPPLIER_ORDER.length
      if (rb < 0) rb = SUPPLIER_ORDER.length
      return (ra - rb) || (a.oi - b.oi)
    })
    .map(function (x) { return x.g })
  // 组内按品类排序：蔬菜 → 肉类 → 干货 → 奶制品和鸡蛋 → 调料 → 其他（2026-09-12 用户拍板）
  // 保持供应商分组不变（要分别发给不同供应商），只调整每组内的原料顺序
  groups.forEach(function (g) {
    g.materials.sort(function (a, b) {
      var ra = categoryRank(a), rb = categoryRank(b)
      if (ra !== rb) return ra - rb
      return (a.name || '').localeCompare(b.name || '')   // 同品类按名称稳定排序
    })
    // 标记品类分组首行：供 UI / CSV 在该位置插入「蔬菜 / 肉类 / …」分隔标题
    var lastRank = null
    g.materials.forEach(function (m) {
      var r = categoryRank(m)
      m.catName = (r >= 1 && r <= MATERIAL_CATEGORY_ORDER.length)
        ? MATERIAL_CATEGORY_ORDER[r - 1].key : '其他'
      m.catFirst = (r !== lastRank)
      lastRank = r
    })
  })
  var totalMoney = groups.reduce(function (s, g) {
    return s + g.materials.reduce(function (x, m) { return x + m.suggestCost }, 0)
  }, 0)
  return {
    materialAgg: materialAgg,
    groups: groups,
    totalMoney: parseFloat(totalMoney.toFixed(2)),
    // 🆕 2026-10-11：这次算出来的采购单里，有哪些原料的库存是「出厂基线」兜底的（非实时盘点）
    stockBaselineNames: stockBaselineNames,
    // 🆕 2026-10-11：材料库里**找不到**的原料（去重）。非空说明云端 material 集合没同步全，
    // 这些原料的供应商/单价/规格都是兜底值（未知供应商 · ¥0），金额不可信。
    unmatchedMaterials: unmatchedMaterialNames.filter(function (n, i, a) { return a.indexOf(n) === i })
  }
}

/* ============================================================================
 *  成本核算扩展（M3 成本 / M4 毛利定价 / M7 看板）—— 2026-10-13 新增
 *  依据：《热力学餐厅_成本核算小程序设计方案与SOP》V1.0
 *
 *  🔴 本段所有假设（综合损耗率 / 人工能耗分摊 / 目标毛利率 / 预警线 / 优秀线）
 *     一律由调用方从 utils/costParams.js 传入，本文件不写死任何一个数字。
 *     改假设只改 costParams 一处，全表联动。
 * ========================================================================== */

/** 菜品分类的固定展示顺序（方案 M7「分类对比」口径） */
var DISH_CATEGORY_ORDER = ['经典主食', '西式主食', '现煮面食', '缤纷小食', '其他']

/** 取数值，非法则回退 */
function _num(v, dft) {
  return (typeof v === 'number' && isFinite(v)) ? v : dft
}

/**
 * 公式二：完全成本
 *   完全成本 = 配方成本 × (1 + 综合损耗率) + 人工能耗分摊
 *
 * 用户拍板（2026-10-13）：损耗率 0、人工分摊不计入 ⇒ 当前完全成本 = 配方成本。
 * 日后把假设一改，这里不用动。
 *
 * @param {number} bomCost 配方成本
 * @param {Object} params costParams
 * @returns {number} 4 位小数
 */
function calcFullCost(bomCost, params) {
  var p = params || {}
  var loss = _num(p.lossRate, 0)
  var labor = _num(p.laborPerPortion, 0)
  return round((Number(bomCost) || 0) * (1 + loss) + labor, 4)
}

/**
 * 公式四：建议售价（保毛利定价）
 *   建议售价 = 完全成本 ÷ (1 − 目标毛利率)
 *
 * ⚠️ 与「成本加成定价」（成本 ×(1+加成率)）不是同一算法，不可混用。
 * ⚠️ 目标毛利率 ≥ 100% 或完全成本为 0 时公式无解 ⇒ 返回 0，由调用方判空。
 *
 * @param {number} fullCost
 * @param {number} targetGrossRate 小数，如 0.829
 * @returns {number} 建议售价（2 位小数）
 */
function suggestPrice(fullCost, targetGrossRate) {
  var g = Number(targetGrossRate) || 0
  var c = Number(fullCost) || 0
  if (c <= 0 || g >= 1) return 0
  return round(c / (1 - g), 2)
}

/**
 * 定价差 = 建议售价 − 现售价
 * 正值 ⇒ 现价偏低、该上调；负值 ⇒ 现价还有余量。
 * @returns {number} 2 位小数
 */
function priceDiff(suggest, sellPrice) {
  return round((Number(suggest) || 0) - (Number(sellPrice) || 0), 2)
}

/**
 * 单道菜的完整成本链：M3 成本 → M4 毛利 → M4 定价
 * 一次算完，避免各页面各自拼装导致口径不一。
 *
 * 售价为 0 的套餐组件（SOP 菜）只算成本，不参与毛利统计与建议定价。
 *
 * @param {Object} dish 菜品（含 bomList / sellPrice）
 * @param {Array} materialList 原料主数据（唯一价格源）
 * @param {Object} params costParams
 * @returns {Object} { bomList, bomCost, fullCost, sellPrice, isPriced,
 *                     profit, grossRate, level, levelClass, suggestPrice, diff }
 */
function calcDishCostChain(dish, materialList, params) {
  var d = dish || {}
  var res = calcDishCost(d.bomList || [], materialList)
  var bomCost = res.totalCost
  var fullCost = calcFullCost(bomCost, params)
  var sellPrice = Number(d.sellPrice) || 0
  var isPriced = sellPrice > 0
  var gross = calcGrossProfit(sellPrice, fullCost)
  var lv = getGrossRateLevel(gross.grossRate, params)
  var sp = isPriced ? suggestPrice(fullCost, (params || {}).targetGrossRate) : 0
  return {
    bomList: res.bomList,
    bomCost: bomCost,
    fullCost: fullCost,
    sellPrice: sellPrice,
    isPriced: isPriced,
    profit: isPriced ? gross.profit : 0,
    grossRate: isPriced ? gross.grossRate : 0,
    level: lv.level,
    levelClass: lv.class,
    suggestPrice: sp,
    diff: isPriced ? priceDiff(sp, sellPrice) : 0
  }
}

/**
 * 看板核心指标（M7）
 *
 * ⚠️ 平均毛利率只统计「已定价」菜品（售价为 0 的套餐组件不参与），
 *    否则会被 0 拉低均值 —— 这是方案五条口径里的毛利口径。
 *
 * @param {Array} dishes
 * @param {Array} materialList
 * @param {Object} params costParams
 * @param {Object} [extra] 可选 { inventoryAmount, materialCount } 由页面另行提供
 * @returns {Object}
 */
function calcMenuStats(dishes, materialList, params, extra) {
  var list = dishes || []
  var warnRate = _num((params || {}).warnRate, 0.70)
  var chains = list.map(function (d) { return calcDishCostChain(d, materialList, params) })
  var priced = chains.filter(function (c) { return c.isPriced })

  var dishTotal = list.length
  var onSaleCount = list.filter(function (d) { return !d.hideInOrder }).length
  /* 「已定价且在售」：两个口径都给出来，避免看板数字被误读
     （方案文档写「可计算毛利的在售菜品 33 道」，与当前数据的 34 / 28 均不等，
       不迁就文档数字，按实际口径展示并标注） */
  var pricedOnSaleCount = list.filter(function (d) {
    return Number(d.sellPrice) > 0 && !d.hideInOrder
  }).length

  var avgBomCost = 0
  var avgFullCost = 0
  if (chains.length) {
    avgBomCost = round(chains.reduce(function (s, c) { return s + c.bomCost }, 0) / chains.length, 2)
    avgFullCost = round(chains.reduce(function (s, c) { return s + c.fullCost }, 0) / chains.length, 2)
  }

  var avgGrossRate = 0
  if (priced.length) {
    avgGrossRate = round(priced.reduce(function (s, c) { return s + c.grossRate }, 0) / priced.length, 4)
  }

  var belowWarn = priced.filter(function (c) { return c.grossRate < warnRate })
  var needRaise = priced.filter(function (c) { return c.diff > 0.005 })

  // 四档分布：偏低 <70 / 达标 70-80 / 良好 80-85 / 优秀 ≥85
  var buckets = { low: 0, warn: 0, ok: 0, good: 0 }
  priced.forEach(function (c) {
    if (c.levelClass === 'tag-rate-good') buckets.good++
    else if (c.levelClass === 'tag-rate-ok') buckets.ok++
    else if (c.levelClass === 'tag-rate-warn') buckets.warn++
    else buckets.low++
  })

  var anomalies = findCostAnomalies(list, materialList)

  return {
    dishTotal: dishTotal,
    onSaleCount: onSaleCount,
    pricedCount: priced.length,
    pricedOnSaleCount: pricedOnSaleCount,
    avgBomCost: avgBomCost,
    avgFullCost: avgFullCost,
    avgGrossRate: avgGrossRate,
    belowWarnCount: belowWarn.length,
    needRaiseCount: needRaise.length,
    raiseTotal: round(needRaise.reduce(function (s, c) { return s + c.diff }, 0), 2),
    buckets: buckets,
    anomalyCount: anomalies.length,
    materialCount: (extra && _num(extra.materialCount, 0)) || (materialList || []).length,
    inventoryAmount: (extra && _num(extra.inventoryAmount, 0)) || 0
  }
}

/**
 * 分类对比（M7）：按菜品分类汇总菜品数、平均毛利率、平均完全成本、低毛利菜品数
 * @returns {Array} 按方案的固定分类顺序排列
 */
function buildCategoryStats(dishes, materialList, params) {
  var warnRate = _num((params || {}).warnRate, 0.70)
  var map = {}
  ;(dishes || []).forEach(function (d) {
    var cat = d.dishCategory || '其他'
    if (!map[cat]) map[cat] = { category: cat, count: 0, chains: [] }
    map[cat].count++
    map[cat].chains.push(calcDishCostChain(d, materialList, params))
  })
  var rows = Object.keys(map).map(function (cat) {
    var g = map[cat]
    var priced = g.chains.filter(function (c) { return c.isPriced })
    return {
      category: cat,
      count: g.count,
      avgFullCost: g.chains.length ? round(g.chains.reduce(function (s, c) { return s + c.fullCost }, 0) / g.chains.length, 2) : 0,
      avgGrossRate: priced.length ? round(priced.reduce(function (s, c) { return s + c.grossRate }, 0) / priced.length, 4) : 0,
      lowCount: priced.filter(function (c) { return c.grossRate < warnRate }).length
    }
  })
  // 按方案固定顺序排；顺序表里没有的分类排到最后（保持稳定）
  rows.sort(function (a, b) {
    var ia = DISH_CATEGORY_ORDER.indexOf(a.category)
    var ib = DISH_CATEGORY_ORDER.indexOf(b.category)
    if (ia < 0) ia = 99
    if (ib < 0) ib = 99
    if (ia !== ib) return ia - ib
    return b.count - a.count
  })
  return rows
}

/**
 * 异常清单（M7）
 *
 * 五类：
 *   emptyBom   配方为空 —— 该菜成本恒为 0
 *   missMat    原料失配 —— 配方行里的原料在原料库找不到，该行按 ¥0 计（静默错算）
 *   zeroPrice  价格缺失 —— 原料单价为 0，成本被低估
 *   dupMat     配方重复 —— 同一道菜同一原料出现多次（方案 M2 校验规则）
 *   drift      缓存漂移 —— 配方行内 price 快照与原料现价不一致（成本按现价算，仅提示）
 *
 * @returns {Array} [{type, typeText, dishId, dishName, detail, severity}]
 */
function findCostAnomalies(dishes, materialList) {
  var out = []
  var priceMap = {}
  ;(materialList || []).forEach(function (m) { priceMap[m.name] = m })

  ;(dishes || []).forEach(function (d) {
    var bom = d.bomList || []
    if (!bom.length) {
      out.push({
        type: 'emptyBom', typeText: '配方为空', severity: 'high',
        dishId: d._id, dishName: d.dishName,
        detail: '该菜没有任何配方行，成本恒为 ¥0'
      })
      return
    }
    var seen = {}
    bom.forEach(function (b) {
      var m = priceMap[b.name]
      if (!m) {
        out.push({
          type: 'missMat', typeText: '原料失配', severity: 'high',
          dishId: d._id, dishName: d.dishName,
          detail: '配方里的「' + b.name + '」在原料库中找不到，该行成本按 ¥0 计'
        })
      } else {
        if (!(Number(m.price) > 0)) {
          out.push({
            type: 'zeroPrice', typeText: '价格缺失', severity: 'mid',
            dishId: d._id, dishName: d.dishName,
            detail: '「' + b.name + '」单价为 ¥0，成本被低估'
          })
        }
        var snap = Number(b.price)
        var now = Number(m.price)
        if (isFinite(snap) && isFinite(now) && snap > 0 && now > 0 && round(snap, 4) !== round(now, 4)) {
          out.push({
            type: 'drift', typeText: '缓存漂移', severity: 'low',
            dishId: d._id, dishName: d.dishName,
            detail: '「' + b.name + '」行内快照 ¥' + round(snap, 2) + ' ≠ 现价 ¥' + round(now, 2) + '（成本按现价算）'
          })
        }
      }
      if (seen[b.name]) {
        out.push({
          type: 'dupMat', typeText: '配方重复', severity: 'mid',
          dishId: d._id, dishName: d.dishName,
          detail: '「' + b.name + '」在同一道菜里出现了多次'
        })
      }
      seen[b.name] = true
    })
  })
  return out
}

/**
 * 建议调价清单（M4 / M7）
 * 只收「已定价 + 建议售价高于现价」的菜，按每份差额降序。
 *
 * @returns {Array}
 */
function buildRepricingList(dishes, materialList, params) {
  var out = []
  ;(dishes || []).forEach(function (d) {
    var c = calcDishCostChain(d, materialList, params)
    if (!c.isPriced || c.diff <= 0.005) return
    out.push({
      dishId: d._id,
      dishName: d.dishName,
      dishCategory: d.dishCategory || '其他',
      bomCost: c.bomCost,
      fullCost: c.fullCost,
      sellPrice: c.sellPrice,
      suggestPrice: c.suggestPrice,
      diff: c.diff,
      diffRate: c.sellPrice > 0 ? round(c.diff / c.sellPrice, 4) : 0,
      grossRate: c.grossRate,
      level: c.level,
      levelClass: c.levelClass
    })
  })
  return out.sort(function (a, b) { return b.diff - a.diff })
}

/**
 * 库存结存金额（M7）
 *
 * 口径与 buildPurchasePlan 的库存联动完全一致（见本文件 `m.curStock += im.stock * im.factor`）：
 *   ① 配方原料库存 = Σ（库存项 stock × factor）
 *   ② 金额 = Σ（该原料库存 × 原料单价）
 *
 * 🔴 实测（2026-10-13）：SEED_INVENTORY_MAP 共 35 条，其中 **8 条 target 与 factor 均为空**
 *   （蜜汁叉烧片 / 熟冻盐田虾 / 上浆巴沙鱼片 / 芝士球 / 鸡肩肉 / 牛柳 / 黄金虾 / 黑虎虾8头），
 *   这 8 条不参与汇总；剩 27 条有效映射对应 26 个不同原料（「披萨饼」有 2 条映射）。
 *   ⚠️ 方案文档写「35 条映射中有 7 条 factor 为空」，与实测 8 条不符 —— 按实测走，不迁就文档。
 * （方案 M6：「未配置映射的库存项不参与金额汇总」）
 *
 * 库存实时值优先；实时单子里没有的项退回出厂基线，并在 usedBaseline 里报数，
 * 供页面提示「这份金额里有 N 项用的是过期基线，不是实测盘点数」。
 *
 * @param {Array} inventoryList 实时库存 [{name,stock}]
 * @param {Array} invMapDef SEED_INVENTORY_MAP [{invName,target,factor}]
 * @param {Array} materialList 原料主数据（取单价）
 * @param {Array} [invDefaults] 出厂基线 SEED_INVENTORY
 * @returns {{amount:number, counted:number, skipped:number, usedBaseline:number}}
 */
function calcInventoryAmount(inventoryList, invMapDef, materialList, invDefaults) {
  var live = {}
  ;(inventoryList || []).forEach(function (it) {
    if (it && it.name != null) live[it.name] = Number(it.stock) || 0
  })
  var dft = {}
  ;(invDefaults || []).forEach(function (it) {
    if (it && it.name != null) dft[it.name] = Number(it.stock) || 0
  })
  var priceMap = {}
  ;(materialList || []).forEach(function (m) { priceMap[m.name] = Number(m.price) || 0 })

  var stockByTarget = {}
  var skipped = 0
  var usedBaseline = 0
  ;(invMapDef || []).forEach(function (d) {
    if (!d || !d.target) { skipped++; return }
    if (!(Number(d.factor) > 0)) { skipped++; return }              // 换算待确认 ⇒ 不参与
    if (priceMap[d.target] === undefined) { skipped++; return }     // 目标原料不在原料库
    var stock
    if (Object.prototype.hasOwnProperty.call(live, d.invName)) {
      stock = live[d.invName]
    } else if (Object.prototype.hasOwnProperty.call(dft, d.invName)) {
      stock = dft[d.invName]
      usedBaseline++
    } else {
      stock = 0
    }
    stockByTarget[d.target] = (stockByTarget[d.target] || 0) + stock * Number(d.factor)
  })

  var amount = 0
  Object.keys(stockByTarget).forEach(function (t) { amount += stockByTarget[t] * priceMap[t] })
  return {
    amount: round(amount, 2),
    counted: Object.keys(stockByTarget).length,
    skipped: skipped,
    usedBaseline: usedBaseline
  }
}

module.exports = {
  calcDishCost: calcDishCost,
  calcGrossProfit: calcGrossProfit,
  calcInventoryAmount: calcInventoryAmount,
  calcFullCost: calcFullCost,
  suggestPrice: suggestPrice,
  priceDiff: priceDiff,
  calcDishCostChain: calcDishCostChain,
  calcMenuStats: calcMenuStats,
  buildCategoryStats: buildCategoryStats,
  findCostAnomalies: findCostAnomalies,
  buildRepricingList: buildRepricingList,
  DISH_CATEGORY_ORDER: DISH_CATEGORY_ORDER,
  recalcAllDishes: recalcAllDishes,
  calcOrderSummary: calcOrderSummary,
  getGrossRateLevel: getGrossRateLevel,
  isHighCostMaterial: isHighCostMaterial,
  isLowStock: isLowStock,
  getStockStatus: getStockStatus,
  round: round,
  expandMealsToDishMap: expandMealsToDishMap,
  computeSalesRef: computeSalesRef,
  expandAdultBookingsToDishMap: expandAdultBookingsToDishMap,
  expandAdultBookingsWithSource: expandAdultBookingsWithSource,
  buildBookingMenuSummary: buildBookingMenuSummary,
  buildPurchasePlan: buildPurchasePlan,
  /**
   * 把实时库存单子（[{name,stock}]）与 SEED_INVENTORY_MAP（[{invName,target,factor}]）按 invName 合并，
   * 生成 buildPurchasePlan 可用的 invMap（[{target,factor,stock,src}]）。
   *
   * 🔴 2026-10-11 修复（用户报「鸡根没有看到库存」）：
   *   原第三分支写的是 `Number(d.stock) || 0`，注释说「实时库存取不到时回退映射定义里的默认 stock」，
   *   但 **SEED_INVENTORY_MAP 的 35 条条目里一条都没有 stock 字段**（默认值在**另一个数组**
   *   SEED_INVENTORY 里，键 = invName）⇒ 那句回退是**死代码，恒得 0**。
   *   后果：只要实时库存单子为空/缺项，「鸡根 / 鸡丝」这类**唯一靠联动取库存**的原料
   *   （mat_041 鸡根 自身 curStock=0、specQty=130、orderUnit=箱）当前库存直接显示 0，
   *   建议采购量变成全量采购 ⇒ 白花钱、也看不出是数据没读到。
   *   ⇒ 改为显式接收 invDefaults（传 SEED_INVENTORY）做兜底，并给每条打 `src`：
   *      'live'    实时单子里有这一项（**用户填的 0 也算，尊重实测值**）
   *      'default' 实时单子缺这一项 → 退回出厂基线
   *      'none'    两边都没有 → 0
   *   上层可据 `src` 提示「这份库存不是实时盘点数」。
   *
   * @param {Array} inventoryList 实时库存单子 [{name,stock}]（云端/本地镜像）
   * @param {Array} invMapDef     SEED_INVENTORY_MAP
   * @param {Array} [invDefaults] 兜底库存单子 [{name,stock}]，传 SEED_INVENTORY
   * @returns {Array} [{target,factor,stock,src}]
   */
  joinInventoryMap: function (inventoryList, invMapDef, invDefaults) {
    var stockByName = {}
    ;(inventoryList || []).forEach(function (it) {
      if (it && it.name != null) stockByName[it.name] = Number(it.stock) || 0
    })
    var defaultByName = {}
    ;(invDefaults || []).forEach(function (it) {
      if (it && it.name != null) defaultByName[it.name] = Number(it.stock) || 0
    })
    return (invMapDef || []).map(function (d) {
      if (Object.prototype.hasOwnProperty.call(stockByName, d.invName)) {
        return { target: d.target, factor: d.factor, stock: stockByName[d.invName], src: 'live' }
      }
      if (Object.prototype.hasOwnProperty.call(defaultByName, d.invName)) {
        return { target: d.target, factor: d.factor, stock: defaultByName[d.invName], src: 'default' }
      }
      return { target: d.target, factor: d.factor, stock: 0, src: 'none' }
    })
  },
}
