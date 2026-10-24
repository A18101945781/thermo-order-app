/**
 * 历史订货记录报表页
 * 功能：日期范围筛选、订单卡片列表、展开原料明细、分页加载
 */
const storage = require('../../utils/storage')
const format = require('../../utils/format')
const { withScrollAnchor } = require('../../utils/scrollAnchor')

const PAGE_SIZE = 10

Page(withScrollAnchor({
  data: {
    startDate: '',
    endDate: '',
    orderList: [],
    expandedId: '',
    allOrders: [],
    page: 1,
    hasMore: false,
    loading: true
  },

  onShow() {
    this.loadOrders()
  },

  /**
   * 加载订单数据
   */
  loadOrders() {
    this.setData({ loading: true, page: 1, expandedId: '' })
    const dateRange = this.buildDateRange()
    storage.getOrderList(1, PAGE_SIZE, dateRange).then(result => {
      const orders = this.formatOrderList(result.list || result || [])
      this.setData({
        allOrders: orders,
        orderList: orders.slice(0, PAGE_SIZE),
        hasMore: orders.length > PAGE_SIZE,
        page: 1
      })
    }).catch(e => {
      console.error('加载订单记录失败:', e)
      this.setData({ orderList: [], hasMore: false })
    }).then(() => {
      this.setData({ loading: false })
    })
  },

  /**
   * 格式化订单列表：添加显示字段
   */
  formatOrderList(list) {
    if (!Array.isArray(list)) return []
    return list.map(order => ({
      ...order,
      createTimeStr: format.time ? format.time(order.createTime, 'YYYY-MM-DD HH:mm') : new Date(order.createTime).toLocaleString(),
      dishCount: order.orderNum ? order.orderNum.reduce((s, o) => s + (o.count || 0), 0) : 0
    }))
  },

  /**
   * 构建日期范围筛选参数
   */
  buildDateRange() {
    const { startDate, endDate } = this.data
    if (!startDate && !endDate) return undefined
    const range = {}
    if (startDate) range.start = new Date(startDate + ' 00:00:00').getTime()
    if (endDate) range.end = new Date(endDate + ' 23:59:59').getTime()
    return range
  },

  /**
   * 选择开始日期
   */
  onPickStartDate() {
    wx.showModal({
      title: '输入开始日期',
      editable: true,
      placeholderText: '如 2025-01-01',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({ startDate: res.content.trim() })
          this.loadOrders()
        }
      }
    })
  },

  /**
   * 选择结束日期
   */
  onPickEndDate() {
    wx.showModal({
      title: '输入结束日期',
      editable: true,
      placeholderText: '如 2025-12-31',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({ endDate: res.content.trim() })
          this.loadOrders()
        }
      }
    })
  },

  /**
   * 清除日期筛选
   */
  onClearDate() {
    this.setData({ startDate: '', endDate: '' })
    this.loadOrders()
  },

  /**
   * 展开/收起订单原料明细
   */
  onToggleExpand(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      expandedId: this.data.expandedId === id ? '' : id
    })
  },

  /**
   * 滚动到底部加载更多（分页）
   */
  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return

    this.setData({ loading: true })
    const nextPage = this.data.page + 1
    const { allOrders } = this.data

    setTimeout(() => {
      const newList = allOrders.slice(0, nextPage * PAGE_SIZE)
      this.setData({
        orderList: newList,
        page: nextPage,
        hasMore: allOrders.length > nextPage * PAGE_SIZE,
        loading: false
      })
    }, 300)
  }
}), { mode: 'scrollview', scrollViewClass: '.order-scroll' })
