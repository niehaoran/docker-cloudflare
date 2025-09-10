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

// ============ 安全和合规配置 ============
// 是否启用访问控制
const ENABLE_ACCESS_CONTROL = true;

// 允许的IP段（CIDR格式，空数组表示不限制）
const ALLOWED_IP_RANGES = [
  // '192.168.0.0/16',  // 内网
  // '10.0.0.0/8',      // 内网
  // '172.16.0.0/12',   // 内网
];

// 允许的User-Agent模式（用于识别合法的Docker客户端）
const ALLOWED_USER_AGENTS = [
  'Docker-Client',
  'docker',
  'containerd',
  'podman',
  'skopeo'
];

// 每小时最大请求数（防止滥用）
const MAX_REQUESTS_PER_HOUR = 1000;

// 是否启用请求日志（用于监控）
const ENABLE_REQUEST_LOGGING = false;

// ============ 性能优化配置 ============

// 是否启用流式传输优化
const ENABLE_STREAMING = true;

// 流式传输的最小文件大小（MB）
const STREAMING_MIN_SIZE = 1;



// 是否启用预连接优化
const ENABLE_PRECONNECT = true;

// ============ 精简的前端界面 ============
const HOMEPAGE_HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Docker 镜像代理服务</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); max-width: 600px; width: 100%; text-align: center; }
    h1 { color: #2d3748; margin-bottom: 10px; font-size: 2.2em; }
    .subtitle { color: #4a5568; margin-bottom: 20px; font-size: 1.1em; }
    .input-group { margin: 20px 0; }
    .input-group input { width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1em; margin-bottom: 12px; }
    .input-group input:focus { outline: none; border-color: #4299e1; }
    .btn { background: #48bb78; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1em; cursor: pointer; margin: 5px; }
    .btn:hover { background: #38a169; }
    .copy-btn { background: #4299e1; }
    .copy-btn:hover { background: #3182ce; }
    .result-section { margin-top: 20px; padding: 20px; background: #f7fafc; border-radius: 8px; display: none; }
    .result-output { display: flex; gap: 8px; margin-bottom: 10px; }
    .result-output input { flex: 1; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-family: monospace; background: white; }
    .examples { margin: 20px 0; }
    .example-btn { background: rgba(66, 153, 225, 0.1); color: #4299e1; border: 1px solid #4299e1; padding: 6px 12px; border-radius: 16px; font-size: 0.9em; cursor: pointer; margin: 2px; }
    .example-btn:hover { background: #4299e1; color: white; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(0, 0, 0, 0.1); color: #718096; font-size: 0.9em; }
    .footer a { color: #4299e1; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .success { color: #38a169; font-weight: 600; margin-top: 8px; display: none; }
    ${ENABLE_SIZE_CHECK ? `.size-limit { background: #fed7aa; border: 1px solid #fb923c; border-radius: 8px; padding: 12px; margin: 15px 0; color: #9a3412; font-size: 0.9em; }` : ''}
  </style>
</head>
<body>
  <div class="container">
    <h1>🐳 Docker 镜像代理服务</h1>
    <div class="subtitle">高速稳定的 Docker 镜像拉取加速服务</div>
    
    ${ENABLE_SIZE_CHECK ? `<div class="size-limit">⚠️ 镜像大小限制：${MAX_IMAGE_SIZE_MB > 0 ? MAX_IMAGE_SIZE_MB + ' MB' : '无限制'}</div>` : ''}
    
    <div class="input-group">
      <input type="text" id="imageInput" placeholder="输入镜像名称，如：nginx、mysql:8.0、ghcr.io/user/repo" />
      <button onclick="generateLink()" class="btn">生成加速链接</button>
    </div>
    
    <div id="resultSection" class="result-section">
      <div class="result-output">
        <input type="text" id="resultOutput" readonly />
        <button onclick="copyResult()" class="btn copy-btn">📋 复制</button>
      </div>
      <div class="success" id="successMessage">✅ 已复制到剪贴板！</div>
    </div>
    
    <div class="examples">
      <div style="margin-bottom: 10px; color: #4a5568; font-weight: 600;">常用示例：</div>
      <button onclick="fillExample('nginx')" class="example-btn">nginx</button>
      <button onclick="fillExample('mysql:8.0')" class="example-btn">mysql:8.0</button>
      <button onclick="fillExample('redis:alpine')" class="example-btn">redis:alpine</button>
      <button onclick="fillExample('ghcr.io/user/repo')" class="example-btn">GitHub镜像</button>
    </div>
    
    <div class="footer">
      <p><strong>作者：陈不丢</strong></p>
      <p>GitHub: <a href="https://github.com/niehaoran/docker-cloudflare" target="_blank">niehaoran/docker-cloudflare</a></p>
      <p style="margin-top: 10px;">🌟 基于 Cloudflare Workers 的全球加速服务</p>
    </div>
  </div>

  <script>
    const currentDomain = window.location.hostname || 'your-domain.com';
    function generateLink() {
      const input = document.getElementById('imageInput');
      const imageName = input.value.trim();
      if (!imageName) { alert('请输入镜像名称！'); return; }
      const acceleratedCommand = \`docker pull \${currentDomain}/\${imageName}\`;
      document.getElementById('resultOutput').value = acceleratedCommand;
      document.getElementById('resultSection').style.display = 'block';
    }
    async function copyResult() {
      const resultOutput = document.getElementById('resultOutput');
      const successMessage = document.getElementById('successMessage');
      try {
        await navigator.clipboard.writeText(resultOutput.value);
        successMessage.style.display = 'block';
        setTimeout(() => successMessage.style.display = 'none', 3000);
      } catch (err) {
        resultOutput.select();
        try { document.execCommand('copy'); successMessage.style.display = 'block'; setTimeout(() => successMessage.style.display = 'none', 3000); } catch (e) { alert('复制失败，请手动复制'); }
      }
    }
    function fillExample(example) { document.getElementById('imageInput').value = example; }
    document.getElementById('imageInput').addEventListener('keypress', function(e) { if (e.key === 'Enter') generateLink(); });
    document.addEventListener('DOMContentLoaded', function() { document.getElementById('imageInput').focus(); });
  </script>
</body>
</html>
`;

// ============ 性能优化实现 ============

// 预连接缓存
const preconnectCache = new Map();

// 简化的会话存储
const pullSessions = new Map();

// 访问控制存储
const hourlyStats = new Map();

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

// 检查IP是否在允许范围内
function isIPAllowed(ip) {
  if (!ENABLE_ACCESS_CONTROL || ALLOWED_IP_RANGES.length === 0) {
    return true;
  }
  
  // 简单的CIDR检查（这里可以用更完整的库）
  for (const range of ALLOWED_IP_RANGES) {
    if (range.includes('/')) {
      // 简化的CIDR检查，实际应该用专门的库
      const [network, bits] = range.split('/');
      // 这里简化处理，实际项目建议用ip-range-check库
      if (ip.startsWith(network.split('.').slice(0, parseInt(bits) / 8).join('.'))) {
        return true;
      }
    } else if (ip === range) {
      return true;
    }
  }
  
  return false;
}

// 检查User-Agent是否合法
function isUserAgentAllowed(userAgent) {
  if (!ENABLE_ACCESS_CONTROL || !userAgent) {
    return true;
  }
  
  const ua = userAgent.toLowerCase();
  return ALLOWED_USER_AGENTS.some(allowed => 
    ua.includes(allowed.toLowerCase())
  );
}

// 检查请求频率
function checkRateLimit(ip) {
  if (!ENABLE_ACCESS_CONTROL) {
    return true;
  }
  
  const now = Date.now();
  const hourKey = Math.floor(now / 3600000); // 每小时的key
  const key = `${ip}-${hourKey}`;
  
  const count = hourlyStats.get(key) || 0;
  if (count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  
  hourlyStats.set(key, count + 1);
  
  // 清理过期的统计数据
  for (const [k, v] of hourlyStats.entries()) {
    const [, hour] = k.split('-');
    if (parseInt(hour) < hourKey - 1) {
      hourlyStats.delete(k);
    }
  }
  
  return true;
}

// 记录访问日志
function logAccess(request, allowed = true) {
  if (!ENABLE_REQUEST_LOGGING) {
    return;
  }
  
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const url = new URL(request.url);
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    ip,
    method: request.method,
    path: url.pathname,
    userAgent,
    allowed,
    cf_ray: request.headers.get('CF-Ray')
  }));
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
    const url = new URL(request.url);
    
    // 访问控制检查
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    
    // 检查IP白名单
    if (!isIPAllowed(clientIP)) {
      logAccess(request, false);
      return new Response('Access denied: IP not allowed', { 
        status: 403,
        headers: {
          'X-Error': 'IP_NOT_ALLOWED',
          'X-Client-IP': clientIP
        }
      });
    }
    
    // 检查User-Agent（仅对Docker请求）
    if (url.pathname.startsWith('/v2/') && !isUserAgentAllowed(userAgent)) {
      logAccess(request, false);
      return new Response('Access denied: Invalid client', { 
        status: 403,
        headers: {
          'X-Error': 'INVALID_CLIENT',
          'X-User-Agent': userAgent
        }
      });
    }
    
    // 检查请求频率
    if (!checkRateLimit(clientIP)) {
      logAccess(request, false);
      return new Response('Rate limit exceeded', { 
        status: 429,
        headers: {
          'X-Error': 'RATE_LIMIT_EXCEEDED',
          'Retry-After': '3600',
          'X-RateLimit-Limit': MAX_REQUESTS_PER_HOUR.toString(),
          'X-RateLimit-Reset': ((Math.floor(Date.now() / 3600000) + 1) * 3600000).toString()
        }
      });
    }
    
    // 记录合法访问
    logAccess(request, true);
    
    return handleRequest(request, env, ctx);
  }
};