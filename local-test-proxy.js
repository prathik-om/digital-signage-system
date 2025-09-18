const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();

// Enable CORS for local testing (both dashboard and TV player)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3003'],
  credentials: false
}));

// Proxy API calls to your Catalyst backend
app.use('/api', createProxyMiddleware({
  target: 'https://atrium-60045083855.development.catalystserverless.in',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Rewrite /api to root for proper routing
  },
  onProxyRes: function (proxyRes, req, res) {
    // Add CORS headers to responses (allow both dashboard and TV player)
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, X-Requested-With, Origin';
  }
}));

// Direct proxy for individual functions
const catalystBaseUrl = 'https://atrium-60045083855.development.catalystserverless.in';

// Special handling for auth endpoint - manual proxy
app.use('/auth', async (req, res) => {
  console.log(`🔄 [AUTH] Proxying ${req.method} ${req.url} to ${catalystBaseUrl}${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Collect request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        console.log(`📦 [AUTH] Request body:`, body);
        console.log(`📝 [AUTH] Request headers:`, req.headers);
        
        // Make request to Catalyst backend
        const https = require('https');
        const url = require('url');
        
        const targetUrl = new URL(`${catalystBaseUrl}/auth`);
        
        const options = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || 443,
          path: targetUrl.pathname + targetUrl.search,
          method: req.method,
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'ProjectorP-Proxy/1.0'
          }
        };
        
        console.log(`🚀 [AUTH] Making request to:`, `${options.method} ${targetUrl.href}`);
        
        const proxyReq = https.request(options, (proxyRes) => {
          console.log(`✅ [AUTH] Response status: ${proxyRes.statusCode}`);
          
          // Set response headers
          Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
          });
          
          // Add CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
          
          res.statusCode = proxyRes.statusCode;
          
          // Pipe response
          proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (err) => {
          console.error(`❌ [AUTH] Request error:`, err);
          res.status(500).json({ error: 'Proxy request failed', message: err.message });
        });
        
        // Send request body
        if (body) {
          proxyReq.write(body);
        }
        proxyReq.end();
        
      } catch (error) {
        console.error(`❌ [AUTH] Error:`, error);
        res.status(500).json({ error: 'Internal proxy error', message: error.message });
      }
    });
    
  } catch (error) {
    console.error(`❌ [AUTH] Error:`, error);
    res.status(500).json({ error: 'Internal proxy error', message: error.message });
  }
});

// Special manual proxy for content endpoint
app.use('/content', async (req, res) => {
  console.log(`🔄 [CONTENT] Proxying ${req.method} ${req.url} to ${catalystBaseUrl}/content`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', async () => {
      try {
        const https = require('https');
        const targetUrl = new URL(`${catalystBaseUrl}/content`);
        
        const options = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || 443,
          path: targetUrl.pathname + targetUrl.search,
          method: req.method,
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'ProjectorP-Proxy/1.0'
          }
        };
        
        const proxyReq = https.request(options, (proxyRes) => {
          Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
          });
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.statusCode = proxyRes.statusCode;
          proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (err) => {
          console.error(`❌ [CONTENT] Request error:`, err);
          res.status(500).json({ error: 'Proxy request failed', message: err.message });
        });
        
        if (body) proxyReq.write(body);
        proxyReq.end();
      } catch (error) {
        console.error(`❌ [CONTENT] Error:`, error);
        res.status(500).json({ error: 'Internal proxy error', message: error.message });
      }
    });
  } catch (error) {
    console.error(`❌ [CONTENT] Error:`, error);
    res.status(500).json({ error: 'Internal proxy error', message: error.message });
  }
});

// Special manual proxy for playlist endpoint
app.use('/playlist', async (req, res) => {
  console.log(`🔄 [PLAYLIST] Proxying ${req.method} ${req.url} to ${catalystBaseUrl}/playlist`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', async () => {
      try {
        const https = require('https');
        const targetUrl = new URL(`${catalystBaseUrl}/playlist`);
        
        const options = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || 443,
          path: targetUrl.pathname + targetUrl.search,
          method: req.method,
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'ProjectorP-Proxy/1.0'
          }
        };
        
        const proxyReq = https.request(options, (proxyRes) => {
          Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
          });
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.statusCode = proxyRes.statusCode;
          proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (err) => {
          console.error(`❌ [PLAYLIST] Request error:`, err);
          res.status(500).json({ error: 'Proxy request failed', message: err.message });
        });
        
        if (body) proxyReq.write(body);
        proxyReq.end();
      } catch (error) {
        console.error(`❌ [PLAYLIST] Error:`, error);
        res.status(500).json({ error: 'Internal proxy error', message: error.message });
      }
    });
  } catch (error) {
    console.error(`❌ [PLAYLIST] Error:`, error);
    res.status(500).json({ error: 'Internal proxy error', message: error.message });
  }
});

// Special manual proxy for media-upload endpoint
app.use('/media-upload', async (req, res) => {
  console.log(`🔄 [MEDIA-UPLOAD] Proxying ${req.method} ${req.url} to ${catalystBaseUrl}/media-upload`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', async () => {
      try {
        const https = require('https');
        const targetUrl = new URL(`${catalystBaseUrl}/media-upload`);
        
        const options = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || 443,
          path: targetUrl.pathname + targetUrl.search,
          method: req.method,
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'ProjectorP-Proxy/1.0'
          }
        };
        
        const proxyReq = https.request(options, (proxyRes) => {
          Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
          });
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.statusCode = proxyRes.statusCode;
          proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (err) => {
          console.error(`❌ [MEDIA-UPLOAD] Request error:`, err);
          res.status(500).json({ error: 'Proxy request failed', message: err.message });
        });
        
        if (body) proxyReq.write(body);
        proxyReq.end();
      } catch (error) {
        console.error(`❌ [MEDIA-UPLOAD] Error:`, error);
        res.status(500).json({ error: 'Internal proxy error', message: error.message });
      }
    });
  } catch (error) {
    console.error(`❌ [MEDIA-UPLOAD] Error:`, error);
    res.status(500).json({ error: 'Internal proxy error', message: error.message });
  }
});

// List of other Catalyst function endpoints (for automatic proxy)
const catalystEndpoints = [
  'emergency',
  'settings',
  'setup_database_multiuser',
  'zoho-integration',
  'test-simple'
];

// Create proxy middleware for each endpoint
catalystEndpoints.forEach(endpoint => {
  app.use(`/${endpoint}`, createProxyMiddleware({
    target: catalystBaseUrl,
    changeOrigin: true,
    secure: true,
    logLevel: 'debug',
    // Ensure POST requests are properly handled
    onProxyReq: function (proxyReq, req, res) {
      console.log(`🔄 Proxying ${req.method} ${req.url} to ${catalystBaseUrl}${req.url}`);
      console.log(`📝 Request headers:`, req.headers);
      console.log(`📦 Request body length:`, req.headers['content-length'] || 'unknown');
    },
    onProxyRes: function (proxyRes, req, res) {
      // Add CORS headers to responses
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, X-Requested-With, Origin';
      console.log(`✅ Proxied ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
    },
    onError: function (err, req, res) {
      console.error(`❌ Proxy error for ${req.method} ${req.url}:`, err.message);
    }
  }));
});

// Special manual proxy for events endpoint
app.use('/events', async (req, res) => {
  console.log(`🔄 [EVENTS] Proxying ${req.method} ${req.url} to ${catalystBaseUrl}/events`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', async () => {
      try {
        const https = require('https');
        const targetUrl = new URL(`${catalystBaseUrl}/events`);
        
        const options = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || 443,
          path: targetUrl.pathname + targetUrl.search,
          method: req.method,
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'ProjectorP-Proxy/1.0'
          }
        };
        
        const proxyReq = https.request(options, (proxyRes) => {
          res.statusCode = proxyRes.statusCode;
          Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
          });
          proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (error) => {
          console.error('❌ Events proxy error:', error);
          res.status(500).json({ error: 'Proxy error: ' + error.message });
        });
        
        if (body) {
          proxyReq.write(body);
        }
        proxyReq.end();
        
      } catch (error) {
        console.error('❌ Events request error:', error);
        res.status(500).json({ error: 'Request error: ' + error.message });
      }
    });
    
  } catch (error) {
    console.error('❌ Events proxy setup error:', error);
    res.status(500).json({ error: 'Proxy setup error: ' + error.message });
  }
});

// Special manual proxy for screens endpoint
app.use('/screens', async (req, res) => {
  console.log(`🔄 [SCREENS] Proxying ${req.method} ${req.url} to ${catalystBaseUrl}/screens`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', async () => {
      try {
        const https = require('https');
        const targetUrl = new URL(`${catalystBaseUrl}/screens`);
        
        const options = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || 443,
          path: targetUrl.pathname + targetUrl.search,
          method: req.method,
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'ProjectorP-Proxy/1.0'
          }
        };
        
        const proxyReq = https.request(options, (proxyRes) => {
          res.statusCode = proxyRes.statusCode;
          Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
          });
          proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (error) => {
          console.error('❌ Screens proxy error:', error);
          res.status(500).json({ error: 'Proxy error: ' + error.message });
        });
        
        if (body) {
          proxyReq.write(body);
        }
        proxyReq.end();
        
      } catch (error) {
        console.error('❌ Screens request error:', error);
        res.status(500).json({ error: 'Request error: ' + error.message });
      }
    });
    
  } catch (error) {
    console.error('❌ Screens proxy setup error:', error);
    res.status(500).json({ error: 'Proxy setup error: ' + error.message });
  }
});


// Image proxy endpoint to handle CORS for external images
app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  
  if (!imageUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  console.log('🖼️ Proxying image:', imageUrl);

  try {
    // Add CORS headers for the image response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Choose the appropriate module based on URL protocol
    const client = imageUrl.startsWith('https:') ? https : http;
    
    // Fetch the image
    client.get(imageUrl, (imageRes) => {
      // Set content type from original response
      if (imageRes.headers['content-type']) {
        res.setHeader('Content-Type', imageRes.headers['content-type']);
      }
      
      // Set content length if available
      if (imageRes.headers['content-length']) {
        res.setHeader('Content-Length', imageRes.headers['content-length']);
      }
      
      // Pipe the image data to response
      imageRes.pipe(res);
      
      imageRes.on('error', (error) => {
        console.error('❌ Error fetching image:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to fetch image' });
        }
      });
      
    }).on('error', (error) => {
      console.error('❌ Network error fetching image:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Network error fetching image' });
      }
    });
    
  } catch (error) {
    console.error('❌ Error in image proxy:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Local proxy server running on http://localhost:${PORT}`);
  console.log(`📱 Dashboard should be running on http://localhost:3000`);
  console.log(`🔗 API calls will be proxied to your Catalyst backend`);
  console.log(`🖼️ Image proxy available at http://localhost:${PORT}/proxy-image`);
  console.log(`\n💡 To test with local API: change API_BASE_URL to http://localhost:3001/api`);
});
