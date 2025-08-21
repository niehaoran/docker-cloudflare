# Docker 镜像拉取监控系统

这是一个增强的 Cloudflare Worker，用于代理和监控 Docker 镜像拉取，具有大小限制功能。

## 新增功能

### 🔍 镜像大小检查
- 在拉取前自动计算 Docker 镜像的总大小
- 支持设置最大镜像大小限制（默认 2048 MB）
- 自动解析 Docker manifest 并计算所有层的总大小
- 支持多架构镜像的大小检查

### 📊 实时日志监控
- 全新的终端风格界面，实时显示镜像拉取状态
- 会话管理系统，每个拉取操作都有独立的会话ID
- 实时显示镜像大小、层数、拉取状态等信息
- 支持查看历史拉取日志

### ⚙️ 配置选项

在 `woker.js` 文件顶部的用户配置区域：

```javascript
// 最大镜像大小限制（单位：MB）
const MAX_IMAGE_SIZE_MB = 2048;

// 是否启用大小检查
const ENABLE_SIZE_CHECK = true;
```

## 使用方法

### 1. 基本使用
访问部署的域名，使用新的监控界面：
- 输入镜像名称（如 `nginx`、`hello-world`、`ghcr.io/user/repo`）
- 点击"开始拉取"创建会话并生成拉取命令
- 点击"仅检查大小"只检查镜像大小不生成拉取命令

### 2. 命令行使用
```bash
# 拉取镜像（自动进行大小检查）
docker pull your-domain.com/nginx

# 检查特定镜像的大小
curl "https://your-domain.com/v2/nginx/manifests/latest"
```

### 3. API接口

#### 创建拉取会话
```bash
curl -X POST "https://your-domain.com/api/create-session" \
  -H "Content-Type: application/json" \
  -d '{"image": "nginx"}'
```

#### 获取会话日志
```bash
curl "https://your-domain.com/api/logs/{session-id}"
```

## 功能特性

### 大小检查机制
- 解析 Docker manifest v2 和 OCI 格式
- 支持多架构镜像（选择第一个架构进行计算）
- 自动处理 Docker Hub 官方镜像的命名空间
- 计算包含所有层的准确大小

### 日志系统
- 实时更新的终端风格界面
- 不同类型的日志条目（info、success、error）
- 会话管理和状态跟踪
- 自动清理旧日志条目

### 安全特性
- 白名单域名控制
- 可选的路径限制
- 镜像大小限制防止资源滥用
- CORS 支持

## 状态说明

### 会话状态
- `created`: 会话已创建
- `processing`: 正在检查镜像大小
- `approved`: 大小检查通过，允许拉取
- `rejected`: 镜像过大，拒绝拉取
- `downloading`: 正在下载镜像数据

### 日志类型
- `info`: 普通信息
- `success`: 成功操作
- `error`: 错误信息

## 部署说明

1. 将 `woker.js` 部署到 Cloudflare Workers
2. 配置自定义域名
3. 调整配置参数（大小限制、白名单等）
4. 访问域名开始使用监控界面

## 注意事项

- 大小检查仅在获取 manifest 时进行，不影响后续的层下载性能
- 会话数据存储在内存中，Worker 重启后会丢失
- 建议设置合理的大小限制以避免资源浪费
- 支持所有主流的 Docker 镜像仓库（Docker Hub、GitHub、GCR 等） 