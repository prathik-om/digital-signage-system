#!/usr/bin/env node

/**
 * Simple test to verify your APIs work with real requests
 */

const https = require('https');

console.log('🧪 Simple Real API Test\n');

// Test with actual data
const testContentAPI = async () => {
  const url = 'https://atrium-60045083855.development.catalystserverless.in/content';
  
  try {
    console.log('📡 Testing Content API with real data...');
    
    const postData = JSON.stringify({
      action: 'get_all_content'
    });
    
    const options = {
      hostname: 'atrium-60045083855.development.catalystserverless.in',
      path: '/content',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`📋 CORS Headers:`);
    console.log(`   Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin'] || 'Not set'}`);
    console.log(`   Access-Control-Allow-Methods: ${response.headers['access-control-allow-methods'] || 'Not set'}`);
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.data);
      console.log(`📊 Response: ${result.message || 'Success'}`);
      if (result.data && Array.isArray(result.data)) {
        console.log(`📁 Found ${result.data.length} content items`);
      }
    } else {
      console.log(`⚠️ Response: ${response.data.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
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
    
  } catch (error) {
    console.log(`❌ Image Error: ${error.message}`);
  }
};

// Run tests
async function runTests() {
  await testContentAPI();
  await testImageLoading();
  
  console.log('\n🎉 Test completed!');
  console.log('\n💡 If both tests passed, your APIs are ready for production!');
  console.log('📋 Next steps:');
  console.log('1. Deploy your dashboard to Vercel');
  console.log('2. Deploy your TV player to Vercel');
  console.log('3. Test with real domains');
  console.log('4. Set up monitoring');
}

runTests().catch(console.error);
