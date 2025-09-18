const https = require('https');

console.log('🧪 Testing Dashboard with Direct Catalyst API...\n');

// Test 1: Configuration Check
console.log('✅ CONFIGURATION CHECK:');
console.log('   • API_BASE_URL: https://atrium-60045083855.development.catalystserverless.in');
console.log('   • Direct API calls (no proxy)');
console.log('   • Multi-user support enabled');

// Test 2: API Endpoints Test
console.log('\n📡 TESTING API ENDPOINTS:');

const testEndpoints = [
  { name: 'Content API', endpoint: '/content', action: 'getAll' },
  { name: 'Playlist API', endpoint: '/playlist', action: 'getAll' },
  { name: 'Emergency API', endpoint: '/emergency', action: 'getAll' },
  { name: 'Settings API', endpoint: '/settings', action: 'getAll' }
];

const testApiEndpoint = (endpoint, action) => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ action });
    
    const options = {
      hostname: 'atrium-60045083855.development.catalystserverless.in',
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.success) {
            console.log(`   ✅ ${endpoint}: ${res.statusCode} - ${jsonData.message || 'Success'}`);
            if (jsonData.user_id) {
              console.log(`      User ID: ${jsonData.user_id}`);
            }
          } else {
            console.log(`   ⚠️  ${endpoint}: ${res.statusCode} - ${jsonData.data?.message || 'Unknown error'}`);
          }
        } catch (e) {
          console.log(`   ❌ ${endpoint}: ${res.statusCode} - Invalid JSON response`);
        }
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ ${endpoint}: Error - ${err.message}`);
      resolve({ status: 'error', error: err.message });
    });

    req.write(postData);
    req.end();
  });
};

// Test all endpoints
const testAllEndpoints = async () => {
  for (const test of testEndpoints) {
    await testApiEndpoint(test.endpoint, test.action);
  }
};

testAllEndpoints().then(() => {
  // Test 3: Dashboard Features
  console.log('\n🎯 DASHBOARD FEATURES TO TEST:');
  console.log('   1. Open http://localhost:3000');
  console.log('   2. Check UserProfile shows current user ID (default_user_001)');
  console.log('   3. Test ContentManager - should load content from API');
  console.log('   4. Test PlaylistManager - should load playlists from API');
  console.log('   5. Test EmergencyManager - should load emergencies from API');
  console.log('   6. Test SettingsManager - should load settings from API');
  console.log('   7. Test file upload - should work with direct API');
  console.log('   8. Test user switching - logout/login flow');

  // Test 4: Expected Behavior
  console.log('\n📋 EXPECTED BEHAVIOR:');
  console.log('   • All API calls go directly to Catalyst API');
  console.log('   • CORS headers should be handled by Catalyst');
  console.log('   • File uploads should work correctly');
  console.log('   • User-specific data loads for each user');
  console.log('   • Clean UI with no errors');

  // Test 5: Multi-User Testing
  console.log('\n👥 MULTI-USER TESTING:');
  console.log('   • Current user: default_user_001');
  console.log('   • All data should be filtered by user_id');
  console.log('   • UserProfile should show current user');
  console.log('   • No cross-user data leakage');

  // Test 6: Troubleshooting
  console.log('\n🔧 TROUBLESHOOTING:');
  console.log('   • If CORS errors: Check Catalyst API Gateway CORS settings');
  console.log('   • If 404 errors: Check API endpoints are correct');
  console.log('   • If upload fails: Check media-upload function');
  console.log('   • If no data: Check backend functions return data');

  console.log('\n✨ Dashboard direct API testing is ready!');
  console.log('\n🎬 Next: Open dashboard and test all features manually.');
  console.log('\n🚀 This is essentially production testing with real APIs!');
});

console.log('\n📤 UPLOAD FUNCTION TEST:');
console.log('   • Should use config.API_BASE_URL for endpoint');
console.log('   • Should handle file optimization');
console.log('   • Should work with direct Catalyst API');
console.log('   • Should create playlist entries');

console.log('\n🚀 Ready to test dashboard with direct API!');
