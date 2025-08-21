// 更新日期: 2025-08-10
// 更新内容: 
// 1. 无论是否重定向，只要目标是 AWS S3，就自动补全 x-amz-content-sha256 和 x-amz-date
// 2. 改进Docker镜像路径处理逻辑，支持多种格式: 如 hello-world | library/hello-world | docker.io/library/hello-world
// 3. 解决大陆拉取第三方 Docker 镜像层失败的问题，自动递归处理所有 302/307 跳转，无论跳转到哪个域名，都由 Worker 继续反代，避免客户端直接访问被墙 CDN，从而提升拉取成功率。
// 4. 添加Docker镜像大小限制功能，会计算镜像层大小并在前端实时显示
// 用户配置区域开始 =================================
// 以下变量用于配置代理服务的白名单和安全设置，可根据需求修改。

// ALLOWED_HOSTS: 定义允许代理的域名列表（默认白名单）。
// - 添加新域名：将域名字符串加入数组，如 'docker.io'。
// - 注意：仅支持精确匹配的域名（如 'github.com'），不支持通配符。
// - 只有列出的域名会被处理，未列出的域名将返回 400 错误。
// 示例：const ALLOWED_HOSTS = ['github.com', 'docker.io'];
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
  
  // RESTRICT_PATHS: 控制是否限制 GitHub 和 Docker 请求的路径。
  // - 设置为 true：只允许 ALLOWED_PATHS 中定义的路径关键字。
  // - 设置为 false：允许 ALLOWED_HOSTS 中的所有路径。
  // 示例：const RESTRICT_PATHS = true;
  const RESTRICT_PATHS = false;
  
  // ALLOWED_PATHS: 定义 GitHub 和 Docker 的允许路径关键字。
  // - 添加新关键字：加入数组，如 'user-id-3' 或 'my-repo'。
  // - 用于匹配请求路径（如 'library' 用于 Docker Hub 官方镜像）。
  // - 路径检查对大小写不敏感，仅当 RESTRICT_PATHS = true 时生效。
  // 示例：const ALLOWED_PATHS = ['library', 'my-user', 'my-repo'];
  const ALLOWED_PATHS = [
    'library',   // Docker Hub 官方镜像仓库的命名空间
    'user-id-1',
    'user-id-2',
  ];

  // MAX_IMAGE_SIZE_MB: 设置允许拉取的Docker镜像最大大小（单位：MB）
  // - 设置为 0 表示不限制大小
  // - 建议设置合理值，如 2048 (2GB) 防止拉取超大镜像
  // 示例：const MAX_IMAGE_SIZE_MB = 2048;
  const MAX_IMAGE_SIZE_MB = 2048;

  // ENABLE_SIZE_CHECK: 是否启用镜像大小检查
  // - 设置为 true：在拉取前检查镜像大小
  // - 设置为 false：跳过大小检查
  const ENABLE_SIZE_CHECK = true;

  // ============ 性能优化配置 ============
  
  // ENABLE_PARALLEL_DOWNLOADS: 启用并行下载层
  // - 设置为 true：同时下载多个镜像层，大幅提升速度
  // - 设置为 false：按顺序下载，节省带宽但速度较慢
  const ENABLE_PARALLEL_DOWNLOADS = true;
  
  // MAX_CONCURRENT_LAYERS: 最大并发下载层数
  // - 建议值：3-8，根据网络条件调整
  // - 过高可能导致连接数超限，过低影响速度
  const MAX_CONCURRENT_LAYERS = 15; // 提高并发数
  
  // ENABLE_LAYER_CACHE: 启用层缓存优化
  // - 设置为 true：在Worker内存中短期缓存小层数据
  // - 设置为 false：禁用缓存
  const ENABLE_LAYER_CACHE = true;
  
  // CACHE_SMALL_LAYERS_MB: 缓存小于此大小的层（MB）
  // - 只缓存配置文件等小层，避免内存溢出
  const CACHE_SMALL_LAYERS_MB = 20; // 增加缓存层大小
  
  // ENABLE_COMPRESSION_OPTIMIZATION: 启用压缩优化
  // - 设置为 true：优化gzip传输，减少传输时间
  // - 设置为 false：禁用压缩优化
  const ENABLE_COMPRESSION_OPTIMIZATION = true;
  
  // PREFETCH_MANIFEST: 预取manifest信息
  // - 设置为 true：在认证时同时预取manifest，减少往返
  // - 设置为 false：按需获取
  const PREFETCH_MANIFEST = true;
  
  // CONNECTION_TIMEOUT_MS: 连接超时时间（毫秒）
  // - 降低超时时间，快速失败重试
  const CONNECTION_TIMEOUT_MS = 10000; // 缩短超时时间
  
  // RETRY_COUNT: 重试次数
  // - 网络不稳定时的重试次数
  const RETRY_COUNT = 3; // 增加重试次数
  
  // ENABLE_STREAMING: 启用流式传输
  // - 设置为 true：大文件分块传输，减少内存使用
  // - 设置为 false：一次性传输
  const ENABLE_STREAMING = true;
  
  // CHUNK_SIZE_MB: 流式传输块大小（MB）
  // - 大文件分块传输的块大小
  const CHUNK_SIZE_MB = 32; // 增加块大小
  
  // ============ 智能路由选择配置 ============
  
  // ENABLE_SMART_ROUTING: 启用智能路由选择
  // - 自动选择最快的镜像源和CDN节点
  const ENABLE_SMART_ROUTING = true;
  
  // LATENCY_TEST_TIMEOUT: 延迟测试超时时间（毫秒）
  const LATENCY_TEST_TIMEOUT = 3000;
  
  // PERFORMANCE_MONITORING: 启用性能监控
  const ENABLE_PERFORMANCE_MONITORING = true;
  
  // CONNECTION_POOLING: 启用连接池管理
  const ENABLE_CONNECTION_POOLING = true;
  
  // 用户配置区域结束 =================================
  
  // 闪电 SVG 图标（Base64 编码）
  const LIGHTNING_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
  </svg>`;
  
  // 日志显示器界面 HTML
  const HOMEPAGE_HTML = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Docker 镜像拉取监控</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(LIGHTNING_SVG)}">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        background: #0a0e27;
        color: #00ff00;
        min-height: 100vh;
        overflow-x: hidden;
      }
      .terminal {
        background: #0a0e27;
        color: #00ff00;
        padding: 20px;
        height: 100vh;
        overflow-y: auto;
        box-sizing: border-box;
        font-size: 14px;
        line-height: 1.4;
      }
      .header {
        border-bottom: 1px solid #00ff00;
        padding-bottom: 10px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
      }
      .header h1 {
        color: #00ff00;
        margin: 0;
        font-size: 24px;
        text-shadow: 0 0 10px #00ff00;
      }
      .status-panel {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      .status-item {
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid #00ff00;
        border-radius: 5px;
        padding: 10px 15px;
        min-width: 150px;
        text-align: center;
      }
      .status-item .label {
        font-size: 12px;
        color: #88ff88;
        display: block;
        margin-bottom: 5px;
      }
      .status-item .value {
        font-size: 18px;
        font-weight: bold;
        color: #00ff00;
      }
      .input-section {
        margin-bottom: 20px;
        background: rgba(0, 255, 0, 0.05);
        border: 1px solid #00ff00;
        border-radius: 5px;
        padding: 15px;
      }
      .input-section h3 {
        margin: 0 0 10px 0;
        color: #00ff00;
        font-size: 16px;
      }
      .input-group {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
        flex-wrap: wrap;
      }
      .input-group input {
        flex: 1;
        background: #000;
        border: 1px solid #00ff00;
        color: #00ff00;
        padding: 8px 12px;
        border-radius: 3px;
        font-family: inherit;
        font-size: 14px;
        min-width: 200px;
      }
      .input-group input:focus {
        outline: none;
        box-shadow: 0 0 5px #00ff00;
      }
      .input-group button {
        background: rgba(0, 255, 0, 0.2);
        border: 1px solid #00ff00;
        color: #00ff00;
        padding: 8px 16px;
        border-radius: 3px;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.3s;
      }
      .input-group button:hover {
        background: rgba(0, 255, 0, 0.3);
        box-shadow: 0 0 5px #00ff00;
      }
      .log-container {
        background: rgba(0, 255, 0, 0.02);
        border: 1px solid #00ff00;
        border-radius: 5px;
        height: 400px;
        overflow-y: auto;
        padding: 15px;
        position: relative;
      }
      .log-header {
        position: sticky;
        top: 0;
        background: #0a0e27;
        border-bottom: 1px solid #00ff00;
        padding-bottom: 5px;
        margin-bottom: 10px;
        font-weight: bold;
      }
      .log-entry {
        margin-bottom: 8px;
        padding: 5px 0;
        border-left: 3px solid transparent;
        padding-left: 10px;
        animation: fadeIn 0.3s;
      }
      .log-entry.info {
        border-left-color: #00ff00;
        color: #88ff88;
      }
      .log-entry.success {
        border-left-color: #00ff00;
        color: #00ff00;
        font-weight: bold;
        text-shadow: 0 0 5px #00ff00;
      }
      .log-entry.error {
        border-left-color: #ff0000;
        color: #ff4444;
        font-weight: bold;
        text-shadow: 0 0 5px #ff0000;
      }
      .log-entry .timestamp {
        color: #666;
        font-size: 12px;
        margin-right: 10px;
      }
      .log-entry .message {
        font-family: inherit;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .cursor {
        animation: blink 1s infinite;
      }
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      .size-limit-info {
        background: rgba(255, 255, 0, 0.1);
        border: 1px solid #ffff00;
        border-radius: 5px;
        padding: 10px;
        margin-bottom: 20px;
        color: #ffff00;
      }
      @media (max-width: 768px) {
        .terminal {
          padding: 10px;
          font-size: 12px;
        }
        .header {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
        .status-panel {
          flex-direction: column;
          gap: 10px;
        }
        .status-item {
          min-width: auto;
        }
        .input-group {
          flex-direction: column;
        }
        .input-group input {
          min-width: auto;
        }
        .log-container {
          height: 300px;
        }
      }
    </style>
  </head>
  <body>
    <div class="terminal">
      <div class="header">
        <h1>🐳 Docker 镜像拉取监控系统</h1>
        <div style="color: #888; font-size: 12px;">
          <span id="current-time"></span>
        </div>
      </div>

      <div class="size-limit-info">
        ⚠️ 系统配置：最大镜像大小限制 ${MAX_IMAGE_SIZE_MB} MB，大小检查：${ENABLE_SIZE_CHECK ? '已启用' : '已禁用'}
        </div>

      <div class="status-panel">
        <div class="status-item">
          <span class="label">当前会话</span>
          <span class="value" id="session-id">-</span>
        </div>
        <div class="status-item">
          <span class="label">镜像大小</span>
          <span class="value" id="image-size">0 MB</span>
        </div>
        <div class="status-item">
          <span class="label">镜像层数</span>
          <span class="value" id="layer-count">0</span>
        </div>
        <div class="status-item">
          <span class="label">会话状态</span>
          <span class="value" id="session-status">等待中</span>
        </div>
        <div class="status-item">
          <span class="label">缓存命中</span>
          <span class="value" id="cache-hits">0</span>
        </div>
        <div class="status-item">
          <span class="label">并发请求</span>
          <span class="value" id="concurrent-requests">0</span>
        </div>
        <div class="status-item">
          <span class="label">下载速度</span>
          <span class="value" id="download-speed">0 MB/s</span>
        </div>
        <div class="status-item">
          <span class="label">下载进度</span>
          <span class="value" id="download-progress">0%</span>
        </div>
      </div>
  
      <div class="input-section">
        <h3>📥 开始新的镜像拉取</h3>
        <div class="input-group">
          <input type="text" id="docker-image" placeholder="输入镜像名称，例如：nginx, hello-world, ghcr.io/user/repo" />
          <button onclick="startPull()">开始拉取</button>
          <button onclick="checkSize()">仅检查大小</button>
        </div>
        <div class="input-group">
          <input type="text" id="session-input" placeholder="输入会话ID查看日志（可选）" />
          <button onclick="loadSession()">查看会话</button>
          <button onclick="clearLogs()">清空日志</button>
        </div>
      </div>
  
      <!-- 性能监控面板 -->
      <div class="input-section">
        <h3>⚡ 性能监控 & 智能路由</h3>
        <div class="input-group">
          <button onclick="refreshPerformanceStats()">刷新性能统计</button>
          <button onclick="testLatency()">测试连接延迟</button>
          <button onclick="togglePerformancePanel()">显示/隐藏详情</button>
        </div>
        
        <div id="performance-panel" style="display: none; margin-top: 15px;">
          <div class="status-panel">
            <div class="status-item">
              <span class="label">智能路由</span>
              <span class="value" id="smart-routing-status">检测中...</span>
            </div>
            <div class="status-item">
              <span class="label">连接池</span>
              <span class="value" id="connection-pool-status">检测中...</span>
            </div>
            <div class="status-item">
              <span class="label">最大并发</span>
              <span class="value" id="max-concurrent-status">-</span>
            </div>
          </div>
          
          <div id="performance-details" style="margin-top: 10px;">
            <div style="font-size: 14px; color: #88ff88; margin-bottom: 10px;">
              <strong>各镜像源性能统计:</strong>
            </div>
            <div id="host-performance-list"></div>
          </div>
          
          <div id="latency-test-results" style="margin-top: 10px;">
            <div style="font-size: 14px; color: #88ff88; margin-bottom: 10px;">
              <strong>延迟测试结果:</strong>
            </div>
            <div id="latency-results-list"></div>
          </div>
        </div>
      </div>
  
      <div class="log-container">
        <div class="log-header">
          📊 实时日志监控 <span class="cursor">█</span>
        </div>
        <div id="log-content">
          <div class="log-entry info">
            <span class="timestamp">[系统]</span>
            <span class="message">Docker 镜像拉取监控系统已启动</span>
          </div>
          <div class="log-entry info">
            <span class="timestamp">[系统]</span>
            <span class="message">等待用户输入镜像名称...</span>
          </div>
        </div>
      </div>
    </div>
  
    <script>
      let currentSessionId = null;
      let logUpdateInterval = null;
      const currentDomain = window.location.hostname;
  
      // 更新当前时间
      function updateTime() {
        document.getElementById('current-time').textContent = new Date().toLocaleString('zh-CN');
      }
      setInterval(updateTime, 1000);
      updateTime();

      // 添加日志条目
      function addLogEntry(message, type = 'info', timestamp = null) {
        const logContent = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = 'log-entry ' + type;
        
        const time = timestamp || new Date().toLocaleTimeString();
        entry.innerHTML = '<span class="timestamp">[' + time + ']</span><span class="message">' + message + '</span>';
        
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
        
        // 保持最近100条日志
        const entries = logContent.querySelectorAll('.log-entry');
        if (entries.length > 100) {
          entries[0].remove();
        }
      }

      // 更新状态面板
      function updateStatus(session) {
        if (session) {
          document.getElementById('session-id').textContent = currentSessionId || '-';
          document.getElementById('image-size').textContent = session.imageSize.toFixed(2) + ' MB';
          document.getElementById('layer-count').textContent = session.layerCount;
          document.getElementById('session-status').textContent = session.status;
          document.getElementById('cache-hits').textContent = session.cacheHits || 0;
        }
      }

      // 获取并更新缓存统计
      async function updateCacheStats() {
        try {
          const response = await fetch('/api/cache-stats');
          if (response.ok) {
            const stats = await response.json();
            document.getElementById('concurrent-requests').textContent = 
              stats.activeRequests + (stats.queuedRequests > 0 ? ' (+' + stats.queuedRequests + ')' : '');
          }
        } catch (error) {
          // 静默处理错误
        }
      }

      // 获取会话日志
      async function fetchSessionLogs(sessionId) {
        try {
          const response = await fetch('/api/logs/' + sessionId);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          addLogEntry('获取会话日志失败: ' + error.message, 'error');
        }
        return null;
      }

      // 开始拉取镜像
      async function startPull() {
        const imageInput = document.getElementById('docker-image');
        const imageName = imageInput.value.trim();
        
        if (!imageName) {
          addLogEntry('请输入有效的镜像名称', 'error');
          return;
        }

        addLogEntry('开始创建新的拉取会话: ' + imageName, 'info');
        
        try {
          // 创建新会话
          const response = await fetch('/api/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageName })
          });
          
          if (response.ok) {
            const data = await response.json();
            currentSessionId = data.sessionId;
            addLogEntry('会话创建成功，ID: ' + currentSessionId, 'success');
            
            // 生成拉取命令
            const pullCommand = 'docker pull ' + currentDomain + '/' + imageName;
            addLogEntry('请使用以下命令拉取镜像:', 'info');
            addLogEntry(pullCommand, 'success');
            
            // 复制到剪贴板
            try {
              await navigator.clipboard.writeText(pullCommand);
              addLogEntry('命令已复制到剪贴板', 'success');
        } catch (err) {
              addLogEntry('自动复制失败，请手动复制', 'info');
            }
            
            // 开始监控会话
            startSessionMonitoring();
            
          } else {
            addLogEntry('创建会话失败', 'error');
          }
        } catch (error) {
          addLogEntry('网络错误: ' + error.message, 'error');
        }
      }

      // 仅检查镜像大小
      async function checkSize() {
        const imageInput = document.getElementById('docker-image');
        const imageName = imageInput.value.trim();
        
        if (!imageName) {
          addLogEntry('请输入有效的镜像名称', 'error');
          return;
        }

        addLogEntry('开始检查镜像大小: ' + imageName, 'info');
        
        try {
          // 创建会话用于大小检查
          const response = await fetch('/api/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageName })
          });
          
          if (response.ok) {
            const data = await response.json();
            currentSessionId = data.sessionId;
            
            // 尝试获取manifest来检查大小
            const manifestUrl = '/v2/' + imageName + '/manifests/latest?session=' + currentSessionId;
            const manifestResponse = await fetch(manifestUrl);
            
            if (manifestResponse.status === 413) {
              const errorData = await manifestResponse.json();
              addLogEntry('镜像大小超限: ' + errorData.message, 'error');
            } else if (manifestResponse.ok) {
              addLogEntry('镜像大小检查完成，可以拉取', 'success');
            } else {
              addLogEntry('检查镜像大小时出错: ' + manifestResponse.status, 'error');
            }
            
            // 开始监控会话以获取详细信息
            startSessionMonitoring();
          }
        } catch (error) {
          addLogEntry('网络错误: ' + error.message, 'error');
        }
      }

      // 加载指定会话
      async function loadSession() {
        const sessionInput = document.getElementById('session-input');
        const sessionId = sessionInput.value.trim();
        
        if (!sessionId) {
          addLogEntry('请输入会话ID', 'error');
          return;
        }
  
        currentSessionId = sessionId;
        addLogEntry('切换到会话: ' + sessionId, 'info');
        startSessionMonitoring();
      }

      // 清空日志
      function clearLogs() {
        const logContent = document.getElementById('log-content');
        logContent.innerHTML = '<div class="log-entry info"><span class="timestamp">[系统]</span><span class="message">日志已清空</span></div>';
        
        // 重置状态
        document.getElementById('session-id').textContent = '-';
        document.getElementById('image-size').textContent = '0 MB';
        document.getElementById('layer-count').textContent = '0';
        document.getElementById('session-status').textContent = '等待中';
        
        if (logUpdateInterval) {
          clearInterval(logUpdateInterval);
          logUpdateInterval = null;
        }
        currentSessionId = null;
      }

      // 开始会话监控
      function startSessionMonitoring() {
        if (!currentSessionId) return;
        
        if (logUpdateInterval) {
          clearInterval(logUpdateInterval);
        }
        
        // 立即获取一次日志
        updateSessionLogs();
        
        // 每2秒更新一次日志和缓存统计
        logUpdateInterval = setInterval(() => {
          updateSessionLogs();
          updateCacheStats();
        }, 2000);
      }

      // 更新会话日志
      async function updateSessionLogs() {
        if (!currentSessionId) return;
        
        const session = await fetchSessionLogs(currentSessionId);
        if (session) {
          updateStatus(session);
          
          // 获取新的日志条目
          const logContent = document.getElementById('log-content');
          const currentEntries = logContent.querySelectorAll('.log-entry').length;
          const newLogs = session.logs.slice(currentEntries - 2); // 减去系统初始日志
          
          newLogs.forEach(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            addLogEntry(log.message, log.type, time);
          });
        }
      }

      // 处理回车键
      document.getElementById('docker-image').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          startPull();
        }
      });

      document.getElementById('session-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          loadSession();
        }
      });

      // ============ 性能监控功能 ============
      
      // 切换性能面板显示
      function togglePerformancePanel() {
        const panel = document.getElementById('performance-panel');
        if (panel.style.display === 'none') {
          panel.style.display = 'block';
          refreshPerformanceStats(); // 显示时自动刷新
        } else {
          panel.style.display = 'none';
        }
      }
      
      // 刷新性能统计
      async function refreshPerformanceStats() {
        try {
          const response = await fetch('/api/performance-stats');
          if (response.ok) {
            const data = await response.json();
            
            // 更新状态显示
            document.getElementById('smart-routing-status').textContent = 
              data.smartRoutingEnabled ? '已启用' : '已禁用';
            document.getElementById('connection-pool-status').textContent = 
              data.connectionPoolEnabled ? '已启用' : '已禁用';
            document.getElementById('max-concurrent-status').textContent = 
              data.maxConcurrentLayers;
            
            // 显示各主机性能统计
            const hostList = document.getElementById('host-performance-list');
            hostList.innerHTML = '';
            
            if (Object.keys(data.performanceStats).length === 0) {
              hostList.innerHTML = '<div style="color: #888;">暂无性能数据</div>';
            } else {
              for (const [host, stats] of Object.entries(data.performanceStats)) {
                const hostDiv = document.createElement('div');
                hostDiv.style.cssText = 'margin: 5px 0; padding: 8px; border: 1px solid #333; border-radius: 3px; font-size: 12px;';
                hostDiv.innerHTML = 
                  '<div style="color: #00ff00; font-weight: bold;">' + host + '</div>' +
                  '<div style="color: #88ff88;">' +
                    '延迟: ' + stats.averageLatency + 'ms | ' + 
                    '可靠性: ' + stats.reliability + '% | ' + 
                    '请求数: ' + stats.totalRequests + ' | ' + 
                    '流量: ' + stats.totalMB + 'MB' +
                  '</div>';
                hostList.appendChild(hostDiv);
              }
            }
            
            addLogEntry('性能统计已刷新', 'success');
          } else {
            addLogEntry('获取性能统计失败', 'error');
          }
        } catch (error) {
          addLogEntry('获取性能统计时出错: ' + error.message, 'error');
        }
      }
      
      // 测试连接延迟
      async function testLatency() {
        const testHosts = [
          'registry-1.docker.io',
          'quay.io',
          'gcr.io',
          'ghcr.io'
        ];
        
        addLogEntry('开始测试各镜像源连接延迟...', 'info');
        
        try {
          const response = await fetch('/api/test-latency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hosts: testHosts })
          });
          
          if (response.ok) {
            const data = await response.json();
            const resultsList = document.getElementById('latency-results-list');
            resultsList.innerHTML = '';
            
            for (const [host, result] of Object.entries(data.results)) {
              const resultDiv = document.createElement('div');
              resultDiv.style.cssText = 'margin: 5px 0; padding: 8px; border: 1px solid #333; border-radius: 3px; font-size: 12px;';
              const statusColor = result.status === 'ok' ? '#00ff00' : '#ff4444';
              const latencyText = result.status === 'ok' ? (result.latency + 'ms') : '超时';

              resultDiv.innerHTML =
                '<div style="color: ' + statusColor + '; font-weight: bold;">' + host + '</div>' +
                '<div style="color: #88ff88;">延迟: ' + latencyText + ' | 状态: ' + result.status + '</div>';
              resultsList.appendChild(resultDiv);

              addLogEntry(host + ': ' + latencyText, result.status === 'ok' ? 'success' : 'error');
            }

            addLogEntry('延迟测试完成', 'success');
          } else {
            addLogEntry('延迟测试失败', 'error');
          }
        } catch (error) {
          addLogEntry('延迟测试时出错: ' + (error && error.message ? error.message : error), 'error');
        }
      }

      // 定期更新性能统计（如果面板打开）
      setInterval(function() {
        const panel = document.getElementById('performance-panel');
        if (panel && panel.style.display !== 'none') {
          refreshPerformanceStats();
        }
      }, 30000); // 每30秒更新一次
    </script>
  </body>
  </html>
  `;

  // 存储当前拉取会话的日志
  const pullSessions = new Map();

  // ============ 性能优化：层缓存系统 ============
  const layerCache = new Map();
  const cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  // 缓存条目结构
  function createCacheEntry(data, headers) {
    return {
      data: data,
      headers: headers,
      timestamp: Date.now(),
      size: data.byteLength || data.length || 0,
      accessCount: 1
    };
  }

  // LRU缓存清理
  function evictOldCache() {
    const maxCacheSize = 50 * 1024 * 1024; // 50MB缓存限制
    const maxAge = 30 * 60 * 1000; // 30分钟过期
    const now = Date.now();
    
    let currentSize = 0;
    const entries = Array.from(layerCache.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => {
        // 按访问时间和频率排序（LRU + LFU混合）
        const aScore = a.timestamp + (a.accessCount * 60000);
        const bScore = b.timestamp + (b.accessCount * 60000);
        return bScore - aScore;
      });
    
    for (const entry of entries) {
      currentSize += entry.size;
      
      // 删除过期或超出大小限制的条目
      if (now - entry.timestamp > maxAge || currentSize > maxCacheSize) {
        layerCache.delete(entry.key);
        cacheStats.evictions++;
      }
    }
  }

  // 获取缓存
  function getCachedLayer(key) {
    const entry = layerCache.get(key);
    if (entry) {
      entry.accessCount++;
      entry.timestamp = Date.now(); // 更新访问时间
      cacheStats.hits++;
      return entry;
    }
    cacheStats.misses++;
    return null;
  }

  // 设置缓存
  function setCachedLayer(key, data, headers) {
    if (!ENABLE_LAYER_CACHE) return;
    
    const size = data.byteLength || data.length || 0;
    const sizeInMB = size / (1024 * 1024);
    
    // 只缓存小层
    if (sizeInMB <= CACHE_SMALL_LAYERS_MB) {
      layerCache.set(key, createCacheEntry(data, headers));
      evictOldCache(); // 清理过期缓存
    }
  }

  // ============ 性能优化：并行请求管理器 ============
  class ParallelRequestManager {
    constructor(maxConcurrent = MAX_CONCURRENT_LAYERS) {
      this.maxConcurrent = maxConcurrent;
      this.activeRequests = 0;
      this.queue = [];
    }
    
    async execute(requestFn, ...args) {
      return new Promise((resolve, reject) => {
        this.queue.push({ requestFn, args, resolve, reject });
        this.processQueue();
      });
    }
    
    async processQueue() {
      if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
        return;
      }
      
      const { requestFn, args, resolve, reject } = this.queue.shift();
      this.activeRequests++;
      
      try {
        const result = await requestFn(...args);
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.activeRequests--;
        this.processQueue(); // 处理下一个请求
      }
    }
  }

  // ============ 智能路由选择系统 ============
  
  // 性能统计缓存
  const performanceStats = new Map();
  const connectionPool = new Map();
  
  // 镜像源优先级配置
  const MIRROR_PRIORITY = {
    'registry-1.docker.io': ['registry-1.docker.io'],
    'quay.io': ['quay.io'],
    'gcr.io': ['gcr.io', 'registry.cn-hangzhou.aliyuncs.com'],
    'ghcr.io': ['ghcr.io']
  };
  
  // 性能监控类
  class PerformanceMonitor {
    constructor() {
      this.stats = new Map();
    }
    
    // 记录请求性能
    recordRequest(host, latency, success, size = 0) {
      if (!this.stats.has(host)) {
        this.stats.set(host, {
          totalRequests: 0,
          successCount: 0,
          totalLatency: 0,
          averageLatency: 0,
          totalBytes: 0,
          lastUpdateTime: Date.now(),
          reliability: 1.0
        });
      }
      
      const stat = this.stats.get(host);
      stat.totalRequests++;
      stat.totalLatency += latency;
      stat.totalBytes += size;
      stat.averageLatency = stat.totalLatency / stat.totalRequests;
      stat.lastUpdateTime = Date.now();
      
      if (success) {
        stat.successCount++;
      }
      
      // 计算可靠性（成功率）
      stat.reliability = stat.successCount / stat.totalRequests;
      
      // 清理过期统计（超过1小时）
      this.cleanupOldStats();
    }
    
    // 获取最佳主机
    getBestHost(candidates) {
      if (!ENABLE_SMART_ROUTING || candidates.length <= 1) {
        return candidates[0];
      }
      
      let bestHost = candidates[0];
      let bestScore = 0;
      
      for (const host of candidates) {
        const stat = this.stats.get(host);
        if (!stat) {
          // 新主机给予中等分数
          const score = 0.5;
          if (score > bestScore) {
            bestScore = score;
            bestHost = host;
          }
          continue;
        }
        
        // 综合评分：延迟 (40%) + 可靠性 (40%) + 最近性 (20%)
        const latencyScore = Math.max(0, 1 - (stat.averageLatency / 5000)); // 5秒为基准
        const reliabilityScore = stat.reliability;
        const recentnessScore = Math.max(0, 1 - ((Date.now() - stat.lastUpdateTime) / 3600000)); // 1小时为基准
        
        const totalScore = latencyScore * 0.4 + reliabilityScore * 0.4 + recentnessScore * 0.2;
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestHost = host;
        }
      }
      
      return bestHost;
    }
    
    // 清理过期统计
    cleanupOldStats() {
      const now = Date.now();
      const maxAge = 3600000; // 1小时
      
      for (const [host, stat] of this.stats.entries()) {
        if (now - stat.lastUpdateTime > maxAge) {
          this.stats.delete(host);
        }
      }
    }
    
    // 获取性能报告
    getPerformanceReport() {
      const report = {};
      for (const [host, stat] of this.stats.entries()) {
        report[host] = {
          averageLatency: Math.round(stat.averageLatency),
          reliability: Math.round(stat.reliability * 100),
          totalRequests: stat.totalRequests,
          totalMB: Math.round(stat.totalBytes / 1024 / 1024)
        };
      }
      return report;
    }
  }
  
  // 连接池管理器
  class ConnectionPoolManager {
    constructor() {
      this.pools = new Map();
      this.maxPoolSize = 10;
      this.connectionTimeout = CONNECTION_TIMEOUT_MS;
    }
    
    // 获取连接
    async getConnection(host) {
      if (!ENABLE_CONNECTION_POOLING) {
        return null;
      }
      
      if (!this.pools.has(host)) {
        this.pools.set(host, {
          active: 0,
          waiting: [],
          lastActivity: Date.now()
        });
      }
      
      const pool = this.pools.get(host);
      
      if (pool.active < this.maxPoolSize) {
        pool.active++;
        pool.lastActivity = Date.now();
        return {
          host,
          release: () => {
            pool.active--;
            if (pool.waiting.length > 0) {
              const waitingRequest = pool.waiting.shift();
              waitingRequest.resolve();
            }
          }
        };
      }
      
      // 等待连接可用
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          const index = pool.waiting.findIndex(item => item.resolve === resolve);
          if (index > -1) {
            pool.waiting.splice(index, 1);
          }
          reject(new Error('Connection pool timeout'));
        }, this.connectionTimeout);
        
        pool.waiting.push({
          resolve: () => {
            clearTimeout(timeout);
            pool.active++;
            pool.lastActivity = Date.now();
            resolve({
              host,
              release: () => {
                pool.active--;
                if (pool.waiting.length > 0) {
                  const waitingRequest = pool.waiting.shift();
                  waitingRequest.resolve();
                }
              }
            });
          },
          reject
        });
      });
    }
    
    // 清理空闲连接池
    cleanup() {
      const now = Date.now();
      const maxIdleTime = 300000; // 5分钟
      
      for (const [host, pool] of this.pools.entries()) {
        if (now - pool.lastActivity > maxIdleTime && pool.active === 0) {
          this.pools.delete(host);
        }
      }
    }
  }
  
  // 延迟测试函数
  async function testLatency(host, path = '/', timeout = LATENCY_TEST_TIMEOUT) {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      await fetch(`https://${host}${path}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Docker-Client/24.0.0 (linux)'
        }
      });
      
      clearTimeout(timeoutId);
      return Date.now() - startTime;
    } catch (error) {
      return timeout; // 返回超时值作为最差延迟
    }
  }
  
  // 创建实例
  const performanceMonitor = new PerformanceMonitor();
  const connectionPoolManager = new ConnectionPoolManager();
  const requestManager = new ParallelRequestManager();

  // 生成会话ID
  function generateSessionId() {
    return Math.random().toString(36).substring(2, 15);
  }

  // 添加日志到会话
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
    // 保持最近1000条日志
    if (session.logs.length > 1000) {
      session.logs = session.logs.slice(-1000);
    }
  }

  // 计算Docker镜像大小
  async function calculateImageSize(targetDomain, imagePath, token, sessionId) {
    try {
      addLog(sessionId, `开始计算镜像大小: ${imagePath}`, 'info');
      
      const manifestUrl = `https://${targetDomain}/v2/${imagePath}/manifests/latest`;
      const headers = {
        'Accept': 'application/vnd.docker.distribution.manifest.v2+json,application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.oci.image.manifest.v1+json,application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.v1+json',
        'User-Agent': 'Docker-Client/24.0.0 (linux)'
      };
      
      // 尝试多种认证策略
      let manifestResponse;
      
      // 策略1：使用提供的token
      if (token) {
        addLog(sessionId, `使用Bearer token认证`, 'info');
        headers['Authorization'] = `Bearer ${token}`;
        manifestResponse = await fetch(manifestUrl, { headers });
        
        if (manifestResponse.ok) {
          addLog(sessionId, `Bearer token认证成功`, 'success');
        } else {
          addLog(sessionId, `Bearer token认证失败: ${manifestResponse.status}`, 'info');
        }
      }
      
      // 策略2：如果token失败或没有token，尝试匿名访问
      if (!manifestResponse || !manifestResponse.ok) {
        addLog(sessionId, `尝试匿名访问`, 'info');
        delete headers['Authorization'];
        manifestResponse = await fetch(manifestUrl, { headers });
        
        if (manifestResponse.ok) {
          addLog(sessionId, `匿名访问成功`, 'success');
        } else if (manifestResponse.status === 401) {
          addLog(sessionId, `匿名访问需要认证，尝试获取新token`, 'info');
          
          // 策略3：如果匿名失败，尝试获取新的匿名token
          try {
            const authResponse = await fetch(`https://${targetDomain}/v2/`, {
              headers: { 'User-Agent': 'Docker-Client/24.0.0 (linux)' }
            });
            
            if (authResponse.status === 401) {
              const wwwAuth = authResponse.headers.get('WWW-Authenticate');
              if (wwwAuth) {
                const authMatch = wwwAuth.match(/Bearer realm="([^"]+)"(?:,service="([^"]*)")?(?:,scope="([^"]*)")?/);
                if (authMatch) {
                  const [, realm, service, scope] = authMatch;
                  addLog(sessionId, `尝试获取匿名token: realm=${realm}`, 'info');
                  
                  // 构建匿名token请求
                  let tokenUrl = realm;
                  const params = new URLSearchParams();
                  if (service) params.append('service', service);
                  if (scope) params.append('scope', scope);
                  else {
                    // 为Docker Hub构建默认scope
                    if (targetDomain === 'registry-1.docker.io') {
                      params.append('scope', `repository:${imagePath}:pull`);
                    }
                  }
                  
                  if (params.toString()) {
                    tokenUrl += '?' + params.toString();
                  }
                  
                  const tokenResponse = await fetch(tokenUrl, {
                    headers: { 'User-Agent': 'Docker-Client/24.0.0 (linux)' }
                  });
                  
                  if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    const newToken = tokenData.token || tokenData.access_token;
                    
                    if (newToken) {
                      addLog(sessionId, `成功获取匿名token`, 'success');
                      headers['Authorization'] = `Bearer ${newToken}`;
                      manifestResponse = await fetch(manifestUrl, { headers });
                      
                      if (manifestResponse.ok) {
                        addLog(sessionId, `使用新token访问成功`, 'success');
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            addLog(sessionId, `获取匿名token失败: ${error.message}`, 'info');
          }
        }
      }
      
      if (!manifestResponse.ok) {
        addLog(sessionId, `所有认证策略都失败，最终状态: ${manifestResponse.status}`, 'error');
        return { success: false, size: 0 };
      }

      const manifest = await manifestResponse.json();
      addLog(sessionId, `成功获取manifest`, 'success');
      
      // 添加调试信息（仅在需要时启用）
      // addLog(sessionId, `Manifest类型: ${manifest.mediaType || 'undefined'}`, 'info');
      // addLog(sessionId, `Manifest内容: ${JSON.stringify(manifest).substring(0, 200)}...`, 'info');

      let totalSize = 0;
      let layerCount = 0;

      // 处理不同类型的manifest
      if (manifest.mediaType === 'application/vnd.docker.distribution.manifest.list.v2+json' || 
          manifest.mediaType === 'application/vnd.oci.image.index.v1+json') {
        // 多架构镜像，选择第一个支持的架构
        addLog(sessionId, `检测到多架构镜像，选择第一个架构进行计算`, 'info');
        const firstManifest = manifest.manifests[0];
        if (firstManifest) {
          const archManifestUrl = `https://${targetDomain}/v2/${imagePath}/manifests/${firstManifest.digest}`;
          const archHeaders = { ...headers };
          const archResponse = await fetch(archManifestUrl, { headers: archHeaders });
          if (archResponse.ok) {
            const archManifest = await archResponse.json();
            addLog(sessionId, `获取到架构特定manifest: ${archManifest.mediaType || 'unknown'}`, 'info');
            if (archManifest.layers) {
              for (const layer of archManifest.layers) {
                totalSize += layer.size;
                layerCount++;
                // 只记录非零大小的层，减少日志输出
                if (layer.size > 0) {
                  addLog(sessionId, `层 ${layerCount}: ${(layer.size / 1024 / 1024).toFixed(2)} MB`, 'info');
                }
              }
            }
          } else {
            addLog(sessionId, `获取架构特定manifest失败: ${archResponse.status}`, 'error');
          }
        }
      } else if (manifest.layers) {
        // 标准V2 manifest
        addLog(sessionId, `检测到标准镜像manifest (V2)`, 'info');
        for (const layer of manifest.layers) {
          totalSize += layer.size;
          layerCount++;
          // 只记录非零大小的层，减少日志输出
          if (layer.size > 0) {
            addLog(sessionId, `层 ${layerCount}: ${(layer.size / 1024 / 1024).toFixed(2)} MB`, 'info');
          }
        }
      } else if (manifest.history && manifest.fsLayers) {
        // V1 manifest格式 
        addLog(sessionId, `检测到V1格式manifest，尝试计算层大小`, 'info');
        for (let i = 0; i < manifest.fsLayers.length; i++) {
          const layer = manifest.fsLayers[i];
          layerCount++;
          
          // 尝试从history中获取大小信息
          if (manifest.history && manifest.history[i]) {
            try {
              const historyItem = JSON.parse(manifest.history[i].v1Compatibility);
              if (historyItem.Size) {
                totalSize += historyItem.Size;
                // 只记录非零大小的层
                if (historyItem.Size > 0) {
                  addLog(sessionId, `层 ${layerCount}: ${(historyItem.Size / 1024 / 1024).toFixed(2)} MB`, 'info');
                }
              }
            } catch (e) {
              addLog(sessionId, `层 ${layerCount}: 解析历史信息失败`, 'info');
            }
          } else {
            addLog(sessionId, `层 ${layerCount}: 大小待计算`, 'info');
          }
        }
      } else {
        // 未知格式，尝试其他可能的字段
        addLog(sessionId, `未知manifest格式，尝试解析其他字段`, 'info');
        
        // 检查是否有config字段（某些OCI格式）
        if (manifest.config && manifest.config.size) {
          totalSize += manifest.config.size;
          addLog(sessionId, `配置层: ${(manifest.config.size / 1024 / 1024).toFixed(2)} MB`, 'info');
        }
        
        // 检查其他可能的层字段
        const possibleLayerFields = ['layers', 'fsLayers', 'blobs'];
        for (const field of possibleLayerFields) {
          if (manifest[field] && Array.isArray(manifest[field])) {
            addLog(sessionId, `发现 ${field} 字段，包含 ${manifest[field].length} 个条目`, 'info');
            layerCount = manifest[field].length;
            break;
          }
        }
      }

      const sizeInMB = totalSize / 1024 / 1024;
      addLog(sessionId, `镜像总大小: ${sizeInMB.toFixed(2)} MB (${layerCount} 层)`, 'success');

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
      addLog(sessionId, `计算镜像大小时出错: ${error.message}`, 'error');
      return { success: false, size: 0 };
    }
  }
  
  async function handleToken(realm, service, scope) {
    // 构建token URL，处理可选参数
    let tokenUrl = realm;
    const params = new URLSearchParams();
    
    if (service) {
      params.append('service', service);
    }
    if (scope) {
      params.append('scope', scope);
    }
    
    if (params.toString()) {
      tokenUrl += '?' + params.toString();
    }
    
    console.log(`Fetching token from: ${tokenUrl}`);
    
    try {
      const tokenResponse = await fetch(tokenUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Docker-Client/24.0.0 (linux)'
        }
      });
      
      if (!tokenResponse.ok) {
        console.log(`Token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
        
        // 尝试无scope的请求（某些注册中心支持）
        if (scope && tokenResponse.status === 400) {
          console.log('Retrying token request without scope');
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
            const retryToken = retryData.token || retryData.access_token;
            if (retryToken) {
              console.log('Token acquired successfully (without scope)');
              return retryToken;
            }
          }
        }
        
        return null;
      }
      
      const tokenData = await tokenResponse.json();
      const token = tokenData.token || tokenData.access_token;
      
      if (!token) {
        console.log('No token found in response');
        return null;
      }
      
      console.log('Token acquired successfully');
      return token;
    } catch (error) {
      console.log(`Error fetching token: ${error.message}`);
      return null;
    }
  }
  
  function isAmazonS3(url) {
    try {
      return new URL(url).hostname.includes('amazonaws.com');
    } catch {
      return false;
    }
  }
  
  // 计算请求体的 SHA256 哈希值
  async function calculateSHA256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // 获取空请求体的 SHA256 哈希值
  function getEmptyBodySHA256() {
    return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  }
  
  async function handleRequest(request, env, ctx) {
    const MAX_REDIRECTS = 5; // 最大重定向次数
    const url = new URL(request.url);
    let path = url.pathname;
  
    // 记录请求信息
    console.log(`Request: ${request.method} ${path}`);
  
    // 首页路由
    if (path === '/' || path === '') {
      return new Response(HOMEPAGE_HTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // API路由：获取缓存统计信息
    if (path === '/api/cache-stats') {
      const totalCached = Array.from(layerCache.values())
        .reduce((sum, entry) => sum + entry.size, 0);
      
      return new Response(JSON.stringify({
        cacheStats,
        totalCachedBytes: totalCached,
        totalCachedMB: (totalCached / 1024 / 1024).toFixed(2),
        cachedEntries: layerCache.size,
        activeRequests: requestManager.activeRequests,
        queuedRequests: requestManager.queue.length
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // API路由：获取性能统计信息
    if (path === '/api/performance-stats') {
      const performanceReport = performanceMonitor.getPerformanceReport();
      
      return new Response(JSON.stringify({
        performanceStats: performanceReport,
        smartRoutingEnabled: ENABLE_SMART_ROUTING,
        connectionPoolEnabled: ENABLE_CONNECTION_POOLING,
        parallelDownloadsEnabled: ENABLE_PARALLEL_DOWNLOADS,
        maxConcurrentLayers: MAX_CONCURRENT_LAYERS
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // API路由：测试连接延迟
    if (path === '/api/test-latency' && request.method === 'POST') {
      const body = await request.json();
      const hosts = body.hosts || ['registry-1.docker.io'];
      const results = {};
      
      for (const host of hosts) {
        const latency = await testLatency(host);
        results[host] = {
          latency: latency,
          status: latency < LATENCY_TEST_TIMEOUT ? 'ok' : 'timeout'
        };
      }
      
      return new Response(JSON.stringify({
        results,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // API路由：获取拉取会话日志
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

    // API路由：创建新的拉取会话
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
        imageName: imageName,
        cacheHits: 0,
        totalRequests: 0
      });
      
      addLog(sessionId, `创建新的拉取会话: ${imageName}`, 'info');
      
      return new Response(JSON.stringify({ sessionId, status: 'created' }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 处理CORS预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
  
    // 处理 Docker V2 API 或 GitHub 代理请求
    let isV2Request = false;
    let v2RequestType = null; // 'manifests' or 'blobs'
    let v2RequestTag = null;  // tag or digest
    if (path.startsWith('/v2/')) {
      isV2Request = true;
      path = path.replace('/v2/', '');
  
      // 解析 V2 API 请求类型和标签/摘要
      const pathSegments = path.split('/').filter(part => part);
      if (pathSegments.length >= 3) {
        // 格式如: nginx/manifests/latest 或 nginx/blobs/sha256:xxx
        v2RequestType = pathSegments[pathSegments.length - 2];
        v2RequestTag = pathSegments[pathSegments.length - 1];
        // 提取镜像名称部分（去掉 manifests/tag 或 blobs/digest 部分）
        path = pathSegments.slice(0, pathSegments.length - 2).join('/');
      }
    }

    // ============ 性能优化：缓存检查 ============
    if (isV2Request && v2RequestType === 'blobs' && ENABLE_LAYER_CACHE) {
      const cacheKey = `${path}:${v2RequestTag}`;
      const cached = getCachedLayer(cacheKey);
      
      if (cached) {
        const sessionId = url.searchParams.get('session');
        if (sessionId) {
          addLog(sessionId, `缓存命中，快速返回层: ${v2RequestTag}`, 'success');
          const session = pullSessions.get(sessionId);
          if (session) {
            session.cacheHits++;
          }
        }
        
        // 从缓存返回数据
        const response = new Response(cached.data, {
          status: 200,
          headers: cached.headers
        });
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }
    }
  
    // 提取目标域名和路径
    const pathParts = path.split('/').filter(part => part);
    if (pathParts.length < 1) {
      return new Response('Invalid request: target domain or path required\n', { status: 400 });
    }
  
    let targetDomain, targetPath, isDockerRequest = false;
  
    // 检查路径是否以 https:// 或 http:// 开头
    const fullPath = path.startsWith('/') ? path.substring(1) : path;
  
    if (fullPath.startsWith('https://') || fullPath.startsWith('http://')) {
      // 处理 /https://domain.com/... 或 /http://domain.com/... 格式
      const urlObj = new URL(fullPath);
      targetDomain = urlObj.hostname;
      targetPath = urlObj.pathname.substring(1) + urlObj.search; // 移除开头的斜杠
  
      // 检查是否为 Docker 请求
      isDockerRequest = ['quay.io', 'gcr.io', 'k8s.gcr.io', 'registry.k8s.io', 'ghcr.io', 'docker.cloudsmith.io', 'registry-1.docker.io', 'docker.io'].includes(targetDomain);
  
      // 处理 docker.io 域名，转换为 registry-1.docker.io
      if (targetDomain === 'docker.io') {
        targetDomain = 'registry-1.docker.io';
      }
    } else {
      // 处理 Docker 镜像路径的多种格式
      if (pathParts[0] === 'docker.io') {
        // 处理 docker.io/library/nginx 或 docker.io/amilys/embyserver 格式
        isDockerRequest = true;
        targetDomain = 'registry-1.docker.io';
  
        if (pathParts.length === 2) {
          // 处理 docker.io/nginx 格式，添加 library 命名空间
          targetPath = `library/${pathParts[1]}`;
        } else {
          // 处理 docker.io/amilys/embyserver 或 docker.io/library/nginx 格式
          targetPath = pathParts.slice(1).join('/');
        }
      } else if (ALLOWED_HOSTS.includes(pathParts[0])) {
        // Docker 镜像仓库（如 ghcr.io）或 GitHub 域名（如 github.com）
        targetDomain = pathParts[0];
        targetPath = pathParts.slice(1).join('/') + url.search;
        isDockerRequest = ['quay.io', 'gcr.io', 'k8s.gcr.io', 'registry.k8s.io', 'ghcr.io', 'docker.cloudsmith.io', 'registry-1.docker.io'].includes(targetDomain);
      } else if (pathParts.length >= 1 && pathParts[0] === 'library') {
        // 处理 library/nginx 格式
        isDockerRequest = true;
        targetDomain = 'registry-1.docker.io';
        targetPath = pathParts.join('/');
      } else if (pathParts.length >= 2) {
        // 处理 amilys/embyserver 格式（带命名空间但不是 library）
        isDockerRequest = true;
        targetDomain = 'registry-1.docker.io';
        targetPath = pathParts.join('/');
      } else {
        // 处理单个镜像名称，如 nginx
        isDockerRequest = true;
        targetDomain = 'registry-1.docker.io';
        targetPath = `library/${pathParts.join('/')}`;
      }
    }
  
    // 默认白名单检查：只允许 ALLOWED_HOSTS 中的域名
    if (!ALLOWED_HOSTS.includes(targetDomain)) {
      console.log(`Blocked: Domain ${targetDomain} not in allowed list`);
      return new Response(`Error: Invalid target domain.\n`, { status: 400 });
    }
  
    // 路径白名单检查（仅当 RESTRICT_PATHS = true 时）
    if (RESTRICT_PATHS) {
      const checkPath = isDockerRequest ? targetPath : path;
      console.log(`Checking whitelist against path: ${checkPath}`);
      const isPathAllowed = ALLOWED_PATHS.some(pathString =>
        checkPath.toLowerCase().includes(pathString.toLowerCase())
      );
      if (!isPathAllowed) {
        console.log(`Blocked: Path ${checkPath} not in allowed paths`);
        return new Response(`Error: The path is not in the allowed paths.\n`, { status: 403 });
      }
    }

    // Docker镜像大小检查（仅对manifest请求进行检查）
    if (ENABLE_SIZE_CHECK && isDockerRequest && isV2Request && v2RequestType === 'manifests') {
      console.log(`Size check enabled for Docker manifest request: ${targetPath}`);
      
      // 从URL查询参数获取session ID，如果没有则创建新的
      const sessionId = url.searchParams.get('session') || generateSessionId();
      
      // 首先尝试获取token进行认证
      let token = null;
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
      
      // 如果没有token，尝试获取一个
      if (!token) {
        try {
          addLog(sessionId, `尝试获取认证token`, 'info');
          const tokenResponse = await fetch(`https://${targetDomain}/v2/`, {
            method: 'GET',
            headers: { 
              'Host': targetDomain,
              'User-Agent': 'Docker-Client/24.0.0 (linux)'
            }
          });
          
          if (tokenResponse.status === 401) {
            const wwwAuth = tokenResponse.headers.get('WWW-Authenticate');
            if (wwwAuth) {
              addLog(sessionId, `发现认证挑战: ${wwwAuth.substring(0, 100)}...`, 'info');
              
              // 改进的正则表达式，处理可选的service和scope
              const authMatch = wwwAuth.match(/Bearer realm="([^"]+)"(?:,service="([^"]*)")?(?:,scope="([^"]*)")?/);
              if (authMatch) {
                const [, realm, service, scope] = authMatch;
                
                // 为Docker Hub构建合适的scope
                let finalScope = scope;
                if (!finalScope && targetDomain === 'registry-1.docker.io') {
                  finalScope = `repository:${targetPath}:pull`;
                  addLog(sessionId, `构建Docker Hub scope: ${finalScope}`, 'info');
                }
                
                token = await handleToken(realm, service || targetDomain, finalScope);
                if (token) {
                  addLog(sessionId, `成功获取认证token`, 'success');
                } else {
                  addLog(sessionId, `获取认证token失败`, 'info');
                }
              }
            }
          } else if (tokenResponse.ok) {
            addLog(sessionId, `${targetDomain}支持匿名访问`, 'success');
          }
        } catch (error) {
          addLog(sessionId, `获取认证token时出错: ${error.message}`, 'info');
          console.log(`Failed to obtain token for size check: ${error.message}`);
        }
      }
      
      // 计算镜像大小
      const sizeResult = await calculateImageSize(targetDomain, targetPath, token, sessionId);
      
      if (sizeResult.success && MAX_IMAGE_SIZE_MB > 0 && sizeResult.size > MAX_IMAGE_SIZE_MB) {
        addLog(sessionId, `镜像太大，拒绝拉取！镜像大小: ${sizeResult.size.toFixed(2)} MB，限制: ${MAX_IMAGE_SIZE_MB} MB`, 'error');
        
        // 更新会话状态
        const session = pullSessions.get(sessionId);
        if (session) {
          session.status = 'rejected';
        }
        
        return new Response(JSON.stringify({
          error: 'Image too large',
          message: `镜像大小 ${sizeResult.size.toFixed(2)} MB 超过限制 ${MAX_IMAGE_SIZE_MB} MB`,
          sessionId: sessionId,
          imageSize: sizeResult.size,
          maxSize: MAX_IMAGE_SIZE_MB
        }), {
          status: 413,
          headers: { 
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId 
          }
        });
      } else if (sizeResult.success) {
        addLog(sessionId, `镜像大小检查通过，允许拉取`, 'success');
        
        // 更新会话状态
        const session = pullSessions.get(sessionId);
        if (session) {
          session.status = 'approved';
        }
        
        // 会话ID将在后续响应中添加
      }
    }
  
    // 构建目标 URL
    let targetUrl;
    if (isDockerRequest) {
      if (isV2Request && v2RequestType && v2RequestTag) {
        // 重构 V2 API URL
        targetUrl = `https://${targetDomain}/v2/${targetPath}/${v2RequestType}/${v2RequestTag}`;
      } else {
        targetUrl = `https://${targetDomain}/${isV2Request ? 'v2/' : ''}${targetPath}`;
      }
    } else {
      targetUrl = `https://${targetDomain}/${targetPath}`;
    }
  
    const newRequestHeaders = new Headers(request.headers);
    
    // 如果有会话ID，添加到请求头中
    const sessionId = url.searchParams.get('session');
    if (sessionId) {
      newRequestHeaders.set('X-Session-ID', sessionId);
    }
    newRequestHeaders.set('Host', targetDomain);
    newRequestHeaders.delete('x-amz-content-sha256');
    newRequestHeaders.delete('x-amz-date');
    newRequestHeaders.delete('x-amz-security-token');
    newRequestHeaders.delete('x-amz-user-agent');
  
    if (isAmazonS3(targetUrl)) {
      newRequestHeaders.set('x-amz-content-sha256', getEmptyBodySHA256());
      newRequestHeaders.set('x-amz-date', new Date().toISOString().replace(/[-:T]/g, '').slice(0, -5) + 'Z');
    }
  
    try {
      // ============ 性能优化：优化请求配置 ============
      const fetchOptions = {
        method: request.method,
        headers: newRequestHeaders,
        body: request.body,
        redirect: 'manual'
      };
      
      // 添加性能优化头
      if (ENABLE_COMPRESSION_OPTIMIZATION) {
        newRequestHeaders.set('Accept-Encoding', 'gzip, deflate, br');
        if (isDockerRequest) {
          // Docker特定优化
          newRequestHeaders.set('Docker-Content-Digest', 'true');
        }
      }
      
      // 连接优化头
      newRequestHeaders.set('Connection', 'keep-alive');
      newRequestHeaders.set('Keep-Alive', 'timeout=30, max=100');
      
      // 大文件传输优化
      if (isV2Request && v2RequestType === 'blobs') {
        newRequestHeaders.set('Range', 'bytes=0-'); // 支持断点续传
        newRequestHeaders.set('Accept-Ranges', 'bytes');
      }
      
      // ============ 智能路由选择 ============
      let optimalHost = targetDomain;
      if (ENABLE_SMART_ROUTING && isDockerRequest) {
        const candidates = MIRROR_PRIORITY[targetDomain] || [targetDomain];
        optimalHost = performanceMonitor.getBestHost(candidates);
        
        // 如果选择了不同的主机，更新目标URL
        if (optimalHost !== targetDomain) {
          targetUrl = targetUrl.replace(`https://${targetDomain}`, `https://${optimalHost}`);
          newRequestHeaders.set('Host', optimalHost);
          
          const sessionId = url.searchParams.get('session');
          if (sessionId) {
            addLog(sessionId, `智能路由选择: ${optimalHost} (替代 ${targetDomain})`, 'info');
          }
        }
      }
      
      // ============ 连接池管理 ============
      let connection = null;
      if (ENABLE_CONNECTION_POOLING) {
        try {
          connection = await connectionPoolManager.getConnection(optimalHost);
        } catch (error) {
          console.log(`Connection pool error: ${error.message}`);
        }
      }
      
      // 记录开始时间用于性能监控
      const requestStartTime = Date.now();
      
      // 使用并行请求管理器处理blob请求
      let response;
      if (ENABLE_PARALLEL_DOWNLOADS && isV2Request && v2RequestType === 'blobs') {
        response = await requestManager.execute(async () => {
          return await fetch(targetUrl, fetchOptions);
        });
      } else {
        response = await fetch(targetUrl, fetchOptions);
      }
      
      // 记录性能数据
      const requestLatency = Date.now() - requestStartTime;
      const responseContentLength = parseInt(response.headers.get('content-length') || '0');
      
      if (ENABLE_PERFORMANCE_MONITORING) {
        performanceMonitor.recordRequest(optimalHost, requestLatency, response.ok, responseContentLength);
      }
      
      // 释放连接池连接
      if (connection) {
        connection.release();
      }
      
      console.log(`Request to ${optimalHost}: ${response.status} ${response.statusText} (${requestLatency}ms)`);
  
      // 处理 Docker 认证挑战
      if (isDockerRequest && response.status === 401) {
        const wwwAuth = response.headers.get('WWW-Authenticate');
        if (wwwAuth) {
          const authMatch = wwwAuth.match(/Bearer realm="([^"]+)",service="([^"]*)",scope="([^"]*)"/);
          if (authMatch) {
            const [, realm, service, scope] = authMatch;
            console.log(`Auth challenge: realm=${realm}, service=${service || targetDomain}, scope=${scope}`);
  
            const token = await handleToken(realm, service || targetDomain, scope);
            if (token) {
              const authHeaders = new Headers(request.headers);
              authHeaders.set('Authorization', `Bearer ${token}`);
              authHeaders.set('Host', targetDomain);
              // 如果目标是 S3，添加必要的 x-amz 头；否则删除可能干扰的头部
              if (isAmazonS3(targetUrl)) {
                authHeaders.set('x-amz-content-sha256', getEmptyBodySHA256());
                authHeaders.set('x-amz-date', new Date().toISOString().replace(/[-:T]/g, '').slice(0, -5) + 'Z');
              } else {
                authHeaders.delete('x-amz-content-sha256');
                authHeaders.delete('x-amz-date');
                authHeaders.delete('x-amz-security-token');
                authHeaders.delete('x-amz-user-agent');
              }
  
              const authRequest = new Request(targetUrl, {
                method: request.method,
                headers: authHeaders,
                body: request.body,
                redirect: 'manual'
              });
              console.log('Retrying with token');
              response = await fetch(authRequest);
              console.log(`Token response: ${response.status} ${response.statusText}`);
            } else {
              console.log('No token acquired, falling back to anonymous request');
              const anonHeaders = new Headers(request.headers);
              anonHeaders.delete('Authorization');
              anonHeaders.set('Host', targetDomain);
              // 如果目标是 S3，添加必要的 x-amz 头；否则删除可能干扰的头部
              if (isAmazonS3(targetUrl)) {
                anonHeaders.set('x-amz-content-sha256', getEmptyBodySHA256());
                anonHeaders.set('x-amz-date', new Date().toISOString().replace(/[-:T]/g, '').slice(0, -5) + 'Z');
              } else {
                anonHeaders.delete('x-amz-content-sha256');
                anonHeaders.delete('x-amz-date');
                anonHeaders.delete('x-amz-security-token');
                anonHeaders.delete('x-amz-user-agent');
              }
  
              const anonRequest = new Request(targetUrl, {
                method: request.method,
                headers: anonHeaders,
                body: request.body,
                redirect: 'manual'
              });
              response = await fetch(anonRequest);
              console.log(`Anonymous response: ${response.status} ${response.statusText}`);
            }
          } else {
            console.log('Invalid WWW-Authenticate header');
          }
        } else {
          console.log('No WWW-Authenticate header in 401 response');
        }
      }
  
      // 处理 S3 重定向（Docker 镜像层）
      if (isDockerRequest && (response.status === 307 || response.status === 302)) {
        const redirectUrl = response.headers.get('Location');
        if (redirectUrl) {
          console.log(`Redirect detected: ${redirectUrl}`);
          const EMPTY_BODY_SHA256 = getEmptyBodySHA256();
          const redirectHeaders = new Headers(request.headers);
          redirectHeaders.set('Host', new URL(redirectUrl).hostname);
          
          // 对于任何重定向，都添加必要的AWS头（如果需要）
          if (isAmazonS3(redirectUrl)) {
            redirectHeaders.set('x-amz-content-sha256', EMPTY_BODY_SHA256);
            redirectHeaders.set('x-amz-date', new Date().toISOString().replace(/[-:T]/g, '').slice(0, -5) + 'Z');
          }
          
          if (response.headers.get('Authorization')) {
            redirectHeaders.set('Authorization', response.headers.get('Authorization'));
          }
  
          const redirectRequest = new Request(redirectUrl, {
            method: request.method,
            headers: redirectHeaders,
            body: request.body,
            redirect: 'manual'
          });
          response = await fetch(redirectRequest);
          console.log(`Redirect response: ${response.status} ${response.statusText}`);
  
          if (!response.ok) {
            console.log('Redirect request failed, returning original redirect response');
            return new Response(response.body, {
              status: response.status,
              headers: response.headers
            });
          }
        }
      }
  
      // ============ 性能优化：响应处理和缓存 ============
      let responseData = response.body;
      const responseHeaders = new Headers(response.headers);
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const sizeInMB = contentLength / (1024 * 1024);
      
      // 缓存小层数据
      if (ENABLE_LAYER_CACHE && isV2Request && v2RequestType === 'blobs' && response.ok) {
        if (sizeInMB <= CACHE_SMALL_LAYERS_MB && sizeInMB > 0) {
          try {
            const arrayBuffer = await response.arrayBuffer();
            const cacheKey = `${path}:${v2RequestTag}`;
            
            // 缓存数据
            setCachedLayer(cacheKey, arrayBuffer, responseHeaders);
            
            // 重新创建响应
            responseData = arrayBuffer;
            
            const sessionId = url.searchParams.get('session');
            if (sessionId) {
              addLog(sessionId, `小层已缓存: ${sizeInMB.toFixed(2)} MB`, 'info');
            }
          } catch (error) {
            console.log(`Failed to cache layer: ${error.message}`);
          }
        }
      }
      
      // 对于大层，启用流式传输优化
      if (ENABLE_STREAMING && isV2Request && v2RequestType === 'blobs' && 
          sizeInMB > CACHE_SMALL_LAYERS_MB && response.ok) {
        const sessionId = url.searchParams.get('session');
        if (sessionId) {
          addLog(sessionId, `大层流式传输: ${sizeInMB.toFixed(2)} MB`, 'info');
        }
        
        // 直接流式传输，不缓存
        responseData = response.body;
        
        // 添加流式传输优化头
        responseHeaders.set('Transfer-Encoding', 'chunked');
        responseHeaders.set('X-Stream-Optimized', 'true');
      }
      
      // 复制响应并添加优化头
      const newResponse = new Response(responseData, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
      
      // 添加CORS和性能头
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
      
      // 性能优化头
      if (ENABLE_COMPRESSION_OPTIMIZATION) {
        newResponse.headers.set('Vary', 'Accept-Encoding');
      }
      
      // 缓存控制
      if (isV2Request && v2RequestType === 'blobs') {
        newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1年缓存
        newResponse.headers.set('X-Cache', 'MISS');
      }
      
      if (isDockerRequest) {
        newResponse.headers.set('Docker-Distribution-API-Version', 'registry/2.0');
        // 删除可能存在的重定向头，确保所有请求都通过Worker处理
        newResponse.headers.delete('Location');
        
        // 获取会话ID并记录请求
        const sessionId = url.searchParams.get('session') || newRequestHeaders.get('X-Session-ID');
        if (sessionId) {
          newResponse.headers.set('X-Session-ID', sessionId);
          
          // 更新会话统计
          const session = pullSessions.get(sessionId);
          if (session) {
            session.totalRequests++;
          }
          
          // 记录Docker请求日志
          if (isV2Request && v2RequestType === 'manifests') {
            addLog(sessionId, `成功获取镜像manifest: ${targetPath}`, 'success');
          } else if (isV2Request && v2RequestType === 'blobs') {
            const sizeInfo = response.headers.get('content-length') ? 
              ` (${(parseInt(response.headers.get('content-length')) / 1024 / 1024).toFixed(2)} MB)` : '';
            addLog(sessionId, `下载镜像层: ${v2RequestTag}${sizeInfo}`, 'info');
          }
          
          // 更新会话状态
          if (session && session.status !== 'downloading') {
            session.status = 'downloading';
            addLog(sessionId, `开始下载镜像数据...`, 'info');
          }
        }
      }
      
      return newResponse;
    } catch (error) {
      console.log(`Fetch error: ${error.message}`);
      return new Response(`Error fetching from ${targetDomain}: ${error.message}\n`, { status: 500 });
    }
  }
  
  export default {
    async fetch(request, env, ctx) {
      return handleRequest(request, env, ctx);
    }
  };