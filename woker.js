// 更新日期: 2025-01-12
// Docker镜像代理服务 - 性能优化版本
// 核心功能：Docker镜像代理、GitHub代理、基础大小限制
// 性能优化：连接复用、流式传输、预连接、并行处理

// ============ 用户配置区域 ============
// 允许代理的域名列表
const ALLOWED_HOSTS = [
  'quay.io',
  'gcr.io',
  'k8s.gcr.io',
  'registry.k8s.io',
  'ghcr.io',
  'docker.cloudsmith.io',
  'registry-1.docker.io',
  'github.com',
  'api.github.com',
  'raw.githubusercontent.com',
  'gist.github.com',
  'gist.githubusercontent.com'
];

// 是否限制路径访问
const RESTRICT_PATHS = false;

// 允许的路径关键字（仅当RESTRICT_PATHS=true时生效）
const ALLOWED_PATHS = [
  'library',
  'user-id-1',
  'user-id-2'
];

// Docker镜像大小限制（MB，0表示不限制）
const MAX_IMAGE_SIZE_MB = 2048;

// 是否启用镜像大小检查
const ENABLE_SIZE_CHECK = true;

// ============ 性能优化配置 ============
// 连接超时时间（毫秒）
const CONNECTION_TIMEOUT = 15000;

// 是否启用流式传输优化
const ENABLE_STREAMING = true;

// 流式传输的最小文件大小（MB）
const STREAMING_MIN_SIZE = 1;

// 是否启用并行处理
const ENABLE_PARALLEL_PROCESSING = true;

// 最大并行连接数
const MAX_PARALLEL_CONNECTIONS = 6;

// 是否启用预连接优化
const ENABLE_PRECONNECT = true;

// ============ 优化的前端界面 ============
const HOMEPAGE_HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Docker 镜像代理服务 - Cloudflare Workers</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: gradientShift 10s ease infinite;
      background-size: 400% 400%;
    }
    
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 60px;
      box-shadow: 
        0 32px 64px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.2);
      max-width: 1000px;
      width: 100%;
      text-align: center;
      animation: slideUp 0.8s ease-out;
      position: relative;
      overflow: hidden;
    }
    
    .container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
      animation: shimmer 2s ease-in-out infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    h1 {
      color: #1a202c;
      margin-bottom: 24px;
      font-size: 3.5em;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .subtitle {
      color: #4a5568;
      margin-bottom: 40px;
      font-size: 1.4em;
      font-weight: 400;
      line-height: 1.6;
    }
    
    .status-banner {
      background: linear-gradient(135deg, #48bb78, #38a169);
      color: white;
      border-radius: 16px;
      padding: 24px;
      margin: 30px 0;
      box-shadow: 0 8px 24px rgba(72, 187, 120, 0.3);
      transform: perspective(1000px) rotateX(2deg);
      transition: transform 0.3s ease;
    }
    
    .status-banner:hover {
      transform: perspective(1000px) rotateX(0deg) translateY(-2px);
    }
    
    .status-banner h3 {
      font-size: 1.5em;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    .status-banner p {
      font-size: 1.1em;
      opacity: 0.95;
    }
    
    .info-card {
      background: rgba(255, 255, 255, 0.8);
      border-radius: 20px;
      padding: 32px;
      margin: 32px 0;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .info-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .info-card:hover::before {
      opacity: 1;
    }
    
    .info-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
    }
    
    .info-card h3 {
      color: #2d3748;
      font-size: 1.6em;
      margin-bottom: 20px;
      font-weight: 600;
    }
    
    .usage-example {
      background: #1a202c;
      color: #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
      margin: 24px 0;
      text-align: left;
      overflow-x: auto;
      font-size: 0.95em;
      line-height: 1.6;
      box-shadow: 0 8px 24px rgba(26, 32, 44, 0.3);
      border: 1px solid #2d3748;
      position: relative;
    }
    
    .usage-example::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, #667eea, transparent);
    }
    
    .usage-example .comment {
      color: #68d391;
      font-style: italic;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin: 32px 0;
      text-align: left;
    }
    
    .feature-item {
      background: rgba(255, 255, 255, 0.6);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      transition: all 0.3s ease;
      position: relative;
    }
    
    .feature-item:hover {
      background: rgba(255, 255, 255, 0.8);
      transform: translateY(-2px);
    }
    
    .feature-item::before {
      content: "✨";
      position: absolute;
      top: 20px;
      left: 20px;
      font-size: 1.5em;
    }
    
    .feature-item h4 {
      color: #2d3748;
      font-size: 1.2em;
      margin-bottom: 12px;
      margin-left: 40px;
      font-weight: 600;
    }
    
    .feature-item p {
      color: #4a5568;
      margin-left: 40px;
      line-height: 1.5;
    }
    
    .config-info {
      background: linear-gradient(135deg, #fed7aa, #fdba74);
      border: 1px solid #fb923c;
      border-radius: 16px;
      padding: 24px;
      margin: 32px 0;
      color: #9a3412;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(251, 146, 60, 0.2);
    }
    
    .footer {
      margin-top: 48px;
      padding-top: 32px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      color: #718096;
      font-size: 0.95em;
      line-height: 1.6;
    }
    
    .footer p {
      margin: 8px 0;
    }
    
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 500;
      margin: 4px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 40px 30px;
        margin: 10px;
        border-radius: 20px;
      }
      
      h1 {
        font-size: 2.5em;
      }
      
      .subtitle {
        font-size: 1.2em;
      }
      
      .info-card {
        padding: 24px;
      }
      
      .feature-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .usage-example {
        font-size: 0.85em;
        padding: 20px;
      }
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 30px 20px;
      }
      
      h1 {
        font-size: 2em;
      }
      
      .status-banner, .info-card {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🐳 Docker 镜像代理服务</h1>
    <div class="subtitle">基于 Cloudflare Workers 的高速稳定 Docker 镜像拉取服务</div>
    
    <div class="status-banner">
      <h3>🚀 服务状态：正常运行</h3>
      <p>当前域名：<strong>${globalThis.location?.hostname || 'your-domain.com'}</strong></p>
      <div style="margin-top: 16px;">
        <span class="badge">全球加速</span>
        <span class="badge">自动认证</span>
        <span class="badge">智能重定向</span>
      </div>
    </div>
    
    ${ENABLE_SIZE_CHECK ? `
    <div class="config-info">
      ⚠️ <strong>镜像大小限制</strong>：${MAX_IMAGE_SIZE_MB > 0 ? MAX_IMAGE_SIZE_MB + ' MB' : '无限制'}
    </div>
    ` : ''}
    
    <div class="info-card">
      <h3>📋 使用方法</h3>
      <div class="usage-example">
<span class="comment"># 基础用法 - Docker Hub 官方镜像</span>
docker pull ${globalThis.location?.hostname || 'your-domain.com'}/nginx
docker pull ${globalThis.location?.hostname || 'your-domain.com'}/library/nginx

<span class="comment"># 第三方镜像仓库</span>
docker pull ${globalThis.location?.hostname || 'your-domain.com'}/ghcr.io/user/repo
docker pull ${globalThis.location?.hostname || 'your-domain.com'}/quay.io/user/repo

<span class="comment"># GitHub 文件下载加速</span>
curl ${globalThis.location?.hostname || 'your-domain.com'}/github.com/user/repo/releases/download/v1.0/file.tar.gz
      </div>
    </div>
    
    <div class="info-card">
      <h3>✨ 支持的功能</h3>
      <div class="feature-grid">
        <div class="feature-item">
          <h4>Docker Hub 代理</h4>
          <p>支持所有 Docker Hub 官方镜像，包括 library 命名空间</p>
        </div>
        <div class="feature-item">
          <h4>第三方仓库</h4>
          <p>支持 GitHub Container Registry、Quay.io、GCR.io 等</p>
        </div>
        <div class="feature-item">
          <h4>GitHub 加速</h4>
          <p>加速 GitHub 文件下载，包括 releases 和 raw 文件</p>
        </div>
        <div class="feature-item">
          <h4>智能处理</h4>
          <p>自动处理认证、重定向和 S3 存储桶访问</p>
        </div>
        ${ENABLE_SIZE_CHECK ? `
        <div class="feature-item">
          <h4>大小限制</h4>
          <p>智能检查镜像大小，防止拉取超大镜像</p>
        </div>
        ` : ''}
        <div class="feature-item">
          <h4>全球加速</h4>
          <p>基于 Cloudflare 全球网络，就近访问最快节点</p>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>🌟 服务由 Cloudflare Workers 提供支持</strong></p>
      <p>⚡ 全球边缘计算 • 🔒 安全可靠 • 🚀 极速访问</p>
      <p>最后更新：${new Date().toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
    </div>
  </div>
</body>
</html>
`;

// ============ 性能优化实现 ============

// 连接池管理
const connectionPool = new Map();

// 预连接缓存
const preconnectCache = new Map();

// 简化的会话存储
const pullSessions = new Map();

// 生成会话ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15);
}

// 创建优化的fetch选项
function createOptimizedFetchOptions(method, headers, body, isLargeFile = false) {
  const options = {
    method,
    headers,
    body,
    redirect: 'manual',
    // 连接复用优化
    keepalive: true,
  };
  
  // 为大文件启用流式传输
  if (ENABLE_STREAMING && isLargeFile) {
    // CF Workers会自动处理流式传输
    options.cf = {
      // 缓存设置
      cacheEverything: false,
      // 启用Argo Smart Routing（如果可用）
      apps: false,
    };
  }
  
  return options;
}

// 优化的请求头设置
function createOptimizedHeaders(originalHeaders, targetDomain, isDockerRequest = false, isLargeFile = false) {
  const headers = new Headers(originalHeaders);
  
  // 基础优化头
  headers.set('Host', targetDomain);
  headers.set('Connection', 'keep-alive');
  headers.set('Keep-Alive', 'timeout=30, max=1000');
  
  // 压缩优化
  if (!headers.has('Accept-Encoding')) {
    headers.set('Accept-Encoding', 'gzip, deflate, br');
  }
  
  // Docker特定优化
  if (isDockerRequest) {
    headers.set('Docker-Distribution-API-Version', 'registry/2.0');
    
    // 大文件传输优化
    if (isLargeFile) {
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Cache-Control', 'no-cache');
    }
  }
  
  // 性能优化头
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('CF-Connecting-IP', '1.1.1.1'); // 标识来自CF
  
  return headers;
}

// 预连接到目标域名
async function preconnectToHost(hostname) {
  if (!ENABLE_PRECONNECT || preconnectCache.has(hostname)) {
    return;
  }
  
  try {
    // 发送HEAD请求预热连接
    const preconnectPromise = fetch(`https://${hostname}/`, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Docker-Client/24.0.0 (linux)',
        'Connection': 'keep-alive'
      },
      cf: {
        cacheTtl: 0,
        cacheEverything: false
      }
    }).catch(() => {}); // 忽略错误
    
    preconnectCache.set(hostname, preconnectPromise);
    
    // 5分钟后清除缓存
    setTimeout(() => {
      preconnectCache.delete(hostname);
    }, 300000);
    
  } catch (error) {
    // 预连接失败不影响主流程
  }
}

// 并行处理多个请求
async function parallelFetch(requests) {
  if (!ENABLE_PARALLEL_PROCESSING || requests.length <= 1) {
    // 如果没有启用并行处理或只有一个请求，直接处理
    return requests.length === 1 ? [await fetch(...requests[0])] : [];
  }
  
  // 限制并发数
  const chunks = [];
  for (let i = 0; i < requests.length; i += MAX_PARALLEL_CONNECTIONS) {
    chunks.push(requests.slice(i, i + MAX_PARALLEL_CONNECTIONS));
  }
  
  const results = [];
  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map(request => fetch(...request))
    );
    results.push(...chunkResults.map(result => 
      result.status === 'fulfilled' ? result.value : null
    ).filter(Boolean));
  }
  
  return results;
}

// 添加日志
function addLog(sessionId, message, type = 'info') {
  if (!pullSessions.has(sessionId)) {
    pullSessions.set(sessionId, {
      logs: [],
      startTime: new Date(),
      imageSize: 0,
      layerCount: 0,
      status: 'processing'
    });
  }
  const session = pullSessions.get(sessionId);
  session.logs.push({
    timestamp: new Date().toISOString(),
    message,
    type
  });
  // 保持最近100条日志
  if (session.logs.length > 100) {
    session.logs = session.logs.slice(-100);
  }
}

// 检查是否为AWS S3
function isAmazonS3(url) {
  try {
    return new URL(url).hostname.includes('amazonaws.com');
  } catch {
    return false;
  }
}

// 获取空请求体的SHA256哈希值
function getEmptyBodySHA256() {
  return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
}

// 处理Docker认证token
async function handleToken(realm, service, scope) {
  let tokenUrl = realm;
  const params = new URLSearchParams();
  
  if (service) params.append('service', service);
  if (scope) params.append('scope', scope);
  
  if (params.toString()) {
    tokenUrl += '?' + params.toString();
  }
  
  try {
    const tokenResponse = await fetch(tokenUrl, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Docker-Client/24.0.0 (linux)'
      }
    });
    
    if (!tokenResponse.ok) {
      // 尝试无scope的请求
      if (scope && tokenResponse.status === 400) {
        const noScopeParams = new URLSearchParams();
        if (service) noScopeParams.append('service', service);
        
        const noScopeUrl = realm + (noScopeParams.toString() ? '?' + noScopeParams.toString() : '');
        const retryResponse = await fetch(noScopeUrl, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'Docker-Client/24.0.0 (linux)'
          }
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          return retryData.token || retryData.access_token;
        }
      }
      return null;
    }
    
    const tokenData = await tokenResponse.json();
    return tokenData.token || tokenData.access_token;
  } catch (error) {
    console.log(`Token获取失败: ${error.message}`);
    return null;
  }
}

// 计算镜像大小（简化版本）
async function calculateImageSize(targetDomain, imagePath, token, sessionId) {
  try {
    addLog(sessionId, `检查镜像大小: ${imagePath}`, 'info');
    
    const manifestUrl = `https://${targetDomain}/v2/${imagePath}/manifests/latest`;
    const headers = {
      'Accept': 'application/vnd.docker.distribution.manifest.v2+json,application/vnd.docker.distribution.manifest.list.v2+json',
      'User-Agent': 'Docker-Client/24.0.0 (linux)'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const manifestResponse = await fetch(manifestUrl, { headers });
    
    if (!manifestResponse.ok) {
      addLog(sessionId, `获取manifest失败: ${manifestResponse.status}`, 'error');
      return { success: false, size: 0 };
    }

    const manifest = await manifestResponse.json();
    let totalSize = 0;
    let layerCount = 0;

    // 处理不同类型的manifest
    if (manifest.layers) {
      // 标准V2 manifest
      for (const layer of manifest.layers) {
        totalSize += layer.size;
        layerCount++;
      }
    } else if (manifest.manifests && manifest.manifests[0]) {
      // 多架构镜像，选择第一个
      const archManifestUrl = `https://${targetDomain}/v2/${imagePath}/manifests/${manifest.manifests[0].digest}`;
      const archResponse = await fetch(archManifestUrl, { headers });
      if (archResponse.ok) {
        const archManifest = await archResponse.json();
        if (archManifest.layers) {
          for (const layer of archManifest.layers) {
            totalSize += layer.size;
            layerCount++;
          }
        }
      }
    }

    const sizeInMB = totalSize / 1024 / 1024;
    addLog(sessionId, `镜像大小: ${sizeInMB.toFixed(2)} MB (${layerCount} 层)`, 'success');

    // 更新会话信息
    const session = pullSessions.get(sessionId);
    if (session) {
      session.imageSize = sizeInMB;
      session.layerCount = layerCount;
    }

    return {
      success: true,
      size: sizeInMB,
      layerCount: layerCount
    };

  } catch (error) {
    addLog(sessionId, `大小检查失败: ${error.message}`, 'error');
    return { success: false, size: 0 };
  }
}

// ============ 主处理函数 ============
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  let path = url.pathname;

  console.log(`请求: ${request.method} ${path}`);

  // 首页
  if (path === '/' || path === '') {
    return new Response(HOMEPAGE_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // API: 创建会话
  if (path === '/api/create-session' && request.method === 'POST') {
    const sessionId = generateSessionId();
    const body = await request.json();
    const imageName = body.image || 'unknown';
    
    pullSessions.set(sessionId, {
      logs: [],
      startTime: new Date(),
      imageSize: 0,
      layerCount: 0,
      status: 'created',
      imageName: imageName
    });
    
    addLog(sessionId, `创建会话: ${imageName}`, 'info');
    
    return new Response(JSON.stringify({ sessionId, status: 'created' }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // API: 获取会话日志
  if (path.startsWith('/api/logs/')) {
    const sessionId = path.replace('/api/logs/', '');
    const session = pullSessions.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: '会话不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // 处理CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // ============ Docker/GitHub 代理逻辑 ============
  
  // 解析V2 API请求
  let isV2Request = false;
  let v2RequestType = null;
  let v2RequestTag = null;
  
  if (path.startsWith('/v2/')) {
    isV2Request = true;
    path = path.replace('/v2/', '');
    
    const pathSegments = path.split('/').filter(part => part);
    if (pathSegments.length >= 3) {
      v2RequestType = pathSegments[pathSegments.length - 2];
      v2RequestTag = pathSegments[pathSegments.length - 1];
      path = pathSegments.slice(0, pathSegments.length - 2).join('/');
    }
  }

  // 解析目标域名和路径
  const pathParts = path.split('/').filter(part => part);
  if (pathParts.length < 1) {
    return new Response('无效请求: 需要目标域名或路径\n', { status: 400 });
  }

  let targetDomain, targetPath, isDockerRequest = false;

  // 处理不同格式的路径
  if (pathParts[0] === 'docker.io') {
    // docker.io/nginx -> registry-1.docker.io/library/nginx
    isDockerRequest = true;
    targetDomain = 'registry-1.docker.io';
    if (pathParts.length === 2) {
      targetPath = `library/${pathParts[1]}`;
    } else {
      targetPath = pathParts.slice(1).join('/');
    }
  } else if (ALLOWED_HOSTS.includes(pathParts[0])) {
    // 直接指定域名
    targetDomain = pathParts[0];
    targetPath = pathParts.slice(1).join('/') + url.search;
    isDockerRequest = ['quay.io', 'gcr.io', 'k8s.gcr.io', 'registry.k8s.io', 'ghcr.io', 'docker.cloudsmith.io', 'registry-1.docker.io'].includes(targetDomain);
  } else if (pathParts.length >= 2) {
    // user/repo -> registry-1.docker.io/user/repo
    isDockerRequest = true;
    targetDomain = 'registry-1.docker.io';
    targetPath = pathParts.join('/');
  } else {
    // nginx -> registry-1.docker.io/library/nginx
    isDockerRequest = true;
    targetDomain = 'registry-1.docker.io';
    targetPath = `library/${pathParts.join('/')}`;
  }

  // 域名白名单检查
  if (!ALLOWED_HOSTS.includes(targetDomain)) {
    return new Response(`错误: 域名 ${targetDomain} 不在允许列表中\n`, { status: 400 });
  }

  // 路径白名单检查
  if (RESTRICT_PATHS) {
    const checkPath = isDockerRequest ? targetPath : path;
    const isPathAllowed = ALLOWED_PATHS.some(pathString =>
      checkPath.toLowerCase().includes(pathString.toLowerCase())
    );
    if (!isPathAllowed) {
      return new Response(`错误: 路径不在允许列表中\n`, { status: 403 });
    }
  }

  // Docker镜像大小检查
  if (ENABLE_SIZE_CHECK && isDockerRequest && isV2Request && v2RequestType === 'manifests') {
    const sessionId = url.searchParams.get('session') || generateSessionId();
    
    // 获取认证token
    let token = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
    
    // 尝试获取token
    if (!token) {
      try {
        const tokenResponse = await fetch(`https://${targetDomain}/v2/`, {
          headers: { 'User-Agent': 'Docker-Client/24.0.0 (linux)' }
        });
        
        if (tokenResponse.status === 401) {
          const wwwAuth = tokenResponse.headers.get('WWW-Authenticate');
          if (wwwAuth) {
            const authMatch = wwwAuth.match(/Bearer realm="([^"]+)"(?:,service="([^"]*)")?(?:,scope="([^"]*)")?/);
            if (authMatch) {
              const [, realm, service, scope] = authMatch;
              let finalScope = scope;
              if (!finalScope && targetDomain === 'registry-1.docker.io') {
                finalScope = `repository:${targetPath}:pull`;
              }
              token = await handleToken(realm, service || targetDomain, finalScope);
            }
          }
        }
      } catch (error) {
        console.log(`获取token失败: ${error.message}`);
      }
    }
    
    // 检查镜像大小
    const sizeResult = await calculateImageSize(targetDomain, targetPath, token, sessionId);
    
    if (sizeResult.success && MAX_IMAGE_SIZE_MB > 0 && sizeResult.size > MAX_IMAGE_SIZE_MB) {
      addLog(sessionId, `镜像过大被拒绝: ${sizeResult.size.toFixed(2)} MB > ${MAX_IMAGE_SIZE_MB} MB`, 'error');
      
      return new Response(JSON.stringify({
        error: 'Image too large',
        message: `镜像大小 ${sizeResult.size.toFixed(2)} MB 超过限制 ${MAX_IMAGE_SIZE_MB} MB`,
        sessionId: sessionId,
        imageSize: sizeResult.size,
        maxSize: MAX_IMAGE_SIZE_MB
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 构建目标URL
  let targetUrl;
  if (isDockerRequest) {
    if (isV2Request && v2RequestType && v2RequestTag) {
      targetUrl = `https://${targetDomain}/v2/${targetPath}/${v2RequestType}/${v2RequestTag}`;
    } else {
      targetUrl = `https://${targetDomain}/${isV2Request ? 'v2/' : ''}${targetPath}`;
    }
  } else {
    targetUrl = `https://${targetDomain}/${targetPath}`;
  }

  // 这部分代码已经在后面的优化中处理，这里可以删除重复代码

  try {
    // 预连接优化
    if (ENABLE_PRECONNECT) {
      preconnectToHost(targetDomain); // 异步预连接，不阻塞主流程
    }
    
    // 判断是否为大文件请求
    const isLargeFileRequest = isV2Request && v2RequestType === 'blobs';
    
    // 创建优化的请求头
    const optimizedHeaders = createOptimizedHeaders(
      request.headers, 
      targetDomain, 
      isDockerRequest, 
      isLargeFileRequest
    );
    
    // AWS S3特殊处理
    if (isAmazonS3(targetUrl)) {
      optimizedHeaders.set('x-amz-content-sha256', getEmptyBodySHA256());
      optimizedHeaders.set('x-amz-date', new Date().toISOString().replace(/[-:T]/g, '').slice(0, -5) + 'Z');
    } else {
      optimizedHeaders.delete('x-amz-content-sha256');
      optimizedHeaders.delete('x-amz-date');
      optimizedHeaders.delete('x-amz-security-token');
      optimizedHeaders.delete('x-amz-user-agent');
    }
    
    // 创建优化的fetch选项
    const fetchOptions = createOptimizedFetchOptions(
      request.method,
      optimizedHeaders,
      request.body,
      isLargeFileRequest
    );
    
    // 发送请求
    let response = await fetch(targetUrl, fetchOptions);

    console.log(`响应: ${response.status} ${response.statusText}`);

    // 处理Docker认证挑战
    if (isDockerRequest && response.status === 401) {
      const wwwAuth = response.headers.get('WWW-Authenticate');
      if (wwwAuth) {
        const authMatch = wwwAuth.match(/Bearer realm="([^"]+)",service="([^"]*)",scope="([^"]*)"/);
        if (authMatch) {
          const [, realm, service, scope] = authMatch;
          const token = await handleToken(realm, service || targetDomain, scope);
          
          if (token) {
            // 创建认证后的优化请求头
            const authHeaders = createOptimizedHeaders(
              request.headers, 
              targetDomain, 
              isDockerRequest, 
              isLargeFileRequest
            );
            authHeaders.set('Authorization', `Bearer ${token}`);
            
            if (isAmazonS3(targetUrl)) {
              authHeaders.set('x-amz-content-sha256', getEmptyBodySHA256());
              authHeaders.set('x-amz-date', new Date().toISOString().replace(/[-:T]/g, '').slice(0, -5) + 'Z');
            }

            const authFetchOptions = createOptimizedFetchOptions(
              request.method,
              authHeaders,
              request.body,
              isLargeFileRequest
            );

            response = await fetch(targetUrl, authFetchOptions);
          }
        }
      }
    }

    // 处理重定向（主要是S3重定向）
    if (isDockerRequest && (response.status === 307 || response.status === 302)) {
      const redirectUrl = response.headers.get('Location');
      if (redirectUrl) {
        const redirectHostname = new URL(redirectUrl).hostname;
        
        // 预连接重定向目标
        if (ENABLE_PRECONNECT) {
          preconnectToHost(redirectHostname);
        }
        
        // 创建重定向的优化请求头
        const redirectHeaders = createOptimizedHeaders(
          request.headers, 
          redirectHostname, 
          isDockerRequest, 
          isLargeFileRequest
        );
        
        if (isAmazonS3(redirectUrl)) {
          redirectHeaders.set('x-amz-content-sha256', getEmptyBodySHA256());
          redirectHeaders.set('x-amz-date', new Date().toISOString().replace(/[-:T]/g, '').slice(0, -5) + 'Z');
        }

        const redirectFetchOptions = createOptimizedFetchOptions(
          request.method,
          redirectHeaders,
          request.body,
          isLargeFileRequest
        );

        response = await fetch(redirectUrl, redirectFetchOptions);
      }
    }

    // 检查是否为大文件响应
    const contentLength = response.headers.get('content-length');
    const fileSizeInMB = contentLength ? parseInt(contentLength) / 1024 / 1024 : 0;
    const isLargeFileResponse = fileSizeInMB >= STREAMING_MIN_SIZE;
    
    // 构建优化的响应
    const responseHeaders = new Headers(response.headers);
    
    // 添加CORS头
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    
    // 性能优化头
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('X-Frame-Options', 'DENY');
    
    // 连接优化
    responseHeaders.set('Connection', 'keep-alive');
    responseHeaders.set('Keep-Alive', 'timeout=30, max=1000');
    
    // Docker特定头
    if (isDockerRequest) {
      responseHeaders.set('Docker-Distribution-API-Version', 'registry/2.0');
      responseHeaders.delete('Location'); // 确保重定向通过Worker处理
      
      // 大文件缓存优化
      if (isLargeFileResponse && v2RequestType === 'blobs') {
        responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
        responseHeaders.set('X-Cache-Status', 'OPTIMIZED');
      }
    }
    
    // 流式传输优化
    if (ENABLE_STREAMING && isLargeFileResponse) {
      responseHeaders.set('Transfer-Encoding', 'chunked');
      responseHeaders.set('X-Streaming', 'enabled');
      
      // 对于大文件，直接流式返回，减少内存使用
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
      
      return newResponse;
    }
    
    // 普通响应
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

    return newResponse;
    
  } catch (error) {
    console.log(`请求失败: ${error.message}`);
    return new Response(`请求 ${targetDomain} 失败: ${error.message}\n`, { status: 500 });
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};