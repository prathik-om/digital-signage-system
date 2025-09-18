#!/usr/bin/env node

/**
 * Simple test script to verify CORS proxy functionality
 * Run this after starting the local proxy server
 */

const https = require('https');
const http = require('http');

console.log('🧪 Testing CORS Proxy Setup...\n');

// Test the image proxy endpoint
const testImageProxy = () => {
  return new Promise((resolve, reject) => {
    const testUrl = 'https://atrium-media-development.zohostratus.in/image%20%281%29.jpg';
    const proxyUrl = `http://localhost:3001/proxy-image?url=${encodeURIComponent(testUrl)}`;
    
    console.log('🖼️ Testing image proxy endpoint...');
    console.log('   Original URL:', testUrl);
    console.log('   Proxy URL:', proxyUrl);
    
    const req = http.get(proxyUrl, (res) => {
      console.log('   Status:', res.statusCode);
      console.log('   Content-Type:', res.headers['content-type']);
      console.log('   CORS Headers:');
      console.log('     Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
      console.log('     Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
      
      if (res.statusCode === 200) {
        console.log('✅ Image proxy test PASSED');
        resolve(true);
      } else {
        console.log('❌ Image proxy test FAILED');
        reject(new Error(`HTTP ${res.statusCode}`));
      }
      
      res.on('data', () => {}); // Consume response body
      res.on('end', () => {});
    });
    
    req.on('error', (error) => {
      console.log('❌ Image proxy test FAILED:', error.message);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Image proxy test TIMEOUT');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

// Test the API proxy endpoint
const testApiProxy = () => {
  return new Promise((resolve, reject) => {
    console.log('\n🔗 Testing API proxy endpoint...');
    
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/content',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      console.log('   Status:', res.statusCode);
      console.log('   CORS Headers:');
      console.log('     Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
      console.log('     Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
      
      if (res.statusCode === 200 || res.statusCode === 400) { // 400 is expected for missing data
        console.log('✅ API proxy test PASSED');
        resolve(true);
      } else {
        console.log('❌ API proxy test FAILED');
        reject(new Error(`HTTP ${res.statusCode}`));
      }
      
      res.on('data', () => {}); // Consume response body
      res.on('end', () => {});
    });
    
    req.on('error', (error) => {
      console.log('❌ API proxy test FAILED:', error.message);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ API proxy test TIMEOUT');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.write(JSON.stringify({ data: {} }));
    req.end();
  });
};

// Run tests
async function runTests() {
  try {
    await testImageProxy();
    await testApiProxy();
    
    console.log('\n🎉 All CORS proxy tests PASSED!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your dashboard: cd web-clients/dashboard && npm start');
    console.log('2. Start your TV player: cd web-clients/tv-player && npm start');
    console.log('3. Verify images load without CORS errors');
    
  } catch (error) {
    console.log('\n❌ CORS proxy tests FAILED:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the proxy server is running: node local-test-proxy.js');
    console.log('2. Check that port 3001 is not blocked by firewall');
    console.log('3. Verify the proxy server logs for any errors');
    process.exit(1);
  }
}

// Check if proxy server is running first
const checkProxyServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001', (res) => {
      console.log('✅ Proxy server is running on port 3001');
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.log('❌ Proxy server is not running on port 3001');
      console.log('   Please start it first: node local-test-proxy.js');
      reject(error);
    });
    
    req.setTimeout(2000, () => {
      console.log('❌ Proxy server connection timeout');
      req.destroy();
      reject(new Error('Connection timeout'));
    });
  });
};

// Start testing
checkProxyServer()
  .then(() => runTests())
  .catch(() => process.exit(1));
