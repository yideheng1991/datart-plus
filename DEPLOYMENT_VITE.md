# Datart 本地启动与部署指南（Vite 版）

> 本文档针对前端构建工具从 Craco 迁移至 Vite 后的本地开发与部署流程。

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

## 三、生产部署模式

生产部署时，通过 Maven 构建将前端打包到后端，最终只需启动一个服务。

### 3.1 一键构建（推荐）

```bash
# 在项目根目录执行
mvn clean package -DskipTests
```

Maven 构建流程自动完成：
1. 执行 `npm run bootstrap` 安装前端依赖
2. 执行 `npm run build:all` 构建前端（包含 task 插件 + Vite 构建）
3. 将前端构建产物从 `frontend/build/` 复制到项目根目录 `static/`
4. 将 `frontend/build/task/index.js` 复制到后端资源目录
5. 打包生成部署 ZIP 文件

构建产物位于：
```
server/target/datart-server-1.0.0-rc.4-install.zip
```

### 3.2 手动构建前端（可选）

如需单独构建前端：

```bash
cd frontend
npm run bootstrap
npm run build:all
```

构建产物输出到 `frontend/build/`。

### 3.3 部署

**解压部署包：**

```bash
unzip datart-server-1.0.0-rc.4-install.zip -d datart-server
cd datart-server
```

部署目录结构：
```
datart-server/
├── bin/                    # 启动脚本
│   ├── datart-server.sh    # Linux 启动脚本
│   └── datart-server.cmd   # Windows 启动脚本
├── config/                 # 配置文件
│   ├── datart.conf         # 主配置文件（最高优先级）
│   ├── profiles/
│   │   └── application-config.yml
│   ├── logback.xml         # 日志配置
│   └── jdbc-driver-ext.yml # JDBC 驱动扩展配置
├── static/                 # 前端构建产物
│   ├── index.html
│   ├── shareChart.html
│   ├── shareDashboard.html
│   ├── shareStoryPlayer.html
│   ├── static/
│   │   ├── js/             # JS 文件
│   │   └── assets/         # CSS、图片等资源
│   └── ...
├── lib/                    # 后端 JAR 依赖
└── LICENSE
```

**修改配置：**

编辑 `config/datart.conf`，配置数据库和服务地址：

```properties
# 数据库配置
datasource.ip=127.0.0.1
datasource.port=3306
datasource.database=datart
datasource.username=root
datasource.password=你的密码

# 服务地址
server.port=8080
server.address=0.0.0.0

# Datart 服务外部访问地址（用于截图等功能）
datart.address=http://你的服务器IP:8080

# 是否允许注册
datart.user.register=true
```

**启动服务：**

Linux：
```bash
bin/datart-server.sh start
```

Windows：
```cmd
bin\datart-server.cmd start
```

**验证：**

浏览器打开 `http://服务器IP:8080` 即可访问。

### 3.4 服务管理（Linux）

```bash
# 启动
bin/datart-server.sh start

# 停止
bin/datart-server.sh stop

# 重启
bin/datart-server.sh restart

# 查看状态
bin/datart-server.sh status
```

## 四、配置说明

### 4.1 前端环境变量

前端通过 Vite 的环境变量系统管理配置。在 `frontend/` 目录下创建 `.env` 文件：

```bash
# 生产部署时的基础路径（对应后端的 context-path）
VITE_PUBLIC_URL=/
```

### 4.2 后端关键配置

| 配置项 | 文件 | 说明 |
|--------|------|------|
| `datasource.*` | `config/datart.conf` | 数据库连接 |
| `server.port` | `config/datart.conf` | 后端服务端口（默认 8080） |
| `datart.address` | `config/datart.conf` | 服务外部访问地址 |
| `datart.user.register` | `config/datart.conf` | 是否允许用户注册 |
| `datart.send-mail` | `config/datart.conf` | 是否启用邮件验证 |

### 4.3 前端开发代理配置

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

## 五、常见问题

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
