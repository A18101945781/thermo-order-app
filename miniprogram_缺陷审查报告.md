# 热力学餐厅小程序 — 缺陷审查报告

> 审查日期：2026-07-11
> 审查范围：8页面 · 7组件 · 7工具模块 · 4配置文件
> 发现问题：P0×3 · P1×14 · P2×31 · 合计48项

---

## P0 致命 — 必须立即修复

### P0-1 毛利率数据格式不一致

**影响**：Excel导出毛利率放大100倍，毛利率颜色判断全错

**根因分析**：
- `calc.calcGrossProfit()` 返回 `{ grossRate: 0.8089 }`（0-1小数）
- `seed.js` 种子数据 `"grossRate": 0.8089`（0-1小数）✓
- `dishDetail.recomputeCost()` 第132行：`grossRate = result.grossRate * 100`（转为0-100）✗
- `excel.exportToCSV()` 第78行：`(d.grossRate * 100).toFixed(1) + '%'`（假设0-1，再×100）✗
- `calc.getGrossRateLevel()` 第158行：`grossRate >= 0.8`（假设0-1）✗
- `DishCard.js` 第67行：`(grossRate * 100).toFixed(1)`（假设0-1）✗
- `dishDetail.wxml` 第93行：`{{dish.grossRate}}%`（直接显示，期望0-100）✗

**修复方案**：全局统一使用0-1小数存储
1. `dishDetail.js` 第132行：`grossRate = sellPrice > 0 ? result.grossRate : 0`（不×100）
2. `dishDetail.js` 第141行：`'dish.grossRate': parseFloat(grossRate.toFixed(4))`
3. `dishDetail.wxml` 第93行：`{{(dish.grossRate * 100).toFixed(1)}}%`
4. 验证 `excel.js`、`DishCard.js`、`calc.getGrossRateLevel` 逻辑一致

**文件清单**：
- `pages/dishDetail/dishDetail.js` 第132、141行
- `pages/dishDetail/dishDetail.wxml` 第93行
- `utils/excel.js` 第78行（确认无需改）
- `utils/calc.js` 第46、158行（确认无需改）
- `components/DishCard/DishCard.js` 第67、71行（确认无需改）

---

### P0-2 历史报表分页参数错误

**影响**：前10条订单永远不显示，订单≤10条时报表完全空白

**根因分析**：
- `record.js` 第32行：`storage.getOrderList(1, PAGE_SIZE, dateRange)` 传入 page=1
- `storage.js` 第250行：`startIdx = page * size = 1 * 10 = 10`（跳过前10条）
- `onLoadMore` 在已缺失前10条的 `allOrders` 上做客户端分页，永远无法补回

**修复方案**：
1. `record.js` 第32行改为：`storage.getOrderList(0, 99999, dateRange)`（一次取全部）
2. `onLoadMore` 保持客户端分页逻辑不变
3. 验证 `storage.getOrderList` 的 page=0 逻辑正确

**文件清单**：
- `pages/record/record.js` 第32行

---

### P0-3 操作人字段大小写错误

**影响**：所有订单的操作人显示为"未知"，无法追责

**根因分析**：
- `login.js` 第58行存入 `userInfo.nickName`（大写N）
- `orderCalc.js` 第297行读取 `userInfo.nickname`（小写n）→ undefined
- `mine.js` 第31行做了兼容：`userInfo.nickName || userInfo.nickname`，但 orderCalc 没有

**修复方案**：
- `orderCalc.js` 第297行改为：`operator: userInfo.nickName || userInfo.nickname || '未知'`

**文件清单**：
- `pages/orderCalc/orderCalc.js` 第297行

---

## P1 重要 — 尽快修复

### P1-1 Excel导出缺少await

**文件**：`pages/mine/mine.js` 第46行
**问题**：`excel.saveCSV()` 返回Promise，但未await，filePath为Promise对象
**修复**：`const filePath = excel.saveCSV ? await excel.saveCSV(csv) : ''`

### P1-2 登录态数据不一致

**文件**：`pages/login/login.js` 第53-61行、`utils/auth.js` 第77-82行、`app.js` 第89-98行
**问题**：
- `auth.saveUserRole` 存 `globalData.userInfo = { nickName, avatarUrl }`
- `login.js` 覆盖 `storage.userInfo = { openid, nickName, role }`
- 两处字段不一致
**修复**：统一 userInfo 结构为 `{ nickName, avatarUrl, openid, role }`

### P1-3 kitchen角色可导出数据

**文件**：`pages/mine/mine.wxml` 第28-35行
**问题**：导出Excel和数据备份对所有角色可见，kitchen角色权限说明标注"导出：不允许"
**修复**：WXML增加 `wx:if="{{canExport}}"` 权限判断

### P1-4 供应商筛选高亮失效

**文件**：`pages/material/material.js` 第25、77-86行
**问题**：`supplierTags` 用简称（"上海诚惠"），`activeSupplier` 存全称（"上海诚惠食品有限公司"），TagFilter匹配不上
**修复**：`activeSupplier` 存简称，`applyFilter` 中映射为全称筛选

### P1-5 BOM上限不一致

**文件**：`pages/dishDetail/dishDetail.js` 第151行 vs `dishDetail.wxml` 第64行
**问题**：JS限制6种，WXML显示添加按钮到20种
**修复**：统一为6种或20种

### P1-6 新建菜品无权限检查

**文件**：`pages/dishDetail/dishDetail.js` 第38-41行
**问题**：`onLoad` 新建分支直接设 `isEdit: true`，不检查权限
**修复**：增加 `auth.canEdit('dish')` 检查

### P1-7 loadDish失败无导航返回

**文件**：`pages/dishDetail/dishDetail.js` 第47-59行
**问题**：菜品不存在时只toast不返回，加载失败无反馈
**修复**：`setTimeout(() => wx.navigateBack(), 1500)` + catch加toast

### P1-8 加载失败无错误提示（3个页面）

**文件**：`dishList.js` 第48-50行、`material.js` 第59-60行、`record.js` 第40-42行
**问题**：catch只console.error，用户看到空列表
**修复**：增加 `wx.showToast({ title: '加载失败', icon: 'none' })` + `loadError` 状态

### P1-9 保存订单金额可能为0

**文件**：`pages/orderCalc/orderCalc.js` 第221、232行
**问题**：totalMoney初始0，未先查看汇总就保存，弹窗显示"¥0"
**修复**：`onSaveOrder` 中先调用汇总计算

### P1-10 汇总逻辑重复实现

**文件**：`pages/orderCalc/orderCalc.js` 第127-197行 vs 第258-289行
**问题**：`onShowSummary` 和 `doSaveOrder` 各自实现一遍原料聚合
**修复**：抽取公共方法或使用已有的 `calc.calcOrderSummary`

### P1-11 非首页无登录守卫

**文件**：除index外所有页面
**问题**：仅index检查登录，其他页面可通过分享链接/恢复场景绕过
**修复**：`app.js` 添加全局 `checkAuth()` 方法，各页面onShow调用

### P1-12 xlsx.min.js缺失

**文件**：`components/ExcelUpload/ExcelUpload.js` 第97行
**问题**：require路径正确但文件不存在，Excel导入完全不可用
**修复**：下载xlsx.min.js放入 `miniprogram/libs/` 目录，或移除Excel导入功能

### P1-13 删除原料无错误处理

**文件**：`pages/material/material.js` 第284行
**问题**：`storage.deleteMaterial()` 的Promise无catch
**修复**：添加 `.catch()` + toast

### P1-14 种子注入云模式时序问题

**文件**：`app.js` 第59-76行
**问题**：`forEach` 不等Promise，云模式下 `seed_injected_v3` 在数据写完前就设true
**修复**：改为 `async/await` + `for...of` 循环

---

## P2 建议 — 体验优化（31项摘要）

| # | 问题 | 文件 | 修复建议 |
|---|------|------|---------|
| 1 | tabBar无图标 | app.json | 添加81×81px PNG图标 |
| 2 | 日期手输无校验 | record.js 第75-103行 | 改用 `<picker mode="date">` |
| 3 | 套餐颜色不一致 | DishCard.js vs format.js | 统一调用 format.packageColor() |
| 4 | 未使用组件注册×7 | 多个.json文件 | 移除冗余声明 |
| 5 | wx:for+wx:if反模式 | dishDetail.wxml 第50行、orderCalc.wxml 第83行 | 用block包裹 |
| 6 | openid空值显示"..." | mine.js 第32行 | 增加非空判断 |
| 7 | 退出未清temp_userInfo | mine.js 第207行 | 增加 removeStorageSync |
| 8 | 权限表显示原始JSON | mine.js 第157行 | 格式化为可读文本 |
| 9 | 备份分享无fail回调 | mine.js 第80-85行 | 增加 fail 回调 |
| 10 | 死代码request.js | utils/request.js | 移除或整合到storage.js |
| 11 | 死代码OrderSummary组件 | components/OrderSummary/ | 移除或重构使用 |
| 12 | 未使用云函数×2 | cloudfunctions/orderCompute, exportExcel | 移除或整合 |
| 13 | npm配置指向错误 | project.config.json 第34行 | 改为 miniprogram/package.json |
| 14 | login注释与实现不一致 | login.js 第3行 | 更新注释 |
| 15 | 种子注入无去重 | storage.js addMaterial/addDish | 增加_id检查 |
| 16 | 供应商数据分散维护 | material.js 第10、25、79行 | 提取为单一数据源 |
| 17 | 数字输入光标跳跃 | dishDetail.js 第89-108行 | blur时再parseFloat |
| 18 | onLoad+onShow重复refresh | index.js 第16-23行 | 只在onShow调用 |
| 19 | pageReady声明但未使用 | dishList.js | 移除或在WXML使用 |
| 20 | 下拉刷新未用finally | dishList.js 第30-33行 | 改用.finally() |
| 21 | material无下拉刷新 | material.json | 添加enablePullDownRefresh |
| 22 | onLoadMore人为延迟300ms | record.js 第134行 | 移除setTimeout |
| 23 | format.time检查冗余 | record.js 第55行 | 直接调用 |
| 24 | auth.canEdit依赖globalData但部分页面查storage | index.js 第28行 | 统一通过auth模块 |
| 25 | 损耗率变化弹窗不更新 | orderCalc.js 第109-122行 | 弹窗开时重新计算 |
| 26 | 保存后未清summaryData | orderCalc.js 第303行 | setData加 summaryData:[], totalMoney:0 |
| 27 | login失败无用户反馈 | login.js 第24-32行 | 增加toast降级提示 |
| 28 | CSS安全区高度被覆盖 | login.wxss 第13-14行 | 用env()单行写法 |
| 29 | Excel导入本地模式不可用但UI显示 | material.wxml 第19行 | 增加isCloud判断 |
| 30 | onEditFormChange逻辑冗余 | material.js 第176-195行 | 拆分为两个函数 |
| 31 | urlCheck/scopeDataCheck关闭 | project.config.json | 上线前设为true |

---

## 战略改进方向（CLO视角）

### 1. 数据契约统一
grossRate、userInfo、供应商名称三处格式分裂是根因。建议建立单一数据源（SSOT），所有模块从同一处读取格式定义。

### 2. 全局错误处理框架
3个页面加载失败都静默。建议封装统一的 `loadDataWithHandler()` 工具函数，内置loading/error/empty三态。

### 3. 权限架构重设计
当前权限检查散落在各页面。建议：
- app.js 提供全局 `checkAuth()` + `checkPermission('module')` 
- 各页面 onShow 统一调用
- WXML 层通过 `canEdit` 变量控制UI显隐

### 4. 代码复用
calcOrderSummary 已存在但未被使用，汇总逻辑却手写了两遍。建议清理死代码 + 强制使用公共函数。

### 5. 测试覆盖
48个问题中大部分可通过简单的单元测试发现。建议为 calc.js、storage.js、auth.js 编写测试用例。
