/**
 * app.js — 热力学餐厅订货管理小程序
 * 双模存储：优先云端数据库，未开通时自动降级本地缓存
 */
const storage = require('./utils/storage.js')
const auth = require('./utils/auth.js')
const cloudConfig = require('./utils/cloudConfig.js')
const { SEED_MATERIALS, SEED_DISHES, SEED_SETMEALS, SEED_INVENTORY, SEED_INVENTORY_MAP, SEED_ADULT_MEALS } = require('./utils/seed.js')

App({
  globalData: {
    userInfo: null,
    userRole: '',
    openid: '',
    cloudReady: false,
    cloudEnvId: '', // 填入云开发环境ID后启用云端模式
    systemInfo: null,
  },

  onLaunch() {
    // 初始化云开发（仅当配置了环境ID时）
    this.initCloud()

    // 获取系统信息
    this.globalData.systemInfo = wx.getSystemInfoSync()

    // 注入种子数据（首次启动）
    this.injectSeedData()

    // 检查登录状态
    this.checkLoginStatus()
  },

  /** 初始化云开发 */
  initCloud() {
    var envId = cloudConfig.envId
    this.globalData.cloudEnvId = envId
    if (!envId) {
      console.log('[App] 未配置云环境ID，使用本地缓存模式')
      this.globalData.cloudReady = false
      return
    }
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: envId,
          traceUser: true,
        })
        this.globalData.cloudReady = true
        console.log('[App] 云开发初始化成功')
      } catch (e) {
        console.warn('[App] 云开发初始化失败，降级本地缓存', e)
        this.globalData.cloudReady = false
      }
    } else {
      this.globalData.cloudReady = false
    }
  },

  /** 首次启动注入种子数据 */
  injectSeedData() {
    var seeded = wx.getStorageSync('seed_injected_v70')
    if (!seeded) {
      console.log('[App] 首次启动，注入种子数据...')
      wx.removeStorageSync('seed_injected')
      wx.removeStorageSync('seed_injected_v2')
      wx.removeStorageSync('seed_injected_v3')
      wx.removeStorageSync('seed_injected_v4')
      wx.removeStorageSync('seed_injected_v5')
      wx.removeStorageSync('seed_injected_v6')
      wx.removeStorageSync('seed_injected_v7')
      wx.removeStorageSync('seed_injected_v8')
      wx.removeStorageSync('seed_injected_v9')
      wx.removeStorageSync('seed_injected_v10')
      wx.removeStorageSync('seed_injected_v11')
      wx.removeStorageSync('seed_injected_v12')
      wx.removeStorageSync('seed_injected_v13')
      wx.removeStorageSync('seed_injected_v14')
      wx.removeStorageSync('seed_injected_v15')
      wx.removeStorageSync('seed_injected_v16')
      wx.removeStorageSync('seed_injected_v17')
      wx.removeStorageSync('seed_injected_v18')
      wx.removeStorageSync('seed_injected_v19')
      wx.removeStorageSync('seed_injected_v20')
      wx.removeStorageSync('seed_injected_v21')
      wx.removeStorageSync('seed_injected_v22')
      wx.removeStorageSync('seed_injected_v23')
      wx.removeStorageSync('seed_injected_v24')
      wx.removeStorageSync('seed_injected_v25')
      wx.removeStorageSync('seed_injected_v26')
      wx.removeStorageSync('seed_injected_v27')
      wx.removeStorageSync('seed_injected_v28')
      wx.removeStorageSync('seed_injected_v29')
      wx.removeStorageSync('seed_injected_v30')
      wx.removeStorageSync('seed_injected_v31')
      wx.removeStorageSync('seed_injected_v32')
      wx.removeStorageSync('seed_injected_v33')
      wx.removeStorageSync('seed_injected_v34')
      wx.removeStorageSync('seed_injected_v35')
      wx.removeStorageSync('seed_injected_v36')
      wx.removeStorageSync('seed_injected_v37')
      wx.removeStorageSync('seed_injected_v38')
      wx.removeStorageSync('seed_injected_v39')
      wx.removeStorageSync('seed_injected_v40')
      wx.removeStorageSync('seed_injected_v41')
      wx.removeStorageSync('seed_injected_v42')
      wx.removeStorageSync('seed_injected_v43')
      wx.removeStorageSync('seed_injected_v44')
      wx.removeStorageSync('seed_injected_v45')
      wx.removeStorageSync('seed_injected_v46')
      wx.removeStorageSync('seed_injected_v48')
      wx.removeStorageSync('seed_injected_v50')
      wx.removeStorageSync('seed_injected_v51')
      wx.removeStorageSync('seed_injected_v52')
      wx.removeStorageSync('seed_injected_v53')
      wx.removeStorageSync('seed_injected_v54')
      wx.removeStorageSync('seed_injected_v55')
      wx.removeStorageSync('seed_injected_v56')
      wx.removeStorageSync('seed_injected_v57')
      wx.removeStorageSync('seed_injected_v58')
      wx.removeStorageSync('seed_injected_v59')
      wx.removeStorageSync('seed_injected_v60')
      wx.removeStorageSync('seed_injected_v61')
      wx.removeStorageSync('seed_injected_v62')
      wx.removeStorageSync('seed_injected_v63')
      wx.removeStorageSync('seed_injected_v64')
      wx.removeStorageSync('seed_injected_v65')
      wx.removeStorageSync('seed_injected_v66')
      wx.removeStorageSync('seed_injected_v67')
      wx.removeStorageSync('seed_injected_v68')
      wx.removeStorageSync('seed_injected_v69')
      // v70 (2026-10-13)：**松食配新进原料「泡芙」建档**（用户拍板「按箱建档」）—— SEED_MATERIALS 新增 mat_109
      //   「泡芙」(145元/箱, unit=箱, orderUnit=箱)；SEED_INVENTORY 新增「泡芙」(stock 0)；
      //   SEED_INVENTORY_MAP 新增 invName「泡芙」→ target「泡芙」，**factor=null（单位换算待确认）**。
      //   ⚠️ 报价单「规格」栏为空、对账单规格列填 0 ⇒「每箱几包/几个」零数据支撑，spec 留空，**严禁猜数**
      //   （「10包×10个」未经证实）。规格确认后回填 spec/specQty + MAP 的 factor。在此之前不参与 BOM 与采购抵扣。
      //   （来源：松食配报价单 20260801003；8月总进货对账单 8.1R11 / 8.4R29 各采购 1 箱 × 145 元）
      // v69 (2026-10-02)：SEED_INVENTORY 新增「水果玉米」(stock 1) —— 用户盘点表出现、原 35 项里没有（用户拍板「加」）。
      //   BOM 中无「水果玉米」原料（只有玉米淀粉 mat_105，属不同物）→ 不进 SEED_INVENTORY_MAP，纯独立库存项、不联动采购扣减。
      // v68 (2026-10-01)：**弯管面独立库存项**（用户拍板）—— SEED_INVENTORY 新增「意大利通心形（弯管）面」stock 0；
      //   SEED_INVENTORY_MAP 新增同名联动 factor=10（好生活 500g*20包/箱=10kg）。
      //   ⚠️ 与「半成品冷冻意大利面」(松食「意面」12kg/箱) 是两种货，**分开抵扣、不重复**。
      // v67 (2026-10-01)：dish_009 热熔芝士弯管意面 换料 —— BOM「意面」(mat_003, 松食 16元/kg)
      //   → 新原料 mat_108「意大利通心形（弯管）面」(好生活 500g*20包/箱=10kg, 20.6元/kg)，
      //   每份用量 0.15kg → 0.1kg；成本 2.4 → 2.06，总成本 11.6→11.26，毛利率 78.91%→79.53%
      // v66 (2026-09-27)：**销量基准接入预警** —— seed.js 新增 `SEED_EST_BASE`（23 道菜的
      //   「平日日均份数」基准）；orderCalc.loadSalesRef 的 estMap 改为「真实近7天日均 avg7 优先，
      //   无真实数据时用 SEED_EST_BASE 兜底」→ 预警不再空跑。
      //   基准来源：收银系统报表（**小长假某单日**实测 59 条商品），按小长假系数 ×5 反推
      //   （平日日均 = 当日实销量 ÷ 5，四舍五入、最低 1）。缺 dish_011/dish_024/dish_043（待报表第6页）
      // v65 (2026-09-27)：**按收银系统统一菜名**（用户要求"对齐菜单名"）——14 处改名，
      //   只动 SEED_DISHES.dishName 与 DISH_ORDER_INDEX 的键（BOM 里的**原料名一律不动**，
      //   如「葡式蛋挞」既是菜名又是原料名，只改菜名）：
      //   dish_059 意式肉酱面→意大利肉酱面配汤｜dish_007 红烧牛肉拌面→红烧牛肉面｜
      //   dish_021 培根香肠芝士披萨→美式培根烤披萨｜dish_019 虾仁培根炒饭配汤→虾仁培根炒饭｜
      //   dish_018 奥尔良鸡腿饭配汤→奥尔良烤鸡腿饭配汤｜dish_026 小笼包→上海小笼包｜
      //   dish_022 水饺→白菜猪肉水饺｜dish_030 炸鸡年糕→炸鸡配年糕｜dish_008 鲍汁双菇拌面→鲍汁双菇面｜
      //   dish_023 葡式蛋挞→蛋挞｜dish_016 热力童趣风奶盖小丸子→奶盖小丸子｜
      //   dish_015 辣炒熵增鱼饼年糕→辣炒鱼饼年糕｜dish_046 咖喱牛腩饭配汤→咖喱牛腩饭；
      //   连带 dish_006「咖喱牛腩饭」→「咖喱牛腩饭(旧版)」以避免与 dish_046 重名
      // v64 (2026-09-26)：韩国鱼饼单价 22 → 20.5 元/kg（按松食报价单 205元/箱 ÷ 10kg；1箱=10kg 已配 specQty）→ dish_015 辣炒熵增鱼饼年糕 成本 4.645→4.57、毛利 83.41%→83.68%（BOM 价与成本字段同步）
      // v63 (2026-09-25)：dish_046 咖喱牛腩饭配汤 —— BOM 里「卷心菜」重复两行（0.1kg + 0.05kg）合并为一行 **0.15kg**（成本不变 ¥0.63，总成本仍 ¥11.4159）；remark 更新（原"土豆片未定价(0)"已失效）。注：dish_046 的「土豆块0.1烧牛肉+土豆片0.05烧汤」与 dish_004 的「胡萝卜丝0.05烧菜+胡萝卜片0.05烧汤」经用户确认属两个动作、合理，已在审计加白名单
      // v62 (2026-09-23)：成分菜 dish_051 的 BOM「土豆片」→「土豆丝」（用户核对 SOP 表与实际菜单均为土豆丝，原写法是笔误；同价 6.4/kg 成本不变）。主菜 dish_047 第4项经 deriveXinjiangSet() 自动跟随 → 新疆团采购单不再出「土豆片」
      // v61 (2026-09-23)：**根治双份配方**——新疆团套餐原来存两遍（主菜 dish_047 手写 BOM + 10 道成分菜 dish_048~057 各一份），改一处忘另一处就漂移（土豆丝/土豆片事故）。现在 dish_047 的 bomList/totalCost/profit/grossRate 改由 seed.js 末尾的 deriveXinjiangSet() 从 10 道成分菜自动派生 → 单一数据源，结构上不可能再漂
      // v60 (2026-09-23)：dish_009 热熔芝士弯管意面 删除「饼 1个」→ BOM 只剩 意面0.15 / 番茄捞牛肉0.2 / 芝士0.1；成本 13.6→11.6、毛利 75.3%→78.9%（与用户 SOP 截图的 3 项一致）。原料「饼」(mat_008) 已无任何菜引用（保留不删）
      // v59 (2026-09-23)：① dish_009 热熔芝士弯管意面 / dish_010 高温脆薯肉酱薯条——BOM 里「叉烧+肉酱」替换为「番茄捞牛肉」(mat_087, ¥23/kg)；用量 0.2kg / 0.1kg（按用户 SOP 截图）。dish_010 成本 3.3625→3.6125(毛利84.7%→83.6%)。② mat_087 补 specQty=10（1箱=10kg）→ 建议采购量出「箱」。③ 修 bug：SEED_INVENTORY_MAP「意大利面番茄肉酱」target 由误写的「肉酱」改为「番茄捞牛肉」（note 早已写明本品=番茄捞牛肉；原错导致 7箱=70kg 库存错扣到「肉酱」，番茄捞牛肉永远 0 库存）
      // v58 (2026-09-23)：鱼饼改名「韩国鱼饼」对齐松食报价单（编码 20260728002）——mat_038 原料名 + dish_015 BOM 名 + nutrition.js 营养表键 三处同步改名；新增箱规 specQty=10 / orderUnit=箱（1箱=10kg）→ 建议采购量出「箱」
      // v57 (2026-09-23)：鱼饼(mat_038) 供应商 好生活 → 松食配送；分类 肉类 → 海鲜（与章鱼丸子/金枪鱼/鳗鱼等海鲜类一致；采购单同属第2组"肉类"，分组位置不变）
      // v56 (2026-09-22)：西瓜单价修正 21.6 → 8 元/kg（按松食现报价；原价疑为早期报价或净料折算）→ 水果碗成本 5.106→2.25、毛利率 71.6%→87.5%；采购单 100份水果碗 西瓜 21kg 记 ¥168（原 ¥454）
      // v55 (2026-09-22)：建议采购量按箱换算——13 项原料补 specQty/orderUnit（源自原料主数据 packQty/spec）；calc.js 容器单位允许小数（如 100个 ÷ 80个/箱 = 1.25箱）；库存映射表同步补箱规（鸡米花10/半熟牛筋肉10/培根13.6/奥尔良鸡根130/虾仁1000/北极贝裙边10/牛肉片10/辣子鸡10/咸味芝士蛋糕80）
      // v54 (2026-09-22)：库存→BOM 换算修正——地道肠 1箱=200根（原 factor=1 把 1箱当 1根，导致 80份用得 160根时库存只抵 1）→ 建议采购 0根
      // v53 (2026-09-22)：小笼包单位修正 kg→个（dish_026 BOM + mat_018 原料主数据；价格 0.625 实为「元/个」）→ 30 份 = 120 个，不再误显示 120kg
      // v52 (2026-09-22)：按用户紧凑订货表定稿——dish_007 红烧牛肉拌面改回「现煮面食」
      // v51 (2026-09-20)：按用户订货菜单最终版重排：dish_007 红烧牛肉拌面回归「西式主食」；dish_059 由「意式肉酱面配汤」改名为「意式肉酱面」（BOM 仍是配汤套餐版）；DISH_ORDER_INDEX 去掉旧名
      // v50 (2026-09-20)：SEED_INVENTORY_MAP 余下换算拍板——上海小笼包 1箱=320个、意大利面番茄肉酱=番茄捞牛肉 1箱=10kg；改名 瑞发德奥尔良鸡对翅→奥尔良对翅、TC308 3/8特脆粗薯→1/4细薯条；蜜汁叉烧片用户确认不联动。全部半成品换算已填，库存→采购单联动 26 项
      // v48 (2026-09-20)：新增 SEED_INVENTORY_MAP（库存半成品→BOM原料联动映射），采购单 buildPurchasePlan 按 curStock 扣减库存；精确同名项 factor=1 直接联动，半成品/改名项 factor 待确认
      // v47 (2026-09-20)：dish_007 红烧牛肉拌面分类从「西式主食」改为「现煮面食」
      // v46 (2026-09-20)：新增 SEED_INVENTORY 库存单子(35项)，订货页直接显示库存并自动减库存；废弃复杂的每日盘点/云端同步/按销量扣减/清空重盘逻辑
      // v45 (2026-09-19)：取消4个经典主食单人套餐(meal_29/30/31/32, 冗余经典主食单品) + 西式主食纯意式肉酱面(dish_020)标记hideInOrder取消；菜单(dishList)只显示经典主食+西式主食两分类(现煮面食/缤纷小食隐藏)；意式肉酱面配汤保留(单品dish_059 + 套餐meal_33两处都在)
      // v44 (2026-09-16)：酸奶(dish_043)改5元单点 + 5个未上表单品(鱼香肉丝/咖喱牛腩饭/儿童餐/热力球形章鱼小丸子/奶油海鲜意面)标记hideInOrder不进订货菜单 + 5个红字菜(热熔芝士弯管意面/高温脆薯肉酱薯条/炙焰焓变鳗鱼饭/冰点凝固冰粉/热力童趣风奶盖小丸子)加printMark(仅打印标记,数据不动)
      // v43 (2026-09-13)：意式肉酱面配汤(dish_059)去掉大米 + 虾仁培根炒饭配汤(dish_019)加150g大米
      // v38 (2026-09-12)：芝士蛋糕价修正 / BOM 零价同步 / 补建奥尔良腌料+醋 / 五花肉 specQty=0.12（120克/块）
      // v42 (2026-09-13)：所有菜品加 dishCategory 字段(经典主食/西式主食/现煮面食/缤纷小食/其他) + 新增能量碗dish_060(单品¥18)；菜单页与订货界面按该分类分组排序
      // v41 (2026-09-13)：新增意式肉酱面配汤(单人套餐 meal_33/dish_059) + 所有套餐大米统一150g + 咖喱牛腩单人套餐改用含汤dish_046
      // v39 (2026-09-12)：油9.5 / 糖9.4 / 老抽5 元每公斤回填（用户提供）+ BOM 全量按原料库价同步重算成本
      // v40 (2026-09-13)：原料 category 归类修正 —— 番茄捞牛肉→肉类；奶盖粉/淡奶油/芝士/黄油/安佳车达芝士/安佳芝士片→奶制品
      // 清除旧菜品（以 seed 为准）；原料做合并保留库存；订单为用户数据不清除
      wx.removeStorageSync('dishes')
      // 合并原料：seed 提供主数据（价格/规格/供应商/品牌/分类），保留已有库存字段
      var _existMats = wx.getStorageSync('materials') || []
      var _existMatMap = {}
      _existMats.forEach(function(m) { _existMatMap[m._id] = m })
      var _mergedMats = SEED_MATERIALS.map(function(m) {
        var _ex = _existMatMap[m._id]
        if (_ex) {
          return Object.assign({}, m, {
            initStock: _ex.initStock, inStock: _ex.inStock, outStock: _ex.outStock,
            curStock: _ex.curStock, minStock: _ex.minStock
          })
        }
        return m
      })
      wx.setStorageSync('materials', _mergedMats)
      // 写入菜品
      SEED_DISHES.forEach(function(d) {
        storage.addDish(d)
      })
      // 写入库存单子（订货页直接减库存用）
      // 2026-09-20：库存已可在订货页直接编辑 → 重灌时保留用户已改的 stock，只补新增品项
      // 🔴 2026-10-06：云模式下**不覆盖本地镜像** —— 云端才是权威源（订货页读 storage.getInventoryList()）。
      //    原先无条件 setStorageSync 会把「手机上已改的库存」用本机旧镜像覆盖掉（换设备/清缓存后重灌时尤其明显）。
      //    云模式：本地只做兜底缓存，由 getInventoryList() 主动从云端刷新；此处仅当本地为空时补一份种子。
      if (storage.isCloudMode && storage.isCloudMode()) {
        if (!(wx.getStorageSync('inventory') || []).length) {
          wx.setStorageSync('inventory', SEED_INVENTORY)
        }
      } else {
        var _existInv = wx.getStorageSync('inventory') || []
        var _existInvMap = {}
        _existInv.forEach(function(it) { _existInvMap[it.name] = it })
        var _mergedInv = SEED_INVENTORY.map(function(it) {
          var _old = _existInvMap[it.name]
          return _old ? Object.assign({}, it, { stock: _old.stock }) : it
        })
        wx.setStorageSync('inventory', _mergedInv)
      }
      wx.setStorageSync('seed_injected_v70', true)
      console.log('[App] 种子数据注入完成：' + SEED_MATERIALS.length + '条原料，' + SEED_DISHES.length + '道菜品，' + SEED_INVENTORY.length + '项库存')
    }

    // 注入套餐种子（独立标记，不影响已注入的菜品/原料）
    var mealSeeded = wx.getStorageSync('seed_meals_injected_v11')
    if (!mealSeeded) {
      wx.removeStorageSync('seed_meals_injected_v7')
      wx.removeStorageSync('seed_meals_injected_v8')
      wx.removeStorageSync('seed_meals_injected_v9')
      wx.removeStorageSync('seed_meals_injected_v10')
      // v11 (2026-10-07)：新疆团套餐改名 —— meal_xj50「新疆团50元套餐」→「新疆团套餐」，
      //                   主菜 dish_047 同步改名（审计 E1 靠「套餐名==主菜名」配对，不同步会静默失效）
      // v10 (2026-09-20)：删除最后一个单人套餐 meal_33(意式肉酱面配汤)，单人套餐全部取消；套餐区只剩团队套餐(走预定)
      // v9 (2026-09-13)：新增意式肉酱面配汤(meal_33, 引用 dish_059)
      // 先清理已被用户取消的旧套餐,避免设备上残留(upsert 不会自动删除)
      var OLD_MEAL_IDS = ['meal_a', 'meal_b', 'meal_c', 'meal_29', 'meal_30', 'meal_31', 'meal_32', 'meal_33']
      OLD_MEAL_IDS.forEach(function(id) { storage.deleteSetMeal(id) })
      SEED_SETMEALS.forEach(function(m) {
        storage.saveSetMeal(m)
      })
      wx.setStorageSync('seed_meals_injected_v11', true)
      console.log('[App] 套餐种子注入完成：' + SEED_SETMEALS.length + '个套餐')
    }

    // 注入成人预定种子（独立标记 v3；**种子自己的单以种子为准，用户手录的一律不碰**）
    // 2026-10-01：科奇 10-02（订购 25 送 3）/ 10-05（订购 30 送 2）两单，50 元餐标、12:00 用餐。
    // v2 (2026-10-01)：10-02 由「20 份送 1」改为「25 份送 2」
    // v3 (2026-10-01)：10-02 赠送 2 → 3（出餐 28）
    // 规则（两条路，别混）：
    //   ① _id 以 am_seed_ 开头 = **种子自己的记录** → 整条覆盖为最新种子值（改了种子才能真生效）
    //   ② 其余（用户手录，_id = am_<时间戳>）→ 按业务键「日期|客源|套餐」判重，已存在则**跳过，绝不覆盖**
    var bkSeeded = wx.getStorageSync('seed_bookings_injected_v3')
    if (!bkSeeded) {
      wx.removeStorageSync('seed_bookings_injected_v1')
      wx.removeStorageSync('seed_bookings_injected_v2')
      var _bkList = wx.getStorageSync('adultMeals') || []
      var _bkKeyOf = function (x) { return [x.date, x.customer, x.setmealId].join('|') }
      var _bkIdxById = {}
      var _bkSeen = {}
      _bkList.forEach(function (x, i) { _bkIdxById[x._id] = i; _bkSeen[_bkKeyOf(x)] = true })
      var _bkAdded = 0, _bkUpdated = 0
      SEED_ADULT_MEALS.forEach(function (b) {
        if (b._id in _bkIdxById) {
          _bkList[_bkIdxById[b._id]] = b       // 种子单 → 以种子为准整条覆盖
          _bkUpdated++
        } else if (!_bkSeen[_bkKeyOf(b)]) {
          _bkList.push(b)
          _bkSeen[_bkKeyOf(b)] = true
          _bkIdxById[b._id] = _bkList.length - 1
          _bkAdded++
        }
      })
      wx.setStorageSync('adultMeals', _bkList)
      wx.setStorageSync('seed_bookings_injected_v3', true)
      console.log('[App] 预定种子注入完成：新增 ' + _bkAdded + ' 条、更新 ' + _bkUpdated + ' 条，当前共 ' + _bkList.length + ' 条')
    }
  },

  /** 检查登录状态，未登录则跳转登录页 */
  checkLogin() {
    var userInfo = wx.getStorageSync('userInfo')
    var userRole = wx.getStorageSync('userRole')
    if (!userInfo || !userRole) {
      wx.reLaunch({ url: '/pages/login/login' })
      return false
    }
    return true
  },

  /** 检查登录状态 */
  checkLoginStatus() {
    var userInfo = wx.getStorageSync('userInfo')
    var userRole = wx.getStorageSync('userRole')
    if (userInfo && userRole) {
      this.globalData.userInfo = userInfo
      this.globalData.userRole = userRole
    }
  },

  /** 设置用户信息 */
  setUserInfo(userInfo, role, openid) {
    this.globalData.userInfo = userInfo
    this.globalData.userRole = role
    this.globalData.openid = openid || ''
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('userRole', role)
    if (openid) {
      wx.setStorageSync('openid', openid)
    }
  },

  /** 清除用户信息 */
  clearUserInfo() {
    this.globalData.userInfo = null
    this.globalData.userRole = ''
    this.globalData.openid = ''
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('userRole')
    wx.removeStorageSync('openid')
  },
})
