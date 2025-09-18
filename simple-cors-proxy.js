const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3003'],
  credentials: false
}));

// Parse JSON bodies with increased size limit for file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// List of Catalyst function endpoints
const catalystEndpoints = [
  'content',
  'playlist', 
  'emergency',
  'settings',
  'media-upload',
  'setup_database_multiuser',
  'zoho-integration',
  'test-simple'
];

// Create proxy routes for each endpoint
catalystEndpoints.forEach(endpoint => {
  app.all(`/${endpoint}`, async (req, res) => {
    try {
      console.log(`🔄 Proxying ${req.method} /${endpoint} to Catalyst API`);
      
      const targetUrl = `https://atrium-60045083855.development.catalystserverless.in/${endpoint}`;
      
      const options = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CORS-Proxy/1.0'
        }
      };

      const proxyReq = https.request(targetUrl, options, (proxyRes) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
        
        // Set status code
        res.statusCode = proxyRes.statusCode;
        
        // Copy headers
        Object.keys(proxyRes.headers).forEach(key => {
          if (key.toLowerCase() !== 'access-control-allow-origin') {
            res.setHeader(key, proxyRes.headers[key]);
          }
        });
        
        // Pipe the response
        proxyRes.pipe(res);
        
        console.log(`✅ Proxied ${req.method} /${endpoint} -> ${proxyRes.statusCode}`);
      });

      proxyReq.on('error', (error) => {
        console.error(`❌ Proxy error for ${req.method} /${endpoint}:`, error.message);
        res.status(500).json({ error: 'Proxy error', message: error.message });
      });

      // Send request body if present
      if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(JSON.stringify(req.body));
      }
      
      proxyReq.end();
      
    } catch (error) {
      console.error(`❌ Error proxying ${req.method} /${endpoint}:`, error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  });
});

// Image proxy endpoint
app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  
  if (!imageUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    console.log(`🖼️ Proxying image: ${imageUrl}`);
    
    const options = {
      headers: {
        'User-Agent': 'CORS-Proxy/1.0'
      }
    };

    const proxyReq = https.request(imageUrl, options, (proxyRes) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/jpeg');
      res.statusCode = proxyRes.statusCode;
      
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
      console.error(`❌ Image proxy error:`, error.message);
      res.status(500).json({ error: 'Image proxy error', message: error.message });
    });

    proxyReq.end();
    
  } catch (error) {
    console.error(`❌ Image proxy error:`, error);
    res.status(500).json({ error: 'Image proxy error', message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CORS proxy is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple CORS proxy running on http://localhost:${PORT}`);
  console.log(`📱 Dashboard should be running on http://localhost:3000`);
  console.log(`🔗 API calls will be proxied to Catalyst backend`);
  console.log(`🖼️ Image proxy available at http://localhost:${PORT}/proxy-image`);
  console.log(`💡 Supported endpoints: ${catalystEndpoints.join(', ')}`);
});
