# Datart 本地开发指南（Vite 版）

> 本文档针对前端构建工具从 Craco 迁移至 Vite 后的本地开发流程。

## 一、环境要求

| 组件 | 版本要求 | 当前版本 |
|------|---------|---------|
| Node.js | >= 18（推荐 22.x） | v22.22.0 |
| JDK | 1.8 | 1.8 |
| Maven | >= 3.6 | - |
| MySQL | >= 5.7 | - |
| npm | >= 6.4.1 | - |

## 二、本地开发模式

本地开发时前后端分别启动，前端通过 Vite 代理将 API 请求转发到后端。

### 2.1 配置数据库

编辑 `config/datart.conf`，填写数据库连接信息：

```properties
datasource.ip=127.0.0.1
datasource.port=3306
datasource.database=datart
datasource.username=root
datasource.password=123456
```

### 2.2 启动后端

**方式一：IDE 启动**

在 IntelliJ IDEA 中直接运行主类 `datart.DatartServerApplication`（位于 `server/src/main/java/datart/DatartServerApplication.java`）。

VM 参数添加：
```
-Dspring.profiles.active=config
-Dfile.encoding=UTF-8
```

**方式二：命令行启动**

```bash
# 在项目根目录执行 Maven 编译
mvn clean compile -DskipTests

# 启动后端服务（监听 8080 端口）
java -server -Dspring.profiles.active=config -Dfile.encoding=UTF-8 -cp "server/target/classes;server/target/lib/*" datart.DatartServerApplication
```

启动成功后，后端服务运行在 `http://localhost:8080`。

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

前端通过 Vite 的环境变量系统管理配置。在 `frontend/` 目录下创建 `.env` 文件：

```bash
# 生产部署时的基础路径（对应后端的 context-path）
VITE_PUBLIC_URL=/
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

## 四、常见问题

### Q: 前端启动后页面空白？
检查浏览器控制台是否有错误。确认后端服务已启动，Vite 代理配置正确。

### Q: Logo 不显示？
确认 `vite.config.ts` 中 svgr 插件配置为 `include: '**/*.svg?svgr'`，普通 SVG 导入应返回 URL 而非组件。

### Q: 构建时提示 Node 版本不兼容？
确保 Node.js >= 18。当前项目使用 Vite 4.5.x，推荐使用 Node 22.x。

### Q: 后端启动报数据库连接失败？
检查 `config/datart.conf` 中的数据库配置是否正确，确认 MySQL 服务已启动且 `datart` 数据库已创建。

### Q: 端口被占用？
- 前端：Vite 会自动递增端口（3000 → 3001 → 3002 ...）
- 后端：修改 `config/datart.conf` 中的 `server.port`
