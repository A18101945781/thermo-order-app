/**
 * scroll-anchor 滚动定位锚点组件
 * 固定在右侧的竖向轨道 + 科奇圆形头像滑块（可上下拖动滚动，点击回顶）
 * - show / progress 由页面控制显隐与百分比
 * - 拖动：算出 ratio(0~1) 抛 scrub 事件，页面反算滚动位置
 * - 轻点（几乎不移动）：抛 totop 事件，页面回顶
 */
// 拖动灵敏度：拖动位移 ÷ 屏高 × GAIN 得到页面滚动比例。
// 1.0 = 拖满一屏才滚到底（原值，偏钝）；1.8 = 拖约 0.56 屏即到底（2026-09-27 用户要求更灵敏）
const DRAG_GAIN = 1.8

Component({
  properties: {
    // 是否显示锚点（一般滚过半屏后出现）
    show: {
      type: Boolean,
      value: false
    },
    // 滚动进度百分比 0~100
    progress: {
      type: Number,
      value: 0
    }
  },

  data: {
    dragging: false,
    // 拖动中 thumb 的百分比位置：由本组件**本地**计算并立即渲染
    // —— 不回环等页面滚动事件回传，所以能跟手（2026-09-27 修「拖动不跟手」）
    dragTop: 0,
    dragPct: 0   // 拖动中的整数百分比（气泡显示用，跟手）
  },

  lifetimes: {
    attached() {
      try {
        this._winH = wx.getWindowInfo ? wx.getWindowInfo().windowHeight : wx.getSystemInfoSync().windowHeight
      } catch (e) {
        this._winH = 667
      }
    }
  },

  methods: {
    onTs(e) {
      const y = (e.touches && e.touches[0] && e.touches[0].clientY) || 0
      this._startY = y
      this._startRatio = (this.data.progress || 0) / 100
      this._moved = false
      const p0 = Math.round(this._startRatio * 100)
      this.setData({ dragging: true, dragTop: this._startRatio * 100, dragPct: p0 })
    },

    onTm(e) {
      const y = (e.touches && e.touches[0] && e.touches[0].clientY) || 0
      const dy = ((y - this._startY) / (this._winH || 667)) * DRAG_GAIN
      let ratio = this._startRatio + dy
      ratio = Math.max(0, Math.min(1, ratio))
      if (Math.abs(y - this._startY) > 6) this._moved = true
      // ① 本地立即更新 thumb 位置（不等页面 scroll 事件回传）→ 跟手
      this.setData({ dragTop: ratio * 100, dragPct: Math.round(ratio * 100) })
      // ② 再通知页面真正滚动
      this.triggerEvent('scrub', { ratio: ratio })
    },

    onTe() {
      const self = this
      // 轻点（几乎没拖动）视为点击回顶
      if (!this._moved) {
        this.setData({ dragging: false })
        this.triggerEvent('totop')
        return
      }
      // 拖动结束：延后 ~80ms 再把位置交还给 progress
      // （等页面 scroll 事件回传，避免松手瞬间 thumb 回跳）
      setTimeout(function () {
        self.setData({ dragging: false })
      }, 80)
    }
  }
})
