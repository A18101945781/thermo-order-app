# 热力学餐厅订货管理小程序

基于微信原生小程序 + TDesign + 腾讯云开发TCB 的餐饮BOM成本核算 + 采购订货超级表系统。

## 功能概览

| 模块 | 说明 |
|------|------|
| 菜品菜单 | 31道菜品，按A/B/C套餐/单品分类，展示售价/成本/毛利率 |
| 原料管理 | 64条原料，按供应商分组，含库存管理(期初/入库/出库/当前/最低) |
| 订货计算器 | 输入各菜品份数，实时计算原料需求总量、建议采购量、采购金额 |
| 历史报表 | 按时间查询历史订单，展开查看原料明细 |
| Excel导入导出 | 兼容原始Excel五张表，支持CSV导出 |

## 数据来源

原始文件：`热力学餐厅_采购超级表.xlsx`，含5张Sheet：

| Sheet | 内容 | 用途 |
|-------|------|------|
| 采购计划 | 31道菜品(名称/套餐/售价/成本) | 菜品基础数据 |
| 原料采购清单 | 64条原料(按供应商分组) | 原料基础数据 |
| SOP配方库 | 菜品×原料矩阵(BOM) | 菜品BOM配比 |
| 原料库存表 | 原料库存管理字段 | 库存数据 |
| 毛利分析 | 菜品利润分析 | 利润展示 |

## 供应商

| 供应商 | 简称 |
|--------|------|
| 松食配 | 松食配 |
| 上海诚惠食品有限公司 | 上海诚惠 |
| 上海瑞淮实业有限公司 | 上海瑞淮 |
| 赛大厨 | 赛大厨 |

## 角色权限

| 角色 | 菜品 | 原料 | 订货 | 报表 |
|------|------|------|------|------|
| 鲍勃(boss) | 读写 | 读写 | 读写 | 读写 |
| 采购(purchase) | 只读 | 只读 | 读写 | 只读 |
| 后厨(kitchen) | 只读 | 只读 | 无 | 无 |

## 部署步骤

### ① 导入项目
1. 打开微信开发者工具
2. 点「+」→ 导入项目
3. 目录选 `D:\ai\thermo-order-app\`
4. AppID: `wx729fd1a07658848a`（正式号，2026-10-03 启用；旧 `wx3efea13680aeca10` 为测试号已弃用）
5. 点导入

### ② 安装TDesign + 构建npm
```
cd miniprogram
npm install
```
然后在开发者工具顶部菜单：**工具 → 构建 npm**

### ③ 开通云开发（可选）
1. 云开发控制台创建环境
2. 把环境ID填入 `app.js` 的 `cloudEnvId`
3. 不开云开发也能用，自动降级本地缓存模式

### ④ 创建数据库集合（云开发模式下）
创建4个集合：`material` / `dish` / `orderRecord` / `user`

### ⑤ 部署云函数
右键 `cloudfunctions/` 下各文件夹 →「上传并部署：云端安装依赖」
- `fileHandle` 和 `exportExcel` 需要 xlsx 依赖

## 技术栈

- 微信原生小程序 WXML/WXSS/JS
- TDesign 小程序组件库
- 腾讯云开发 TCB (云函数/云数据库/云存储)
- 双模存储：云端数据库 + 本地缓存自动降级

## 项目结构

```
thermo-order-app/
├── miniprogram/           # 前端代码
│   ├── app.js             # 入口(含种子数据注入)
│   ├── app.json           # 全局配置
│   ├── app.wxss           # 全局样式
│   ├── sitemap.json
│   ├── package.json       # npm依赖(tdesign-miniprogram)
│   ├── pages/             # 8个页面
│   │   ├── index/         # 首页导航
│   │   ├── dishList/      # 菜品菜单
│   │   ├── dishDetail/    # 菜品详情
│   │   ├── material/      # 原料管理(含供应商/库存)
│   │   ├── orderCalc/     # 订货计算器
│   │   ├── record/        # 历史报表
│   │   ├── login/         # 登录页
│   │   └── mine/          # 个人中心
│   ├── components/        # 7个公共组件
│   │   ├── DishCard/      # 菜品卡片
│   │   ├── MaterialTable/ # 原料超级表
│   │   ├── OrderSummary/  # 采购汇总弹窗
│   │   ├── ExcelUpload/   # Excel上传
│   │   ├── SearchBar/     # 搜索框
│   │   ├── TagFilter/     # 标签筛选
│   │   └── NumberInput/   # 数字输入
│   └── utils/             # 6个工具库
│       ├── storage.js     # 双模存储API
│       ├── calc.js        # 餐饮计算(成本/毛利/订货/库存)
│       ├── format.js      # 格式化工具
│       ├── auth.js        # 登录+权限
│       ├── excel.js       # Excel导入导出
│       ├── request.js     # 云函数请求封装
│       └── seed.js        # 种子数据(64原料+31菜品)
├── cloudfunctions/        # 7个云函数
│   ├── materialManage/    # 原料CRUD
│   ├── dishBomCalc/       # 菜品BOM计算
│   ├── orderCompute/      # 订货计算
│   ├── recordSave/        # 订单保存查询
│   ├── fileHandle/        # Excel文件解析
│   ├── userAuth/          # 用户认证
│   └── exportExcel/       # Excel导出
├── database/              # 4套集合Schema
├── project.config.json
├── package.json
└── README.md
```
