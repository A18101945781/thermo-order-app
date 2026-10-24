/**
 * withScrollAnchor —— 为页面统一接入"科奇头像滚动定位控件"
 *
 * 用法（页面 .js）：
 *   const { withScrollAnchor } = require('../../utils/scrollAnchor')
 *   Page(withScrollAnchor({
 *     ...原有配置...
 *     // 若是 scroll-view 主列表页，传 { mode: 'scrollview', scrollViewClass: '.order-scroll' }
 *   }))
 *
 * 页面 .wxml 根容器末尾加：
 *   <scroll-anchor show="{{showScrollAnchor}}" progress="{{scrollProgress}}" bind:totop="onScrollAnchorTop" />
 *
 * 说明：
 * - page 模式：依赖 onPageScroll（整页滚动）。onScrollAnchorTop 用 wx.pageScrollTo 回顶。
 * - scrollview 模式：主列表是 scroll-view，需在 scroll-view 上 bindscroll="onScroll"，
 *   并给 scroll-view 加 scroll-top="{{_saScrollTop}}"；onScrollAnchorTop 用受控 scrollTop 回顶。
 * - 原页面的 onShow 会被保留（包裹调用），其余生命周期不受影响。
 */

function getWinHeight() {
  try {
    if (wx.getWindowInfo) return wx.getWindowInfo().windowHeight
  } catch (e) {}
  try {
    return wx.getSystemInfoSync().windowHeight
  } catch (e) {
    return 667
  }
}

function withScrollAnchor(config, opts) {
  opts = opts || {}
  const mode = opts.mode === 'scrollview' ? 'scrollview' : 'page'
  const scrollViewClass = opts.scrollViewClass || '.order-scroll'
  const origOnShow = config.onShow

  // 合并 data：加入锚点所需字段
  const data = Object.assign({}, config.data, {
    _saWinH: 0,
    _saPageH: 0,
    scrollProgress: 0,
    showScrollAnchor: false
  })
  if (mode === 'scrollview') {
    data._saScrollTop = 0
  }

  function measure() {
    try {
      this._saWinH = getWinHeight()
      if (mode === 'page') {
        const q = wx.createSelectorQuery()
        q.select('.page').boundingClientRect((rect) => {
          if (rect && rect.height) this._saPageH = rect.height
        }).exec()
      }
    } catch (e) {}
  }

  function update(progress, show) {
    const p = Math.max(0, Math.min(100, Math.round(progress)))
    const changed =
      this.data.showScrollAnchor !== show ||
      Math.abs((this.data.scrollProgress || 0) - p) >= 1
    if (changed) this.setData({ scrollProgress: p, showScrollAnchor: show })
  }

  const onShow = function () {
    if (typeof origOnShow === 'function') origOnShow.apply(this, arguments)
    measure.call(this)
  }

  // page 模式：整页滚动
  const onPageScroll = function (e) {
    const winH = this._saWinH || getWinHeight()
    if (e && e.scrollHeight) this._saPageH = e.scrollHeight
    const total = this._saPageH || e.scrollHeight || 0
    const max = total - winH
    const pct = max > 0 ? (e.scrollTop / max) * 100 : 0
    const show = e.scrollTop > winH * 0.6
    update.call(this, pct, show)
  }

  // scrollview 模式：scroll-view 滚动
  // ⚠️ 性能关键（2026-09-12）：**绝不回写 _saScrollTop**。
  // 回写会与受控属性 scroll-top 形成回环：滚动 → setData(scrollTop) → 视图重定位 → 再触发 scroll …
  // 每次 setData 都要跨线程通信，高频触发会让滚动明显发黏/变慢。
  // 受控 scroll-top 只在「程序主动跳转」时设置（回顶 onScrollAnchorTop / 拖动 onScrollAnchorScrub）。
  const onScroll = function (e) {
    const winH = this._saWinH || getWinHeight()
    const detail = (e && e.detail) || {}
    const top = detail.scrollTop || 0
    const total = detail.scrollHeight || 0
    this._saScrollHeight = total // 缓存供 scrub 反算
    const max = total - winH
    const pct = max > 0 ? (top / max) * 100 : 0
    const show = top > winH * 0.6
    update.call(this, pct, show)   // 内部已节流：进度变化 <1% 不 setData
  }

  // 回顶
  const onScrollAnchorTop = function () {
    if (mode === 'scrollview') {
      // scroll-view 受控 scroll-top：先设极小值再设 0，确保触发回顶
      this.setData({ _saScrollTop: 0.1 })
      const self = this
      setTimeout(function () {
        self.setData({ _saScrollTop: 0 })
      }, 60)
    } else {
      wx.pageScrollTo({ scrollTop: 0, duration: 300 })
    }
  }

  // 拖动滑块：组件抛出 ratio(0~1)，反算滚动位置
  const onScrollAnchorScrub = function (e) {
    const detail = (e && e.detail) || {}
    let ratio = typeof detail.ratio === 'number' ? detail.ratio : 0
    ratio = Math.max(0, Math.min(1, ratio))
    const winH = this._saWinH || getWinHeight()
    const total = mode === 'scrollview' ? (this._saScrollHeight || 0) : (this._saPageH || 0)
    const max = total - winH
    const top = Math.max(0, ratio * max)
    if (mode === 'scrollview') {
      const cur = Number(this.data._saScrollTop) || 0
      const prog = Math.round(ratio * 100)
      if (Math.abs(cur - top) < 0.5) {
        // 目标与受控值几乎相同（如用户已手动滚到该处再拖回同一点）→ 值不变不会触发滚动
        // 先设一个微小偏移再设回目标，确保 scroll-view 真的跳转
        this.setData({ _saScrollTop: top > 0 ? top - 0.1 : 0.1, scrollProgress: prog })
        const self = this
        setTimeout(function () { self.setData({ _saScrollTop: top }) }, 20)
      } else {
        this.setData({ _saScrollTop: top, scrollProgress: prog })
      }
    } else {
      wx.pageScrollTo({ scrollTop: top, duration: 0 })
      this.setData({ scrollProgress: Math.round(ratio * 100) })
    }
  }

  const merged = Object.assign({}, config, {
    data: data,
    onShow: onShow,
    onScrollAnchorTop: onScrollAnchorTop,
    onScrollAnchorScrub: onScrollAnchorScrub
  })
  if (mode === 'scrollview') {
    merged.onScroll = onScroll
  } else {
    merged.onPageScroll = onPageScroll
  }
  return merged
}

module.exports = { withScrollAnchor, getWinHeight }
