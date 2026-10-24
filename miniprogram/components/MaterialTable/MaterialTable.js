/**
 * MaterialTable 原料超级表格组件
 * 展示原料列表，固定表头，滚动浏览
 * 高成本原料红色显示，低库存红色报警
 * Props: list(Array), canEdit(Boolean), quickEditMode(Boolean)
 * Events: edit({item}), delete({item}), stockinput({item, value})
 */
var format = require('../../utils/format.js')
var calc = require('../../utils/calc.js')

Component({
  properties: {
    list: { type: Array, value: [] },
    canEdit: { type: Boolean, value: false },
    quickEditMode: { type: Boolean, value: false },
  },

  data: {
    displayList: [],
  },

  observers: {
    'list'(newList) {
      // 格式化显示数据
      var displayList = (newList || []).map(function(item) {
        var status = calc.getStockStatus(item)
        return Object.assign({}, item, {
          _priceText: format.money(item.price),
          _supplierShort: format.supplierShort(item.supplier),
          _isHighCost: calc.isHighCostMaterial(item.price),
          _isLowStock: calc.isLowStock(item),
          _statusText: status.text,
          _statusClass: status.class,
        })
      })
      this.setData({ displayList: displayList })
    },
  },

  methods: {
    onEdit(e) {
      // 快调模式下，整行不再响应点击弹窗，由 input 单独接事件
      if (this.properties.quickEditMode) return
      var index = e.currentTarget.dataset.index
      var item = this.properties.list[index]
      if (item) {
        this.triggerEvent('edit', { item: item })
      }
    },

    onDelete(e) {
      var index = e.currentTarget.dataset.index
      var item = this.properties.list[index]
      if (item) {
        this.triggerEvent('delete', { item: item })
      }
    },

    // 快调模式：库存输入事件（仅在 quickEditMode=true 时触发）
    onStockInput(e) {
      var index = e.currentTarget.dataset.index
      var item = this.properties.list[index]
      if (!item) return
      var raw = e.detail && e.detail.value !== undefined ? e.detail.value : ''
      var val = raw === '' || raw === null ? '' : String(raw).replace(/[^\d.]/g, '')
      this.triggerEvent('stockinput', { item: item, index: index, value: val })
    },
  },
})
