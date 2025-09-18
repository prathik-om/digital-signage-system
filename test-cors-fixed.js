#!/usr/bin/env node

/**
 * Test CORS headers after fixes
 */

const https = require('https');

console.log('🧪 Testing Fixed CORS Headers\n');

// Test endpoints with correct actions
const testEndpoints = [
  {
    name: 'Content API',
    path: '/content',
    action: 'getAll'
  },
  {
    name: 'Playlist API', 
    path: '/playlist',
    action: 'getAll'
  },
  {
    name: 'Emergency API',
    path: '/emergency', 
    action: 'getAll'
  },
  {
    name: 'Auth API',
    path: '/auth',
    action: 'getStatus'
  }
];

// Helper function to make requests
const makeRequest = (path, data) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'atrium-60045083855.development.catalystserverless.in',
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Test OPTIONS request (CORS preflight)
const testOptionsRequest = async (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'atrium-60045083855.development.catalystserverless.in',
      path: path,
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };
    
    const req = https.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers
      });
    });
    
    req.on('error', reject);
    req.end();
  });
};

// Test a single endpoint
const testEndpoint = async (endpoint) => {
  console.log(`🔍 Testing ${endpoint.name}...`);
  
  try {
    // Test OPTIONS request first
    const optionsResponse = await testOptionsRequest(endpoint.path);
    console.log(`  ✅ OPTIONS: ${optionsResponse.statusCode}`);
    
    // Check CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': optionsResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': optionsResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': optionsResponse.headers['access-control-allow-headers']
    };
    
    console.log(`  📋 CORS Headers:`);
    console.log(`     Origin: ${corsHeaders['Access-Control-Allow-Origin'] || '❌ Not set'}`);
    console.log(`     Methods: ${corsHeaders['Access-Control-Allow-Methods'] || '❌ Not set'}`);
    console.log(`     Headers: ${corsHeaders['Access-Control-Allow-Headers'] ? '✅ Set' : '❌ Not set'}`);
    
    // Test actual API call
    const apiResponse = await makeRequest(endpoint.path, {
      action: endpoint.action
    });
    
    console.log(`  ✅ POST: ${apiResponse.statusCode}`);
    
    if (apiResponse.statusCode === 200) {
      const result = JSON.parse(apiResponse.data);
      console.log(`  📊 Response: ${result.message || 'Success'}`);
    } else {
      console.log(`  ⚠️ Response: ${apiResponse.data.substring(0, 100)}...`);
    }
    
    return {
      success: true,
      cors: corsHeaders,
      status: apiResponse.statusCode
    };
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test image loading
const testImageLoading = async () => {
  console.log('\n🖼️ Testing image loading...');
  
  const imageUrl = 'https://atrium-media-development.zohostratus.in/image%20%281%29.jpg';
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.get(imageUrl, (res) => {
        resolve({
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          contentLength: res.headers['content-length']
        });
      });
      req.on('error', reject);
    });
    
    console.log(`✅ Image Status: ${response.statusCode}`);
    console.log(`📋 Content-Type: ${response.contentType}`);
    console.log(`📏 Size: ${response.contentLength} bytes`);
    
    return true;
  } catch (error) {
    console.log(`❌ Image Error: ${error.message}`);
    return false;
  }
};

// Main test function
async function runTests() {
  console.log('🚀 Starting CORS tests...\n');
  
  const results = [];
  
  // Test all endpoints
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint: endpoint.name, ...result });
    console.log(''); // Empty line for readability
  }
  
  // Test image loading
  const imageSuccess = await testImageLoading();
  
  // Generate summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' * 50);
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ Successful tests: ${successCount}/${totalCount}`);
  console.log(`🖼️ Image loading: ${imageSuccess ? '✅ Success' : '❌ Failed'}`);
  
  // Check CORS headers
  const corsIssues = results.filter(r => {
    return r.success && (!r.cors['Access-Control-Allow-Origin'] || 
                        !r.cors['Access-Control-Allow-Methods']);
  });
  
  if (corsIssues.length === 0) {
    console.log('🎉 CORS headers are working correctly!');
  } else {
    console.log(`⚠️ CORS issues found in ${corsIssues.length} endpoints`);
  }
  
  console.log('\n💡 Next steps:');
  if (successCount === totalCount && imageSuccess) {
    console.log('1. ✅ Your APIs are ready for production!');
    console.log('2. 🚀 Deploy to Vercel');
    console.log('3. 🌐 Test with real domains');
    console.log('4. 📊 Set up monitoring');
  } else {
    console.log('1. 🔧 Fix any remaining issues');
    console.log('2. 🧪 Re-run tests');
    console.log('3. 🚀 Then deploy to production');
  }
}

runTests().catch(console.error);
