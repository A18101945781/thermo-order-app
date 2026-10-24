/**
 * 原料超级表管理页
 * 功能：分类/供应商筛选、搜索、原料CRUD、Excel导入、库存预警
 */
const storage = require('../../utils/storage')
const auth = require('../../utils/auth')
const calc = require('../../utils/calc')
const excel = require('../../utils/excel')
const { withScrollAnchor } = require('../../utils/scrollAnchor')

// 供应商和分类常量（与 seed.js 中物料的 supplier 取值保持一致，否则筛选不到）
// 2026-09-08：上海诚惠食品有限公司 已并入 好生活（同一家公司）
const SUPPLIERS = ['全部', '好生活', '松食配送', '瑞淮', '赛大厨', '申美', '未知供应商']
const CATEGORIES = ['全部', '主食', '海鲜', '肉类', '蔬菜', '水果', '调料', '饮品', '甜品', '包装', '其他', '未分类']

Page(withScrollAnchor({
  data: {
    activeCategory: '全部',
    activeSupplier: '全部',
    searchText: '',
    allList: [],
    filteredList: [],
    loading: true,
    canEdit: false,

    // 标签筛选数据
    categoryTags: CATEGORIES,
    supplierTags: SUPPLIERS,

    // 编辑弹窗
    showEditPopup: false,
    isNewMaterial: false,
    editId: '',
    categoryIndex: 0,          // 原生 picker 需要的是「下标」
    editForm: {
      name: '', price: '', unit: '',
      category: '未分类', supplier: '松食配',
      initStock: '0', inStock: '0', outStock: '0',
      minStock: '0', remark: ''
    },

    // 下拉选项
    categoryOptions: CATEGORIES.filter(c => c !== '全部').map(c => ({ label: c, value: c })),
    supplierOptions: SUPPLIERS.filter(s => s !== '全部').map(s => ({ label: s, value: s })),

    // 批量设置供应商
    supplierImportVisible: false,
    supplierImportPreview: [],
    supplierImportStat: { matched: 0, unmatched: 0 },
    _supplierImportMap: {},

    // 库存快调模式
    quickEditMode: false,
    quickEditDirty: false,
    _quickEditChanges: {},
    _quickEditLeaving: false
  },

  onLoad() {
    this.setData({ canEdit: auth.canEdit('material') })
  },

  onShow() {
    this.loadData()
  },

  /**
   * 加载全部原料数据
   */
  loadData() {
    this.setData({ loading: true })
    storage.getMaterialList().then(list => {
      // 动态生成供应商筛选标签（去重，用全称，新供应商也能筛选）
      const supSet = {}
      list.forEach(function(m) { if (m.supplier) supSet[m.supplier] = true })
      const supplierTags = ['全部'].concat(Object.keys(supSet))
      this.setData({ allList: list, supplierTags: supplierTags })
      this.applyFilter()
    }).catch(e => {
      console.error('加载原料列表失败:', e)
    }).then(() => {
      this.setData({ loading: false })
    })
  },

  /**
   * 分类筛选变更
   */
  onCategoryChange(e) {
    this.setData({ activeCategory: e.detail })
    this.applyFilter()
  },

  /**
   * 供应商筛选变更
   */
  onSupplierChange(e) {
    // supplierTags 现已是供应商全称（动态聚合），直接使用
    this.setData({ activeSupplier: e.detail })
    this.applyFilter()
  },

  /**
   * 搜索处理
   */
  onSearch(e) {
    this.setData({ searchText: e.detail })
    this.applyFilter()
  },

  /**
   * 清除搜索
   */
  onSearchClear() {
    this.setData({ searchText: '' })
    this.applyFilter()
  },

  /**
   * 综合筛选
   */
  applyFilter() {
    const { activeCategory, activeSupplier, searchText, allList } = this.data
    let result = allList

    if (activeCategory !== '全部') {
      result = result.filter(m => m.category === activeCategory)
    }

    if (activeSupplier !== '全部') {
      result = result.filter(m => m.supplier === activeSupplier)
    }

    if (searchText) {
      const keyword = searchText.toLowerCase()
      // 同时搜索 名称/供应商/分类/备注，避免只搜名称导致"搜不出"
      result = result.filter(m =>
        (m.name || '').toLowerCase().includes(keyword) ||
        (m.supplier || '').toLowerCase().includes(keyword) ||
        (m.category || '').toLowerCase().includes(keyword) ||
        (m.remark || '').toLowerCase().includes(keyword)
      )
    }

    this.setData({ filteredList: result })
  },

  /**
   * 点击原料行 - 有编辑权限则打开编辑弹窗
   */
  onMaterialEdit(e) {
    if (!this.data.canEdit) {
      wx.showToast({ title: '需要老板权限才能编辑', icon: 'none' })
      return
    }
    const item = e.detail.item
    this.setData({
      isNewMaterial: false,
      editId: item._id,
      editForm: {
        name: item.name || '',
        price: String(item.price || ''),
        unit: item.unit || '',
        category: item.category || '未分类',
        supplier: item.supplier || '松食配',
        initStock: String(item.initStock ?? '0'),
        inStock: String(item.inStock ?? '0'),
        outStock: String(item.outStock ?? '0'),
        minStock: String(item.minStock ?? '0'),
        remark: item.remark || ''
      },
      categoryIndex: this._categoryIndexOf(item.category || '未分类'),
      showEditPopup: true
    })
  },

  /**
   * 新增原料
   */
  onAddMaterial() {
    if (!this.data.canEdit) return
    this.setData({
      isNewMaterial: true,
      editId: '',
      editForm: {
        name: '', price: '', unit: '',
        category: '未分类', supplier: '松食配',
        initStock: '0', inStock: '0', outStock: '0',
        minStock: '0', remark: ''
      },
      categoryIndex: this._categoryIndexOf('未分类'),
      showEditPopup: true
    })
  },

  /** 分类名 → picker 下标（找不到时回退到最后一项「未分类」） */
  _categoryIndexOf(name) {
    const arr = this.data.categoryOptions
    const idx = arr.findIndex(o => o.value === name)
    return idx >= 0 ? idx : arr.length - 1
  },

  /**
   * 编辑表单字段变更（原生 input 的 bindinput：值同样在 e.detail.value，
   * 与原 t-input 的 bind:change 结构一致，只有取值来源变了）
   */
  onEditFormChange(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({ [`editForm.${field}`]: String(e.detail.value) })
  },

  /**
   * 分类选择（原生 picker 的 bindchange 回传的是「下标」，不是值 → 需转成分类名）
   */
  onCategoryPick(e) {
    const idx = Number(e.detail.value)
    const opt = this.data.categoryOptions[idx]
    if (!opt) return
    this.setData({ 'editForm.category': opt.value, categoryIndex: idx })
  },

  /**
   * 保存原料
   */
  onSaveMaterial() {
    const { editForm, isNewMaterial, editId } = this.data
    const name = (editForm.name || '').trim()
    if (!name) {
      wx.showToast({ title: '请输入原料名称', icon: 'none' })
      return
    }
    if (!editForm.price || parseFloat(editForm.price) < 0) {
      wx.showToast({ title: '请输入有效单价', icon: 'none' })
      return
    }

    const initStock = parseFloat(editForm.initStock) || 0
    const inStock = parseFloat(editForm.inStock) || 0
    const outStock = parseFloat(editForm.outStock) || 0
    const curStock = initStock + inStock - outStock

    const data = {
      name: name,
      price: parseFloat(editForm.price),
      unit: editForm.unit || '',
      category: editForm.category || '未分类',
      supplier: editForm.supplier || '松食配',
      initStock: initStock,
      inStock: inStock,
      outStock: outStock,
      curStock: curStock,
      minStock: parseFloat(editForm.minStock) || 0,
      remark: editForm.remark || ''
    }

    const afterSave = () => {
      this.setData({ showEditPopup: false })
      this.loadData()
      wx.showToast({ title: isNewMaterial ? '新增成功' : '保存成功', icon: 'success' })
    }

    if (isNewMaterial) {
      storage.addMaterial(data).then(afterSave).catch(e => {
        console.error('保存原料失败:', e)
        wx.showToast({ title: '保存失败', icon: 'error' })
      })
    } else {
      storage.updateMaterial(editId, data).then(afterSave).catch(e => {
        console.error('保存原料失败:', e)
        wx.showToast({ title: '保存失败', icon: 'error' })
      })
    }
  },

  /**
   * 关闭编辑弹窗
   */
  onCloseEditPopup() {
    this.setData({ showEditPopup: false })
  },

  /** 原生弹层面板用：catchtap 阻止冒泡（点面板内部不会关掉弹窗） */
  onNoop() {},

  /**
   * Excel导入成功回调
   */
  onExcelImportSuccess(e) {
    // 组件内部已处理导入，刷新列表即可
    this.loadData()
    wx.showToast({ title: '导入完成', icon: 'success' })
  },

  /**
   * 批量设置供应商：选 CSV -> 解析 -> 预览（本地模式可用，不依赖云开发）
   * CSV 两列：原料名称,供应商（首行表头可含「原料」「供应商」字样，自动跳过）
   */
  onOpenSupplierImport() {
    if (!this.data.canEdit) return
    const that = this
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['csv', 'txt'],
      success(res) {
        const file = res.tempFiles[0]
        wx.getFileSystemManager().readFile({
          filePath: file.path,
          encoding: 'utf-8',
          success(r) {
            const rows = that._parseSupplierCSV(r.data)
            if (!rows.length) {
              wx.showToast({ title: '未解析到有效数据', icon: 'none' })
              return
            }
            that._buildSupplierPreview(rows)
          },
          fail(err) {
            console.error('读取文件失败:', err)
            wx.showToast({ title: '读取文件失败', icon: 'none' })
          }
        })
      },
      fail() {}
    })
  },

  /** 解析供应商 CSV 文本 */
  _parseSupplierCSV(text) {
    text = (text || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = text.split('\n').filter(function(l) { return l.trim() !== '' })
    const rows = []
    lines.forEach(function(line, idx) {
      // 跳过表头（首行含「原料」或「供应商」字样）
      if (idx === 0 && (line.indexOf('原料') !== -1 || line.indexOf('供应商') !== -1)) return
      const parts = line.split(',')
      const name = (parts[0] || '').trim()
      const supplier = (parts[1] || '').trim()
      if (name) rows.push({ name: name, supplier: supplier })
    })
    return rows
  },

  /** 用解析结果匹配现有原料，生成预览数据 */
  _buildSupplierPreview(rows) {
    const list = this.data.allList
    const normMap = {}
    const preview = []
    let unmatched = 0
    rows.forEach(function(r) {
      const key = r.name.trim().toLowerCase()
      normMap[key] = r.supplier
      const found = list.find(function(m) { return (m.name || '').trim().toLowerCase() === key })
      if (found) {
        preview.push({ name: found.name, oldSupplier: found.supplier || '（空）', newSupplier: r.supplier || '（空）', missing: false })
      } else {
        unmatched++
        preview.push({ name: r.name, oldSupplier: '（原料不存在）', newSupplier: r.supplier || '（空）', missing: true })
      }
    })
    this.setData({
      _supplierImportMap: normMap,
      supplierImportPreview: preview,
      supplierImportStat: { matched: preview.length - unmatched, unmatched: unmatched },
      supplierImportVisible: true
    })
  },

  /** 确认应用供应商更新 */
  onApplySupplierImport() {
    const that = this
    const map = this.data._supplierImportMap
    wx.showLoading({ title: '更新中...' })
    storage.batchUpdateSupplier(map).then(function(res) {
      wx.hideLoading()
      that.setData({ supplierImportVisible: false })
      that.loadData()
      wx.showToast({ title: '已更新 ' + res.matched + ' 条', icon: 'success' })
    }).catch(function(e) {
      wx.hideLoading()
      console.error('更新供应商失败:', e)
      wx.showToast({ title: '更新失败', icon: 'none' })
    })
  },

  onCloseSupplierImport() {
    this.setData({ supplierImportVisible: false })
  },

  // onSupplierImportPopupChange 已移除：t-popup 换成原生弹层后，关闭走遮罩 tap / 取消按钮

  /**
   * 库存快调模式：开/关
   * 进入时拍当前库存快照，离开时弹"未保存确认"
   */
  onToggleQuickEdit() {
    if (!this.data.canEdit) return
    if (this.data.quickEditMode) {
      // 已在快调模式 -> 等价于"取消"
      this.onCancelQuickEdit()
      return
    }
    // 进入快调
    const snap = {}
    this.data.filteredList.forEach(m => { snap[m._id] = m.curStock })
    this.setData({
      quickEditMode: true,
      quickEditDirty: false,
      _quickEditChanges: {}
    })
    this._quickEditSnapshot = snap
    wx.showToast({ title: '进入快调模式', icon: 'none', duration: 1200 })
  },

  /**
   * 库存输入事件（来自 MaterialTable）
   * 缓存在 _quickEditChanges，按 _id 累计
   */
  onQuickStockInput(e) {
    const { item, value } = e.detail || {}
    if (!item || !item._id) return
    const changes = Object.assign({}, this.data._quickEditChanges)
    changes[item._id] = { id: item._id, name: item.name, newStock: value }
    this.setData({ _quickEditChanges: changes, quickEditDirty: true })
  },

  /**
   * 保存快调：把每条改动作为新 initStock 覆盖 curStock
   * 计算口径：curStock = initStock + inStock - outStock
   * 令 newInitStock = newStock - (inStock - outStock)，覆盖即可
   */
  onSaveQuickEdit() {
    if (!this.data.canEdit) return
    const changes = this.data._quickEditChanges
    const keys = Object.keys(changes || {})
    if (!keys.length) {
      // 没改就直接退出
      this.setData({
        quickEditMode: false,
        quickEditDirty: false,
        _quickEditChanges: {}
      })
      this._quickEditLeaving = true
      wx.showToast({ title: '无修改', icon: 'none' })
      return
    }
    const list = this.data.allList
    const ops = []
    keys.forEach(id => {
      const ch = changes[id]
      const raw = ch.newStock
      const v = raw === '' || raw === null || raw === undefined ? NaN : Number(raw)
      if (isNaN(v) || v < 0) {
        // 跳过非法输入
        return
      }
      const m = list.find(x => x._id === id)
      if (!m) return
      const inS = Number(m.inStock || 0)
      const outS = Number(m.outStock || 0)
      const newInit = Math.max(0, v - (inS - outS))
      ops.push({ id: id, name: m.name, newInit: newInit, newStock: v })
    })
    if (!ops.length) {
      wx.showToast({ title: '无有效修改', icon: 'none' })
      return
    }
    this._quickEditLeaving = true
    wx.showLoading({ title: '保存中...' })
    Promise.all(ops.map(op =>
        storage.updateMaterial(op.id, {
          initStock: op.newInit,
          curStock: op.newStock
        }).catch(e => ({ _err: e, _id: op.id }))
      )).then(results => {
        wx.hideLoading()
        const fail = results.filter(r => r && r._err)
        this.setData({
          quickEditMode: false,
          quickEditDirty: false,
          _quickEditChanges: {}
        })
        this.loadData()
        if (fail.length) {
          wx.showToast({ title: '已保存 ' + (ops.length - fail.length) + '/' + ops.length, icon: 'none' })
        } else {
          wx.showToast({ title: '已保存 ' + ops.length + ' 条', icon: 'success' })
        }
      })
  },

  /**
   * 取消快调：直接退出（输入未持久化）
   */
  onCancelQuickEdit() {
    if (!this.data.quickEditMode && !this.data.quickEditDirty) return
    this._quickEditLeaving = true
    this.setData({
      quickEditMode: false,
      quickEditDirty: false,
      _quickEditChanges: {}
    })
    wx.showToast({ title: '已取消', icon: 'none', duration: 1200 })
  },

  /**
   * 未保存退出提醒
   */
  onUnload() {
    if (this.data.quickEditDirty && !this._quickEditLeaving) {
      wx.showModal({
        title: '有未保存的库存修改',
        content: '当前页面有 ' + Object.keys(this.data._quickEditChanges || {}).length + ' 条改动未提交，确定离开吗？',
        confirmText: '离开',
        cancelText: '继续编辑',
        success: (res) => {
          if (!res.confirm) {
            // 用户选继续编辑，标记可"留下"
            this._quickEditLeaving = false
          }
        }
      })
    }
  },

  /** 下载供应商模板：现有原料名 + 空供应商列，复制到剪贴板（粘到 Excel 填写后导入） */
  onDownloadSupplierTemplate() {
    const list = this.data.allList
    let csv = '原料名称,供应商\n'
    if (list.length > 0) {
      list.forEach(function(m) { csv += (m.name || '') + ',\n' })
    } else {
      csv += '牛腩,\n大米,好生活\n'
    }
    excel.copyCSVAsTable(csv).then(function() {
      wx.showToast({ title: '模板已复制，粘到Excel填写', icon: 'none', duration: 2500 })
    }).catch(function() {
      wx.showModal({ title: '供应商模板（CSV）', content: csv, showCancel: false })
    })
  },

  /**
   * 删除原料
   */
  onMaterialDelete(e) {
    if (!this.data.canEdit) return
    const item = e.detail.item
    var that = this
    wx.showModal({
      title: '确认删除',
      content: '确定要删除原料「' + item.name + '」吗？',
      success: function(res) {
        if (res.confirm) {
          storage.deleteMaterial(item._id).then(function() {
            wx.showToast({ title: '已删除', icon: 'success' })
            that.loadData()
          })
        }
      },
    })
  }
}))
