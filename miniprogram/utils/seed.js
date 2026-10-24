const SEED_MATERIALS = [
  {
    "_id": "mat_001",
    "name": "大米",
    "price": 5.39,
    "unit": "kg",
    "category": "主食",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_002",
    "name": "年糕条",
    "price": 10.5,
    "unit": "kg",
    "category": "主食",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_003",
    "name": "意面",
    "price": 16,
    "unit": "kg",
    "specQty": 12,
    "orderUnit": "箱",
      "spec": "2kg*6包",
    "category": "冻品",
    "supplier": "松食配送",
      "brand": "定制",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_004",
    "name": "薯条",
    "price": 8.75,
    "unit": "kg",
    "specQty": 12,
    "orderUnit": "箱",
    "category": "主食",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_005",
    "name": "面条",
    "price": 7.4,
    "unit": "kg",
    "category": "主食",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_006",
    "name": "大福",
    "price": 0.73,
    "unit": "个",
    "category": "其他",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 200,
    "remark": ""
  },
  {
    "_id": "mat_007",
    "name": "牛角包",
    "price": 1.3,
    "unit": "个",
    "category": "其他",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_008",
    "name": "饼",
    "price": 2,
    "unit": "个",
    "category": "其他",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_009",
    "name": "鸡蛋",
    "price": 10.96,
    "unit": "kg",
      "spec": "散装",
    "category": "禽类",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_010",
    "name": "打包盒",
    "price": 0.5,
    "unit": "个",
    "category": "包装",
    "supplier": "瑞淮",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 500,
    "remark": ""
  },
  {
    "_id": "mat_011",
    "name": "北极贝裙边",
    "price": 18,
    "unit": "kg",
    "specQty": 10,
    "orderUnit": "箱",
      "spec": "500g*20包",
    "category": "冻品",
    "supplier": "松食配送",
      "brand": "东北新福",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_012",
    "name": "咸味芝士蛋糕",
    "price": 4.75,
    "unit": "个",
    "specQty": 80,
      "spec": "380元/箱×80块",
    "category": "冻品",
    "supplier": "松食配送",
      "brand": "立高",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 80,
    "remark": "380元/箱 ÷ 80块 = 4.75元/块（2026-09-10 用户确认）；原 price 误记 47.5（=整箱价被当成单块价），已修正"
  },
  {
    "_id": "mat_013",
    "name": "土豆片",
    "price": 6.4,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_014",
    "name": "地道肠",
    "price": 1.425,
    "unit": "根",
    "specQty": 200,
    "category": "冻品",
    "supplier": "赛大厨",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 200,
    "remark": "松食报价 285元/箱(200根), 1.425元/根"
  },
  {
    "_id": "mat_015",
    "name": "培根",
    "price": 25.74,
    "unit": "kg",
    "specQty": 13.6,
    "orderUnit": "箱",
      "spec": "纯猪肉 1.7kg*8包",
    "category": "冻品",
    "supplier": "松食配送",
      "brand": "名右",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_016",
    "name": "大娘水饺",
    "price": 0.34,
    "unit": "个",
    "specQty": 390,
    "category": "未分类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 300,
    "remark": ""
  },
  {
    "_id": "mat_017",
    "name": "奥尔良烤翅",
    "price": 3.32,
    "unit": "kg",
    "category": "未分类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_018",
    "name": "小笼包",
    "price": 0.625,
    "unit": "个",
    "specQty": 320,
    "orderUnit": "箱",
    "category": "未分类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_019",
    "name": "披萨饼",
    "price": 3.75,
    "unit": "kg",
    "category": "未分类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_020",
    "name": "混合蔬菜",
    "price": 6.6,
    "unit": "kg",
    "category": "未分类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_021",
    "name": "葡式蛋挞",
    "price": 1.84,
    "unit": "个",
    "specQty": 180,
    "category": "未分类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 700,
    "remark": ""
  },
  {
    "_id": "mat_022",
    "name": "骨香鸡",
    "price": 19,
    "unit": "kg",
    "specQty": 10,
    "orderUnit": "箱",
    "category": "未分类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_023",
    "name": "鸡米花",
    "price": 16,
    "unit": "kg",
    "specQty": 10,
    "orderUnit": "箱",
      "spec": "1kg*10包",
    "category": "冻品",
    "supplier": "松食配送",
      "brand": "大成",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_024",
    "name": "水果",
    "price": 10,
    "unit": "kg",
    "category": "水果",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_025",
    "name": "沃柑",
    "price": 15.6,
    "unit": "kg",
    "category": "水果",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_026",
    "name": "火龙果",
    "price": 17.2,
    "unit": "kg",
    "category": "水果",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_027",
    "name": "葡萄干",
    "price": 34.4,
    "unit": "kg",
    "category": "调味品",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_028",
    "name": "西瓜",
    "price": 8,
    "unit": "kg",
    "category": "水果",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "2026-09-22 按松食现报价 8 元/公斤修正（原 21.6，疑为早期报价/净料折算，采购单与实际付款差 ¥286/百份）"
  },
  {
    "_id": "mat_030",
    "name": "章鱼丸子",
    "price": 2,
    "unit": "kg",
    "category": "海鲜",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_031",
    "name": "虾仁",
    "price": 0.5,
    "unit": "个",
    "specQty": 1000,
    "category": "海鲜",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 1000,
    "remark": ""
  },
  {
    "_id": "mat_032",
    "name": "金枪鱼",
    "price": 50,
    "unit": "kg",
    "category": "海鲜",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_033",
    "name": "冰粉",
    "price": 1.6,
    "unit": "包",
    "category": "甜品",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 100,
    "remark": "松食报价 160元/箱(100包), 1.6元/包"
  },
  {
    "_id": "mat_035",
    "name": "叉烧",
    "price": 32,
    "unit": "kg",
    "category": "肉类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_036",
    "name": "奥尔良鸡腿",
    "price": 4.15,
    "unit": "个",
    "category": "肉类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 700,
    "remark": ""
  },
  {
    "_id": "mat_037",
    "name": "半熟牛筋肉",
    "price": 56,
    "unit": "kg",
    "specQty": 10,
    "spec": "1kg*10包",
    "category": "冻品",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 10,
    "remark": "原牛腩位, 2026-08-28 SOP替换半熟牛筋肉: 松食配送560元/箱(1kg×10包=10kg)=56元/kg; 品牌千般就"
  },
  {
    "_id": "mat_038",
    "name": "韩国鱼饼",
    "price": 20.5,
    "unit": "kg",
    "specQty": 10,
    "orderUnit": "箱",
    "category": "海鲜",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_039",
    "name": "鳗鱼",
    "price": 45,
    "unit": "kg",
    "category": "肉类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_040",
    "name": "鸡丝",
    "price": 11.8,
    "unit": "kg",
    "specQty": 10,
    "orderUnit": "箱",
    "category": "肉类",
    "supplier": "赛大厨",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_041",
    "name": "鸡根",
    "price": 1.6,
    "unit": "个",
    "specQty": 130,
    "category": "肉类",
    "supplier": "赛大厨",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 130,
    "remark": ""
  },
  {
    "_id": "mat_042",
    "name": "卷心菜",
    "price": 4.2,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_043",
    "name": "卷心菜块",
    "price": 4.2,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_044",
    "name": "土豆丝",
    "price": 6.4,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_045",
    "name": "土豆块",
    "price": 6.4,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_046",
    "name": "大白菜丝",
    "price": 7,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_047",
    "name": "杏鲍菇丁",
    "price": 13.8,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_048",
    "name": "番茄块",
    "price": 20.2,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_049",
    "name": "胡萝卜丝",
    "price": 7.2,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_050",
    "name": "胡萝卜片",
    "price": 7.2,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_051",
    "name": "茭白丝",
    "price": 20,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_052",
    "name": "西兰花",
    "price": 15.2,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_053",
    "name": "青菜",
    "price": 4.2,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_054",
    "name": "青菜段",
    "price": 7.6,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_055",
    "name": "香菇丁",
    "price": 21.8,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_056",
    "name": "香菇丝",
    "price": 21.2,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_057",
    "name": "奶盖粉",
    "price": 45,
    "unit": "kg",
    "category": "奶制品",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_058",
    "name": "淡奶油",
    "price": 50.8,
    "unit": "kg",
    "category": "奶制品",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_059",
    "name": "白芝麻",
    "price": 29.4,
    "unit": "kg",
    "category": "调味品",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_060",
    "name": "肉酱",
    "price": 25,
    "unit": "kg",
    "specQty": 10,
    "orderUnit": "箱",
    "category": "调料",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_061",
    "name": "芝士",
    "price": 46,
    "unit": "kg",
    "specQty": 12,
    "orderUnit": "箱",
    "category": "奶制品",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_062",
    "name": "花生碎",
    "price": 30.2,
    "unit": "kg",
    "category": "调味品",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_063",
    "name": "牛奶",
    "price": 10,
    "unit": "kg",
    "category": "饮品",
    "supplier": "瑞淮",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": ""
  },
  {
    "_id": "mat_064",
    "name": "酸奶",
    "price": 0.9,
    "unit": "个",
    "category": "饮品",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 96,
    "remark": ""
  },
  {
    "_id": "mat_065",
    "name": "去皮鸡胸块",
    "price": 17,
    "unit": "kg",
    "category": "肉类",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·红烧鸡块主料(松食 17元/kg,2026-08-08 录入)"
  },
  {
    "_id": "mat_066",
    "name": "胡萝卜块",
    "price": 7.6,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·红烧鸡块配菜(2026-08-05 新增,单价待录入)"
  },
  {
    "_id": "mat_067",
    "name": "鳕鱼排",
    "price": 0.79,
    "unit": "个",
      "spec": "31g*200",
    "category": "海鲜",
    "supplier": "赛大厨",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 180,
    "remark": "儿童套餐·鳕鱼排主料(2026-08-05 新增,单价 0.88 元/份 来自 SOP)"
  },
  {
    "_id": "mat_068",
    "name": "青虾仁",
    "price": 45,
    "unit": "kg",
    "category": "海鲜",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·五彩河虾仁主料(2026-08-05 新增,单价待录入;区别于 mat_031 河虾仁按个计)"
  },
  {
    "_id": "mat_069",
    "name": "去骨五花肉",
    "price": 33.4,
    "unit": "kg",
    "spec": "120克/块",
    "category": "肉类",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "块",
    "specQty": 0.12,
    "remark": "儿童套餐·本帮红烧肉主料；2026-09-12 用户确认采购规格 120克/块（1块=0.12kg），订100份=100块=12kg；已配 specQty=0.12 让采购单按块算"
  },
  {
    "_id": "mat_070",
    "name": "番茄",
    "price": 20.2,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·番茄炒蛋主料(2026-08-05 新增,单价待录入)"
  },
  {
    "_id": "mat_071",
    "name": "生抽",
    "price": 10.23,
    "unit": "kg",
    "category": "调料",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "海天生抽 22.7元/桶(1.9L≈2.22kg) 折算kg价"
  },
  {
    "_id": "mat_072",
    "name": "老抽",
    "price": 5,
    "unit": "kg",
    "category": "调料",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "单价回填5元/kg(2026-09-12用户提供,松食配送);儿童套餐·经验配方补入(2026-08-05,用量与品种待 SOP 审核)"
  },
  {
    "_id": "mat_073",
    "name": "糖",
    "price": 9.4,
    "unit": "kg",
    "category": "调料",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "单价回填9.4元/kg(2026-09-12用户提供,好生活);儿童套餐·经验配方补入(2026-08-05,用量与品种待 SOP 审核)"
  },
  {
    "_id": "mat_074",
    "name": "盐",
    "price": 1.6,
    "unit": "kg",
    "category": "调料",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "单价回填1.6元/kg(2026-09-09用户拍板);儿童套餐·经验配方补入(2026-08-05,用量与品种待 SOP 审核)"
  },
  {
    "_id": "mat_075",
    "name": "油",
    "price": 9.5,
    "unit": "kg",
    "category": "调料",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "单价回填9.5元/kg(2026-09-12用户提供,好生活大豆油);儿童套餐·经验配方补入(2026-08-05,用量与品种待 SOP 审核)"
  },
  {
    "_id": "mat_076",
    "name": "葱",
    "price": 7,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·经验配方补入(2026-08-05,用量与品种待 SOP 审核)"
  },
  {
    "_id": "mat_077",
    "name": "姜",
    "price": 11.6,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·经验配方补入(2026-08-05,用量与品种待 SOP 审核)"
  },
  {
    "_id": "mat_078",
    "name": "蒜",
    "price": 15.2,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·经验配方补入(2026-08-05,用量与品种待 SOP 审核)"
  },
  {
    "_id": "mat_079",
    "name": "八角",
    "price": 137.4,
    "unit": "kg",
    "category": "调味品",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·本帮红烧肉香料(2026-08-05,用量与品种待 SOP 审核)"
  },
  {
    "_id": "mat_080",
    "name": "咖喱粉",
    "price": 30,
    "unit": "kg",
    "category": "调料",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·咖喱牛腩调料(2026-08-06 新增,单价估算)"
  },
  {
    "_id": "mat_081",
    "name": "黑木耳",
    "price": 104.4,
    "unit": "kg",
    "category": "调味品",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·手撕包菜配料(2026-08-06 新增,单价估算)"
  },
  {
    "_id": "mat_082",
    "name": "云丝",
    "price": 33,
    "unit": "kg",
    "category": "豆制品",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·香菜云丝主料(2026-08-06 新增,单价来自 SOP 33元/kg)"
  },
  {
    "_id": "mat_083",
    "name": "香菜",
    "price": 12,
    "unit": "kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "儿童套餐·香菜云丝配料(2026-08-06 新增,单价估算)"
  },
  {
    "_id": "mat_084",
    "name": "红曲米",
    "price": 14,
    "unit": "kg",
      "spec": "散称",
    "category": "调料",
    "supplier": "松食配送",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "松食模板 14元/KG(散称), 2026-08-08 录入原料库"
  },
  {
    "_id": "mat_085",
    "name": "牛肉片",
    "price": 48,
    "unit": "kg",
    "specQty": 10,
    "orderUnit": "箱",
      "spec": "1kg*10包",
    "category": "冻品",
    "supplier": "松食配送",
      "brand": "易太",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "松食模板 480元/箱(10kg)=48/kg, 2026-08-08 录入原料库"
  },
  {
    "_id": "mat_086",
    "name": "梅花味精",
    "price": 8,
    "unit": "kg",
      "spec": "25kg",
    "category": "调料",
    "supplier": "松食配送",
      "brand": "梅花",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "松食模板 200元/袋(25kg)=8/kg, 2026-08-08 录入原料库"
  },
  {
    "_id": "mat_087",
    "name": "番茄捞牛肉",
    "price": 23,
    "unit": "kg",
    "spec": "10kg/箱",
    "category": "肉类",
    "supplier": "松食配送",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "specQty": 10,
    "packQty": 10,
    "remark": "原名意面酱(2026-09-01 SOP截图新增);报价单原名:番茄捞牛肉,编码20260701001,230元/箱(10kg)=23元/kg,松食配送；2026-09-23 补 specQty=10 让建议采购量出「箱」（同时用于 dish_009/dish_010）"
  },
  {
    "_id": "mat_088",
    "name": "雪碧糖浆",
    "price": 18,
    "unit": "L",
    "spec": "10L/箱",
    "category": "饮品原料",
    "supplier": "申美",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 10,
    "remark": "报价单 雪碧糖浆 10L=180元=18元/L；快乐元气水-雪碧原料"
  },
  {
    "_id": "mat_089",
    "name": "可乐糖浆",
    "price": 16.5,
    "unit": "L",
    "spec": "20L/箱",
    "category": "饮品原料",
    "supplier": "申美",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 20,
    "remark": "报价单 可乐糖浆 20L=330元=16.5元/L；快乐元气水-可乐原料"
  },
  {
    "_id": "mat_090",
    "name": "零度可乐糖浆",
    "price": 18,
    "unit": "L",
    "spec": "10L/箱",
    "category": "饮品原料",
    "supplier": "申美",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 10,
    "remark": "报价单 零度可乐糖浆 10L=180元=18元/L；快乐元气水-无糖可乐原料"
  },
  {
    "_id": "mat_091",
    "name": "意式红标咖啡豆",
    "price": 129,
    "unit": "kg",
    "spec": "1kg/袋",
    "category": "饮品原料",
    "supplier": "瑞淮",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "袋",
    "packQty": 1,
    "remark": "报价单 意式红标咖啡豆 1kg=129元；现磨咖啡通用原料"
  },
  {
    "_id": "mat_092",
    "name": "椰子水",
    "price": 12,
    "unit": "kg",
    "spec": "12kg/箱",
    "category": "饮品原料",
    "supplier": "瑞淮",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 12,
    "remark": "报价单 椰子水 12kg/箱=144元=12元/kg；椰青美式原料"
  },
  {
    "_id": "mat_093",
    "name": "菲诺厚椰乳",
    "price": 12,
    "unit": "kg",
    "spec": "12kg/箱",
    "category": "饮品原料",
    "supplier": "瑞淮",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 12,
    "remark": "报价单 菲诺厚椰乳 12kg/箱=144元=12元/kg；椰乳拿铁/椰香奶茶原料"
  },
  {
    "_id": "mat_094",
    "name": "香水柠檬",
    "price": 23.33,
    "unit": "kg",
    "spec": "1.2kg/瓶",
    "category": "饮品原料",
    "supplier": "瑞淮",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "瓶",
    "packQty": 1.2,
    "remark": "报价单 香水柠檬 1.2kg/瓶=28元≈23.33元/kg；手作茶饮柠檬类原料"
  },
  {
    "_id": "mat_095",
    "name": "锡兰红茶",
    "price": 70,
    "unit": "kg",
    "spec": "500g/袋",
    "category": "饮品原料",
    "supplier": "",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "袋",
    "packQty": 0.5,
    "remark": "报价单 锡兰红茶 500g=35元=70元/kg；葡萄柠檬茶/椰香奶茶/焦糖奶茶原料；供应商待补"
  },
  {
    "_id": "mat_096",
    "name": "茉莉花茶",
    "price": 60,
    "unit": "kg",
    "spec": "500g/袋",
    "category": "饮品原料",
    "supplier": "瑞淮",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "袋",
    "packQty": 0.5,
    "remark": "报价单 茉莉花茶 500g=30元=60元/kg；茉香奶茶原料"
  },
  {
    "_id": "mat_097",
    "name": "杏鲍菇切片",
    "price": 13.4,
    "unit": "kg",
    "spec": "13.4元/kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "kg",
    "packQty": 1,
    "remark": "报价单 杏鲍菇切片 6.70元/斤×2=13.40元/kg(2026-09-03用户截图);新疆团50元套餐BOM原料;与mat_047杏鲍菇丁13.8/kg(切丁规格,不同形态)并存"
  },
  {
    "_id": "mat_098",
    "name": "青椒块",
    "price": 19.4,
    "unit": "kg",
    "spec": "19.4元/kg",
    "category": "蔬菜",
    "supplier": "好生活",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "kg",
    "packQty": 1,
    "remark": "报价单 青椒块 9.70元/斤×2=19.40元/kg(2026-09-03用户截图);新疆团50元套餐BOM原料"
  },
  {
    "_id": "mat_099",
    "name": "辣子鸡",
    "price": 14.5,
    "unit": "kg",
    "specQty": 10,
    "spec": "480元/箱(10kg)",
    "category": "冻品",
    "supplier": "松食配送",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "箱",
    "packQty": 10,
    "remark": "报价单 辣子鸡 480元/箱(10kg)=14.50元/kg(2026-09-03用户截图,待供应商核实);新疆团50元套餐BOM原料;类目按预加工调料估算,实际可能为冻品类"
  },
  {
    "_id": "mat_100",
    "name": "干辣椒段",
    "price": 48,
    "unit": "kg",
    "spec": "24元/斤",
    "category": "调料",
    "supplier": "好生活",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "kg",
    "packQty": 1,
    "remark": "报价单 干辣椒段 24元/斤×2=48.00元/kg(2026-09-03用户截图);新疆团50元套餐BOM原料"
  },
  {
    "_id": "mat_101",
    "name": "包装野山椒2kg*6包",
    "price": 6.2,
    "unit": "kg",
    "spec": "12.4元/包(2kg)",
    "category": "调料",
    "supplier": "好生活",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "包",
    "packQty": 2,
    "remark": "报价单 包装野山椒2kg*6包 12.40元/包(2kg)=6.20元/kg(2026-09-03用户截图);新疆团50元套餐BOM原料;箱规2kg*6包/箱"
  },
  {
    "_id": "mat_102",
    "name": "安佳车达芝士",
    "price": 70,
    "unit": "kg",
    "spec": "",
    "category": "奶制品",
    "supplier": "",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "kg",
    "packQty": 1,
    "remark": "芝士酱BOM原料(2026-09-09用户补价70元/kg);供应商/规格/包装待补报价单"
  },
  {
    "_id": "mat_103",
    "name": "安佳芝士片",
    "price": 70,
    "unit": "kg",
    "spec": "",
    "category": "奶制品",
    "supplier": "",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "kg",
    "packQty": 1,
    "remark": "芝士酱BOM原料(2026-09-09用户补价70元/kg);供应商/规格/包装待补报价单"
  },
  {
    "_id": "mat_104",
    "name": "黄油",
    "price": 120,
    "unit": "kg",
    "spec": "",
    "category": "奶制品",
    "supplier": "",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "kg",
    "packQty": 1,
    "remark": "芝士酱BOM原料(2026-09-09用户补价120元/kg);供应商/规格/包装待补报价单"
  },
  {
    "_id": "mat_105",
    "name": "玉米淀粉",
    "price": 0,
    "unit": "kg",
    "spec": "",
    "category": "调料",
    "supplier": "",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "kg",
    "packQty": 1,
    "remark": "芝士酱BOM原料(2026-09-09建库);单价暂记0待用户补报价单"
  },
  {
    "_id": "mat_106",
    "name": "奥尔良腌料",
    "price": 0,
    "unit": "kg",
    "spec": "",
    "category": "调料",
    "supplier": "",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "kg",
    "packQty": 1,
    "remark": "2026-09-10 补建：dish_002 奥尔良鸡根 BOM 已引用但原原料库缺失（采购单会落到未知供应商）；单价/供应商待补报价单"
  },
  {
    "_id": "mat_107",
    "name": "醋",
    "price": 0,
    "unit": "kg",
    "spec": "",
    "category": "调料",
    "supplier": "",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "orderUnit": "kg",
    "packQty": 1,
    "remark": "2026-09-10 补建：dish_041 香菜云丝 BOM 已引用但原原料库缺失；单价/供应商待补报价单"
  },
  {
    "_id": "mat_108",
    "name": "意大利通心形（弯管）面",
    "price": 20.6,
    "unit": "kg",
    "specQty": 10,
    "orderUnit": "箱",
    "spec": "500g*20包/箱",
    "category": "主食",
    "supplier": "好生活",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "2026-10-01 新增：dish_009 热熔芝士弯管意面专用（SOP 变更，原 BOM 误用料「意面」mat_003）。好生活报价单编码 40980945「意大利通心形（弯管）面500g*20包」10.3元/包 → 20.6元/kg（1箱=10kg）。形态与「意面」不同 → 独立原料，勿合并（形态铁律）。报价单为 2026-02 期，单价待最新报价确认"
  },
  {
    "_id": "mat_109",
    "name": "泡芙",
    "price": 145,
    "unit": "箱",
    "specQty": 1,
    "orderUnit": "箱",
    "spec": "",
    "category": "",
    "supplier": "松食配送",
    "brand": "",
    "initStock": 0,
    "inStock": 0,
    "outStock": 0,
    "curStock": 0,
    "minStock": 0,
    "remark": "2026-10-13 新增（用户拍板「按箱建档」）：松食配报价单物料编码 20260801003「泡芙」，本期报价 145 元/箱，单位=箱。⚠️ 报价单「规格」栏为空，8月总进货对账单（<8.1>R11、<8.4>R29）该行的规格/分类两列也填 0 ⇒ 「每箱几包、每包几个」在全项目数据源零命中。故 spec 留空、specQty=1（1箱=1箱）、unit=箱，均为「只能确定到箱」的口径，严禁猜数（「10包×10个」未经任何数据佐证）。采购实证：8/1、8/4 各采购 1 箱 × 145 = 145 元。规格确认后回填 spec/specQty，并同步 SEED_INVENTORY_MAP 的 factor；在此之前因无单位换算，不参与 BOM 用量与采购量抵扣"
  }
];

const SEED_DISHES = [
  {
    "_id": "dish_001",
    "dishName": "鱼香肉丝",
      "hideInOrder": true,
      "dishCategory": "其他",
    "packageType": "团队套餐",
    "sellPrice": 28,
    "bomList": [
      {
        "name": "大米",
        "useNum": 0.15,
        "price": 5.39,
        "unit": "kg",
        "cost": 0.8085
      },
      {
        "name": "打包盒",
        "useNum": 1,
        "price": 0.5,
        "unit": "个",
        "cost": 0.5
      },
      {
        "name": "鸡丝",
        "useNum": 0.1,
        "price": 11.8,
        "unit": "kg",
        "cost": 1.18
      },
      {
        "name": "土豆丝",
        "useNum": 0.12,
        "price": 6.4,
        "unit": "kg",
        "cost": 0.768
      },
      {
        "name": "胡萝卜丝",
        "useNum": 0.05,
        "price": 7.2,
        "unit": "kg",
        "cost": 0.36
      },
      {
        "name": "茭白丝",
        "useNum": 0.05,
        "price": 20,
        "unit": "kg",
        "cost": 1
      },
      {
        "name": "青菜",
        "useNum": 0.15,
        "price": 4.2,
        "unit": "kg",
        "cost": 0.63
      },
      {
        "name": "酸奶",
        "useNum": 1,
        "price": 0.9,
        "unit": "个",
        "cost": 0.9
      }
    ],
    "totalCost": 6.1465,
    "profit": 21.8535,
    "grossRate": 0.7805
  },
  {
    "_id": "dish_002",
    "dishName": "奥尔良鸡根",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "鸡根",
        "useNum": 2,
        "price": 1.6,
        "unit": "个",
        "cost": 3.2
      },
      {
        "name": "奥尔良腌料",
        "useNum": 0.005,
        "price": 0,
        "unit": "kg",
        "cost": 0
      },
      {
        "name": "油",
        "useNum": 0.003,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.0285
      }
    ],
    "totalCost": 3.2285,
    "profit": -3.2285,
    "grossRate": 0,
    "remark": "成人套餐组件(38元B套+58元A套共用)·覆盖旧奥尔良鸡根;鸡根2个/份(2026-08-06确认);腌料/油为经验值"
  },
  {
    "_id": "dish_003",
    "dishName": "红烧牛腩",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "半熟牛筋肉",
        "useNum": 0.08,
        "price": 56,
        "unit": "kg",
        "cost": 4.48
      },
      {
        "name": "土豆块",
        "useNum": 0.05,
        "price": 6.4,
        "unit": "kg",
        "cost": 0.32
      },
      {
        "name": "胡萝卜块",
        "useNum": 0.02,
        "price": 7.6,
        "unit": "kg",
        "cost": 0.152
      },
      {
        "name": "生抽",
        "useNum": 0.005,
        "price": 10.23,
        "unit": "kg",
        "cost": 0.0512
      },
      {
        "name": "老抽",
        "useNum": 0.003,
        "price": 5,
        "unit": "kg",
        "cost": 0.015
      },
      {
        "name": "糖",
        "useNum": 0.003,
        "price": 9.4,
        "unit": "kg",
        "cost": 0.0282
      },
      {
        "name": "葱",
        "useNum": 0.003,
        "price": 7,
        "unit": "kg",
        "cost": 0.021
      },
      {
        "name": "姜",
        "useNum": 0.002,
        "price": 11.6,
        "unit": "kg",
        "cost": 0.0232
      },
      {
        "name": "油",
        "useNum": 0.005,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.0475
      }
    ],
    "totalCost": 5.1381,
    "profit": -5.1381,
    "grossRate": 0,
    "remark": "成人套餐组件(58元A套主菜)·覆盖旧红烧牛腩;旧版鸡蛋/鸡根/番茄/青菜四项已删除(2026-08-06确认);调料为经验值"
  },
  {
    "_id": "dish_004",
    "dishName": "鱼香鸡丝饭配汤",
      "dishCategory": "经典主食",
    "packageType": "SOP",
    "sellPrice": 35,
    "bomList": [
      {
        "name": "大米",
        "useNum": 0.15,
        "price": 5.39,
        "unit": "kg",
        "cost": 0.8085
      },
      {
        "name": "鸡丝",
        "useNum": 0.1,
        "price": 11.8,
        "unit": "kg",
        "cost": 1.18
      },
      {
        "name": "卷心菜",
        "useNum": 0.1,
        "price": 4.2,
        "unit": "kg",
        "cost": 0.42
      },
      {
        "name": "胡萝卜丝",
        "useNum": 0.05,
        "price": 7.2,
        "unit": "kg",
        "cost": 0.36
      },
      {
        "name": "胡萝卜片",
        "useNum": 0.05,
        "price": 7.2,
        "unit": "kg",
        "cost": 0.36
      },
      {
        "name": "茭白丝",
        "useNum": 0.05,
        "price": 20,
        "unit": "kg",
        "cost": 1
      }
    ],
    "totalCost": 4.1285,
    "profit": 30.8715,
    "grossRate": 0.8826
  },
  {
    "_id": "dish_005",
    "dishName": "水果碗",
      "dishCategory": "缤纷小食",
    "packageType": "SOP",
    "sellPrice": 18,
    "bomList": [
      {
        "name": "沃柑",
        "useNum": 0.02,
        "price": 15.6,
        "unit": "kg",
        "cost": 0.312
      },
      {
        "name": "火龙果",
        "useNum": 0.015,
        "price": 17.2,
        "unit": "kg",
        "cost": 0.258
      },
      {
        "name": "西瓜",
        "useNum": 0.21,
        "price": 8,
        "unit": "kg",
        "cost": 1.68
      }
    ],
    "totalCost": 2.25,
    "profit": 15.75,
    "grossRate": 0.875
  },
  {
    "_id": "dish_006",
    "dishName": "咖喱牛腩饭(旧版)",
      "hideInOrder": true,
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 55,
    "bomList": [
      {
        "name": "大米",
        "useNum": 0.15,
        "price": 5.39,
        "unit": "kg",
        "cost": 0.8085
      },
      {
        "name": "半熟牛筋肉",
        "useNum": 0.15,
        "price": 56,
        "unit": "kg",
        "cost": 8.4
      },
      {
        "name": "卷心菜",
        "useNum": 0.1,
        "price": 4.2,
        "unit": "kg",
        "cost": 0.42
      },
      {
        "name": "土豆块",
        "useNum": 0.1,
        "price": 6.4,
        "unit": "kg",
        "cost": 0.64
      },
      {
        "name": "胡萝卜片",
        "useNum": 0.05,
        "price": 7.2,
        "unit": "kg",
        "cost": 0.36
      }
    ],
    "totalCost": 10.6285,
    "profit": 44.3715,
    "grossRate": 0.8068
  },
  {
    "_id": "dish_007",
    "dishName": "红烧牛肉面",
      "dishCategory": "现煮面食",
    "packageType": "SOP",
    "sellPrice": 55,
    "bomList": [
      {
        "name": "面条",
        "useNum": 0.15,
        "price": 7.4,
        "unit": "kg",
        "cost": 1.11
      },
      {
        "name": "半熟牛筋肉",
        "useNum": 0.15,
        "price": 56,
        "unit": "kg",
        "cost": 8.4
      },
      {
        "name": "杏鲍菇丁",
        "useNum": 0.05,
        "price": 13.8,
        "unit": "kg",
        "cost": 0.69
      },
      {
        "name": "青菜",
        "useNum": 0.1,
        "price": 4.2,
        "unit": "kg",
        "cost": 0.42
      }
    ],
    "totalCost": 10.62,
    "profit": 44.38,
    "grossRate": 0.8069
  },
  {
    "_id": "dish_008",
    "dishName": "鲍汁双菇面",
      "dishCategory": "现煮面食",
    "packageType": "SOP",
    "sellPrice": 32,
    "bomList": [
      {
        "name": "面条",
        "useNum": 0.15,
        "price": 7.4,
        "unit": "kg",
        "cost": 1.11
      },
      {
        "name": "杏鲍菇丁",
        "useNum": 0.1,
        "price": 13.8,
        "unit": "kg",
        "cost": 1.38
      },
      {
        "name": "青菜段",
        "useNum": 0.1,
        "price": 7.6,
        "unit": "kg",
        "cost": 0.76
      },
      {
        "name": "香菇丁",
        "useNum": 0.1,
        "price": 21.8,
        "unit": "kg",
        "cost": 2.18
      }
    ],
    "totalCost": 5.43,
    "profit": 26.57,
    "grossRate": 0.8303
  },
  {
    "_id": "dish_009",
    "dishName": "热熔芝士弯管意面",
      "printMark": true,
      "dishCategory": "西式主食",
    "packageType": "单品",
    "sellPrice": 55,
    "bomList": [
      {
        "name": "意大利通心形（弯管）面",
        "useNum": 0.1,
        "price": 20.6,
        "unit": "kg",
        "cost": 2.06
      },
      {
        "name": "番茄捞牛肉",
        "useNum": 0.2,
        "price": 23,
        "unit": "kg",
        "cost": 4.6
      },
      {
        "name": "芝士",
        "useNum": 0.1,
        "price": 46,
        "unit": "kg",
        "cost": 4.6
      }
    ],
    "totalCost": 11.26,
    "profit": 43.74,
    "grossRate": 0.7953,
    "remark": "2026-10-01 SOP 变更（用户报单）：用料「意面」→「意大利通心形（弯管）面」(mat_108, 好生活 500g*20包/箱)，每份 100g（原 0.15kg）。成本 2.4→2.06"
  },
  {
    "_id": "dish_010",
    "dishName": "高温脆薯肉酱薯条",
      "printMark": true,
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 22,
    "bomList": [
      {
        "name": "薯条",
        "useNum": 0.15,
        "price": 8.75,
        "unit": "kg",
        "cost": 1.3125
      },
      {
        "name": "番茄捞牛肉",
        "useNum": 0.1,
        "price": 23,
        "unit": "kg",
        "cost": 2.3
      }
    ],
    "totalCost": 3.6125,
    "profit": 18.3875,
    "grossRate": 0.8358
  },
  {
    "_id": "dish_011",
    "dishName": "炙焰焓变鳗鱼饭",
      "printMark": true,
      "dishCategory": "西式主食",
    "packageType": "单品",
    "sellPrice": 88,
    "bomList": [
      {
        "name": "大米",
        "useNum": 0.15,
        "price": 5.39,
        "unit": "kg",
        "cost": 0.8085
      },
      {
        "name": "水果",
        "useNum": 0.1,
        "price": 10,
        "unit": "kg",
        "cost": 1
      },
      {
        "name": "章鱼丸子",
        "useNum": 0.47,
        "price": 2,
        "unit": "kg",
        "cost": 0.94
      },
      {
        "name": "鳗鱼",
        "useNum": 0.33,
        "price": 45,
        "unit": "kg",
        "cost": 14.85
      },
      {
        "name": "卷心菜",
        "useNum": 0.1,
        "price": 4.2,
        "unit": "kg",
        "cost": 0.42
      },
      {
        "name": "西兰花",
        "useNum": 0.05,
        "price": 15.2,
        "unit": "kg",
        "cost": 0.76
      }
    ],
    "totalCost": 18.7785,
    "profit": 69.2215,
    "grossRate": 0.7877
  },
  {
    "_id": "dish_012",
    "dishName": "儿童餐",
      "hideInOrder": true,
      "dishCategory": "其他",
    "packageType": "单品",
    "sellPrice": 38,
    "bomList": [
      {
        "name": "意面",
        "useNum": 0.075,
        "price": 16,
        "unit": "kg",
        "cost": 1.2
      },
      {
        "name": "大福",
        "useNum": 2,
        "price": 0.73,
        "unit": "个",
        "cost": 1.46
      },
      {
        "name": "牛角包",
        "useNum": 1,
        "price": 1.3,
        "unit": "个",
        "cost": 1.3
      },
      {
        "name": "金枪鱼",
        "useNum": 0.02,
        "price": 50,
        "unit": "kg",
        "cost": 1
      },
      {
        "name": "叉烧",
        "useNum": 0.025,
        "price": 32,
        "unit": "kg",
        "cost": 0.8
      },
      {
        "name": "肉酱",
        "useNum": 0.025,
        "price": 25,
        "unit": "kg",
        "cost": 0.625
      },
      {
        "name": "芝士",
        "useNum": 0.05,
        "price": 46,
        "unit": "kg",
        "cost": 2.3
      }
    ],
    "totalCost": 8.685,
    "profit": 29.315,
    "grossRate": 0.7714
  },
  {
    "_id": "dish_013",
    "dishName": "冰点凝固冰粉",
      "printMark": true,
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 18,
    "bomList": [
      {
        "name": "冰粉",
        "useNum": 1,
        "price": 1.6,
        "unit": "包",
        "cost": 1.6
      }
    ],
    "totalCost": 1.6,
    "profit": 16.4,
    "grossRate": 0.9111
  },
  {
    "_id": "dish_014",
    "dishName": "热力球形章鱼小丸子",
      "hideInOrder": true,
      "dishCategory": "其他",
    "packageType": "单品",
    "sellPrice": 16,
    "bomList": [
      {
        "name": "章鱼丸子",
        "useNum": 0.47,
        "price": 2,
        "unit": "kg",
        "cost": 0.94
      }
    ],
    "totalCost": 0.94,
    "profit": 15.06,
    "grossRate": 0.9413
  },
  {
    "_id": "dish_015",
    "dishName": "辣炒鱼饼年糕",
      "dishCategory": "现煮面食",
    "packageType": "单品",
    "sellPrice": 28,
    "bomList": [
      {
        "name": "年糕条",
        "useNum": 0.25,
        "price": 10.5,
        "unit": "kg",
        "cost": 2.625
      },
      {
        "name": "韩国鱼饼",
        "useNum": 0.05,
        "price": 20.5,
        "unit": "kg",
        "cost": 1.025
      },
      {
        "name": "芝士",
        "useNum": 0.02,
        "price": 46,
        "unit": "kg",
        "cost": 0.92
      }
    ],
    "totalCost": 4.57,
    "profit": 23.43,
    "grossRate": 0.8368
  },
  {
    "_id": "dish_016",
    "dishName": "奶盖小丸子",
      "printMark": true,
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 22,
    "bomList": [
      {
        "name": "大福",
        "useNum": 3,
        "price": 0.73,
        "unit": "个",
        "cost": 2.19
      },
      {
        "name": "奶盖粉",
        "useNum": 0.015,
        "price": 45,
        "unit": "kg",
        "cost": 0.675
      },
      {
        "name": "淡奶油",
        "useNum": 0.015,
        "price": 50.8,
        "unit": "kg",
        "cost": 0.762
      },
      {
        "name": "牛奶",
        "useNum": 0.015,
        "price": 10,
        "unit": "kg",
        "cost": 0.15
      }
    ],
    "totalCost": 3.777,
    "profit": 18.223,
    "grossRate": 0.8283
  },
  {
    "_id": "dish_017",
    "dishName": "奶油海鲜意面",
      "hideInOrder": true,
      "dishCategory": "其他",
    "packageType": "单品",
    "sellPrice": 52,
    "bomList": [
      {
        "name": "意面",
        "useNum": 0.15,
        "price": 16,
        "unit": "kg",
        "cost": 2.4
      },
      {
        "name": "北极贝裙边",
        "useNum": 0.01,
        "price": 18,
        "unit": "kg",
        "cost": 0.18
      },
      {
        "name": "虾仁",
        "useNum": 5,
        "price": 0.5,
        "unit": "个",
        "cost": 2.5
      },
      {
        "name": "淡奶油",
        "useNum": 0.02,
        "price": 50.8,
        "unit": "kg",
        "cost": 1.016
      },
      {
        "name": "肉酱",
        "useNum": 0.1,
        "price": 25,
        "unit": "kg",
        "cost": 2.5
      }
    ],
    "totalCost": 8.596,
    "profit": 43.404,
    "grossRate": 0.8347
  },
  {
    "_id": "dish_018",
    "dishName": "奥尔良烤鸡腿饭配汤",
      "dishCategory": "经典主食",
    "packageType": "SOP",
    "sellPrice": 42,
    "bomList": [
      {
        "name": "奥尔良鸡腿",
        "useNum": 1,
        "price": 4.15,
        "unit": "个",
        "cost": 4.15
      },
      {
        "name": "青菜段",
        "useNum": 0.1,
        "price": 7.6,
        "unit": "kg",
        "cost": 0.76
      }
    ],
    "totalCost": 4.91,
    "profit": 37.09,
    "grossRate": 0.8831
  },
  {
    "_id": "dish_019",
    "dishName": "虾仁培根炒饭",
      "dishCategory": "经典主食",
    "packageType": "SOP",
    "sellPrice": 48,
    "bomList": [
      {
        "name": "北极贝裙边",
        "useNum": 0.2,
        "price": 18,
        "unit": "kg",
        "cost": 3.6
      },
      {
        "name": "培根",
        "useNum": 0.02,
        "price": 25.74,
        "unit": "kg",
        "cost": 0.5148
      },
      {
        "name": "混合蔬菜",
        "useNum": 0.05,
        "price": 6.6,
        "unit": "kg",
        "cost": 0.33
      },
      {
        "name": "虾仁",
        "useNum": 4,
        "price": 0.5,
        "unit": "个",
        "cost": 2
      },
      {
        "name": "大米",
        "useNum": 0.15,
        "price": 5.39,
        "unit": "kg",
        "cost": 0.8085
      }
    ],
    "totalCost": 7.2533,
    "profit": 40.7467,
    "grossRate": 0.8489
  },
  {
    "_id": "dish_020",
    "dishName": "意式肉酱面(单品)",
      "dishCategory": "西式主食",
    "packageType": "SOP",
    "sellPrice": 52,
    "hideInOrder": true,
    "bomList": [
      {
        "name": "意面",
        "useNum": 0.268,
        "price": 16,
        "unit": "kg",
        "cost": 4.288
      },
      {
        "name": "番茄捞牛肉",
        "useNum": 0.2,
        "price": 23,
        "unit": "kg",
        "cost": 4.6
      }
    ],
    "totalCost": 8.888,
    "profit": 43.112,
    "grossRate": 0.8291,
    "remark": "配汤:罗宋汤(dish_024),两菜独立、套餐搭配时单独计;意面用量0.15→0.268、增番茄捞牛肉(mat_087,2026-09-01按SOP截图,同日报价单补溯源)"
  },
  {
    "_id": "dish_059",
    "dishName": "意大利肉酱面配汤",
      "dishCategory": "西式主食",
    "packageType": "SOP",
    "sellPrice": 52,
    "bomList": [
      {
        "name": "意面",
        "useNum": 0.268,
        "price": 16,
        "unit": "kg",
        "cost": 4.288
      },
      {
        "name": "番茄捞牛肉",
        "useNum": 0.2,
        "price": 23,
        "unit": "kg",
        "cost": 4.6
      },
      {
        "name": "土豆片",
        "useNum": 0.05,
        "price": 6.4,
        "unit": "kg",
        "cost": 0.32
      },
      {
        "name": "培根",
        "useNum": 0.01,
        "price": 25.74,
        "unit": "kg",
        "cost": 0.2574
      },
      {
        "name": "卷心菜",
        "useNum": 0.05,
        "price": 4.2,
        "unit": "kg",
        "cost": 0.21
      },
    ],
    "totalCost": 9.6754,
    "profit": 42.3246,
    "grossRate": 0.8143,
    "remark": "意式肉酱面(dish_020)+罗宋汤(dish_024)组合 · 2026-09-13 新增单人套餐, 52元 · 2026-09-13 去掉大米(意面配汤不含饭)"
  },
  {
    "_id": "dish_021",
    "dishName": "美式培根烤披萨",
      "dishCategory": "西式主食",
    "packageType": "单品",
    "sellPrice": 58,
    "bomList": [
      {
        "name": "培根",
        "useNum": 0.05,
        "price": 25.74,
        "unit": "kg",
        "cost": 1.287
      },
      {
        "name": "披萨饼",
        "useNum": 1,
        "price": 3.75,
        "unit": "kg",
        "cost": 3.75
      },
      {
        "name": "混合蔬菜",
        "useNum": 0.05,
        "price": 6.6,
        "unit": "kg",
        "cost": 0.33
      },
      {
        "name": "芝士",
        "useNum": 0.1,
        "price": 46,
        "unit": "kg",
        "cost": 4.6
      }
    ],
    "totalCost": 9.967,
    "profit": 48.033,
    "grossRate": 0.8282
  },
  {
    "_id": "dish_022",
    "dishName": "白菜猪肉水饺",
      "dishCategory": "现煮面食",
    "packageType": "单品",
    "sellPrice": 28,
    "bomList": [
      {
        "name": "大娘水饺",
        "useNum": 10,
        "price": 0.34,
        "unit": "个",
        "cost": 3.4
      }
    ],
    "totalCost": 3.4,
    "profit": 24.6,
    "grossRate": 0.8786
  },
  {
    "_id": "dish_023",
    "dishName": "蛋挞",
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 6,
    "bomList": [
      {
        "name": "葡式蛋挞",
        "useNum": 2,
        "price": 1.84,
        "unit": "个",
        "cost": 3.68
      }
    ],
    "totalCost": 3.68,
    "profit": 2.32,
    "grossRate": 0.3867
  },
  {
    "_id": "dish_024",
    "dishName": "罗宋汤",
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 8,
    "bomList": [
      {
        "name": "土豆片",
        "useNum": 0.05,
        "price": 6.4,
        "unit": "kg",
        "cost": 0.32
      },
      {
        "name": "培根",
        "useNum": 0.01,
        "price": 25.74,
        "unit": "kg",
        "cost": 0.2574
      },
      {
        "name": "卷心菜",
        "useNum": 0.05,
        "price": 4.2,
        "unit": "kg",
        "cost": 0.21
      }
    ],
    "totalCost": 0.7874,
    "profit": 7.2126,
    "grossRate": 0.9016
  },
  {
    "_id": "dish_025",
    "dishName": "鸡米花",
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 15,
    "bomList": [
      {
        "name": "鸡米花",
        "useNum": 0.25,
        "price": 16,
        "unit": "kg",
        "cost": 4
      }
    ],
    "totalCost": 4,
    "profit": 11,
    "grossRate": 0.7333
  },
  {
    "_id": "dish_026",
    "dishName": "上海小笼包",
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 16,
    "bomList": [
      {
        "name": "小笼包",
        "useNum": 4,
        "price": 0.625,
        "unit": "个",
        "cost": 2.5
      }
    ],
    "totalCost": 2.5,
    "profit": 13.5,
    "grossRate": 0.8438
  },
  {
    "_id": "dish_027",
    "dishName": "地道肠",
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 18,
    "bomList": [
      {
        "name": "地道肠",
        "useNum": 2,
        "price": 1.425,
        "unit": "根",
        "cost": 2.85
      }
    ],
    "totalCost": 2.85,
    "profit": 15.15,
    "grossRate": 0.8417
  },
  {
    "_id": "dish_028",
    "dishName": "奥尔良烤翅",
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 25,
    "bomList": [
      {
        "name": "奥尔良烤翅",
        "useNum": 2,
        "price": 3.32,
        "unit": "kg",
        "cost": 6.64
      }
    ],
    "totalCost": 6.64,
    "profit": 18.36,
    "grossRate": 0.7344
  },
  {
    "_id": "dish_029",
    "dishName": "奥尔良烤全腿",
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 25,
    "bomList": [
      {
        "name": "奥尔良鸡腿",
        "useNum": 1,
        "price": 4.15,
        "unit": "个",
        "cost": 4.15
      }
    ],
    "totalCost": 4.15,
    "profit": 20.85,
    "grossRate": 0.834
  },
  {
    "_id": "dish_030",
    "dishName": "炸鸡配年糕",
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 25,
    "bomList": [
      {
        "name": "年糕条",
        "useNum": 0.05,
        "price": 10.5,
        "unit": "kg",
        "cost": 0.525
      },
      {
        "name": "骨香鸡",
        "useNum": 0.25,
        "price": 19,
        "unit": "kg",
        "cost": 4.75
      }
    ],
    "totalCost": 5.275,
    "profit": 19.725,
    "grossRate": 0.789
  },
  {
    "_id": "dish_031",
    "dishName": "芝士蛋糕",
      "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 28,
    "bomList": [
      {
        "name": "咸味芝士蛋糕",
        "useNum": 1,
        "price": 4.75,
        "unit": "个",
        "cost": 4.75
      }
    ],
    "totalCost": 4.75,
    "profit": 23.25,
    "grossRate": 0.8304
  },
  {
    "_id": "dish_032",
    "dishName": "红烧鸡块",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "去皮鸡胸块",
        "useNum": 0.1,
        "price": 17,
        "unit": "kg",
        "cost": 1.7
      },
      {
        "name": "土豆块",
        "useNum": 0.05,
        "price": 6.4,
        "unit": "kg",
        "cost": 0.32
      },
      {
        "name": "胡萝卜块",
        "useNum": 0.01,
        "price": 7.6,
        "unit": "kg",
        "cost": 0.076
      },
      {
        "name": "生抽",
        "useNum": 0.005,
        "price": 10.23,
        "unit": "kg",
        "cost": 0.0512
      },
      {
        "name": "老抽",
        "useNum": 0.003,
        "price": 5,
        "unit": "kg",
        "cost": 0.015
      },
      {
        "name": "糖",
        "useNum": 0.005,
        "price": 9.4,
        "unit": "kg",
        "cost": 0.047
      },
      {
        "name": "油",
        "useNum": 0.01,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.095
      },
      {
        "name": "葱",
        "useNum": 0.005,
        "price": 7,
        "unit": "kg",
        "cost": 0.035
      },
      {
        "name": "姜",
        "useNum": 0.003,
        "price": 11.6,
        "unit": "kg",
        "cost": 0.0348
      }
    ],
    "totalCost": 2.374,
    "profit": -2.374,
    "grossRate": 0,
    "remark": "儿童套餐组件(50元C套主菜)·调料用量为经验值,待 SOP 审核;去皮鸡胸块单价已录(松食17/kg)"
  },
  {
    "_id": "dish_033",
    "dishName": "鳕鱼排",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "鳕鱼排",
        "useNum": 2,
        "price": 0.79,
        "unit": "个",
        "cost": 1.58
      },
      {
        "name": "盐",
        "useNum": 0.002,
        "price": 1.6,
        "unit": "kg",
        "cost": 0.0032
      },
      {
        "name": "油",
        "useNum": 0.01,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.095
      }
    ],
    "totalCost": 1.6782,
    "profit": -1.6782,
    "grossRate": 0,
    "remark": "儿童套餐组件(50元C套+58元B套共用)·鳕鱼排 2 块/份,SOP 截图已给单价 0.88 元/份;盐/油用量为经验值"
  },
  {
    "_id": "dish_034",
    "dishName": "五彩河虾仁",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "青虾仁",
        "useNum": 0.1,
        "price": 45,
        "unit": "kg",
        "cost": 4.5
      },
      {
        "name": "混合蔬菜",
        "useNum": 0.05,
        "price": 6.6,
        "unit": "kg",
        "cost": 0.33
      },
      {
        "name": "盐",
        "useNum": 0.002,
        "price": 1.6,
        "unit": "kg",
        "cost": 0.0032
      },
      {
        "name": "油",
        "useNum": 0.01,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.095
      },
      {
        "name": "蒜",
        "useNum": 0.005,
        "price": 15.2,
        "unit": "kg",
        "cost": 0.076
      }
    ],
    "totalCost": 5.0042,
    "profit": -5.0042,
    "grossRate": 0,
    "remark": "儿童套餐组件(68元F套主菜)·青虾仁45元/kg(2026-08-06确认)·盐/油/蒜用量为经验值"
  },
  {
    "_id": "dish_035",
    "dishName": "本帮红烧肉",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "去骨五花肉",
        "useNum": 0.12,
        "price": 33.4,
        "unit": "kg",
        "cost": 4.008
      },
      {
        "name": "生抽",
        "useNum": 0.008,
        "price": 10.23,
        "unit": "kg",
        "cost": 0.0818
      },
      {
        "name": "老抽",
        "useNum": 0.005,
        "price": 5,
        "unit": "kg",
        "cost": 0.025
      },
      {
        "name": "糖",
        "useNum": 0.01,
        "price": 9.4,
        "unit": "kg",
        "cost": 0.094
      },
      {
        "name": "油",
        "useNum": 0.01,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.095
      },
      {
        "name": "葱",
        "useNum": 0.005,
        "price": 7,
        "unit": "kg",
        "cost": 0.035
      },
      {
        "name": "姜",
        "useNum": 0.003,
        "price": 11.6,
        "unit": "kg",
        "cost": 0.0348
      }
    ],
    "totalCost": 4.3736,
    "profit": -4.3736,
    "grossRate": 0,
    "remark": "儿童套餐组件(68元F套配菜)·五花肉37.6元/kg(2026-08-06确认);所有调料用量为经验值"
  },
  {
    "_id": "dish_036",
    "dishName": "番茄炒蛋",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "番茄",
        "useNum": 0.08,
        "price": 20.2,
        "unit": "kg",
        "cost": 1.616
      },
      {
        "name": "鸡蛋",
        "useNum": 0.08,
        "price": 10.96,
        "unit": "kg",
        "cost": 0.8768
      },
      {
        "name": "糖",
        "useNum": 0.005,
        "price": 9.4,
        "unit": "kg",
        "cost": 0.047
      },
      {
        "name": "葱",
        "useNum": 0.005,
        "price": 7,
        "unit": "kg",
        "cost": 0.035
      },
      {
        "name": "盐",
        "useNum": 0.001,
        "price": 1.6,
        "unit": "kg",
        "cost": 0.0016
      }
    ],
    "totalCost": 2.5764,
    "profit": -2.5764,
    "grossRate": 0,
    "remark": "儿童套餐组件(58元A套+68元F套共用)·已确认 0.08+0.08=番茄+鸡蛋,调料用量经审核通过;番茄单价待录入"
  },
  {
    "_id": "dish_037",
    "dishName": "时蔬(青菜段)",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "青菜段",
        "useNum": 0.15,
        "price": 7.6,
        "unit": "kg",
        "cost": 1.14
      },
      {
        "name": "油",
        "useNum": 0.005,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.0475
      },
      {
        "name": "蒜",
        "useNum": 0.003,
        "price": 15.2,
        "unit": "kg",
        "cost": 0.0456
      },
      {
        "name": "盐",
        "useNum": 0.001,
        "price": 1.6,
        "unit": "kg",
        "cost": 0.0016
      }
    ],
    "totalCost": 1.2347,
    "profit": -1.2347,
    "grossRate": 0,
    "remark": "儿童套餐共享组件·5套新套餐(38/50/58A/58B/68元)全部共用·青菜段单价5.4元/kg已有;用量0.15kg为推定值(炒后约100g),待确认"
  },
  {
    "_id": "dish_038",
    "dishName": "咖喱牛腩",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "半熟牛筋肉",
        "useNum": 0.08,
        "price": 56,
        "unit": "kg",
        "cost": 4.48
      },
      {
        "name": "土豆块",
        "useNum": 0.05,
        "price": 6.4,
        "unit": "kg",
        "cost": 0.32
      },
      {
        "name": "胡萝卜块",
        "useNum": 0.02,
        "price": 7.6,
        "unit": "kg",
        "cost": 0.152
      },
      {
        "name": "咖喱粉",
        "useNum": 0.015,
        "price": 30,
        "unit": "kg",
        "cost": 0.45
      },
      {
        "name": "油",
        "useNum": 0.005,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.0475
      },
      {
        "name": "盐",
        "useNum": 0.002,
        "price": 1.6,
        "unit": "kg",
        "cost": 0.0032
      },
      {
        "name": "生抽",
        "useNum": 0.003,
        "price": 10.23,
        "unit": "kg",
        "cost": 0.0307
      },
      {
        "name": "葱",
        "useNum": 0.003,
        "price": 7,
        "unit": "kg",
        "cost": 0.021
      },
      {
        "name": "姜",
        "useNum": 0.002,
        "price": 11.6,
        "unit": "kg",
        "cost": 0.0232
      }
    ],
    "totalCost": 5.5276,
    "profit": -5.5276,
    "grossRate": 0,
    "remark": "成人套餐组件(58元B套主菜)·牛腩+土豆+胡萝卜同红烧牛腩,调料改咖喱粉;咖喱粉单价估算"
  },
  {
    "_id": "dish_039",
    "dishName": "白菜香菇肉丝",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "大白菜丝",
        "useNum": 0.1,
        "price": 7,
        "unit": "kg",
        "cost": 0.7
      },
      {
        "name": "鸡丝",
        "useNum": 0.05,
        "price": 11.8,
        "unit": "kg",
        "cost": 0.59
      },
      {
        "name": "香菇丝",
        "useNum": 0.01,
        "price": 21.2,
        "unit": "kg",
        "cost": 0.212
      },
      {
        "name": "胡萝卜丝",
        "useNum": 0.01,
        "price": 7.2,
        "unit": "kg",
        "cost": 0.072
      },
      {
        "name": "油",
        "useNum": 0.005,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.0475
      },
      {
        "name": "盐",
        "useNum": 0.002,
        "price": 1.6,
        "unit": "kg",
        "cost": 0.0032
      },
      {
        "name": "生抽",
        "useNum": 0.003,
        "price": 10.23,
        "unit": "kg",
        "cost": 0.0307
      }
    ],
    "totalCost": 1.6554,
    "profit": -1.6554,
    "grossRate": 0,
    "remark": "成人套餐组件(38元B套+58元B套共用)·SOP 大白菜按大白菜丝处理复用现有料;调料为经验值"
  },
  {
    "_id": "dish_040",
    "dishName": "手撕包菜",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "卷心菜",
        "useNum": 0.15,
        "price": 4.2,
        "unit": "kg",
        "cost": 0.63
      },
      {
        "name": "鸡丝",
        "useNum": 0.05,
        "price": 11.8,
        "unit": "kg",
        "cost": 0.59
      },
      {
        "name": "黑木耳",
        "useNum": 0.01,
        "price": 104.4,
        "unit": "kg",
        "cost": 1.044
      },
      {
        "name": "油",
        "useNum": 0.005,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.0475
      },
      {
        "name": "盐",
        "useNum": 0.002,
        "price": 1.6,
        "unit": "kg",
        "cost": 0.0032
      },
      {
        "name": "蒜",
        "useNum": 0.002,
        "price": 15.2,
        "unit": "kg",
        "cost": 0.0304
      }
    ],
    "totalCost": 2.3451,
    "profit": -2.3451,
    "grossRate": 0,
    "remark": "成人套餐组件(38元B套配菜)·黑木耳为2026-08-06新增原料;调料为经验值"
  },
  {
    "_id": "dish_041",
    "dishName": "香菜云丝",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "云丝",
        "useNum": 0.08,
        "price": 33,
        "unit": "kg",
        "cost": 2.64
      },
      {
        "name": "香菜",
        "useNum": 0.01,
        "price": 12,
        "unit": "kg",
        "cost": 0.12
      },
      {
        "name": "胡萝卜丝",
        "useNum": 0.02,
        "price": 7.2,
        "unit": "kg",
        "cost": 0.144
      },
      {
        "name": "盐",
        "useNum": 0.001,
        "price": 1.6,
        "unit": "kg",
        "cost": 0.0016
      },
      {
        "name": "油",
        "useNum": 0.002,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.019
      },
      {
        "name": "醋",
        "useNum": 0.003,
        "price": 0,
        "unit": "kg",
        "cost": 0
      }
    ],
    "totalCost": 2.9246,
    "profit": -2.9246,
    "grossRate": 0,
    "remark": "成人套餐组件(50元C套主菜)·云丝0.08kg/33元(2026-08-06确认);香菜/醋为新增料;调料为经验值"
  },
  {
    "_id": "dish_042",
    "dishName": "米饭",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "大米",
        "useNum": 0.15,
        "price": 5.39,
        "unit": "kg",
        "cost": 0.8085
      }
    ],
    "totalCost": 0.8085,
    "profit": -0.8085,
    "grossRate": 0,
    "remark": "成人套餐共享组件·5套套餐全部共用"
  },
  {
    "_id": "dish_043",
    "dishName": "酸奶",
      "dishCategory": "缤纷小食",
    "packageType": "SOP",
    "sellPrice": 5,
    "bomList": [
      {
        "name": "酸奶",
        "useNum": 1,
        "price": 0.9,
        "unit": "个",
        "cost": 0.9
      }
    ],
    "totalCost": 0.9,
    "profit": -0.9,
    "grossRate": 0,
    "remark": "成人套餐共享组件·5套套餐全部共用,0.9元/个"
  },
  {
    "_id": "dish_044",
    "dishName": "鱼香肉丝(套餐主菜)",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "鸡丝",
        "useNum": 0.1,
        "price": 11.8,
        "unit": "kg",
        "cost": 1.18
      },
      {
        "name": "胡萝卜丝",
        "useNum": 0.05,
        "price": 7.2,
        "unit": "kg",
        "cost": 0.36
      },
      {
        "name": "茭白丝",
        "useNum": 0.05,
        "price": 20,
        "unit": "kg",
        "cost": 1
      },
      {
        "name": "大米",
        "useNum": 0.15,
        "price": 5.39,
        "unit": "kg",
        "cost": 0.8085
      },
      {
        "name": "打包盒",
        "useNum": 1,
        "price": 0.5,
        "unit": "个",
        "cost": 0.5
      }
    ],
    "totalCost": 3.8485,
    "profit": -3.8485,
    "grossRate": 0,
    "remark": "28元套餐鱼香肉丝主菜组件(含米饭+打包盒,不含酸奶/土豆丝/青菜,避免与配菜重复计价)"
  },
  {
    "_id": "dish_045",
    "dishName": "土豆丝",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      {
        "name": "土豆丝",
        "useNum": 0.12,
        "price": 6.4,
        "unit": "kg",
        "cost": 0.768
      },
      {
        "name": "油",
        "useNum": 0.005,
        "price": 9.5,
        "unit": "kg",
        "cost": 0.0475
      },
      {
        "name": "盐",
        "useNum": 0.001,
        "price": 1.6,
        "unit": "kg",
        "cost": 0.0016
      }
    ],
    "totalCost": 0.8171,
    "profit": -0.8171,
    "grossRate": 0,
    "remark": "28元套餐配菜·清炒土豆丝"
  },
  {
    "_id": "dish_046",
    "dishName": "咖喱牛腩饭",
      "dishCategory": "经典主食",
    "packageType": "SOP",
    "sellPrice": 55,
    "bomList": [
      {
        "name": "大米",
        "useNum": 0.15,
        "price": 5.39,
        "unit": "kg",
        "cost": 0.8085
      },
      {
        "name": "半熟牛筋肉",
        "useNum": 0.15,
        "price": 56,
        "unit": "kg",
        "cost": 8.4
      },
      {
        "name": "卷心菜",
        "useNum": 0.15,
        "price": 4.2,
        "unit": "kg",
        "cost": 0.63
      },
      {
        "name": "土豆块",
        "useNum": 0.1,
        "price": 6.4,
        "unit": "kg",
        "cost": 0.64
      },
      {
        "name": "胡萝卜片",
        "useNum": 0.05,
        "price": 7.2,
        "unit": "kg",
        "cost": 0.36
      },
      {
        "name": "土豆片",
        "useNum": 0.05,
        "price": 6.4,
        "unit": "kg",
        "cost": 0.32
      },
      {
        "name": "培根",
        "useNum": 0.01,
        "price": 25.74,
        "unit": "kg",
        "cost": 0.2574
      }
    ],
    "totalCost": 11.4159,
    "profit": 43.5841,
    "grossRate": 0.7924,
    "remark": "咖喱牛腩饭(dish_006)+罗宋汤(dish_024)物理合并,加汤不加价仍售55元;土豆块0.1烧牛肉+土豆片0.05烧汤(2026-09-23 用户确认属两个动作,非替代);卷心菜两行合并为0.15kg(2026-09-25 用户确认)"
  },
  {
    "_id": "dish_047",
    "dishName": "新疆团套餐",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 50,
    // ↓↓↓ BOM / 成本由文件末尾「单一数据源派生」自动生成，请勿手写（源 = 10 道成分菜 dish_048~057）
    "bomList": [],
    "totalCost": 0,
    "profit": 0,
    "grossRate": 0,
    "remark": "成人套餐主菜(2026-09-03用户截图新增)·10项原料含5项新增(mat_097杏鲍菇切片/098青椒块/099辣子鸡/100干辣椒段/101包装野山椒);原样按用户报价单箱/斤/包折算为元/kg;总成本10.29元/份、利润39.71、毛利率79.41%;"
  },
  // 2026-09-08 新疆团套餐拆解：10 道成分菜（packageType=_COMPOSE，仅供 meal_xj50 内部换菜引用，不在用户菜单显示）
  {
    "_id": "dish_048", "dishName": "牛肉片",
      "dishCategory": "其他", "packageType": "_COMPOSE", "sellPrice": 0,
    "bomList": [{ "name": "牛肉片", "useNum": 0.1, "price": 48, "unit": "kg", "cost": 4.8 }],
    "totalCost": 4.8, "profit": 0, "grossRate": 0,
    "remark": "新疆团成分菜(2026-09-08拆)·牛肉片0.1kg/份"
  },
  {
    "_id": "dish_049", "dishName": "杏鲍菇片",
      "dishCategory": "其他", "packageType": "_COMPOSE", "sellPrice": 0,
    "bomList": [{ "name": "杏鲍菇切片", "useNum": 0.05, "price": 13.4, "unit": "kg", "cost": 0.67 }],
    "totalCost": 0.67, "profit": 0, "grossRate": 0,
    "remark": "新疆团成分菜(2026-09-08拆)·杏鲍菇切片0.05kg/份(mat_097)"
  },
  {
    "_id": "dish_050", "dishName": "青椒块",
      "dishCategory": "其他", "packageType": "_COMPOSE", "sellPrice": 0,
    "bomList": [{ "name": "青椒块", "useNum": 0.02, "price": 19.4, "unit": "kg", "cost": 0.388 }],
    "totalCost": 0.388, "profit": 0, "grossRate": 0,
    "remark": "新疆团成分菜(2026-09-08拆)·青椒块0.02kg/份(mat_098)"
  },
  {
    "_id": "dish_051", "dishName": "土豆丝",
      "dishCategory": "其他", "packageType": "_COMPOSE", "sellPrice": 0,
    "bomList": [{ "name": "土豆丝", "useNum": 0.12, "price": 6.4, "unit": "kg", "cost": 0.768 }],
    "totalCost": 0.768, "profit": 0, "grossRate": 0,
    "remark": "新疆团成分菜(2026-09-08拆)·土豆丝0.12kg/份(2026-09-23 由「土豆片」改正：用户核对 SOP 表与实际菜单均为土豆丝，原写法是笔误；同价 6.4/kg，成本不变)"
  },
  {
    "_id": "dish_052", "dishName": "辣子鸡",
      "dishCategory": "其他", "packageType": "_COMPOSE", "sellPrice": 0,
    "bomList": [{ "name": "辣子鸡", "useNum": 0.15, "price": 14.5, "unit": "kg", "cost": 2.175 }],
    "totalCost": 2.175, "profit": 0, "grossRate": 0,
    "remark": "新疆团成分菜(2026-09-08拆)·辣子鸡0.15kg/份(mat_099)"
  },
  {
    "_id": "dish_053", "dishName": "干辣椒段",
      "dishCategory": "其他", "packageType": "_COMPOSE", "sellPrice": 0,
    "bomList": [{ "name": "干辣椒段", "useNum": 0.01, "price": 48, "unit": "kg", "cost": 0.48 }],
    "totalCost": 0.48, "profit": 0, "grossRate": 0,
    "remark": "新疆团成分菜(2026-09-08拆)·干辣椒段0.01kg/份(mat_100)"
  },
  {
    "_id": "dish_054", "dishName": "野山椒",
      "dishCategory": "其他", "packageType": "_COMPOSE", "sellPrice": 0,
    "bomList": [{ "name": "包装野山椒2kg*6包", "useNum": 0.01, "price": 6.2, "unit": "kg", "cost": 0.062 }],
    "totalCost": 0.062, "profit": 0, "grossRate": 0,
    "remark": "新疆团成分菜(2026-09-08拆)·包装野山椒0.01kg/份(mat_101)"
  },
  {
    "_id": "dish_055", "dishName": "胡萝卜丝",
      "dishCategory": "其他", "packageType": "_COMPOSE", "sellPrice": 0,
    "bomList": [{ "name": "胡萝卜丝", "useNum": 0.03, "price": 7.2, "unit": "kg", "cost": 0.216 }],
    "totalCost": 0.216, "profit": 0, "grossRate": 0,
    "remark": "新疆团成分菜(2026-09-08拆)·胡萝卜丝0.03kg/份(mat_049)"
  },
  {
    "_id": "dish_056", "dishName": "卷心菜块",
      "dishCategory": "其他", "packageType": "_COMPOSE", "sellPrice": 0,
    "bomList": [{ "name": "卷心菜块", "useNum": 0.15, "price": 4.2, "unit": "kg", "cost": 0.63 }],
    "totalCost": 0.63, "profit": 0, "grossRate": 0,
    "remark": "新疆团成分菜(2026-09-08拆)·卷心菜块0.15kg/份(mat_043)"
  },
  {
    "_id": "dish_057", "dishName": "黑木耳",
      "dishCategory": "其他", "packageType": "_COMPOSE", "sellPrice": 0,
    "bomList": [{ "name": "黑木耳", "useNum": 0.001, "price": 104.4, "unit": "kg", "cost": 0.1044 }],
    "totalCost": 0.1044, "profit": 0, "grossRate": 0,
    "remark": "新疆团成分菜(2026-09-08拆)·黑木耳0.001kg/份(mat_081)"
  },
  {
    "_id": "dish_058",
    "dishName": "芝士酱",
      "dishCategory": "其他",
    "packageType": "SOP",
    "sellPrice": 0,
    "bomList": [
      { "name": "牛奶", "useNum": 0.22, "price": 10, "unit": "kg", "cost": 2.2 },
      { "name": "淡奶油", "useNum": 0.1, "price": 50.8, "unit": "kg", "cost": 5.08 },
      { "name": "安佳车达芝士", "useNum": 0.15, "price": 70, "unit": "kg", "cost": 10.5 },
      { "name": "安佳芝士片", "useNum": 0.05, "price": 70, "unit": "kg", "cost": 3.5 },
      { "name": "黄油", "useNum": 0.02, "price": 120, "unit": "kg", "cost": 2.4 },
      { "name": "玉米淀粉", "useNum": 0.008, "price": 0, "unit": "kg", "cost": 0 },
      { "name": "盐", "useNum": 0.002, "price": 1.6, "unit": "kg", "cost": 0.0032 }
    ],
    "totalCost": 23.6832,
    "profit": -23.6832,
    "grossRate": 0,
    "remark": "芝士酱基础半成品SOP(2026-09-09用户成本表):牛奶0.22/淡奶油0.1/安佳车达0.15/安佳芝士片0.05/黄油0.02/玉米淀粉0.008/盐0.002 kg每份;车达70/芝士片70/黄油120/盐1.6回填后每份成本23.6832(原表缺价时7.28);玉米淀粉价待补;sellPrice0暂不单卖,待用户定挂点"
  },
  {
    "_id": "dish_060",
    "dishName": "能量碗",
    "dishCategory": "缤纷小食",
    "packageType": "单品",
    "sellPrice": 18,
    "bomList": [],
    "totalCost": 0,
    "profit": 18,
    "grossRate": 1
  }
];

const SEED_SETMEALS = [
  {
    "_id": "meal_38",
    "name": "38元成人套餐B",
    "desc": "奥尔良鸡根 + 白菜香菇肉丝 + 手撕包菜 + 时蔬(青菜段) + 米饭 + 酸奶",
    "price": 38,
    "category": "团队",
    "items": [
      {
        "dishId": "dish_002",
        "qty": 1
      },
      {
        "dishId": "dish_039",
        "qty": 1
      },
      {
        "dishId": "dish_040",
        "qty": 1
      },
      {
        "dishId": "dish_037",
        "qty": 1
      },
      {
        "dishId": "dish_042",
        "qty": 1
      },
      {
        "dishId": "dish_043",
        "qty": 1
      }
    ]
  },
  {
    "_id": "meal_50",
    "name": "50元成人套餐C",
    "desc": "红烧鸡块 + 鳕鱼排 + 香菜云丝 + 时蔬(青菜段) + 米饭 + 酸奶",
    "price": 50,
    "category": "团队",
    "items": [
      {
        "dishId": "dish_032",
        "qty": 1
      },
      {
        "dishId": "dish_033",
        "qty": 1
      },
      {
        "dishId": "dish_041",
        "qty": 1
      },
      {
        "dishId": "dish_037",
        "qty": 1
      },
      {
        "dishId": "dish_042",
        "qty": 1
      },
      {
        "dishId": "dish_043",
        "qty": 1
      }
    ]
  },
  {
    "_id": "meal_58a",
    "name": "58元成人套餐A",
    "desc": "奥尔良鸡根 + 红烧牛腩 + 番茄炒蛋 + 时蔬(青菜段) + 米饭 + 酸奶",
    "price": 58,
    "category": "团队",
    "items": [
      {
        "dishId": "dish_002",
        "qty": 1
      },
      {
        "dishId": "dish_003",
        "qty": 1
      },
      {
        "dishId": "dish_036",
        "qty": 1
      },
      {
        "dishId": "dish_037",
        "qty": 1
      },
      {
        "dishId": "dish_042",
        "qty": 1
      },
      {
        "dishId": "dish_043",
        "qty": 1
      }
    ]
  },
  {
    "_id": "meal_58b",
    "name": "58元成人套餐B",
    "desc": "咖喱牛腩 + 鳕鱼排 + 白菜香菇肉丝 + 时蔬(青菜段) + 米饭 + 酸奶",
    "price": 58,
    "category": "团队",
    "items": [
      {
        "dishId": "dish_038",
        "qty": 1
      },
      {
        "dishId": "dish_033",
        "qty": 1
      },
      {
        "dishId": "dish_039",
        "qty": 1
      },
      {
        "dishId": "dish_037",
        "qty": 1
      },
      {
        "dishId": "dish_042",
        "qty": 1
      },
      {
        "dishId": "dish_043",
        "qty": 1
      }
    ]
  },
  {
    "_id": "meal_68",
    "name": "68元成人套餐F",
    "desc": "五彩河虾仁 + 本帮红烧肉 + 番茄炒蛋 + 时蔬(青菜段) + 米饭 + 酸奶",
    "price": 68,
    "category": "团队",
    "items": [
      {
        "dishId": "dish_034",
        "qty": 1
      },
      {
        "dishId": "dish_035",
        "qty": 1
      },
      {
        "dishId": "dish_036",
        "qty": 1
      },
      {
        "dishId": "dish_037",
        "qty": 1
      },
      {
        "dishId": "dish_042",
        "qty": 1
      },
      {
        "dishId": "dish_043",
        "qty": 1
      }
    ]
  },
  {
    "_id": "meal_28",
    "name": "28元成人套餐",
    "desc": "鱼香肉丝(含米饭) + 酸奶 + 土豆丝 + 青菜段 + 打包盒",
    "price": 28,
    "category": "团队",
    "items": [
      {
        "dishId": "dish_044",
        "qty": 1
      },
      {
        "dishId": "dish_043",
        "qty": 1
      },
      {
        "dishId": "dish_045",
        "qty": 1
      },
      {
        "dishId": "dish_037",
        "qty": 1
      }
    ]
  },
  {
    "_id": "meal_xj50",
    "name": "新疆团套餐",
    "desc": "新疆团套餐(50元/位)·10项原料·主菜由dish_047提供,适用游客/团体预订",
    "price": 50,
    "category": "团队",
    "items": [
      { "dishId": "dish_048", "qty": 1 },
      { "dishId": "dish_049", "qty": 1 },
      { "dishId": "dish_050", "qty": 1 },
      { "dishId": "dish_051", "qty": 1 },
      { "dishId": "dish_052", "qty": 1 },
      { "dishId": "dish_053", "qty": 1 },
      { "dishId": "dish_054", "qty": 1 },
      { "dishId": "dish_055", "qty": 1 },
      { "dishId": "dish_056", "qty": 1 },
      { "dishId": "dish_057", "qty": 1 }
    ]
  }
];


// ── 菜单展示分类顺序与组内排序权重（2026-09-13 用户菜单定稿）──
const DISH_CATEGORY_ORDER = ['经典主食', '西式主食', '现煮面食', '缤纷小食', '其他']
// 组内顺序：按用户菜单从上到下编号；未列出项归"其他"，默认 1000
const DISH_ORDER_INDEX = {
  '鱼香鸡丝饭配汤': 0, '奥尔良烤鸡腿饭配汤': 1, '虾仁培根炒饭': 2, '咖喱牛腩饭': 3,
  '热熔芝士弯管意面': 4, '意大利肉酱面配汤': 5, '美式培根烤披萨': 6, '炙焰焓变鳗鱼饭': 7, '红烧牛肉面': 8,
  '辣炒鱼饼年糕': 9, '鲍汁双菇面': 10, '白菜猪肉水饺': 11,
  '酸奶': 12, '蛋挞': 13, '罗宋汤': 14, '鸡米花': 15, '高温脆薯肉酱薯条': 16, '上海小笼包': 17,
  '能量碗': 18, '水果碗': 19, '地道肠': 20, '奥尔良烤翅': 21, '奥尔良烤全腿': 22, '炸鸡配年糕': 23,
  '芝士蛋糕': 24, '冰点凝固冰粉': 25, '奶盖小丸子': 26
}
/** 库存单子（2026-09-20）：来自用户提供的库存盘点表，作为订货时直接减库存的初始数量 */
const SEED_INVENTORY = [
  { name: '半成品冷冻意大利面', stock: 11 },
  { name: '意大利通心形（弯管）面', stock: 0 },
  { name: '奥尔良对翅', stock: 4 },
  { name: '鸡米花', stock: 9 },
  { name: '9寸披萨饼胚', stock: 12 },
  { name: '上海小笼包手工', stock: 1 },
  { name: '奥尔良手枪腿', stock: 3 },
  { name: '半熟牛筋肉', stock: 7 },
  { name: '地道肠', stock: 1 },
  { name: '混合蔬菜', stock: 1 },
  { name: '熟冻盐田虾', stock: 3 },
  { name: '意大利面番茄肉酱', stock: 7 },
  { name: '1/4细薯条', stock: 8 },
  { name: '划水鸡丝', stock: 7 },
  { name: '咸味芝士慕斯蛋糕', stock: 3 },
  { name: '热辣骨香鸡', stock: 4 },
  { name: '水饺', stock: 2 },
  { name: '上浆巴沙鱼片', stock: 1 },
  { name: '马苏里拉芝士', stock: 1 },
  { name: '培根', stock: 3 },
  { name: '奥尔良鸡根', stock: 6 },
  { name: '虾仁', stock: 2 },
  { name: '意大利面黑椒肉酱', stock: 2 },
  { name: '蛋挞', stock: 2 },
  { name: '蜜汁叉烧片', stock: 1 },
  { name: '芝士球', stock: 1 },
  { name: '鸡肩肉', stock: 2 },
  { name: '鳕鱼排', stock: 2 },
  { name: '牛柳', stock: 0 },
  { name: '北极贝裙边', stock: 2 },
  { name: '黄金虾', stock: 1 },
  { name: '黑虎虾8头', stock: 1 },
  { name: '牛肉片', stock: 3 },
  { name: '辣子鸡', stock: 2 },
  { name: '土耳其披萨饼', stock: 1 },
  // v69 (2026-10-02)：用户盘点表出现、原 35 项里没有 → 新增（用户拍板「加」）
  //   BOM 中无「水果玉米」原料（只有玉米淀粉 mat_105，不同物）→ 不进 SEED_INVENTORY_MAP，纯独立库存项
  { name: '水果玉米', stock: 1 },
  // v70 (2026-10-13)：松食配新进原料「泡芙」（mat_109，145元/箱）—— 进库存表，订货页可见、可下单；
  //   规格未知 ⇒ SEED_INVENTORY_MAP 的 factor 置 null（单位换算待确认），引擎暂不扣减采购量。严禁猜数。
  { name: '泡芙', stock: 0 }
];

/**
 * 库存 → 采购单联动映射（2026-09-20）
 * 把「库存单子（SEED_INVENTORY，半成品/SKU 名）」对应到 BOM 原料名，供 buildPurchasePlan 用 curStock 扣减采购量
 * - target：对应 BOM 原料名（buildPurchasePlan 按名聚合）。'' 表示 BOM 无对应原料，不联动
 * - factor：1 个库存单位可抵扣多少 BOM 原料单位（如半成品冷冻意大利面 1箱 = ?kg 意面）
 *   factor 为 null 表示「单位换算待确认」，引擎暂不扣减，避免算错采购量（严禁猜数）
 * - factor=1 仅用于库存名与 BOM 原料名精确一致（或明显同一产品仅命名略异）的项，已默认按 1:1 联动
 */
const SEED_INVENTORY_MAP = [
  // ── 精确同名 / 明显同一产品（2026-09-22 已按原料主数据 packQty/spec 补箱规）──
  { invName: '鸡米花', target: '鸡米花', factor: 10, note: '1箱=10kg（原料主数据 spec 1kg*10包）' },
  { invName: '半熟牛筋肉', target: '半熟牛筋肉', factor: 10, note: '1箱=10kg（原料 packQty 10 / spec 1kg*10包）' },
  { invName: '混合蔬菜', target: '混合蔬菜', factor: 1, note: '⚠️ 原料主数据无箱规，待用户确认' },
  { invName: '培根', target: '培根', factor: 13.6, note: '1箱=13.6kg（原料 spec 纯猪肉 1.7kg*8包）' },
  { invName: '奥尔良鸡根', target: '鸡根', factor: 130, note: '库存名=奥尔良鸡根，BOM名=鸡根；1箱=130个（原料 鸡根 packQty）' },
  { invName: '虾仁', target: '虾仁', factor: 1000, note: '1箱=1000个（原料 packQty）' },
  { invName: '鳕鱼排', target: '鳕鱼排', factor: 1, note: '⚠️ 原料 packQty=180 与 spec「31g*200」矛盾，待用户确认' },
  { invName: '北极贝裙边', target: '北极贝裙边', factor: 10, note: '1箱=10kg（原料 spec 500g*20包）' },
  { invName: '牛肉片', target: '牛肉片', factor: 10, note: '1箱=10kg（原料 spec 1kg*10包）' },
  { invName: '辣子鸡', target: '辣子鸡', factor: 10, note: '1箱=10kg（原料 packQty 10 / spec 480元/箱(10kg)）' },
  { invName: '咸味芝士慕斯蛋糕', target: '咸味芝士蛋糕', factor: 80, note: '库存名含慕斯，BOM名=咸味芝士蛋糕；1箱=80个（原料 packQty 80 + 用户确认 380元/箱×80块）' },
  { invName: '意大利通心形（弯管）面', target: '意大利通心形（弯管）面', factor: 10, note: '2026-10-01 新建（用户拍板）：好生活 500g*20包/箱=10kg。⚠️ 与「半成品冷冻意大利面」(松食意面，12kg/箱) 是两种货，勿合并抵扣。当前库存 0，盘点填数后抵扣 dish_009 用量' },
  // ── 半成品 / 改名：已确认换算（2026-09-20 用户提供箱规），factor = 1箱可抵扣多少 BOM 单位 ──
  { invName: '半成品冷冻意大利面', target: '意面', factor: 12, note: '用户确认 1箱=12kg（原投诉重点）' },
  { invName: '奥尔良对翅', target: '奥尔良烤翅', factor: 220, note: '用户确认 1箱=220个（2026-09-20 由「瑞发德奥尔良鸡对翅」改名）' },
  { invName: '9寸披萨饼胚', target: '披萨饼', factor: 24, note: '用户确认 1箱=24个（饼胚→披萨饼）' },
  { invName: '奥尔良手枪腿', target: '奥尔良鸡腿', factor: 69, note: '用户确认 1箱=69个（手枪腿→鸡腿）' },
  { invName: '1/4细薯条', target: '薯条', factor: 12, note: '用户确认 1箱=12kg（2026-09-20 由「TC308 3/8特脆粗薯」改名）' },
  { invName: '划水鸡丝', target: '鸡丝', factor: 10, note: '用户确认 1箱=10kg' },
  { invName: '热辣骨香鸡', target: '骨香鸡', factor: 10, note: '用户确认 1箱=10kg' },
  { invName: '水饺', target: '大娘水饺', factor: 390, note: '用户确认 1箱=390个' },
  { invName: '马苏里拉芝士', target: '芝士', factor: 12, note: '用户确认 1箱=12kg（马苏里拉→芝士）' },
  { invName: '意大利面黑椒肉酱', target: '肉酱', factor: 10, note: '用户确认 1箱=10kg（黑椒肉酱→肉酱）' },
  { invName: '蛋挞', target: '葡式蛋挞', factor: 180, note: '用户确认 1箱=180个' },
  { invName: '土耳其披萨饼', target: '披萨饼', factor: 50, note: '用户确认 1箱=50个' },
  { invName: '地道肠', target: '地道肠', factor: 200, note: '用户确认 1箱=200根（2026-09-22）' },
  // ── 已拍板（2026-09-20）──
  { invName: '上海小笼包手工', target: '小笼包', factor: 320, note: '用户确认 1箱=320个' },
  { invName: '意大利面番茄肉酱', target: '番茄捞牛肉', factor: 10, note: '用户确认本品=番茄捞牛肉，1箱=10kg（2026-09-23 修正：原 target 误写「肉酱」，与 note 矛盾，导致 7箱=70kg 被错扣到肉酱上）' },
  // ── 用户确认不联动 ──
  { invName: '蜜汁叉烧片', target: '', factor: null, note: '用户确认叉烧不用了，不联动' },
  // ── BOM 无对应原料：不联动 ──
  { invName: '熟冻盐田虾', target: '', factor: null, note: 'BOM无盐田虾原料（虾仁另计），不联动' },
  { invName: '上浆巴沙鱼片', target: '', factor: null, note: 'BOM无巴沙鱼原料，不联动' },
  { invName: '芝士球', target: '', factor: null, note: 'BOM无芝士球原料（近芝士），不联动' },
  { invName: '鸡肩肉', target: '', factor: null, note: 'BOM无鸡肩肉原料，不联动' },
  { invName: '牛柳', target: '', factor: null, note: 'BOM无牛柳原料；库存=0，不联动' },
  { invName: '黄金虾', target: '', factor: null, note: 'BOM无黄金虾原料（虾仁另计），不联动' },
  { invName: '黑虎虾8头', target: '', factor: null, note: 'BOM无黑虎虾原料，不联动' },
  // ── v70 (2026-10-13) 新增：泡芙（松食配报价单编码 20260801003，145元/箱）──
  { invName: '泡芙', target: '泡芙', factor: null, note: '⚠️ 规格待补：报价单「规格」栏为空，1箱=?个/?kg 无任何数据支撑 ⇒ 暂不抵扣采购量（严禁猜数）。规格确认后回填 factor' }
];

/**
 * 库存「别名表」（2026-10-02 立）
 * 用途：订货页「批量粘贴导入库存」时，用户盘点表/Excel 里的**旧名、简称、商品编码名**
 *       → 对应到 SEED_INVENTORY 的**正式品名**。
 * 匹配优先级：① 归一化精确 ② 本别名表 ③ 唯一包含。
 * 归一化口径：全角转半角 + 去所有空白 + 转小写（orderCalc._normInvName）。
 *
 * 🔴 铁律与约束：
 *   - **target 必须存在于 SEED_INVENTORY**（_audit_seed.js G 段校验，缺失即 P0）。
 *   - 只允许「同一物的不同叫法」。**形态不同 = 不同原料**（2026-09-23 用户明令），
 *     严禁用别名把「土豆丝/土豆片」这类不同形态合并。
 *   - 别名不是猜：拿不准的不要写进来，让它落进「未识别」由人确认。
 */
const SEED_INVENTORY_ALIAS = [
  // 来自 SEED_INVENTORY_MAP 备注里记的改名史（已核实，非推测）
  { alias: '瑞发德奥尔良鸡对翅', target: '奥尔良对翅', note: '旧供应商全称（seed map 已记：2026-09-20 改名）' },
  { alias: 'TC308 3/8特脆粗薯', target: '1/4细薯条', note: '商品编码名（seed map 已记：2026-09-20 改名）' },
  // 用户 2026-10-02 盘点表实际用名 → 已确认
  { alias: '奥尔良鸡烤翅', target: '奥尔良对翅', note: '盘点表常用叫法（2026-10-02 用户确认）' },
  { alias: '奥尔良烤翅', target: '奥尔良对翅', note: '该库存项对应 BOM 原料名即「奥尔良烤翅」' }
];

// ============ 单一数据源派生（2026-09-23）============
// 背景：新疆团套餐的配方曾存两遍（主菜 dish_047 手写一份 + 10 道成分菜 dish_048~057 各一份），
//      2026-09-23 出现「主菜写土豆丝、成分菜写土豆片」的漂移事故 → 采购单按错的算。
// 现在：唯一数据源 = 10 道成分菜的 bomList；导出前自动派生主菜 dish_047 的 BOM 与成本。
// 改配方只改成分菜，主菜自动跟随（主菜里手写的 bomList 已清空，勿再手填）。
;(function deriveXinjiangSet() {
  var MAIN_ID = 'dish_047'
  var COMP_IDS = ['dish_048', 'dish_049', 'dish_050', 'dish_051', 'dish_052',
                  'dish_053', 'dish_054', 'dish_055', 'dish_056', 'dish_057']
  var byId = {}
  for (var i = 0; i < SEED_DISHES.length; i++) byId[SEED_DISHES[i]._id] = SEED_DISHES[i]
  var main = byId[MAIN_ID]
  if (!main) return
  var bom = []
  for (var j = 0; j < COMP_IDS.length; j++) {
    var comp = byId[COMP_IDS[j]]
    if (!comp || !comp.bomList || !comp.bomList.length) continue
    for (var k = 0; k < comp.bomList.length; k++) {
      var b = comp.bomList[k]
      bom.push({ name: b.name, useNum: b.useNum, price: b.price, unit: b.unit, cost: b.cost })
    }
  }
  main.bomList = bom
  var total = 0
  for (var x = 0; x < bom.length; x++) {
    total += (Number(bom[x].useNum) || 0) * (Number(bom[x].price) || 0)
  }
  main.totalCost = Math.round(total * 10000) / 10000
  main.profit = Math.round((main.sellPrice - main.totalCost) * 10000) / 10000
  main.grossRate = main.sellPrice > 0 ? Math.round((main.profit / main.sellPrice) * 10000) / 10000 : 0
})()


/**
 * 销量基准（2026-09-27 用户提供收银系统报表）
 * ⚠️ 口径 = **平日**日均份数（份/天）
 *   来源：收银系统「单品+套餐」报表，统计周期 = **小长假某单日**（59 条商品 / 6 页）
 *   换算：平日日均 = 报表当日实销量 ÷ 5（按用户客流系数表「小长假 ×5」反推），四舍五入、最低 1
 *   用途：订货页「预估量预警」的兜底基准 —— 真实散点销量 avg7 优先，无真实数据时用此表
 *   ⚠️ 改动此表必须升 app.js 的种子版本号
 */
const SEED_EST_BASE = {
  dish_059: 20, // 意大利肉酱面配汤 99份
  dish_004: 17, // 鱼香鸡丝饭配汤 87
  dish_046: 14, // 咖喱牛腩饭 71
  dish_019: 13, // 虾仁培根炒饭 66
  dish_005: 12, // 水果碗 60
  dish_028: 12, // 奥尔良烤翅 59
  dish_021: 11, // 美式培根烤披萨 53
  dish_007: 11, // 红烧牛肉面 53
  dish_018: 9,  // 奥尔良烤鸡腿饭配汤 46
  dish_027: 8,  // 地道肠 40
  dish_025: 8,  // 鸡米花 40
  dish_031: 8,  // 芝士蛋糕 38
  dish_023: 7,  // 蛋挞 35
  dish_013: 7,  // 冰点凝固冰粉 34
  dish_060: 4,  // 能量碗 19
  dish_026: 3,  // 上海小笼包 17
  dish_022: 3,  // 白菜猪肉水饺 16
  dish_030: 3,  // 炸鸡配年糕 15
  dish_008: 3,  // 鲍汁双菇面 13
  dish_009: 2,  // 热熔芝士弯管意面 8
  dish_015: 2,  // 辣炒鱼饼年糕 8
  dish_016: 1,  // 奶盖小丸子 5
  dish_029: 1   // 奥尔良烤全腿 2
  // 未出现（应在报表第 6 页，待补）：dish_011 炙焰焓变鳗鱼饭 / dish_024 罗宋汤 / dish_043 酸奶
  // dish_010 高温脆薯肉酱薯条 = 新菜单未上架，报表无数据
};

// ─────────────── 成人套餐预定（种子，一次性注入 · 种子单以种子为准，用户手录不覆盖）───────────────
// 2026-10-01 用户报单：科奇两单，均 50 元餐标、12:00 用餐
//   10-02：订购 25 份 + 赠送 3 份（原 20+1 → 用户 10-01 下午改为 +5 份，赠送 3 份）
//   10-05：订购 30 份 + 赠送 2 份
// mealItems（下单当时的组成快照）**从 SEED_SETMEALS 的 meal_50 派生**，不手抄菜名 ——
// 与 deriveXinjiangSet() 同一思路：单一数据源，将来套餐改名/换菜不会让种子单漂移。
function deriveKeqiBookings() {
  var meal = null
  for (var i = 0; i < SEED_SETMEALS.length; i++) {
    if (SEED_SETMEALS[i]._id === 'meal_50') { meal = SEED_SETMEALS[i]; break }
  }
  if (!meal) return []
  var price = Number(meal.price) || 0
  // 每次调用重新构建快照，保证两条单各自持有独立副本（不被共享引用串改）
  function snapshot() {
    return (meal.items || []).map(function (it) {
      var dn = it.dishId
      for (var j = 0; j < SEED_DISHES.length; j++) {
        if (SEED_DISHES[j]._id === it.dishId) { dn = SEED_DISHES[j].dishName; break }
      }
      return { dishId: it.dishId, qty: Number(it.qty) || 1, dishName: dn }
    })
  }
  function mk(id, date, orderQty, giftQty) {
    return {
      _id: id,
      date: date,
      time: '12:00',
      customer: '科奇',
      setmealId: meal._id,
      setmealName: meal.name,
      unitPrice: price,
      orderQty: orderQty,
      giftQty: giftQty,
      typeRemark: '',
      dishSwaps: [],
      extraDishes: [],
      mealItems: snapshot(),
      totalAmount: orderQty * price   // 金额仅按订购数算，赠送不计费
    }
  }
  return [
    mk('am_seed_keqi_20261002', '2026-10-02', 25, 3),
    mk('am_seed_keqi_20261005', '2026-10-05', 30, 2)
  ]
}
const SEED_ADULT_MEALS = deriveKeqiBookings();

module.exports = { SEED_MATERIALS, SEED_DISHES, SEED_SETMEALS, DISH_CATEGORY_ORDER, DISH_ORDER_INDEX, SEED_INVENTORY, SEED_INVENTORY_MAP, SEED_INVENTORY_ALIAS, SEED_EST_BASE, SEED_ADULT_MEALS };
