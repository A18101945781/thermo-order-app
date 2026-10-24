/**
 * SearchBar 搜索栏组件
 * Props: value(String), placeholder(String)
 * Events: change(raw string), search(raw string), clear(), blur(raw string)
 */
Component({
  properties: {
    value: { type: String, value: '' },
    placeholder: { type: String, value: '搜索...' },
  },

  data: {
    innerValue: '',
  },

  observers: {
    'value'(newVal) {
      if (newVal !== this.data.innerValue) {
        this.setData({ innerValue: newVal || '' })
      }
    },
  },

  lifetimes: {
    attached() {
      this.setData({ innerValue: this.properties.value || '' })
    },
  },

  methods: {
    onInput(e) {
      var value = (e.detail && e.detail.value) || ''
      this.setData({ innerValue: value })
      this.triggerEvent('change', value)
      // 输入即实时搜索，IDE 模拟器无键盘 confirm 也能过滤
      this.triggerEvent('search', value.trim())
    },

    onSearch(e) {
      var value = (e.detail && e.detail.value) || this.data.innerValue
      this.triggerEvent('search', value.trim())
    },

    onBlur() {
      this.triggerEvent('blur', this.data.innerValue)
    },

    onClear() {
      this.setData({ innerValue: '' })
      this.triggerEvent('change', '')
      this.triggerEvent('clear')
    },
  },
})
