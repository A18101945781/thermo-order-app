/**
 * 成本看板 —— 成本核算方案 M7 模块
 * 依据：《热力学餐厅_成本核算小程序设计方案与SOP》V1.0
 *
 * 入口：我的 → 成本看板
 *   （底部 tabBar 已有 5 项、微信上限就是 5，故看板不走 tab）
 *
 * 数据全部**实时计算、不缓存**（方案纪律：成本一律实时重算）：
 *   storage.getDishList()       菜品 + 内嵌 BOM
 *   storage.getMaterialList()   原料主数据（全局唯一价格源）
 *   storage.getInventoryList()  库存单子
 *   seed.SEED_INVENTORY_MAP/_INVENTORY  库存映射表与出厂基线
 *   costParams.getCostParams()  集中假设参数
 */

const storage = require('../../utils/storage.js')
const calc = require('../../utils/calc.js')
const costParams = require('../../utils/costParams.js')
const seed = require('../../utils/seed.js')

/* 毛利率四档展示定义（方案 M7 口径） */
const BUCKET_DEF = [
  { key: 'good', label: '优秀 ≥85%', cls: 'b-good' },
  { key: 'ok',   label: '良好 80–85%', cls: 'b-ok' },
  { key: 'warn', label: '达标 70–80%', cls: 'b-warn' },
  { key: 'low',  label: '偏低 <70%',  cls: 'b-low' }
]

/** 百分比文本 → 小数；非法返回 null */
function pctToRate(s) {
  var n = parseFloat(s)
  if (!isFinite(n) || n < 0 || n > 100) return null
  return n / 100
}

/** 比率 → 展示文本（去掉多余 0） */
function rateToPct(r) {
  return String(parseFloat((Number(r) * 100).toFixed(2)))
}

/** 时间戳 → "10/13 15:24" */
function fmtLogTime(ts) {
  var d = new Date(Number(ts) || 0)
  var pad = function (n) { return n < 10 ? '0' + n : String(n) }
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

Page({
  data: {
    loading: true,
    errMsg: '',

    /* 假设参数（展示用） */
    paramChips: [],
    paramsAllDefault: false,

    /* 指标 */
    stats: null,
    buckets: [],
    catRows: [],
    raiseRows: [],
    raiseShown: [],
    raiseLimit: 5,
    anomalyRows: [],
    anomalyShown: [],
    anomalyLimit: 5,
    anomalyByType: [],
    priceLogRows: [],
    inv: null,

    /* 假设参数弹层 */
    showParamDlg: false,
    editParam: {}
  },

  onLoad() {
    this.reload()
  },

  onShow() {
    /* 从别处改完原料价 / 配方回来，必须重算（成本一律实时重算） */
    if (this._loaded) this.reload()
  },

  onPullDownRefresh() {
    var self = this
    this.reload().then(function () {
      wx.stopPullDownRefresh()
      wx.showToast({ title: '已刷新', icon: 'none' })
    }).catch(function () {
      wx.stopPullDownRefresh()
    })
  },

  /* ============================================================
     数据加载 + 计算
     ============================================================ */
  reload() {
    var self = this
    var params = costParams.getCostParams()
    return Promise.all([
      storage.getDishList(),
      storage.getMaterialList(),
      storage.getInventoryList(),
      storage.getPriceLogList({ limit: 20 })
    ]).then(function (res) {
      self._loaded = true
      self.build(res[0] || [], res[1] || [], res[2] || [], params, res[3] || [])
    }).catch(function (e) {
      self.setData({
        loading: false,
        errMsg: (e && e.message) || '数据读取失败，请下拉重试'
      })
      return Promise.reject(e)
    })
  },

  build(dishes, materials, inventory, params, priceLogs) {
    /* 库存结存金额（factor 缺失的映射条目不参与汇总） */
    var inv = calc.calcInventoryAmount(
      inventory, seed.SEED_INVENTORY_MAP, materials, seed.SEED_INVENTORY
    )

    var stats = calc.calcMenuStats(dishes, materials, params, {
      materialCount: materials.length,
      inventoryAmount: inv.amount
    })

    /* 展示用派生字段：wxml 里不做运算，避免浮点尾巴漏到界面上 */
    stats = Object.assign({}, stats, {
      avgGrossRateText: (stats.avgGrossRate * 100).toFixed(1) + '%',
      avgBomCostText: stats.avgBomCost.toFixed(2),
      avgFullCostText: stats.avgFullCost.toFixed(2),
      raiseTotalText: stats.raiseTotal.toFixed(2),
      inventoryAmountText: inv.amount.toFixed(2)
    })

    /* 四档分布 */
    var buckets = BUCKET_DEF.map(function (b) {
      var n = stats.buckets[b.key] || 0
      return {
        key: b.key,
        label: b.label,
        cls: b.cls,
        count: n,
        pct: stats.pricedCount ? Math.round(n / stats.pricedCount * 100) : 0
      }
    })

    /* 分类对比 */
    var catRows = calc.buildCategoryStats(dishes, materials, params).map(function (r) {
      var lv = calc.getGrossRateLevel(r.avgGrossRate, params)
      return {
        category: r.category,
        count: r.count,
        avgFullCost: r.avgFullCost,
        rateText: (r.avgGrossRate * 100).toFixed(1) + '%',
        lowCount: r.lowCount,
        levelText: lv.level,
        levelClass: lv.class
      }
    })

    /* 建议调价清单 */
    var raiseRows = calc.buildRepricingList(dishes, materials, params).map(function (r) {
      return {
        dishId: r.dishId,
        dishName: r.dishName,
        dishCategory: r.dishCategory,
        fullCost: r.fullCost.toFixed(2),
        sellPrice: r.sellPrice.toFixed(2),
        suggestPrice: r.suggestPrice.toFixed(2),
        diffText: '+' + r.diff.toFixed(2),
        diffRateText: '+' + (r.diffRate * 100).toFixed(1) + '%',
        levelText: r.level,
        levelClass: r.levelClass
      }
    })

    /* 异常清单 */
    var anomalyRows = calc.findCostAnomalies(dishes, materials)
    var typeMap = {}
    anomalyRows.forEach(function (a) {
      if (!typeMap[a.typeText]) {
        typeMap[a.typeText] = { text: a.typeText, count: 0, severity: a.severity }
      }
      typeMap[a.typeText].count++
    })
    var anomalyByType = Object.keys(typeMap).map(function (k) { return typeMap[k] })
      .sort(function (a, b) { return b.count - a.count })

    /* 最近调价（方案 M5 留痕） */
    var priceLogRows = (priceLogs || []).map(function (r) {
      var from = Number(r.fromPrice) || 0
      var to = Number(r.toPrice) || 0
      return {
        _id: r._id,
        name: r.name,
        fromText: '¥' + from.toFixed(2),
        toText: '¥' + to.toFixed(2),
        up: to > from,
        deltaText: from > 0
          ? ((to >= from ? '+' : '') + (Number(r.deltaPct) * 100).toFixed(1) + '%')
          : '首次定价',
        timeText: fmtLogTime(r.time)
      }
    })

    /* 假设参数 chips */
    var paramChips = [
      { label: '损耗率', value: rateToPct(params.lossRate) + '%' },
      { label: '人工分摊', value: params.laborPerPortion > 0 ? ('¥' + params.laborPerPortion + '/份') : '不计入' },
      { label: '目标毛利率', value: rateToPct(params.targetGrossRate) + '%' },
      { label: '预警线', value: rateToPct(params.warnRate) + '%' },
      { label: '优秀线', value: rateToPct(params.goodRate) + '%' }
    ]

    this.setData({
      loading: false,
      errMsg: '',
      stats: stats,
      buckets: buckets,
      catRows: catRows,
      raiseRows: raiseRows,
      raiseShown: raiseRows.slice(0, this.data.raiseLimit),
      anomalyRows: anomalyRows,
      anomalyShown: anomalyRows.slice(0, this.data.anomalyLimit),
      anomalyByType: anomalyByType,
      priceLogRows: priceLogRows,
      inv: inv,
      paramChips: paramChips,
      paramsAllDefault: costParams.isDefaultCostParams()
    })
  },

  /* ============================================================
     列表展开
     ============================================================ */
  moreRaise() {
    this.setData({ raiseLimit: 999, raiseShown: this.data.raiseRows.slice(0, 999) })
  },

  moreAnomaly() {
    this.setData({ anomalyLimit: 999, anomalyShown: this.data.anomalyRows.slice(0, 999) })
  },

  /* ============================================================
     假设参数弹层
     ============================================================ */
  openParams() {
    var p = costParams.getCostParams()
    this.setData({
      showParamDlg: true,
      editParam: {
        lossRatePct: rateToPct(p.lossRate),
        laborPerPortion: String(p.laborPerPortion),
        targetGrossRatePct: rateToPct(p.targetGrossRate),
        warnRatePct: rateToPct(p.warnRate),
        goodRatePct: rateToPct(p.goodRate)
      }
    })
  },

  closeParams() {
    this.setData({ showParamDlg: false })
  },

  onParamInput(e) {
    var k = e.currentTarget.dataset.k
    var patch = {}
    patch['editParam.' + k] = e.detail.value
    this.setData(patch)
  },

  saveParams() {
    var e = this.data.editParam
    var loss = pctToRate(e.lossRatePct)
    var target = pctToRate(e.targetGrossRatePct)
    var warn = pctToRate(e.warnRatePct)
    var good = pctToRate(e.goodRatePct)
    var labor = parseFloat(e.laborPerPortion)

    if (loss === null || target === null || warn === null || good === null) {
      wx.showToast({ title: '比率请填 0–100 之间的数字', icon: 'none' })
      return
    }
    if (!isFinite(labor) || labor < 0) {
      wx.showToast({ title: '人工分摊请填不小于 0 的数字', icon: 'none' })
      return
    }
    if (target >= 1) {
      wx.showToast({ title: '目标毛利率不能 ≥ 100%（公式无解）', icon: 'none' })
      return
    }
    if (warn >= good) {
      wx.showToast({ title: '预警线要低于优秀线', icon: 'none' })
      return
    }

    costParams.saveCostParams({
      lossRate: loss,
      laborPerPortion: labor,
      targetGrossRate: target,
      warnRate: warn,
      goodRate: good
    })
    this.setData({ showParamDlg: false })
    wx.showToast({ title: '已保存，正在重算', icon: 'none' })
    this.reload()
  },

  resetParams() {
    var self = this
    wx.showModal({
      title: '还原默认假设',
      content: '将恢复为：损耗率 0%、人工分摊不计入、目标毛利率 82.9%、预警线 70%、优秀线 85%。',
      confirmText: '还原',
      success: function (r) {
        if (!r.confirm) return
        costParams.resetCostParams()
        self.setData({ showParamDlg: false })
        wx.showToast({ title: '已还原默认', icon: 'none' })
        self.reload()
      }
    })
  },

  /* 阻止面板内点击穿透到遮罩 */
  noop() {}
})
