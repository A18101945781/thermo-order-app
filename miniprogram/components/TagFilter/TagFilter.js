/**
 * TagFilter 标签筛选组件
 * 水平滚动的标签筛选器，点击切换激活状态
 * Props: tags(Array), active(String), title(String, optional display label)
 * Event: change → emits raw tag string
 */
Component({
  properties: {
    tags: { type: Array, value: [] },
    active: { type: String, value: '' },
    title: { type: String, value: '' },
  },

  methods: {
    onTagTap(e) {
      var tag = e.currentTarget.dataset.tag
      var newTag = tag === this.properties.active ? '' : tag
      // 直接 emit 原始字符串，方便页面直接使用 e.detail
      this.triggerEvent('change', newTag)
    },
  },
})
