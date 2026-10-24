/**
 * costParams.js — 成本核算「集中假设参数」
 *
 * 依据：《热力学餐厅_成本核算小程序设计方案与SOP》V1.0 第 M4 节 ——
 *   「依赖一组集中假设：综合损耗率、目标毛利率、毛利率预警线、优秀线、
 *     人工能耗分摊（元/份）。假设集中放在一处，公式只引用不写死。
 *     改假设，全表联动。」
 *
 * 🔴 铁律：任何页面 / 云函数要用到损耗率、目标毛利率、预警线、优秀线，
 *         一律从这里取，禁止在别处写死数字。
 *
 * 存储位置：本机 wx 本地缓存。
 *   这些是「经营假设」，不是业务数据（原料 / 菜品 / 订单），
 *   改动频率极低且属于本机决策，故不上云、不新增云函数。
 *
 * 单位约定：比率一律用小数（0.829 = 82.9%），只在页面展示时 ×100。
 */

var STORE_KEY = 'costParams'

/* 默认值 —— 2026-10-13 用户逐项拍板确定 */
var DEFAULTS = {
  // 综合损耗率：生鲜择洗 / 切配 / 报废统一并入该系数。
  // 用户拍板：先用 0（成本暂不加损耗），实测后再改这一处即可全表联动。
  lossRate: 0,

  // 人工 + 能耗分摊（元 / 份）。用户拍板：不计入，只看食材成本。
  // 日后若改为计入，把它设成每份金额即可：完全成本 = 配方成本 ×(1+损耗) + 本值。
  laborPerPortion: 0,

  // 目标毛利率基准：82.9%（取自在售菜品毛利率中位数，方案 7.2 建议值）
  targetGrossRate: 0.829,

  // 毛利率预警线 70%：低于此值标红，进「建议调价」清单
  warnRate: 0.70,

  // 毛利率优秀线 85%：达到或超过标绿
  goodRate: 0.85,

  // 外卖佣金：0 = 暂不计入（当前只做堂食口径）。
  // 日后若计入，需明确毛利率的堂食 / 外卖两套口径，故先留 0 占位。
  takeawayCommission: 0
}

/** 参数中文名（用于页面展示与改值提示，避免各处重复写文案） */
var LABELS = {
  lossRate: '综合损耗率',
  laborPerPortion: '人工能耗分摊',
  targetGrossRate: '目标毛利率',
  warnRate: '毛利率预警线',
  goodRate: '毛利率优秀线',
  takeawayCommission: '外卖佣金'
}

/**
 * 读取参数（自动与默认值合并，容错）
 * 本地缓存缺失 / 损坏 / 出现新字段时都不会拿到 undefined。
 * @returns {Object} 完整参数对象
 */
function getCostParams() {
  var saved = null
  try {
    saved = wx.getStorageSync(STORE_KEY)
  } catch (e) {
    saved = null
  }
  var out = {}
  Object.keys(DEFAULTS).forEach(function (k) {
    var v = saved && saved[k]
    // 只接受有限数值，其余（undefined / null / NaN / 字符串垃圾）一律回退默认值
    out[k] = (typeof v === 'number' && isFinite(v)) ? v : DEFAULTS[k]
  })
  return out
}

/**
 * 保存参数（局部更新，只覆盖传入的键）
 * @param {Object} patch - 如 { lossRate: 0.05 }
 * @returns {Object} 保存后的完整参数
 */
function saveCostParams(patch) {
  var cur = getCostParams()
  if (patch && typeof patch === 'object') {
    Object.keys(DEFAULTS).forEach(function (k) {
      var v = patch[k]
      if (typeof v === 'number' && isFinite(v)) cur[k] = v
    })
  }
  try {
    wx.setStorageSync(STORE_KEY, cur)
  } catch (e) {
    // 存储写失败不阻断计算：内存里的 cur 仍然可用
  }
  return cur
}

/**
 * 还原为出厂默认值
 * @returns {Object} 默认参数
 */
function resetCostParams() {
  try {
    wx.removeStorageSync(STORE_KEY)
  } catch (e) {
    // 忽略
  }
  return getCostParams()
}

/**
 * 参数是否处于「出厂全默认」状态（用于页面提示「你还没改过假设」）
 * @returns {boolean}
 */
function isDefaultCostParams() {
  var cur = getCostParams()
  return Object.keys(DEFAULTS).every(function (k) { return cur[k] === DEFAULTS[k] })
}

/** 取某个参数的中文名，未知键原样返回 */
function labelOf(key) {
  return LABELS[key] || key
}

module.exports = {
  DEFAULTS: DEFAULTS,
  LABELS: LABELS,
  getCostParams: getCostParams,
  saveCostParams: saveCostParams,
  resetCostParams: resetCostParams,
  isDefaultCostParams: isDefaultCostParams,
  labelOf: labelOf
}
