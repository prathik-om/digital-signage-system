#!/usr/bin/env node

/**
 * Production API Testing Script
 * Tests both development and production APIs to identify CORS and other issues
 */

const https = require('https');
const http = require('http');

console.log('🧪 Production API Testing Suite\n');

// Configuration
const environments = {
  development: {
    name: 'Development',
    baseUrl: 'https://atrium-60045083855.development.catalystserverless.in',
    color: '🛠️'
  },
  production: {
    name: 'Production', 
    baseUrl: 'https://atrium-60045083855.production.catalystserverless.in',
    color: '🏭'
  }
};

const endpoints = [
  { name: 'Content', path: '/content' },
  { name: 'Playlist', path: '/playlist' },
  { name: 'Emergency', path: '/emergency' },
  { name: 'Auth', path: '/auth' },
  { name: 'Zoho Integration', path: '/zoho-integration' }
];

// Test results storage
const results = {
  development: {},
  production: {}
};

// Helper function to make HTTP requests
const makeRequest = (url, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Digital-Signage-Test-Suite/1.0.0'
      },
      timeout: 10000
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData,
          url: url
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Test a single endpoint
const testEndpoint = async (environment, endpoint) => {
  const env = environments[environment];
  const url = `${env.baseUrl}${endpoint.path}`;
  
  try {
    console.log(`  ${env.color} Testing ${endpoint.name}...`);
    
    // Test OPTIONS (CORS preflight)
    try {
      const optionsResponse = await makeRequest(url, 'OPTIONS');
      const corsHeaders = {
        'Access-Control-Allow-Origin': optionsResponse.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': optionsResponse.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': optionsResponse.headers['access-control-allow-headers']
      };
      
      console.log(`    ✅ OPTIONS: ${optionsResponse.statusCode}`);
      console.log(`    📋 CORS Headers:`, corsHeaders);
      
      results[environment][endpoint.name] = {
        status: 'success',
        options: optionsResponse.statusCode,
        cors: corsHeaders,
        error: null
      };
    } catch (optionsError) {
      console.log(`    ❌ OPTIONS failed: ${optionsError.message}`);
      results[environment][endpoint.name] = {
        status: 'failed',
        options: null,
        cors: null,
        error: optionsError.message
      };
    }
    
    // Test POST (actual API call)
    try {
      const postResponse = await makeRequest(url, 'POST', { data: {} });
      console.log(`    ✅ POST: ${postResponse.statusCode}`);
      
      if (results[environment][endpoint.name]) {
        results[environment][endpoint.name].post = postResponse.statusCode;
      }
    } catch (postError) {
      console.log(`    ⚠️ POST failed: ${postError.message} (expected for some endpoints)`);
    }
    
  } catch (error) {
    console.log(`    ❌ ${endpoint.name} failed: ${error.message}`);
    results[environment][endpoint.name] = {
      status: 'failed',
      error: error.message
    };
  }
};

// Test image loading (CORS test)
const testImageLoading = async (environment) => {
  const env = environments[environment];
  const testImageUrl = 'https://atrium-media-development.zohostratus.in/image%20%281%29.jpg';
  
  try {
    console.log(`  ${env.color} Testing image loading...`);
    
    // Test direct image access
    const response = await makeRequest(testImageUrl, 'GET');
    
    if (response.statusCode === 200) {
      console.log(`    ✅ Image accessible: ${response.statusCode}`);
      console.log(`    📋 Content-Type: ${response.headers['content-type']}`);
      
      if (!results[environment].ImageLoading) {
        results[environment].ImageLoading = {};
      }
      results[environment].ImageLoading.direct = 'success';
    } else {
      console.log(`    ❌ Image not accessible: ${response.statusCode}`);
      if (!results[environment].ImageLoading) {
        results[environment].ImageLoading = {};
      }
      results[environment].ImageLoading.direct = 'failed';
    }
    
  } catch (error) {
    console.log(`    ❌ Image loading failed: ${error.message}`);
    if (!results[environment].ImageLoading) {
      results[environment].ImageLoading = {};
    }
    results[environment].ImageLoading.direct = 'failed';
    results[environment].ImageLoading.error = error.message;
  }
};

// Run tests for an environment
const testEnvironment = async (environment) => {
  const env = environments[environment];
  console.log(`\n${env.color} Testing ${env.name} Environment`);
  console.log(`📍 Base URL: ${env.baseUrl}`);
  console.log('=' * 50);
  
  // Test all endpoints
  for (const endpoint of endpoints) {
    await testEndpoint(environment, endpoint);
  }
  
  // Test image loading
  await testImageLoading(environment);
};

// Generate test report
const generateReport = () => {
  console.log('\n📊 TEST REPORT');
  console.log('=' * 60);
  
  Object.keys(results).forEach(environment => {
    const env = environments[environment];
    console.log(`\n${env.color} ${env.name} Environment Results:`);
    
    Object.keys(results[environment]).forEach(test => {
      const result = results[environment][test];
      if (result.status === 'success') {
        console.log(`  ✅ ${test}: PASSED`);
        if (result.cors) {
          console.log(`     CORS: ${result.cors['Access-Control-Allow-Origin'] || 'Not set'}`);
        }
      } else if (result.status === 'failed') {
        console.log(`  ❌ ${test}: FAILED - ${result.error}`);
      } else {
        console.log(`  ⚠️ ${test}: PARTIAL - ${result.error || 'Some issues detected'}`);
      }
    });
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. If CORS errors occur, ensure your backend functions include proper CORS headers');
  console.log('2. For production deployment, test with actual domain URLs');
  console.log('3. Consider using a CDN for image optimization in production');
  console.log('4. Monitor API response times and implement proper error handling');
};

// Main execution
async function runTests() {
  try {
    // Test development environment
    await testEnvironment('development');
    
    // Test production environment
    await testEnvironment('production');
    
    // Generate report
    generateReport();
    
    console.log('\n🎉 Production API testing completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Review any failed tests above');
    console.log('2. Fix CORS issues in your backend functions');
    console.log('3. Deploy to production and test with real domains');
    console.log('4. Set up monitoring and error tracking');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
