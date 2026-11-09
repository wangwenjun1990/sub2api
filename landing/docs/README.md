# 鹊桥文档页（GPT / Codex）

当前教程归在侧栏默认展开的「GPT 指南」下，可点击标题收起；以后可在 template.html 中并列增加 Claude 等指南分组。

直接双击 `index.html` 即可预览，无需启动前端或登录。页面自带样式和脚本，不依赖 CDN；截图放在旁边的 `images/` 目录。

## 从主页进入

主页顶部「使用文档」、页脚「使用文档」，以及「轻松接入」区域的 GPT / Codex 教程链接，都会打开本目录的 index.html。手机端可在右上角菜单中找到「使用文档」。

## 图片如何上传展示

当前为静态文档，没有网页上传按钮。本机预览直接复制图片；部署时将生成的 index.html 和 images/ 图片目录一起上传到网站的 docs/ 目录。

例如：把配置截图命名为 `cc-provider.png`，放入 `landing/docs/images/`，在仓库根目录运行 `node landing/docs/build.mjs`，刷新文档的「CC Switch 配置」页，就能看到图片替换原有占位框。

预留的图片名（以下使用 png，也支持 jpg / jpeg / webp / gif）：

| 图片文件名 | 展示位置 |
| --- | --- |
| api-key.png | 快速开始：创建 API Key |
| node-windows.png | Windows 安装 Node.js |
| node-linux.png | Linux 安装 Node.js |
| codex-installed.png | Codex 安装成功 |
| cc-download-windows.png | Windows 下载 CC Switch |
| cc-download-linux.png | Linux 下载 CC Switch |
| cc-provider.png | CC Switch 配置供应商 |
| codex-ready.png | Codex 连接成功 |

## 修改正文

正文在 **content.md**，使用 Markdown：标题、列表、表格、代码块、图片都可以编辑。

- `<!-- page:quickstart -->` 等标记分隔六个文档页，请保留。
- `:::windows` / `:::linux` 到 `:::` 之间是对应系统的专属内容，页面顶部按钮会统一切换。
- 普通内容两种系统共用。
- 页内链接使用 `#node`、`#codex`、`#cc-switch`、`#configuration`、`#faq`。

修改后，在仓库根目录运行：

```powershell
node landing/docs/build.mjs
```

生成器使用项目 `frontend/node_modules` 中已有的 marked。若尚未安装前端依赖，先按项目说明在 frontend 中执行 `pnpm install`（构建环境建议 Node.js 20+）。**阅读生成的网页不需要 Node.js 或任何依赖。**

## 贴截图

方式一：按占位标记自动替换。

正文中的 `<!-- screenshot:cc-provider | CC Switch 的 Codex 供应商配置 -->` 对应 `images/cc-provider.png`（也支持 jpg / jpeg / webp / gif）。保存截图后重新运行构建命令，会自动把占位框换成图片。其他标记同理。

方式二：直接在 Markdown 里插图。

```markdown
![填写 Codex 供应商信息](images/my-codex-settings.png)
```

将实际图片放入 `images/`，替换原有 screenshot 标记，重新生成即可。截图请遮住 API Key。

## 文件

- `content.md`：正文，日常主要编辑这里。
- `styles.css`：颜色、排版、响应式布局。
- `app.js`：导航、系统切换、搜索、复制、主题切换。
- `template.html`：页面外壳。
- `build.mjs`：将正文和样式脚本打包为可直接打开的 HTML。
- `index.html`：生成的页面；重新构建会覆盖，建议不要直接编辑。

品牌、控制台链接可在 template.html 中修改。API 基础地址和教程内容在 content.md 中修改，生成前请按实际站点核对。模型 ID 使用 YOUR_MODEL_ID 占位，以控制台当前分组为准。

## 本地访问

```powershell
python -m http.server 5176 --bind 127.0.0.1 --directory landing
```

访问 <http://127.0.0.1:5176/docs/>。预览服务需保持运行。

## 部署

将 `index.html` 和 `images/` 一起放在静态站点的 `/docs/` 目录即可。若已有 landing 站点，上传整个 docs 目录后可从 `/docs/` 打开。单独的 Markdown 文件不会自动被浏览器渲染。

本文档暂为独立静态页面；没有改动主应用路由。若希望使用 `api.queqiaohub.com/docs/`，需要给服务器增加对应静态路径，再上传这些文件。


