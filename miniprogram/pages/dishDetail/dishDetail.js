/**
 * 菜品详情页
 * 功能：查看/编辑菜品信息、BOM管理、成本汇总、原料选择弹窗
 */
const storage = require('../../utils/storage')
const calc = require('../../utils/calc')
const auth = require('../../utils/auth')
const nutrition = require('../../utils/nutrition')
const { withScrollAnchor } = require('../../utils/scrollAnchor')

Page(withScrollAnchor({
  data: {
    dishId: '',
    isNew: false,
    isEdit: false,
    sopMode: false,  // SOP 模板录入模式（?mode=sop 进入）
    dish: {
      _id: '',
      dishName: '',
      packageType: '单品',
      bomList: [],
      totalCost: 0,
      sellPrice: 0,
      grossRate: 0,
      profit: 0
    },
    sellPriceDisplay: '0',
    showAddPopup: false,
    materialSearch: '',
    availableMaterials: [],
    allMaterials: [],

    // 营养成分（每份成品，依据《中国食物成分表》第6版计算）
    nutri: null,
    nutriTips: [],
    nutriMissing: [],
    showNutriDetail: false
  },

  onLoad(options) {
    const canEditDish = auth.canEdit('dish')
    const sopMode = options.mode === 'sop'

    if (options._id) {
      // 查看/编辑已有菜品
      this.setData({ dishId: options._id, isNew: false, isEdit: canEditDish, sopMode })
      this.loadDish(options._id)
    } else {
      // 新建菜品
      const init = {
        isNew: true,
        isEdit: true,
        sopMode,
        dish: {
          _id: '',
          dishName: '',
          packageType: sopMode ? 'SOP' : '单品',
          bomList: [],
          totalCost: 0,
          sellPrice: sopMode ? 0 : 0,
          grossRate: 0,
          profit: 0
        },
        sellPriceDisplay: '0'
      }
      this.setData(init)
    }
  },

  /**
   * 加载菜品详情
   */
  loadDish(id) {
    storage.getDish(id).then(dish => {
      if (dish) {
        this.setData({
          dish,
          sellPriceDisplay: String(dish.sellPrice || 0)
        })
        this.refreshNutrition()
      } else {
        wx.showToast({ title: '菜品不存在', icon: 'none' })
      }
    }).catch(e => {
      console.error('加载菜品详情失败:', e)
    })
  },

  /**
   * 菜品名称输入
   */
  onDishNameInput(e) {
    this.setData({ 'dish.dishName': e.detail.value })
  },

  /**
   * 套餐类型切换
   */
  onPackageTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ 'dish.packageType': type })
  },

  /**
   * 售价输入（实时）
   */
  onSellPriceInput(e) {
    const val = e.detail.value
    this.setData({ sellPriceDisplay: val })
    this.recomputeCost()
  },

  /**
   * BOM用量变更（NumberInput blur后触发）
   */
  onBomUseNumChange(e) {
    const index = e.currentTarget.dataset.index
    const val = parseFloat(e.detail.value) || 0
    const bomList = this.data.dish.bomList
    // 创建新数组确保 setData 触发重渲染
    const newBomList = bomList.map(function(item, i) {
      if (i === index) {
        return {
          name: item.name,
          useNum: val,
          price: item.price,
          unit: item.unit,
          cost: parseFloat((val * item.price).toFixed(2))
        }
      }
      return item
    })
    this.setData({ 'dish.bomList': newBomList })
    this.recomputeCost()
  },

  /**
   * 售价变更（t-input change事件，兼容旧版）
   */
  onSellPriceChange(e) {
    const val = e.detail.value
    this.setData({ sellPriceDisplay: val })
    this.recomputeCost()
  },

  /**
   * 重新计算成本：基于当前BOM和售价
   */
  recomputeCost() {
    var dish = this.data.dish
    var sellPriceDisplay = this.data.sellPriceDisplay
    var sellPrice = parseFloat(sellPriceDisplay) || 0
    var totalCost = dish.bomList.reduce(function(sum, item) { return sum + (item.cost || 0) }, 0)

    var profit, grossRate
    if (calc.calcGrossProfit) {
      var result = calc.calcGrossProfit(sellPrice, totalCost)
      profit = result.profit
      grossRate = sellPrice > 0 ? (result.grossRate * 100) : 0
    } else {
      profit = sellPrice - totalCost
      grossRate = sellPrice > 0 ? ((profit / sellPrice) * 100) : 0
    }

    this.setData({
      'dish.totalCost': parseFloat(totalCost.toFixed(2)),
      'dish.sellPrice': parseFloat(sellPrice.toFixed(2)),
      'dish.grossRate': parseFloat(grossRate.toFixed(1)),
      'dish.profit': parseFloat(profit.toFixed(2))
    })

    // 配方变了，营养成分同步重算
    this.refreshNutrition()
  },

  /**
   * 重算营养成分
   * 依据《中国食物成分表》第6版，按 bomList 净投料量折算「每份成品」含量
   */
  refreshNutrition() {
    var dish = this.data.dish
    if (!dish || !dish.bomList || !dish.bomList.length) {
      this.setData({ nutri: null, nutriTips: [], nutriMissing: [] })
      return
    }

    var n = nutrition.calcDishNutrition(dish)
    var a = nutrition.analyze(n)

    this.setData({
      nutri: {
        energy: n.energy,
        protein: n.protein,
        fat: n.fat,
        cho: n.cho,
        sodium: n.sodium,
        totalGram: n.totalGram,
        saltGram: a ? a.saltGram : 0,
        nrv: a ? a.nrv : null,
        ratio: a ? a.ratio : null,
        items: n.items,
        estCount: n.estCount
      },
      nutriTips: a ? a.tips : [],
      nutriMissing: n.missing
    })
  },

  /**
   * 展开/收起逐原料营养明细
   */
  onToggleNutriDetail() {
    this.setData({ showNutriDetail: !this.data.showNutriDetail })
  },

  /**
   * 打开添加原料弹窗
   */
  onOpenAddMaterial() {
    const { dish } = this.data
    // 加载所有原料，排除已选中的
    storage.getMaterialList().then(allMaterials => {
      const usedNames = dish.bomList.map(b => b.name)
      const available = allMaterials.filter(m => !usedNames.includes(m.name))
      this.setData({
        allMaterials,
        availableMaterials: available,
        materialSearch: '',
        showAddPopup: true
      })
    }).catch(e => {
      console.error('加载原料列表失败:', e)
    })
  },

  /**
   * 搜索原料
   */
  onMaterialSearchChange(e) {
    const keyword = e.detail.value.toLowerCase()
    const { allMaterials, dish } = this.data
    const usedNames = dish.bomList.map(b => b.name)
    const filtered = allMaterials.filter(m =>
      !usedNames.includes(m.name) &&
      m.name.toLowerCase().includes(keyword)
    )
    this.setData({ materialSearch: keyword, availableMaterials: filtered })
  },

  /**
   * 添加原料到BOM
   */
  onAddBomItem(e) {
    const { name, price, unit } = e.currentTarget.dataset
    const { dish } = this.data

    // 避免重复添加
    if (dish.bomList.some(b => b.name === name)) {
      wx.showToast({ title: '该原料已添加', icon: 'none' })
      return
    }

    // 默认用量为1个单位
    const newItem = {
      name: name,
      useNum: 1,
      price: parseFloat(price) || 0,
      unit: unit,
      cost: parseFloat(price) || 0
    }

    const newBomList = [...dish.bomList, newItem]
    this.setData({ 'dish.bomList': newBomList, showAddPopup: false })
    this.recomputeCost()
  },

  /**
   * 移除BOM原料项
   */
  onRemoveBomItem(e) {
    const index = e.currentTarget.dataset.index
    const { dish } = this.data
    const newBomList = dish.bomList.filter((_, i) => i !== index)
    this.setData({ 'dish.bomList': newBomList })
    this.recomputeCost()
  },

  /** 原生弹层面板用：catchtap 阻止冒泡（点面板内部不会关掉弹窗） */
  onNoop() {},

  onClosePopup() {
    this.setData({ showAddPopup: false })
  },

  /**
   * 保存菜品
   */
  async onSaveDish() {
    const { dish, isNew, dishId } = this.data

    // 校验菜名
    if (!dish.dishName || !dish.dishName.trim()) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }
    // 校验BOM
    if (dish.bomList.length === 0) {
      wx.showToast({ title: '请至少添加一种原料', icon: 'none' })
      return
    }
    // 最终计算成本
    this.recomputeCost()

    const saveData = {
      dishName: dish.dishName.trim(),
      packageType: dish.packageType,
      bomList: dish.bomList,
      totalCost: dish.totalCost,
      sellPrice: dish.sellPrice,
      grossRate: dish.grossRate,
      profit: dish.profit
    }

    try {
      if (isNew) {
        await storage.addDish(saveData)
      } else {
        await storage.updateDish(dishId, saveData)
      }
      wx.showToast({ title: isNew ? '菜品创建成功' : '菜品保存成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (e) {
      console.error('保存菜品失败:', e)
      wx.showToast({ title: '保存失败', icon: 'error' })
    }
  }
}))
