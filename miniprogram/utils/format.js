/**
 * format.js — 格式化工具
 * 金额、数字、分类、时间、供应商、库存状态
 */

/** 金额格式化 → ¥12.34 */
function money(val) {
  val = Number(val) || 0
  return '¥' + val.toFixed(2)
}

/** 百分比 → 72.61% */
function percent(rate) {
  rate = Number(rate) || 0
  return (rate * 100).toFixed(1) + '%'
}

/** 保留两位小数 */
function decimal2(val) {
  val = Number(val) || 0
  return val.toFixed(2)
}

/** 数量+单位 → 0.5kg */
function quantity(val, unit) {
  val = Number(val) || 0
  unit = unit || ''
  return val + unit
}

/** 时间戳 → 2026-07-10 14:30 */
function time(ts, fmt) {
  if (!ts) return ''
  var d = new Date(ts)
  var Y = d.getFullYear()
  var M = String(d.getMonth() + 1).padStart(2, '0')
  var D = String(d.getDate()).padStart(2, '0')
  var h = String(d.getHours()).padStart(2, '0')
  var m = String(d.getMinutes()).padStart(2, '0')
  if (fmt === 'date') return Y + '-' + M + '-' + D
  return Y + '-' + M + '-' + D + ' ' + h + ':' + m
}

/** 时间戳 → "3分钟前" */
function timeAgo(ts) {
  if (!ts) return ''
  var diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return time(ts, 'date')
}

/**
 * 套餐类型 → 展示名称
 * 默认原样显示分类值（团队套餐/SOP/单品）。
 * 若以后要给某个分类换展示名，在 labels 里加一条即可，
 * 界面 wxml 里的静态标签需同步修改。
 */
function packageLabel(type) {
  var labels = {
    // '团队套餐': '鱼香肉丝',  // 如需改名，取消注释并同步 wxml 标签
  }
  return labels[type] || type || ''
}

/** 套餐类型 → 颜色 */
function packageColor(type) {
  var colors = {
    '团队套餐': '#FA5151',
    'SOP': '#8C6EEF',
    '单品': '#ED7B2F',
  }
  return colors[type] || '#999999'
}

/** 角色标签 */
function roleLabel(role) {
  var labels = {
    boss: '鲍勃',
    purchase: '采购',
    kitchen: '后厨',
  }
  return labels[role] || '未登录'
}

/** 供应商简称（去掉有限公司等后缀） */
function supplierShort(name) {
  if (!name) return '未分配'
  return name
    .replace('上海', '')
    .replace('实业有限公司', '')
    .replace('食品有限公司', '')
    .replace('有限公司', '')
    .trim()
}

/** 库存状态 */
function stockStatus(curStock, minStock) {
  curStock = Number(curStock) || 0
  minStock = Number(minStock) || 0
  if (minStock > 0 && curStock <= minStock) return { text: '不足', class: 'text-danger' }
  if (curStock === 0) return { text: '无', class: 'text-warning' }
  return { text: '正常', class: 'text-success' }
}

module.exports = {
  money: money,
  percent: percent,
  decimal2: decimal2,
  quantity: quantity,
  time: time,
  timeAgo: timeAgo,
  packageLabel: packageLabel,
  packageColor: packageColor,
  roleLabel: roleLabel,
  supplierShort: supplierShort,
  stockStatus: stockStatus,
}
