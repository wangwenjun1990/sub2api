# Sub2API Landing Page

单文件静态落地页，不依赖构建工具，不需要改 sub2api 主程序。

## 文件

```text
landing/
├── index.html   # 页面本体（HTML + CSS + JS 都在这一个文件里）
└── README.md
```

## 先改这几处

打开 `landing/index.html`，找到最下面的 `SITE_CONFIG`：

```js
const SITE_CONFIG = {
  name: "Sub2API",
  panelUrl: "https://console.example.com",
  registerUrl: "https://console.example.com/register",
  apiBase: "https://api.example.com",
  contactUrl: "https://t.me/yourname",
  icp: "ICP备00000000号"
};
```

| 字段 | 说明 |
|---|---|
| `name` | 品牌名，会替换页面上的 Sub2API |
| `panelUrl` | sub2api 控制台地址 |
| `registerUrl` | 注册页地址 |
| `apiBase` | 用户调用 API 的 Base URL |
| `contactUrl` | 客服链接（Telegram / QQ / 微信 / 邮箱） |
| `icp` | 备案号，没有就留空，会自动隐藏 |

还可以按实际情况修改：

- 模型列表（`#models` 区域）
- 价格（`#pricing` 区域）
- FAQ 文案
- 主题色：`:root` 里的 `--accent`、`--accent-2`

**不要写你没有的能力**，比如真实可用性、并发数、退款承诺，按实际服务写。

## 本地预览

直接双击 `index.html` 就能看。

或者：

```bash
cd landing
python -m http.server 8000
```

打开 `http://localhost:8000`。

## 部署方式一：Caddy（推荐）

假设：

- 落地页：`www.example.com`
- 控制台：`console.example.com`
- API：`api.example.com`

Caddyfile：

```caddy
www.example.com {
    root * /var/www/sub2api-landing
    file_server
}

console.example.com {
    reverse_proxy 127.0.0.1:8080
}

api.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

上传页面：

```bash
sudo mkdir -p /var/www/sub2api-landing
sudo cp landing/index.html /var/www/sub2api-landing/
```

然后 `sudo systemctl reload caddy`。

## 部署方式二：Nginx

```nginx
server {
    listen 80;
    server_name www.example.com;
    root /var/www/sub2api-landing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

控制台和 API 用另外的 server 块反代到 `127.0.0.1:8080`，或者直接用不同端口/子域名。

## 和 sub2api 的关系

- 落地页只是营销页，负责介绍、引导注册。
- 注册、登录、充值、创建 API Key 仍然在 sub2api 控制台。
- CTA 按钮通过 `SITE_CONFIG` 跳到控制台。

推荐用**子域名**分离：

```text
www.example.com       -> 落地页
console.example.com   -> sub2api 控制台
api.example.com       -> sub2api API
```

如果一定要同域名：

```text
example.com/          -> 落地页
example.com/api/...   -> 反代 sub2api
example.com/v1/...    -> 反代 sub2api
example.com/login     -> 反代 sub2api
```

Nginx 需要按路径分流，配置更复杂，不如子域名清晰。

## 上线前检查

- 域名已解析，HTTPS 正常
- `panelUrl` / `registerUrl` / `apiBase` 都是真实可访问地址
- 模型列表和价格与实际控制台一致
- 联系方式可点通
- 备案号（如需）
- 退款、隐私、服务条款页面（如需）

## 说明

这个页面是原创模板，只参考了同类 AI 中转站落地页的常见结构，没有复制 apikey.fan 的代码、样式或文案。
