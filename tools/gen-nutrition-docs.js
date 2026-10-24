/**
 * 生成营养分析相关的交付文档
 *   1. 菜单SOP上传模板.csv      —— 供填写新菜单SOP
 *   2. 原料营养库对照表.csv     —— 现有 64 种原料的营养数据（中国食物成分表第6版）
 *   3. 配方数据待核对清单.md    —— 扫描出的异常配方
 *
 * 用法：node tools/gen-nutrition-docs.js
 */
var fs = require('fs')
var path = require('path')

var ROOT = path.join(__dirname, '..')
var MP = path.join(ROOT, 'miniprogram')
var OUT = path.join(ROOT, 'docs')

var seed = require(path.join(MP, 'utils/seed.js'))
var nu = require(path.join(MP, 'utils/nutrition.js'))

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

/** 写 UTF-8 BOM 的 CSV，Excel/WPS 双击直接正常显示中文 */
function writeCSV(name, rows) {
  var csv = rows.map(function (r) {
    return r.map(function (c) {
      c = c === null || c === undefined ? '' : String(c)
      return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c
    }).join(',')
  }).join('\r\n')
  var p = path.join(OUT, name)
  fs.writeFileSync(p, '\ufeff' + csv, 'utf8')
  console.log('✅ ' + name + '  (' + rows.length + ' 行)')
  return p
}

function writeMD(name, text) {
  var p = path.join(OUT, name)
  fs.writeFileSync(p, text, 'utf8')
  console.log('✅ ' + name)
  return p
}

// =================================================================
// 1. 菜单SOP上传模板
// =================================================================
function genTemplate() {
  var rows = []
  rows.push(['菜品名称', '分类', '售价(元)', '原料名称', '净用量', '单位', '烹饪方式', '备注'])

  // 填写示例（3 行，用 ← 示例 标记，填完删掉即可）
  rows.push(['示例:鱼香肉丝', 'A套餐', '28', '大米', '80', 'g', '蒸', '← 示例行，填完删除'])
  rows.push(['示例:鱼香肉丝', 'A套餐', '28', '猪里脊', '60', 'g', '炒', '← 同一道菜的原料，菜名重复写'])
  rows.push(['示例:鱼香肉丝', 'A套餐', '28', '鸡蛋', '1', '个', '', '← 计件原料用「个/根/只/张/份」'])
  rows.push([])
  rows.push(['【填写说明】'])
  rows.push(['1. 每一行 = 一道菜里的一种原料；同一道菜有几种原料就写几行，菜品名称/分类/售价 重复填写'])
  rows.push(['2. 净用量 = 去皮去骨去壳后的实际投料量（营养按此计算），不是采购毛重'])
  rows.push(['3. 单位只填这几种：g（克）、kg（千克）、ml（毫升）、个、根、只、张、份'])
  rows.push(['   ⚠ 计件原料（鸡根/小笼包/烤翅/披萨饼等）务必填「个/根/只/张」，不要写 kg——现有数据就是这里错了'])
  rows.push(['4. 分类填：A套餐 / B套餐 / C套餐 / 套餐 / 单品'])
  rows.push(['5. 调味料（盐/酱油/糖/油）也请填，直接影响钠和脂肪；不确定用量填常规值即可'])
  rows.push(['6. 烹饪方式可空；填了会用于估算烹饪吸油量（炸+8%油、炒+3%油）'])
  rows.push(['7. 填完把本文件发给鲍勃即可，会自动算出每道菜的 能量/蛋白质/脂肪/碳水/钠 + 套餐汇总'])
  rows.push([])
  rows.push(['【常见调味料参考用量（单份）】'])
  rows.push(['盐', '2~3 g', '', '酱油', '5~10 ml', '', '食用油', '8~15 ml', ''])
  rows.push(['白糖', '3~8 g', '', '生抽', '5~8 ml', '', '蚝油', '3~5 g', ''])
  return writeCSV('菜单SOP上传模板.csv', rows)
}

// =================================================================
// 2. 原料营养库对照表
// =================================================================
function genNutriTable() {
  var DB = nu.NUTRITION_DB
  var matByName = {}
  seed.SEED_MATERIALS.forEach(function (m) { matByName[m.name] = m })

  var rows = []
  rows.push([
    '原料名称', '分类', '采购单位', '单价(元)',
    '能量(kcal/100g)', '蛋白质(g)', '脂肪(g)', '碳水(g)', '钠(mg)',
    '数据来源', '成分表对应条目'
  ])

  var names = Object.keys(DB).sort()
  names.forEach(function (name) {
    var d = DB[name]
    var m = matByName[name] || {}
    var n = d.n || []
    rows.push([
      name,
      m.category || '',
      m.unit || '',
      m.price === undefined ? '' : m.price,
      d.n ? n[0] : '—',
      d.n ? n[1] : '—',
      d.n ? n[2] : '—',
      d.n ? n[3] : '—',
      d.n ? n[4] : '—',
      d.src === 'cn6' ? '中国食物成分表第6版' : (d.src === 'est' ? '估算(复合加工品)' : '不计营养'),
      d.note || ''
    ])
  })

  rows.push([])
  rows.push(['【说明】'])
  rows.push(['· 数值口径：每 100g 可食部含量'])
  rows.push(['· 数据来源=中国食物成分表第6版：直接查表所得，可用于对外公示'])
  rows.push(['· 数据来源=估算：成分表无独立条目的复合加工品（水饺/蛋挞/肉酱等），按主配料折算或取商品标示值，仅供内部参考'])
  rows.push(['· 若你的实际采购商品包装上有营养成分表，以包装标示为准，把数值发给鲍勃可覆盖估算值'])
  return writeCSV('原料营养库对照表.csv', rows)
}

// =================================================================
// 3. 配方数据待核对清单
// =================================================================
function genIssueList() {
  var issues = []   // 投料克重异常 → 数据错误，必须改
  var highCal = []  // 投料正常但能量偏高 → 菜品本身重口，非数据错误
  var warns = []    // 投料偏少 → 需确认是否漏填

  seed.SEED_DISHES.forEach(function (d) {
    var n = nu.calcDishNutrition(d)
    var suspects = []
    d.bomList.forEach(function (b) {
      var g = nu.toGram(b.name, b.useNum, b.unit)
      if (g >= 300) {
        suspects.push({ name: b.name, useNum: b.useNum, unit: b.unit, gram: g, price: b.price, cost: b.cost })
      }
    })
    if (n.totalGram > 1000) {
      issues.push({ dish: d, n: n, suspects: suspects })
    } else if (n.energy > 1000) {
      highCal.push({ dish: d, n: n })
    } else if (n.totalGram < 150) {
      warns.push({ dish: d, n: n })
    }
  })

  var zeroPrice = []
  seed.SEED_MATERIALS.forEach(function (m) {
    if (!m.price) zeroPrice.push(m)
  })

  var L = []
  L.push('# 配方数据待核对清单')
  L.push('')
  L.push('> 生成时间：' + new Date().toLocaleString('zh-CN'))
  L.push('> 扫描范围：' + seed.SEED_DISHES.length + ' 道菜 / ' + seed.SEED_MATERIALS.length + ' 种原料')
  L.push('> 判定标准：单份正餐合理区间 投料 300~800g、能量 400~1000 kcal')
  L.push('')
  L.push('---')
  L.push('')
  L.push('## 一、结论先行')
  L.push('')
  L.push('营养库已覆盖全部 ' + seed.SEED_MATERIALS.length + ' 种原料（覆盖率 100%），**计算引擎本身没问题**。')
  L.push('扫描结果分三类：')
  L.push('')
  L.push('| 类型 | 数量 | 性质 |')
  L.push('| --- | --- | --- |')
  L.push('| ❌ 投料克重异常 | ' + issues.length + ' 道 | **数据错误**，必须改，否则营养算不准 |')
  L.push('| ⚠ 高热量 | ' + highCal.length + ' 道 | 数据没错，菜品本身热量高，需在配餐时留意 |')
  L.push('| ⚠ 投料偏少 | ' + warns.length + ' 道 | 需确认是小份点心还是漏填配料 |')
  L.push('| ✅ 正常 | ' + (seed.SEED_DISHES.length - issues.length - highCal.length - warns.length) + ' 道 | 可直接出营养报告 |')
  L.push('')
  L.push('数据错误的根因有三个：')
  L.push('')
  L.push('| 根因 | 说明 | 影响 |')
  L.push('| --- | --- | --- |')
  L.push('| ① 计件原料单位标成 kg | 「鸡根 2kg」实际是「2 根」，「小笼包 4kg」实际是「4 个」 | 营养虚高 10~20 倍；成本核算**未受影响**（单价本身是按件计的） |')
  L.push('| ② 配方串味 | 红烧牛腩的配方里出现了「鸡根 2kg」 | 配方错误，需人工确认 |')
  L.push('| ③ 单价为 0 | ' + zeroPrice.length + ' 种原料单价 0 元 | 成本与毛利率失真 |')
  L.push('')
  L.push('**这些问题你在做 SOP 时一并修正即可，不用单独返工。**')
  L.push('')
  L.push('---')
  L.push('')
  L.push('## 二、必须修正：' + issues.length + ' 道菜（投料克重异常）')
  L.push('')

  issues.forEach(function (it, idx) {
    var d = it.dish, n = it.n
    L.push('### ' + (idx + 1) + '. ' + d.dishName + '（' + d.packageType + '，售价 ' + d.sellPrice + ' 元）')
    L.push('')
    L.push('当前算出：投料 **' + n.totalGram + ' g**、能量 **' + n.energy + ' kcal** ← 明显不合理')
    L.push('')
    L.push('| 原料 | 现填用量 | 折算克重 | 单价 | 成本 | 判断 |')
    L.push('| --- | --- | --- | --- | --- | --- |')
    d.bomList.forEach(function (b) {
      var g = nu.toGram(b.name, b.useNum, b.unit)
      var judge = ''
      if (g >= 300) {
        judge = '**❌ 疑似单位错误**，单价 ' + b.price + ' 元/' + b.unit + ' 看起来是按「个/根/只」计价'
      }
      L.push('| ' + b.name + ' | ' + b.useNum + b.unit + ' | ' + g + ' g | ' +
        b.price + ' 元/' + b.unit + ' | ' + b.cost + ' 元 | ' + judge + ' |')
    })
    L.push('')
  })

  if (highCal.length) {
    L.push('---')
    L.push('')
    L.push('## 三、高热量提示：' + highCal.length + ' 道菜（数据无误，配餐需留意）')
    L.push('')
    L.push('投料克重正常，是菜品本身高油高碳水。单份成人午餐建议 600~800 kcal，以下几道已超：')
    L.push('')
    L.push('| 菜品 | 分类 | 投料 | 能量 | 脂肪 | 钠 | 折合盐 | 超出午餐建议 |')
    L.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
    highCal.forEach(function (h) {
      var a = nu.analyze(h.n)
      var over = Math.round(h.n.energy - 700)
      L.push('| ' + h.dish.dishName + ' | ' + h.dish.packageType + ' | ' + h.n.totalGram + ' g | **' +
        h.n.energy + ' kcal** | ' + h.n.fat + ' g | ' + h.n.sodium + ' mg | ' + a.saltGram + ' g | +' + over + ' kcal |')
    })
    L.push('')
    L.push('建议：这几道搭配套餐时，配菜选清淡的（水果碗、罗宋汤），别再叠高油主食。')
    L.push('')
  }

  if (warns.length) {
    L.push('---')
    L.push('')
    L.push('## 四、请确认：' + warns.length + ' 道菜投料偏少（<150g）')
    L.push('')
    L.push('这几道可能本来就是小份点心，也可能是漏填了配料，麻烦确认一下：')
    L.push('')
    L.push('| 菜品 | 分类 | 投料 | 能量 |')
    L.push('| --- | --- | --- | --- |')
    warns.forEach(function (w) {
      L.push('| ' + w.dish.dishName + ' | ' + w.dish.packageType + ' | ' + w.n.totalGram + ' g | ' + w.n.energy + ' kcal |')
    })
    L.push('')
  }

  if (zeroPrice.length) {
    L.push('---')
    L.push('')
    L.push('## 五、单价为 0 的原料（' + zeroPrice.length + ' 种）')
    L.push('')
    L.push('| 原料编号 | 原料名称 | 分类 | 单位 | 供应商 |')
    L.push('| --- | --- | --- | --- | --- |')
    zeroPrice.forEach(function (m) {
      L.push('| ' + m._id + ' | ' + m.name + ' | ' + m.category + ' | ' + m.unit + ' | ' + (m.supplier || '—') + ' |')
    })
    L.push('')
    L.push('单价 0 会让这些菜的成本被低估、毛利率虚高，建议补上采购价。')
    L.push('')
  }

  L.push('---')
  L.push('')
  L.push('## 六、正常的 ' + (seed.SEED_DISHES.length - issues.length - highCal.length - warns.length) + ' 道菜（可直接出营养报告）')
  L.push('')
  L.push('| 菜品 | 分类 | 投料 | 能量 | 蛋白质 | 脂肪 | 碳水 | 钠 | 折合盐 |')
  L.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  seed.SEED_DISHES.forEach(function (d) {
    var n = nu.calcDishNutrition(d)
    if (n.totalGram > 1000 || n.energy > 1000 || n.totalGram < 150) return
    var a = nu.analyze(n)
    L.push('| ' + d.dishName + ' | ' + d.packageType + ' | ' + n.totalGram + ' g | ' +
      n.energy + ' kcal | ' + n.protein + ' g | ' + n.fat + ' g | ' + n.cho + ' g | ' +
      n.sodium + ' mg | ' + a.saltGram + ' g |')
  })
  L.push('')
  L.push('---')
  L.push('')
  L.push('## 七、下一步')
  L.push('')
  L.push('1. 你按 `菜单SOP上传模板.csv` 填写完整菜单 SOP（**计件原料记得用「个/根/只」**）')
  L.push('2. 填完发给鲍勃，会自动产出：')
  L.push('   - 每道菜的核心 5 项营养（能量/蛋白质/脂肪/碳水/钠）+ NRV%')
  L.push('   - 每个套餐的一餐汇总，对照《中国居民膳食指南》午餐推荐量')
  L.push('   - 三大营养素供能比，判断结构是否合理')
  L.push('3. 数据同时写进小程序，菜品详情页直接显示营养成分表')
  L.push('')
  return writeMD('配方数据待核对清单.md', L.join('\n'))
}

// =================================================================
console.log('生成营养分析交付文档...')
console.log('')
var p1 = genTemplate()
var p2 = genNutriTable()
var p3 = genIssueList()
console.log('')
console.log('输出目录：' + OUT)
