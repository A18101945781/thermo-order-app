/**
 * bizCalendar.js — 营业日历（2026-10-11 新增）
 *
 * 背景：本店 **每周一休息**，但国定假日里的周一照常营业。
 *   既定链路是「下单日 → 次日到货用料」，所以「明天」不能死算 今天+1：
 *   周日打开小程序时，死算出来的「明天」是空着的周一，
 *   备货看板 / 采购单默认日期 / 单据日期会一起指向一个没有预定的日子。
 *
 * 口径（2026-10-11 用户拍板）：
 *   - 休息日 = 周一（REST_WEEKDAYS），但若该日在「照常营业例外表」里则不休
 *   - **只顺延到下一个营业日，不做区间合并**：周日那单只为周二备料
 *     （周日当天营业要用的料，是周六那单已经订好的）
 *
 * ⚠️ 例外表默认留空 —— 国定节假日安排每年由国务院另行公布，
 *    **不预填、不猜测**。遇到「国定假日里含周一且照常营业」时，
 *    把那个日期（'YYYY-MM-DD'）加进 EXTRA_OPEN_DAYS 即可。
 *
 * 用法：
 *   bizCalendar.nextBizDay('2026-10-11')  → '2026-10-13'   （周日 → 跳过周一 → 周二）
 *   bizCalendar.nextBizDay('2026-10-10')  → '2026-10-11'   （周六 → 周日，不跳）
 *   bizCalendar.isRestDay('2026-10-12')   → true
 *   bizCalendar.label('2026-10-13')       → '10/13 周二'
 */

var REST_WEEKDAYS = [1]      // 0=周日, 1=周一 … 6=周六
var MAX_SEEK = 14            // 顺延最多往后找这么多天（连休不可能更久，防死循环）

/** 照常营业的例外日（国定假日里的周一等），格式 'YYYY-MM-DD' */
var EXTRA_OPEN_DAYS = []

var WD_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function pad2(n) { return (n < 10 ? '0' : '') + n }

/** Date → 'YYYY-MM-DD' */
function fmt(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

/** 'YYYY-MM-DD' → Date；iOS 不认 '-' 分隔，须换成 '/'；无效返回 null */
function parse(dateStr) {
  if (!dateStr) return null
  var d = new Date(String(dateStr).replace(/-/g, '/'))
  return isNaN(d.getTime()) ? null : d
}

/** 今天 'YYYY-MM-DD' */
function today() { return fmt(new Date()) }

/** 相对某日的偏移天数（days 可为负）；dateStr 空则相对今天 */
function offset(dateStr, days) {
  var d = parse(dateStr || today())
  if (!d) return ''
  d.setDate(d.getDate() + (days || 0))
  return fmt(d)
}

/** '周一'（无效日期返回 ''） */
function weekdayName(dateStr) {
  var d = parse(dateStr)
  return d ? WD_CN[d.getDay()] : ''
}

/** 是否休息日：周一休；落在照常营业例外表里的日子不休 */
function isRestDay(dateStr) {
  var d = parse(dateStr)
  if (!d) return false
  if (EXTRA_OPEN_DAYS.indexOf(String(dateStr)) >= 0) return false
  return REST_WEEKDAYS.indexOf(d.getDay()) >= 0
}

/** 从 dateStr 的**次日**起算的第一个营业日（dateStr 本身不参与判断） */
function nextBizDay(dateStr) {
  var base = dateStr || today()
  for (var i = 1; i <= MAX_SEEK; i++) {
    var d = offset(base, i)
    if (d && !isRestDay(d)) return d
  }
  return offset(base, 1)
}

/** 从 dateStr **当日**起算的第一个营业日（当天不休息就返回当天） */
function bizDayOnOrAfter(dateStr) {
  var base = dateStr || today()
  if (!isRestDay(base)) return base
  return nextBizDay(base)
}

/** '10/13 周二' */
function label(dateStr) {
  var d = parse(dateStr)
  if (!d) return String(dateStr || '')
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + WD_CN[d.getDay()]
}

/**
 * fromStr 与 toStr 之间被跳过的休息日（不含两端）
 * @returns {Array<String>} 如 ['2026-10-12']
 */
function skippedBetween(fromStr, toStr) {
  var out = []
  var start = parse(fromStr)
  var end = parse(toStr)
  if (!start || !end) return out
  var cur = new Date(start.getTime())
  cur.setDate(cur.getDate() + 1)
  var guard = 0
  while (cur.getTime() < end.getTime() && guard++ < 400) {
    var s = fmt(cur)
    if (isRestDay(s)) out.push(s)
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

/** 被跳过的休息日文字，如 '10/12 周一'；没有则 '' */
function skippedText(fromStr, toStr) {
  return skippedBetween(fromStr, toStr).map(label).join('、')
}

module.exports = {
  REST_WEEKDAYS: REST_WEEKDAYS,
  EXTRA_OPEN_DAYS: EXTRA_OPEN_DAYS,
  today: today,
  fmt: fmt,
  parse: parse,
  offset: offset,
  weekdayName: weekdayName,
  isRestDay: isRestDay,
  nextBizDay: nextBizDay,
  bizDayOnOrAfter: bizDayOnOrAfter,
  label: label,
  skippedBetween: skippedBetween,
  skippedText: skippedText
}
