/**
 * Production Server with API Proxy
 * Serves static files from dist/ and proxies API requests to backend
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8005;

// API Proxy Configuration with Mobile Browser Support
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  ws: true,
  logLevel: 'debug',

  // Enhanced headers for mobile browser compatibility
  onProxyReq: (proxyReq, req, res) => {
    console.log('[PROXY] Request:', req.method, req.path);
    console.log('[PROXY] User-Agent:', req.get('User-Agent'));

    // Forward original host information
    proxyReq.setHeader('X-Forwarded-For', req.ip);
    proxyReq.setHeader('X-Forwarded-Host', req.get('Host') || '');
    proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
  },

  onProxyRes: (proxyRes, req, res) => {
    console.log('[PROXY] Response:', proxyRes.statusCode, 'for', req.path);

    // Add CORS headers for mobile browser compatibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  },

  onError: (err, req, res) => {
    console.error('[PROXY] Error for', req.path, ':', err.message);
    res.status(500).json({
      error: 'Proxy error',
      message: err.message,
      path: req.path
    });
  },

  // Filter function determines which requests to proxy
  filter: (pathname) => {
    const shouldProxy = pathname.startsWith('/api') ||
                       pathname.startsWith('/auth') ||
                       pathname.startsWith('/exercises') ||
                       pathname.startsWith('/health') ||
                       pathname.startsWith('/ws') ||
                       pathname.startsWith('/chat');
    console.log('[PROXY] Filter:', pathname, '→', shouldProxy ? 'PROXY' : 'SKIP');
    return shouldProxy;
  }
});

// Handle OPTIONS preflight requests for mobile browsers (middleware approach)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('[OPTIONS] Preflight request for:', req.path);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  next();
});

// Serve static files FIRST (before proxy)
app.use(express.static(path.join(__dirname, 'dist')));

// Apply proxy middleware for API routes only
app.use(apiProxy);

// Serve index.html for all other routes (SPA fallback)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Production server running on http://0.0.0.0:${PORT}`);
  console.log(`   - Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`   - Proxying API requests to: http://localhost:8000`);
});

// Enable WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/ws')) {
    apiProxy.upgrade(req, socket, head);
  }
});
