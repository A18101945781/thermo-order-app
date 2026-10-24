/**
 * 营养成分计算模块
 *
 * 数据来源：《中国食物成分表》标准版 第6版（中国疾控中心营养与健康所）
 *          部分复合加工品（如水饺、蛋挞、肉酱）成分表无独立条目，
 *          按主要配料折算取常见商品标示值，已在 src 字段标注 'est'。
 *
 * 数值口径：每 100g「可食部」含量
 * 指标：能量(kcal) / 蛋白质(g) / 脂肪(g) / 碳水化合物(g) / 钠(mg)
 *
 * 注意：配方 bomList 中的 useNum 视为「净用量（可食部）」，
 *      即已完成去皮、去骨、去壳后的实际投料量，不再二次折算可食部系数。
 */

// ---------------------------------------------------------------
// 一、原料营养库  [能量kcal, 蛋白质g, 脂肪g, 碳水g, 钠mg]
//    src: 'cn6' = 中国食物成分表第6版直接查得
//         'est' = 复合加工品，按配料折算/商品标示值估算
// ---------------------------------------------------------------
var NUTRITION_DB = {
  // ── 主食 ──────────────────────────────
  '大米':       { n: [346, 7.4, 0.8, 77.9, 3.8],     src: 'cn6', note: '稻米(均值),生重' },
  '年糕条':     { n: [154, 3.3, 0.6, 34.7, 40.0],    src: 'cn6', note: '年糕' },
  '意面':       { n: [350, 11.9, 1.1, 74.6, 6.0],    src: 'cn6', note: '意大利面,干重' },
  '意大利通心形（弯管）面': { n: [350, 11.9, 1.1, 74.6, 6.0], src: 'cn6', note: '意大利通心形（弯管）面,干重（同干意面）' },
  '薯条':       { n: [298, 3.4, 14.7, 38.7, 210.0],  src: 'est', note: '冷冻薯条油炸后' },
  '面条':       { n: [286, 8.3, 0.7, 61.9, 3.0],     src: 'cn6', note: '面条(生)' },

  // ── 其他主食/烘焙 ─────────────────────
  '大福':       { n: [235, 3.0, 0.5, 54.0, 30.0],    src: 'est', note: '糯米大福' },
  '牛角包':     { n: [406, 8.0, 21.0, 45.8, 450.0],  src: 'est', note: '可颂' },
  '饼':         { n: [258, 7.5, 2.3, 52.9, 150.0],   src: 'cn6', note: '烙饼' },
  '鸡蛋':       { n: [144, 13.3, 8.8, 2.8, 131.5],   src: 'cn6', note: '鸡蛋(可食部)' },

  // ── 包装（不计营养）───────────────────
  '打包盒':     { n: null, src: 'na', note: '包装物,不计入营养' },

  // ── 荤食/加工品 ───────────────────────
  '北极贝群边': { n: [78, 15.0, 0.6, 3.0, 300.0],    src: 'est', note: '贝类' },
  '北极贝裙边': { n: [78, 15.0, 0.6, 3.0, 300.0],    src: 'est', note: '贝类' },
  '咸味芝士蛋糕':{ n: [321, 6.0, 20.0, 28.0, 320.0], src: 'est', note: '芝士蛋糕' },
  '土豆片':     { n: [77, 2.0, 0.2, 17.2, 2.7],      src: 'cn6', note: '马铃薯' },
  '地道肠':     { n: [212, 14.0, 10.4, 15.6, 1085.0],src: 'cn6', note: '火腿肠' },
  '培根':       { n: [181, 22.3, 9.0, 2.6, 1100.0],  src: 'cn6', note: '培根' },
  '大娘水饺':   { n: [240, 9.0, 9.0, 30.0, 480.0],   src: 'est', note: '猪肉白菜水饺' },
  '奥尔良烤翅': { n: [220, 19.0, 14.0, 4.5, 620.0],  src: 'est', note: '腌制烤鸡翅' },
  '小笼包':     { n: [235, 8.5, 9.0, 30.0, 400.0],   src: 'est', note: '猪肉小笼包' },
  '披萨饼':     { n: [268, 9.0, 6.0, 44.0, 480.0],   src: 'est', note: '披萨饼底' },
  '混合蔬菜':   { n: [65, 3.0, 0.5, 12.5, 30.0],     src: 'est', note: '冷冻玉米豌豆胡萝卜' },
  '葡式蛋挞':   { n: [291, 4.5, 16.0, 32.0, 130.0],  src: 'est', note: '蛋挞' },
  '骨香鸡':     { n: [279, 20.0, 17.0, 11.0, 560.0], src: 'est', note: '炸鸡块' },
  '鸡米花':     { n: [285, 16.0, 17.5, 16.0, 620.0], src: 'est', note: '裹粉炸鸡' },

  // ── 水果 ──────────────────────────────
  '水果':       { n: [50, 0.6, 0.2, 12.0, 3.0],      src: 'est', note: '混合水果均值' },
  '沃柑':       { n: [51, 0.7, 0.2, 11.9, 1.4],      src: 'cn6', note: '柑橘' },
  '红龙果':     { n: [55, 1.1, 0.2, 13.3, 2.7],      src: 'cn6', note: '火龙果' },
  '葡萄干':     { n: [341, 2.5, 0.4, 83.4, 19.1],    src: 'cn6', note: '葡萄干' },
  '西瓜':       { n: [31, 0.5, 0.3, 6.8, 3.2],       src: 'cn6', note: '西瓜' },

  // ── 海鲜 ──────────────────────────────
  '章鱼丸子':   { n: [190, 7.0, 8.0, 22.0, 480.0],   src: 'est', note: '章鱼小丸子' },
  '虾仁':       { n: [93, 18.6, 1.1, 2.8, 165.0],    src: 'cn6', note: '虾仁' },
  '金枪鱼':     { n: [108, 24.4, 0.6, 0.0, 45.0],    src: 'cn6', note: '金枪鱼(生)' },

  // ── 甜品 ──────────────────────────────
  '冰粉':       { n: [46, 0.1, 0.0, 11.4, 5.0],      src: 'est', note: '冰粉(含糖水)' },
  '奥利奥':     { n: [480, 5.0, 20.0, 71.0, 400.0],  src: 'est', note: '夹心饼干' },

  // ── 肉类 ──────────────────────────────
  '叉烧':       { n: [279, 20.0, 16.0, 14.0, 900.0], src: 'est', note: '广式叉烧' },
  '奥尔良鸡腿': { n: [181, 17.5, 10.5, 4.0, 580.0],  src: 'est', note: '腌制鸡腿' },
  '牛腩':       { n: [332, 17.1, 29.3, 0.0, 60.0],   src: 'cn6', note: '牛腩(生)' },
  '韩国鱼饼':   { n: [145, 11.0, 5.0, 13.0, 700.0],  src: 'est', note: '鱼糕/鱼豆腐' },
  '鳗鱼':       { n: [181, 18.6, 10.8, 2.3, 58.0],   src: 'cn6', note: '鳗鲡' },
  '鸡丝':       { n: [133, 19.4, 5.0, 2.5, 63.0],    src: 'cn6', note: '鸡胸肉' },
  '鸡根':       { n: [181, 20.0, 11.0, 0.0, 96.0],   src: 'cn6', note: '鸡小腿' },

  // ── 蔬菜 ──────────────────────────────
  '卷心菜':     { n: [24, 1.5, 0.2, 4.6, 27.2],      src: 'cn6', note: '甘蓝' },
  '卷心菜块':   { n: [24, 1.5, 0.2, 4.6, 27.2],      src: 'cn6', note: '甘蓝' },
  '土豆丝':     { n: [77, 2.0, 0.2, 17.2, 2.7],      src: 'cn6', note: '马铃薯' },
  '土豆块':     { n: [77, 2.0, 0.2, 17.2, 2.7],      src: 'cn6', note: '马铃薯' },
  '大白菜丝':   { n: [18, 1.5, 0.1, 3.2, 57.5],      src: 'cn6', note: '大白菜' },
  '杏鲍菇丁':   { n: [35, 1.3, 0.1, 8.3, 1.9],       src: 'cn6', note: '杏鲍菇' },
  '番茄块':     { n: [20, 0.9, 0.2, 4.0, 5.0],       src: 'cn6', note: '番茄' },
  '胡萝卜丝':   { n: [39, 1.0, 0.2, 8.8, 71.4],      src: 'cn6', note: '胡萝卜' },
  '胡萝卜片':   { n: [39, 1.0, 0.2, 8.8, 71.4],      src: 'cn6', note: '胡萝卜' },
  '茭白丝':     { n: [26, 1.2, 0.2, 5.9, 5.8],       src: 'cn6', note: '茭白' },
  '西兰花':     { n: [36, 4.1, 0.6, 4.3, 18.8],      src: 'cn6', note: '西兰花' },
  '青菜':       { n: [15, 1.5, 0.3, 2.4, 73.5],      src: 'cn6', note: '小白菜' },
  '青菜段':     { n: [15, 1.5, 0.3, 2.4, 73.5],      src: 'cn6', note: '小白菜' },
  '香菇丁':     { n: [26, 2.2, 0.3, 5.2, 1.4],       src: 'cn6', note: '鲜香菇' },
  '香菇丝':     { n: [26, 2.2, 0.3, 5.2, 1.4],       src: 'cn6', note: '鲜香菇' },

  // ── 调料/乳制品 ───────────────────────
  '奶盖粉':     { n: [470, 6.0, 25.0, 55.0, 300.0],  src: 'est', note: '奶盖粉' },
  '淡奶油':     { n: [345, 2.1, 36.0, 3.1, 40.0],    src: 'est', note: '动物性淡奶油35%' },
  '白芝麻':     { n: [536, 18.4, 39.6, 24.0, 8.3],   src: 'cn6', note: '芝麻(白)' },
  '肉酱':       { n: [130, 7.0, 8.0, 7.0, 620.0],    src: 'est', note: '博洛尼亚肉酱' },
  '芝士':       { n: [328, 25.7, 23.5, 3.5, 584.0],  src: 'cn6', note: '干酪' },
  '花生碎':     { n: [601, 23.9, 44.4, 25.7, 34.8],  src: 'cn6', note: '花生仁(炒)' },

  // ── 饮品 ──────────────────────────────
  '牛奶':       { n: [54, 3.0, 3.2, 3.4, 37.2],      src: 'cn6', note: '全脂牛乳' },
  '酸奶':       { n: [72, 2.5, 2.7, 9.3, 39.8],      src: 'cn6', note: '酸奶(全脂加糖)' },

  // ── 2026-08-05 新增：儿童餐 SOP 主料 ──────────
  '去皮鸡胸块': { n: [133, 19.4, 5.0, 2.5, 34.4],    src: 'cn6', note: '鸡胸脯肉(去皮)' },
  '胡萝卜块':   { n: [39, 1.0, 0.2, 8.8, 71.4],      src: 'cn6', note: '胡萝卜(红)' },
  '鳕鱼排':     { n: [205, 12.0, 10.5, 15.0, 350.0], src: 'est', note: '裹粉鳕鱼排半成品,约40g/个,含预调味' },
  '青虾仁':     { n: [87, 16.4, 2.4, 0.0, 133.8],    src: 'cn6', note: '河虾(青虾)' },
  '去骨五花肉': { n: [568, 9.3, 59.0, 0.0, 39.1],    src: 'cn6', note: '猪肉(肋条肉/五花)' },
  '番茄':       { n: [20, 0.9, 0.2, 4.0, 5.0],       src: 'cn6', note: '番茄(西红柿)' },

  // ── 2026-08-05 新增：基础调料 ────────────────
  // 注意：酱油/盐 钠含量极高，是儿童餐钠超标主因，用量务必按 SOP 实填
  '生抽':       { n: [63, 5.6, 0.1, 10.1, 5757.0],   src: 'cn6', note: '酱油(生抽)' },
  '老抽':       { n: [70, 4.5, 0.1, 13.0, 6800.0],   src: 'est', note: '酱油(老抽),钠高于生抽' },
  '糖':         { n: [400, 0.0, 0.0, 99.9, 0.6],     src: 'cn6', note: '白砂糖' },
  '盐':         { n: [0, 0.0, 0.0, 0.0, 39311.0],    src: 'cn6', note: '精盐,钠39.3g/100g' },
  '油':         { n: [899, 0.0, 99.9, 0.0, 4.5],     src: 'cn6', note: '植物调和油' },
  '葱':         { n: [27, 1.6, 0.4, 4.9, 10.4],      src: 'cn6', note: '小葱(香葱)' },
  '姜':         { n: [46, 1.3, 0.6, 10.3, 14.9],     src: 'cn6', note: '生姜' },
  '蒜':         { n: [128, 4.5, 0.2, 27.6, 19.6],    src: 'cn6', note: '大蒜(白皮)' },
  '八角':       { n: [195, 3.8, 5.6, 50.0, 14.7],    src: 'est', note: '八角(大料),用量极小可忽略' },
  '黑木耳':     { n: [27, 1.5, 0.2, 6.0, 8.5],       src: 'cn6', note: '木耳(干)', dictNote: '' },
  '云丝':       { n: [200, 12.0, 10.0, 10.0, 600.0], src: 'est', note: '豆制品丝(千张丝类)' },
  '香菜':       { n: [33, 2.1, 0.5, 6.4, 56.4],      src: 'cn6', note: '芫荽(香菜)' },
  '咖喱粉':     { n: [370, 14.0, 14.0, 50.0, 1000.0], src: 'est', note: '混合咖喱粉(含盐)' },
  '醋':         { n: [38, 0.0, 0.0, 8.6, 1.5],       src: 'cn6', note: '食醋' },
  '奥尔良腌料': { n: [300, 10.0, 2.0, 60.0, 6000.0], src: 'est', note: '奥尔良烤翅腌料(干撒,用量小)' }
}

// ---------------------------------------------------------------
// 二、非重量单位 → 克重换算表（unit 为「个」「份」「只」等时使用）
// ---------------------------------------------------------------
var UNIT_WEIGHT = {
  '鸡根': 40,
  '大福': 45,
  '牛角包': 60,
  '饼': 80,
  '咸味芝士蛋糕': 80,
  '大娘水饺': 20,
  '葡式蛋挞': 55,
  '虾仁': 8,
  '奥利奥': 11,
  '奥尔良鸡腿': 100,
  '酸奶': 150,
  '冰粉': 200,
  '打包盒': 0,
  '鳕鱼排': 40      // 裹粉鳕鱼排半成品，单价 0.88 元/个
}

// ---------------------------------------------------------------
// 三、营养素参考值 NRV（GB 28050-2011 预包装食品营养标签通则）
// ---------------------------------------------------------------
var NRV = {
  energy: 2000,   // kcal（8400 kJ）
  protein: 60,    // g
  fat: 60,        // g（上限值）
  cho: 300,       // g
  sodium: 2000    // mg（上限值）
}

// 一日三餐中「一顿正餐」的合理占比（按 30%~40% 计，取 35%）
var MEAL_RATIO = 0.35

// ---------------------------------------------------------------
// 四、单位换算：把 (用量, 单位, 原料名) 统一折算成「克」
// ---------------------------------------------------------------
function toGram(name, useNum, unit) {
  var num = Number(useNum) || 0
  if (num <= 0) return 0
  var u = String(unit || '').trim()

  if (u === 'kg' || u === '千克' || u === '公斤') return num * 1000
  if (u === 'g' || u === '克') return num
  if (u === 'L' || u === '升') return num * 1000      // 按水密度近似
  if (u === 'ml' || u === '毫升') return num

  // 个 / 份 / 只 / 袋 等计件单位，查克重表
  var w = UNIT_WEIGHT[name]
  if (typeof w === 'number') return num * w

  return -1   // 无法换算，返回 -1 由上层记为缺失
}

// ---------------------------------------------------------------
// 五、单道菜营养计算
//   dish: { dishName, bomList: [{name, useNum, unit}] }
//   返回: { energy, protein, fat, cho, sodium, totalGram, items, missing }
// ---------------------------------------------------------------
function calcDishNutrition(dish) {
  var res = {
    energy: 0, protein: 0, fat: 0, cho: 0, sodium: 0,
    totalGram: 0,
    items: [],      // 逐原料明细，便于溯源
    missing: [],    // 缺营养数据或无法换算的原料
    estCount: 0     // 使用估算值的原料数
  }
  if (!dish || !dish.bomList || !dish.bomList.length) return res

  for (var i = 0; i < dish.bomList.length; i++) {
    var b = dish.bomList[i]
    var name = b.name
    var rec = NUTRITION_DB[name]

    // 包装物等标记为不计营养，直接跳过且不算缺失
    if (rec && rec.src === 'na') continue

    if (!rec || !rec.n) {
      res.missing.push({ name: name, reason: '营养库无此原料' })
      continue
    }

    var gram = toGram(name, b.useNum, b.unit)
    if (gram < 0) {
      res.missing.push({ name: name, reason: '单位「' + b.unit + '」无克重换算' })
      continue
    }
    if (gram === 0) continue

    var k = gram / 100
    var item = {
      name: name,
      gram: round(gram, 1),
      energy: round(rec.n[0] * k, 1),
      protein: round(rec.n[1] * k, 2),
      fat: round(rec.n[2] * k, 2),
      cho: round(rec.n[3] * k, 2),
      sodium: round(rec.n[4] * k, 1),
      src: rec.src
    }
    res.items.push(item)
    if (rec.src === 'est') res.estCount++

    res.totalGram += gram
    res.energy += rec.n[0] * k
    res.protein += rec.n[1] * k
    res.fat += rec.n[2] * k
    res.cho += rec.n[3] * k
    res.sodium += rec.n[4] * k
  }

  res.totalGram = round(res.totalGram, 1)
  res.energy = round(res.energy, 0)
  res.protein = round(res.protein, 1)
  res.fat = round(res.fat, 1)
  res.cho = round(res.cho, 1)
  res.sodium = round(res.sodium, 0)
  return res
}

// ---------------------------------------------------------------
// 六、套餐/多菜合计
//   list: [dish, dish, ...]  或  [{dish, qty}, ...]
// ---------------------------------------------------------------
function calcTotalNutrition(list) {
  var total = {
    energy: 0, protein: 0, fat: 0, cho: 0, sodium: 0,
    totalGram: 0, missing: [], details: []
  }
  if (!list || !list.length) return total

  for (var i = 0; i < list.length; i++) {
    var entry = list[i]
    var dish = entry && entry.bomList ? entry : (entry && entry.dish)
    var qty = (entry && typeof entry.qty === 'number') ? entry.qty : 1
    if (!dish) continue

    var n = calcDishNutrition(dish)
    total.energy += n.energy * qty
    total.protein += n.protein * qty
    total.fat += n.fat * qty
    total.cho += n.cho * qty
    total.sodium += n.sodium * qty
    total.totalGram += n.totalGram * qty
    total.details.push({ dishName: dish.dishName, qty: qty, nutrition: n })
    for (var j = 0; j < n.missing.length; j++) total.missing.push(n.missing[j])
  }

  total.energy = round(total.energy, 0)
  total.protein = round(total.protein, 1)
  total.fat = round(total.fat, 1)
  total.cho = round(total.cho, 1)
  total.sodium = round(total.sodium, 0)
  total.totalGram = round(total.totalGram, 1)
  return total
}

// ---------------------------------------------------------------
// 七、营养解读：NRV 占比 + 供能比 + 风险提示
// ---------------------------------------------------------------
function analyze(n) {
  if (!n) return null

  // NRV% —— 相对全天参考值
  var nrv = {
    energy: pct(n.energy, NRV.energy),
    protein: pct(n.protein, NRV.protein),
    fat: pct(n.fat, NRV.fat),
    cho: pct(n.cho, NRV.cho),
    sodium: pct(n.sodium, NRV.sodium)
  }

  // 三大产能营养素供能比（蛋白4 / 脂肪9 / 碳水4 kcal per g）
  var kP = n.protein * 4
  var kF = n.fat * 9
  var kC = n.cho * 4
  var kSum = kP + kF + kC
  var ratio = {
    protein: kSum > 0 ? round(kP / kSum * 100, 1) : 0,
    fat: kSum > 0 ? round(kF / kSum * 100, 1) : 0,
    cho: kSum > 0 ? round(kC / kSum * 100, 1) : 0
  }

  // 与「一顿正餐」合理区间对比（中国居民膳食指南）
  var mealEnergy = NRV.energy * MEAL_RATIO      // ≈700 kcal
  var mealSodium = NRV.sodium * MEAL_RATIO      // ≈700 mg
  var tips = []

  if (n.energy > mealEnergy * 1.3) {
    tips.push({ level: 'warn', text: '能量偏高（' + n.energy + ' kcal，一餐建议 ≤' + Math.round(mealEnergy) + ' kcal）' })
  } else if (n.energy < mealEnergy * 0.6) {
    tips.push({ level: 'info', text: '能量偏低（' + n.energy + ' kcal），可能不足以支撑一顿正餐' })
  } else {
    tips.push({ level: 'ok', text: '能量适中（一餐参考 ' + Math.round(mealEnergy) + ' kcal）' })
  }

  if (ratio.fat > 35) {
    tips.push({ level: 'warn', text: '脂肪供能比 ' + ratio.fat + '%，超过膳食指南建议的 20%~30%' })
  } else if (ratio.fat < 15) {
    tips.push({ level: 'info', text: '脂肪供能比 ' + ratio.fat + '%，低于建议下限 20%' })
  } else {
    tips.push({ level: 'ok', text: '脂肪供能比 ' + ratio.fat + '%，处于合理区间' })
  }

  if (ratio.protein < 10) {
    tips.push({ level: 'warn', text: '蛋白质供能比仅 ' + ratio.protein + '%，建议 10%~20%，可增加荤菜或豆制品' })
  } else {
    tips.push({ level: 'ok', text: '蛋白质供能比 ' + ratio.protein + '%，达标' })
  }

  if (n.sodium > mealSodium * 1.5) {
    tips.push({ level: 'warn', text: '钠 ' + n.sodium + ' mg，约合食盐 ' + round(n.sodium * 2.54 / 1000, 1) + ' g，一餐偏咸' })
  } else {
    tips.push({ level: 'ok', text: '钠 ' + n.sodium + ' mg（约合食盐 ' + round(n.sodium * 2.54 / 1000, 1) + ' g）' })
  }

  return { nrv: nrv, ratio: ratio, tips: tips, saltGram: round(n.sodium * 2.54 / 1000, 1) }
}

// ---------------------------------------------------------------
// 八、工具函数
// ---------------------------------------------------------------
function round(v, d) {
  var p = Math.pow(10, d || 0)
  return Math.round((Number(v) || 0) * p) / p
}

function pct(v, base) {
  return round((Number(v) || 0) / base * 100, 0)
}

/** 检查一批原料名在营养库中的覆盖情况，用于导入新 SOP 后排查 */
function checkCoverage(names) {
  var ok = [], miss = []
  for (var i = 0; i < names.length; i++) {
    var nm = names[i]
    if (NUTRITION_DB[nm]) ok.push(nm)
    else miss.push(nm)
  }
  return { total: names.length, covered: ok.length, missing: miss }
}

module.exports = {
  NUTRITION_DB: NUTRITION_DB,
  UNIT_WEIGHT: UNIT_WEIGHT,
  NRV: NRV,
  MEAL_RATIO: MEAL_RATIO,
  toGram: toGram,
  calcDishNutrition: calcDishNutrition,
  calcTotalNutrition: calcTotalNutrition,
  analyze: analyze,
  checkCoverage: checkCoverage
}
