# Docker 镜像代理加速服务

> 🚀 基于 Cloudflare Workers 的 Docker 镜像代理服务

## ✨ 功能特性

- 🐳 支持 Docker Hub、GHCR、GCR、Quay 等镜像仓库
- ⚡ 全球 CDN 加速，提升拉取速度
- 🔒 安全控制：IP 白名单、域名限制、频率控制
- 📊 可选镜像大小检查功能
- 🎨 友好的 Web 管理界面

## 🚀 快速开始

### 1. 部署到 Cloudflare Workers

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 创建新的 Worker
3. 复制 `worker.js` 代码并保存部署
4. 配置自定义域名

### 2. 使用方法

#### 网页界面
访问你的域名，输入镜像名即可生成代理命令

#### 命令行使用
```bash
# 官方镜像
docker pull your-domain.com/nginx
docker pull your-domain.com/mysql:8.0

# 第三方镜像
docker pull your-domain.com/ghcr.io/username/repo:tag
```

## 📋 支持的镜像仓库

| 仓库 | 示例 |
|------|------|
| Docker Hub | `your-domain.com/nginx` |
| GitHub | `your-domain.com/ghcr.io/actions/runner` |
| Google | `your-domain.com/gcr.io/distroless/java` |
| Quay | `your-domain.com/quay.io/prometheus/prometheus` |

## ⚙️ 配置选项

```javascript
// 允许的域名
const ALLOWED_HOSTS = ['registry-1.docker.io', 'ghcr.io', 'gcr.io', 'quay.io'];

// 镜像大小限制（MB，0=不限制）
const MAX_IMAGE_SIZE_MB = 2048;

// 访问控制
const ENABLE_ACCESS_CONTROL = true;
const ALLOWED_IP_RANGES = ['192.168.0.0/16', '10.0.0.0/8'];
```

## 🔧 API 接口

```bash
# 创建拉取会话
curl -X POST "https://your-domain.com/api/create-session" \
  -H "Content-Type: application/json" \
  -d '{"image": "nginx"}'

# 获取会话日志
curl "https://your-domain.com/api/logs/{session-id}"
```

## 💖 支持项目

如果这个项目对你有帮助，欢迎打赏支持！

<div align="center">
  <img src="donate-qr.png" alt="微信打赏" width="300"/>
  <br>
  <em>扫码打赏，支持开发</em>
</div>

## 👨‍💻 作者

**陈不丢**
- GitHub: [@niehaoran](https://github.com/niehaoran)
- 博客: [blog.budiuyun.net](https://blog.budiuyun.net)
- 我的容器云平台: [budiuyun.net](https://budiuyun.net)

## ⚠️ 免责声明

- 本程序仅供学习交流使用，请勿用于非法用途
- 使用本程序需遵守当地法律法规
- 作者不对使用者的任何行为承担责任

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！⭐**

</div>

## Star 趋势
[![Star 趋势](https://starchart.cc/niehaoran/docker-cloudflare.svg?variant=adaptive)](https://starchart.cc/niehaoran/docker-cloudflare) 