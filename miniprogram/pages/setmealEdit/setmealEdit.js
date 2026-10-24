/**
 * 套餐组成设置页
 * 用途：成人套餐（category=团队）经常换菜，这里自己改「默认组成」，
 *      改完订货计算器 / 预定 / 备货生成全部立即按新组成走，不需要改代码、不需要升注入版本。
 * 原理：改动写入 storage 的 setMealOverrides 覆盖层（storage.saveSetMealOverride），
 *      读取时与 seed 基础套餐合并；每个套餐可单独「恢复默认」。
 */
const storage = require('../../utils/storage')

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

Page({
  data: {
    meals: [],            // 团队套餐（含 itemsView / totalCost / profit / grossRateText / _overridden）
    editingId: '',        // 当前正在编辑的套餐 _id，空 = 全部处于查看态
    editItems: [],        // 编辑中的组成 [{key,dishId,dishName,qty}]
    editPrice: 0,
    editCost: '0.00',
    editProfit: '0.00',
    editGrossText: '—',
    showPicker: false,
    pickerMode: 'add',    // add=添加菜 / replace=替换某一行
    pickerIdx: -1,
    searchKw: '',
    allDishes: [],        // 可选菜品 [{_id,dishName,costText}]
    filteredDishes: []
  },

  onLoad() {
    this.loadAll()
  },

  onShow() {
    // 编辑中不刷新，避免把用户未保存的改动冲掉
    if (!this.data.editingId) this.loadAll()
  },

  // ===== 数据加载 =====
  loadAll() {
    Promise.all([
      storage.getSetMealList(),
      storage.getDishList()
    ]).then(res => {
      const meals = res[0] || []
      const dishes = res[1] || []

      const dishMap = {}
      dishes.forEach(d => { dishMap[d._id] = d })
      this._dishMap = dishMap

      // 可选菜品：全部菜品（SOP 组件 + 单品），按名称排序
      const opts = dishes.map(d => ({
        _id: d._id,
        dishName: d.dishName || d._id,
        packageType: d.packageType || '',
        costText: round2(d.totalCost).toFixed(2)
      }))
      opts.sort((a, b) => (a.dishName > b.dishName ? 1 : (a.dishName < b.dishName ? -1 : 0)))

      // 只管成人套餐（团队），按价格升序
      const team = meals.filter(m => m && m.category === '团队')
      team.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))

      const view = team.map(m => {
        const r = this._calcItems(m.items || [], m.price)
        return Object.assign({}, m, {
          itemsView: r.rows,
          totalCost: r.cost.toFixed(2),
          profit: r.profit.toFixed(2),
          grossRateText: r.grossText
        })
      })

      this.setData({ meals: view, allDishes: opts, filteredDishes: opts })
    }).catch(e => {
      console.error('[setmealEdit] 加载失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  /** 按组成算成本/利润/毛利（菜品成本取 dish.totalCost） */
  _calcItems(items, price) {
    const dishMap = this._dishMap || {}
    let cost = 0
    const rows = (items || []).map((it, i) => {
      const d = dishMap[it.dishId] || {}
      const qty = Number(it.qty) || 1
      const unit = Number(d.totalCost) || 0
      const c = unit * qty
      cost += c
      return {
        key: it.dishId + '_' + i,
        dishId: it.dishId,
        dishName: d.dishName || it.dishId,
        qty: qty,
        unitCost: round2(unit).toFixed(2),
        cost: round2(c).toFixed(2),
        missing: !d.dishName          // 菜品已被删/改名时标出来
      }
    })
    cost = round2(cost)
    const p = Number(price) || 0
    const profit = round2(p - cost)
    const grossText = p > 0 ? (Math.round((profit / p) * 1000) / 10) + '%' : '—'
    return { rows: rows, cost: cost, profit: profit, grossText: grossText }
  },

  _refreshEditCalc(items, price) {
    const r = this._calcItems(items, price)
    this.setData({
      editCost: r.cost.toFixed(2),
      editProfit: r.profit.toFixed(2),
      editGrossText: r.grossText
    })
  },

  // ===== 编辑态切换 =====
  onStartEdit(e) {
    const id = e.currentTarget.dataset.id
    const meal = this.data.meals.filter(m => m._id === id)[0]
    if (!meal) return
    const dishMap = this._dishMap || {}
    const items = (meal.items || []).map((it, i) => ({
      key: 'k' + i + '_' + Date.now(),
      dishId: it.dishId,
      qty: Number(it.qty) || 1,
      dishName: (dishMap[it.dishId] || {}).dishName || it.dishId
    }))
    this.setData({ editingId: id, editItems: items, editPrice: Number(meal.price) || 0 })
    this._refreshEditCalc(items, meal.price)
  },

  onCancelEdit() {
    this.setData({ editingId: '', editItems: [], showPicker: false })
  },

  // ===== 组成增删改 =====
  onQtyStep(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const delta = Number(e.currentTarget.dataset.delta)
    const items = this.data.editItems.slice()
    if (idx < 0 || idx >= items.length) return
    const next = (Number(items[idx].qty) || 1) + delta
    if (next < 1) { wx.showToast({ title: '数量最少 1，可点「删」移除', icon: 'none' }); return }
    if (next > 20) { wx.showToast({ title: '单菜数量上限 20', icon: 'none' }); return }
    items[idx] = Object.assign({}, items[idx], { qty: next })
    this.setData({ editItems: items })
    this._refreshEditCalc(items, this.data.editPrice)
  },

  onRemoveItem(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const items = this.data.editItems.slice()
    if (idx < 0 || idx >= items.length) return
    if (items.length <= 1) { wx.showToast({ title: '至少保留 1 道菜', icon: 'none' }); return }
    items.splice(idx, 1)
    this.setData({ editItems: items })
    this._refreshEditCalc(items, this.data.editPrice)
  },

  onReplaceItem(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({
      showPicker: true, pickerMode: 'replace', pickerIdx: idx,
      searchKw: '', filteredDishes: this.data.allDishes
    })
  },

  onAddItem() {
    this.setData({
      showPicker: true, pickerMode: 'add', pickerIdx: -1,
      searchKw: '', filteredDishes: this.data.allDishes
    })
  },

  // ===== 选菜弹窗 =====
  onSearchInput(e) {
    const kw = ((e.detail && e.detail.value) || '').trim()
    const list = kw
      ? this.data.allDishes.filter(d => (d.dishName || '').indexOf(kw) >= 0)
      : this.data.allDishes
    this.setData({ searchKw: kw, filteredDishes: list })
  },

  onPickDish(e) {
    const id = e.currentTarget.dataset.id
    const d = (this._dishMap || {})[id]
    if (!d) return
    const items = this.data.editItems.slice()
    if (this.data.pickerMode === 'replace' && this.data.pickerIdx >= 0) {
      const old = items[this.data.pickerIdx] || {}
      items[this.data.pickerIdx] = {
        key: 'k' + Date.now(), dishId: id, dishName: d.dishName || id, qty: Number(old.qty) || 1
      }
    } else {
      if (items.some(x => x.dishId === id)) {
        wx.showToast({ title: '该菜已在套餐中，改数量即可', icon: 'none' })
        return
      }
      items.push({ key: 'k' + Date.now(), dishId: id, dishName: d.dishName || id, qty: 1 })
    }
    this.setData({ editItems: items, showPicker: false })
    this._refreshEditCalc(items, this.data.editPrice)
  },

  onPickerCancel() {
    this.setData({ showPicker: false })
  },

  /** 原生弹层面板用：catchtap 阻止冒泡（点面板内部不会关掉弹窗） */
  onNoop() {},

  // ===== 保存 / 恢复默认 =====
  onSaveEdit() {
    const id = this.data.editingId
    const items = this.data.editItems
    if (!id) return
    if (!items.length) { wx.showToast({ title: '至少保留 1 道菜', icon: 'none' }); return }
    const payload = items.map(it => ({ dishId: it.dishId, qty: Number(it.qty) || 1 }))
    const desc = items.map(it => it.dishName + ((Number(it.qty) || 1) > 1 ? '×' + it.qty : '')).join(' + ')
    storage.saveSetMealOverride(id, { items: payload, desc: desc }).then(() => {
      this.setData({ editingId: '', editItems: [] })
      this.loadAll()
      wx.showToast({ title: '已保存，全局生效', icon: 'success' })
    }).catch(e => {
      console.error('[setmealEdit] 保存失败', e)
      wx.showToast({ title: '保存失败', icon: 'error' })
    })
  },

  onReset(e) {
    const id = e.currentTarget.dataset.id
    const meal = this.data.meals.filter(m => m._id === id)[0]
    wx.showModal({
      title: '恢复默认组成',
      content: '将「' + ((meal && meal.name) || id) + '」恢复为系统默认组成，你在这里改过的换菜会被清除。',
      confirmText: '恢复默认',
      confirmColor: '#FA5151',
      success: res => {
        if (!res.confirm) return
        storage.clearSetMealOverride(id).then(() => {
          this.setData({ editingId: '', editItems: [] })
          this.loadAll()
          wx.showToast({ title: '已恢复默认', icon: 'success' })
        })
      }
    })
  }
})
