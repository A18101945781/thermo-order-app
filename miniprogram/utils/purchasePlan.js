/**
 * 采购单文本构建工具
 * 把"按供应商分组的采购明细"渲染成与小程序预览弹窗一致的纯文本/CSV
 * 粘到 WPS/Excel 会自动按 Tab 分列、按空行分片
 *
 * 用法：
 *   const { buildFullCsv, buildSupplierSection } = require('../../utils/purchasePlan')
 *   const csv = buildFullCsv({
 *     title: '采购单预览 · 预定备货（2026-08-29）',
 *     fileName: '采购单_预定备货_2026-08-29_20260827.csv',
 *     groups: [{ supplier: '松食配送', materials: [...] }],
 *     totalMoney: 859.33,
 *     dateLabel: '2026-08-29',
 *     sourceLabel: '预定备货（订购+赠送）',  // 可选
 *   })
 */

/**
 * CSV 单元格转义（2026-10-11）
 *   - 字段含 半角逗号 / 双引号 / 换行 时用双引号包裹，内部 " → ""
 *   - 🔴 必须走这里再 join(',')：备注、规格都是**用户自由文本**，含一个半角逗号就会把整行顶偏一位
 *     （消费端 excel.js 的 csvLineToTsv 自 2026-10-06 起已按 CSV 规则解析引号）
 *   - 无特殊字符时返回值与原文完全一致 ⇒ 对既有数据零影响
 */
function csvCell(v) {
  const s = (v === null || v === undefined) ? '' : String(v)
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

/**
 * 构建单个供应商片区（不含顶部标题/文件名、不含底部总金额）
 * @param {Object} group { supplier, materials:[{name,unit,totalUseNum,curStock,suggestBuy,price,suggestCost}] }
 * @param {Object} opts { dateLabel, sourceLabel }
 */
function buildSupplierSection(group, opts) {
  opts = opts || {}
  const materials = (group && group.materials) || []
  const supplier = (group && group.supplier) || '未知供应商'
  const dateLabel = opts.dateLabel || ''
  const sourceLabel = opts.sourceLabel || ''

  let s = ''
  s += '供应商：' + supplier + '\n'
  if (dateLabel) s += '日期：' + dateLabel + '\n'
  if (sourceLabel) s += '来源：' + sourceLabel + '\n'
  s += '\n'
  // 🔴 8 列（2026-10-06 用户拍板两次改序）：
  //   ① 「建议采购」提前到第 3 位（供应商最关心「要买多少」）；
  //   ② 去掉「单位」列（用户要求「建议采购不要单位」）—— 单位信息已在建议采购量里
  //      （如「2kg」/「0箱」/「100块」），单独一列冗余。
  //   列序：序号 | 原料名称 | 建议采购量 | 总用量 | 备注 | 当前库存 | 单价 | 预估金额
  //   ⚠️ 表头、数据行、合计行、总金额行四处的列数/列序必须完全一致，否则 WPS 里整体错位一位。
  s += '序号,原料名称,建议采购量,总用量,备注,当前库存,单价,预估金额\n'

  let subtotal = 0
  materials.forEach(function (m, i) {
    // 品类分隔标题（如「蔬菜」「调料」），便于在 WPS 里按类查找、核对是否漏买
    if (m.catFirst && m.catName) {
      s += '【' + m.catName + '】\n'
    }
    // 建议采购量自带采购单位（如「100块」/「2kg」/「0箱」）；未配规格时 buyUnit 就是库存单位
    s += [
      i + 1,
      m.name,
      (m.suggestBuy || 0) + (m.buyUnit || ''),
      m.totalUseNum,
      m.specLabel || '',
      m.curStock,
      m.price,
      m.suggestCost
    ].map(csvCell).join(',') + '\n'
    subtotal += Number(m.suggestCost || 0)
  })
  // 7 个逗号 = 8 字段，与表头、数据行严格对齐（金额列在最后，前面 7 个字段全空）
  s += '\n合计,,,,,,,¥' + subtotal.toFixed(2) + '\n'
  return s
}

/**
 * 构建「散点菜单汇总」段落（放在原料明细之前）
 * 散点 = 订货计算器里直接填份数的菜（含套餐快捷区展开的菜），与「预定菜单汇总」互补
 * @param {Array} spotSummary [{ dishName, qty }]
 */
function buildSpotSummarySection(spotSummary) {
  if (!spotSummary || !spotSummary.length) return ''
  var s = '【散点菜单汇总】\n'
  s += '序号,菜品,份数\n'
  ;(spotSummary || []).forEach(function (d, i) {
    s += [i + 1, d.dishName, d.qty].join(',') + '\n'
  })
  s += '\n'
  return s
}

/**
 * 构建「预定菜单汇总」段落（放在原料明细之前）
 * 让复制 / 分享出去的采购单也能看到每单出了什么菜，便于核对原料数字来源
 * 🔴 10 列（2026-10-11 用户拍板加「备注」）：序号 | 日期 | 客源 | 套餐 | 备注 | 订购 | 赠送 | 实际出餐菜单 | 换菜 | 加菜
 *    备注 = 该单在预定里填的 typeRemark（如「12点左右吃饭」「258/桌」）；
 *    ⚠️ 表头、数据行两处列数/列序必须一致，且必须与 _gen_purchase_xlsx.py 的菜单汇总 Sheet 同步。
 * @param {Array} menuSummary calc.buildBookingMenuSummary() 的产物
 */
function buildMenuSummarySection(menuSummary) {
  if (!menuSummary || !menuSummary.length) return ''
  var s = '【预定菜单汇总】\n'
  s += '序号,日期,客源,套餐,备注,订购,赠送,实际出餐菜单,换菜,加菜\n'
  ;(menuSummary || []).forEach(function (m, i) {
    var menuTxt = (m.menu || []).map(function (d) {
      return d.dishName + '×' + d.qty
    }).join(' + ')
    var swapTxt = (m.swaps || []).map(function (sw) {
      return sw.from + '→' + sw.to + (sw.qty ? '×' + sw.qty : '（全换）')
    }).join(' ; ')
    var extraTxt = (m.extras || []).map(function (e) {
      return e.dishName + '×' + e.qty
    }).join(' + ')
    s += [i + 1, m.date, m.customer, m.setmealName, m.remark || '', m.orderQty, m.giftQty,
          menuTxt, swapTxt, extraTxt].map(csvCell).join(',') + '\n'
  })
  s += '\n'
  return s
}

/**
 * 构建完整的采购单文本（顶部 + 各供应商片区 + 底部总金额）
 * 粘到 WPS/Excel 表现：
 *   - 第一行为标题（粘到 A1，作为文件名备注）
 *   - 后续每片以"供应商：xxx"开头（粘到不同列，独立成块）
 *   - 字段分隔由 copyCSVAsTable 转成 Tab → 自动按列对齐
 *   - 最后一行"采购预估总金额 ¥XXX"作为整单合计
 *
 * @param {Object} opts
 *   - title {string} 顶部标题（弹窗标题）
 *   - fileName {string} 文件名（弹窗副标题）
 *   - groups {Array} 供应商分组数组
 *   - totalMoney {number} 整单总金额
 *   - dateLabel {string} 日期标签（每片"日期：xxx"用）
 *   - sourceLabel {string=} 来源标签（可选，每片"来源：xxx"用）
 *   - menuSummary {Array=} 预定菜单汇总（可选，有则在原料明细前插入一段）
 *   - spotSummary {Array=} 散点菜单汇总（可选，排在最前：散点 → 预定 → 原料明细）
 */
function buildFullCsv(opts) {
  opts = opts || {}
  const title = opts.title || '采购单预览'
  const fileName = opts.fileName || ''
  const groups = opts.groups || []
  const totalMoney = Number(opts.totalMoney || 0)
  const sectionOpts = {
    dateLabel: opts.dateLabel || '',
    sourceLabel: opts.sourceLabel || ''
  }

  let csv = ''
  // 顶部：标题 + 文件名
  csv += title + '\n'
  if (fileName) csv += '文件名：' + fileName + '\n'
  csv += '\n'

  // 散点菜单汇总（排最前：散点 → 预定 → 原料明细）
  if (opts.spotSummary && opts.spotSummary.length) {
    csv += buildSpotSummarySection(opts.spotSummary)
  }

  // 预定菜单汇总（在原料明细之前，便于核对每个原料数字来自哪道菜）
  if (opts.menuSummary && opts.menuSummary.length) {
    csv += buildMenuSummarySection(opts.menuSummary)
  }

  // 各供应商片区（空行分隔）
  groups.forEach(function (g, i) {
    if (i > 0) csv += '\n'
    csv += buildSupplierSection(g, sectionOpts)
  })

  // 底部：整单总金额（7 个逗号 = 8 字段，与表头 8 列对齐）
  csv += '\n'
  csv += '采购预估总金额,,,,,,,¥' + totalMoney.toFixed(2) + '\n'
  return csv
}

module.exports = {
  buildSupplierSection: buildSupplierSection,
  buildSpotSummarySection: buildSpotSummarySection,
  buildMenuSummarySection: buildMenuSummarySection,
  buildFullCsv: buildFullCsv
}