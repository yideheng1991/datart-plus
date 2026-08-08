# Datart 本地开发指南（Vite 版）

> 本文档针对前端构建工具从 Craco 迁移至 Vite 后的本地开发流程。

## 一、环境要求

| 组件 | 版本要求 | 当前版本 |
|------|---------|---------|
| Node.js | >= 22 | v22.22.0 |
| JDK | 1.8 | 1.8 |
| Maven | >= 3.6 | - |

## 二、本地开发模式

本地开发时前后端分别启动，前端通过 Vite 代理将 API 请求转发到后端。

### 2.1 配置数据库

编辑 `server/src/main/resources/application-demo.yml`，修改数据库连接信息：

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource
    url: jdbc:mysql://127.0.0.1:3306/datart?&allowMultiQueries=true&characterEncoding=utf-8
    username: root
    password: 123456
```

默认使用 MySQL，也可切换为内置 H2 数据库（取消注释 `h2` 配置并注释掉 `mysql` 配置）。

### 2.2 启动后端

**IDE 启动**

在 IntelliJ IDEA 中直接运行主类 `datart.DatartServerApplication`（位于 `server/src/main/java/datart/DatartServerApplication.java`）。

VM 参数添加：
```
-Dspring.profiles.active=demo
-Dfile.encoding=UTF-8
```

### 2.3 启动前端

```bash
cd frontend

# 首次运行：安装依赖
npm run bootstrap

# 启动开发服务器
npm run dev
```

启动成功后：
- 前端开发服务器运行在 `http://localhost:3000`（端口被占用时自动递增）
- Vite 已配置代理，`/api/v1` 和 `/resources` 请求自动转发到后端 `http://localhost:8080`
- 支持 HMR 热更新，修改代码后页面自动刷新

### 2.4 访问应用

浏览器打开 `http://localhost:3000` 即可访问 Datart。

## 三、配置说明

### 3.1 前端环境变量

前端通过 Vite 的环境变量系统管理配置：

| 文件 | 用途 |
|------|------|
| `frontend/.env` | 通用环境变量 |
| `frontend/.env.development` | 开发环境（`npm run dev`） |
| `frontend/.env.production` | 生产环境（`npm run build`） |

```bash
# 生产部署时的基础路径（对应后端的 context-path）
VITE_PUBLIC_URL=/

# 是否生成 sourcemap（生产环境建议 false）
GENERATE_SOURCEMAP=false
```

### 3.2 前端开发代理配置

前端开发服务器的代理配置位于 `frontend/vite.config.ts`：

```typescript
server: {
  port: 3000,
  proxy: {
    '/api/v1': {
      target: 'http://localhost:8080',  // 后端地址
      changeOrigin: true,
    },
    '/resources': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

如后端端口非 8080，需同步修改此配置。

## 四、生产构建与部署

### 4.1 手动构建前端

```bash
cd frontend

# 安装依赖
npm run bootstrap

# 生产构建（输出到 frontend/build/）
npm run build:all
```

`build:all` 包含两步：
- `build:task` — 使用 esbuild + Babel 构建 task 脚本（输出到 `build/task/index.js`）
- `build` — 使用 Vite 构建前端应用（输出到 `build/`）

### 4.2 Maven 一体化构建

Maven 构建时会自动执行前端构建：

```bash
cd datart
mvn clean package -Dmaven.test.skip=true
```

构建流程：
1. `initialize` — `npm run bootstrap` 安装前端依赖
2. `generate-resources` — `npm run build:all` 构建前端
3. `compile` — 将 `frontend/build/` 复制到 `static/`
4. `package` — 打包为 `datart-server-1.0.0-rc.x-install.zip`

### 4.3 部署


- 新手上路：参见 [Deployment](./Deployment.md)
- 详细文档：https://datart-docs.dhyi.top/datart-docs/docs/




