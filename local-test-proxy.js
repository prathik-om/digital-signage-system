const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Enable CORS for local testing
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: false
}));

// Proxy API calls to your Catalyst backend
app.use('/api', createProxyMiddleware({
  target: 'https://atrium-60045083855.development.catalystserverless.in',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remove /api prefix when forwarding
  },
  onProxyRes: function (proxyRes, req, res) {
    // Add CORS headers to responses
    proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, X-Requested-With, Origin';
  }
}));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Local proxy server running on http://localhost:${PORT}`);
  console.log(`📱 Dashboard should be running on http://localhost:3000`);
  console.log(`🔗 API calls will be proxied to your Catalyst backend`);
  console.log(`\n💡 To test with local API: change API_BASE_URL to http://localhost:3001/api`);
});
