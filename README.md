![](https://datart-docs.dhyi.top/datart-docs/images/about/logo_with_text.jpg)

> ⚠️ 本项目基于 datart 进行二次开发与功能增强，**非官方仓库**。  
> 原 datart 项目自 2023 年 9 月起更新缓慢，本仓库旨在在其基础上持续维护并增强企业级可视化能力。

# datart-plus
**datart 增强发行版** —— 专注提升大屏编辑体验、统计图表能力与高级表格表现力，更适合企业落地场景。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

---

## 🚀 项目定位

datart-plus 是基于开源项目 [datart](https://gitee.com/running-elephant/datart) 的**增强发行版**。
datart 由原 davinci 主创团队（跑象科技 / running-elephant）出品。

- ✅ 完全保留 datart 的核心设计理念：`Source → View → Chart → Visualization`
- ✅ 在不破坏原生模型的前提下，系统性增强编辑体验与分析能力
- ✅ 针对国内企业常见场景，沉淀高频、实用的可视化能力
- ✅ **在原项目维护节奏放缓的背景下，提供持续可用的增强版本**

📌 **这不是一个 fork，而是一个独立维护的能力增强版本。**

---

## 🌟 核心增强能力（Highlights）

| 类型 | 分类 | 更新内容 |
| :--- | :--- | :--- |
| ✨ 新增功能 | 大屏媒体组件 | • 新增 **13 种大屏边框组件**<br>• 新增 **11 种装饰元素**<br>• 新增 **Icon 图标组件**（支持样式与颜色配置） |
| ✨ 新增功能 | 自由布局编辑器（重构） | • **多选组件**：支持批量复制、粘贴、撤销/重做<br>• **对齐工具栏**：一键左/右/顶/底对齐，水平/垂直居中<br>• **智能参考线**：拖拽时显示边缘与中心对齐参考线<br>• **方向键交互优化**：<br>　- 选中组件：方向键微调位置<br>　- 未选中组件：方向键滚动画布<br>• **透明度设置**：支持自由布局 / 自动布局的画布及组件背景透明度调整<br>• **颜色增强**：新增颜色取色器 + 最近使用颜色记录 |
| ✨ 新增功能 | 数据分析 | • 聚合方式新增 **中位数（Median）**、**四分位数（Quartile）** |
| ✨ 新增功能 | 图表插件 | • 新增 **雷达图图表插件**，支持多维数据对比分析，支持跳转与查看数据交互<br>• 新增 **箱线图（Boxplot）**，支持分布统计与异常值分析 |
| ✨ 新增功能 | NL2SQL 智能查询 | • 新增对接 AI 大模型，实现自然语言 SQL 查询<br>• 新增默认 Prompt 模板配置<br>• Schema 提示词压缩优化，降低 Token 消耗 |
| 🔧 技术升级 | 前端构建工具 | • 前端构建工具从 **Craco 迁移至 Vite 7**<br>• 开发服务器秒级启动，HMR 热更新<br>• Task 构建使用 esbuild + Babel，性能提升 **30x+** |
| 🔧 技术升级 | API 文档 | • Swagger 从 Springfox v2 迁移至 **Springdoc OpenAPI 3**<br>• 生产环境自动禁用 Swagger |
| 🐛 Bug 修复 | 筛选与时间 | • 修复图表筛选条件「自定义时间」默认值错误问题（原默认 +2，已修正为当前正确时间） |
| 🐛 Bug 修复 | SQL 生成 | • 修复日期粒度字段排序时 `columnKey` 与 `functionColumns` 不一致导致的 SQL 报错问题 |
| 🐛 Bug 修复 | 数据源兼容 | • 修复 H2 方言翻译 MySQL `IF` 与 `DATEDIFF` 函数时的语法兼容性问题 |
| 🐛 Bug 修复 | 图表渲染 | • 修复图表事件监听器解绑引发的内存泄漏<br>• 修复替换 View 字段时原字段配置丢失问题 |
| 🐛 Bug 修复 | 大屏组件 | • 修复 TabWidget 选项卡间距、溢出、宽度约束和标题同步问题 |

---

### 架构模块 Architecture
![](http://datart-docs.dhyi.top/datart-docs/images/about/architecture.png)

## 🤔 为什么选择 datart-plus？

如果你有以下需求，这个版本会比原生 datart 更合适：

- 需要**更高效的大屏编辑体验**
- 希望未来有**箱线图、雷达图**等更多的统计分析图表支持
- 需要 **AntV S2 级别的高级表格能力**(单独插件)
- 需要 **AI 自然语言查询（NL2SQL）** 能力
- 需要在现代前端工具链（**Vite 7**）上运行和开发
- 在企业内部系统中高频使用 datart
- 需要**持续维护、可落地、可扩展**的可视化平台

### 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | React 17 + TypeScript 4.5 |
| 构建工具 | **Vite 7**（已从 Craco 迁移） |
| UI 组件库 | Ant Design 4.16 |
| 图表引擎 | ECharts 5.3 + AntV S2 1.19 |
| 后端框架 | Spring Boot 2.4 + Java 8 |
| API 文档 | **Springdoc OpenAPI 3**（已从 Springfox 迁移） |
| 数据库 | MySQL 5.7+ / H2 |
| 前端开发环境 | Node.js >= 22 |

---

## 🔗 与原生 datart 的关系

| 项目 | 说明 |
|---|---|
| 基础架构 | 完全继承 datart 官方架构 |
| 插件体系 | 兼容原生 Source / Chart / Visualization 插件机制 |
| 数据模型 | 与官方版本保持一致 |
| 维护状态 | 原项目自 2023 年 9 月起更新较少，本仓库独立维护并持续增强 |

---

## 📸 在线体验

> 演示地址

http://datart-demo.dhyi.top  
用户名：demo  
密码：123456

---

## ⚡ 快速开始
- **本地开发**：参见 [DEPLOYMENT_VITE.md](./DEPLOYMENT_VITE.md)（Vite 版开发指南）
- **生产部署**：参见 [Deployment 文档](https://datart-docs.dhyi.top/datart-docs/docs/)
- **用户手册**：参见 [第一个可视化作品](https://datart-docs.dhyi.top/datart-docs/docs/first-visualization.html)


---

## 🌐 社区支持

### 交流讨论
欢迎加入知识星球参与讨论  
![](https://datart-docs.dhyi.top/datart-docs/images/about/zhishixingqiu.jpg)

### 插件示例仓库
[示例仓库 v1.0.0](https://gitee.com/running-elephant/datart-extension-charts)

### 反馈问题
平台问题可查看 [Issue](https://gitee.com/ydheng/datart/issues)，提交新 Issue 请参考 [Issue 描述规范](https://gitee.com/ydheng/datart/tree/master/.gitee/)

---

## 📝 版本说明

本项目遵循 datart 原有 **Apache 2.0** 协议，新增代码同样开源。

---

## 🙏 致谢

本项目由 **datart（原 davinci 主创团队，跑象科技 / running-elephant）** 的设计理念启发而来。  
在原项目维护节奏放缓的背景下，datart-plus 希望延续其开放、可塑、智能的设计理念，进一步降低企业可视化落地成本。

---

## 📄 License

datart-plus is licensed under the Apache License 2.0.  
See the [LICENSE](https://gitee.com/running-elephant/datart/blob/master/LICENSE) file for details.