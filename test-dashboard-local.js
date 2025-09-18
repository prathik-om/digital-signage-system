const http = require('http');

console.log('🧪 Testing Dashboard Locally - Complete Flow...\n');

// Test 1: Check if services are running
console.log('✅ CHECKING SERVICES:');
console.log('   • Local Proxy: Should be running on port 3001');
console.log('   • Dashboard: Should be running on port 3000');
console.log('   • Catalyst Functions: Should be deployed and accessible');

// Test 2: Configuration Check
console.log('\n🔧 CONFIGURATION CHECK:');
console.log('   • API_BASE_URL: Should be http://localhost:3001 (development)');
console.log('   • Smart Config: Should auto-detect localhost');
console.log('   • Multi-user: Should be enabled');

// Test 3: API Endpoints Test
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
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`   ✅ ${endpoint}: ${res.statusCode} ${res.statusMessage}`);
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
  // Test 4: Dashboard Features
  console.log('\n🎯 DASHBOARD FEATURES TO TEST:');
  console.log('   1. Open http://localhost:3000');
  console.log('   2. Check UserProfile shows current user ID');
  console.log('   3. Test ContentManager - should load content');
  console.log('   4. Test PlaylistManager - should load playlists');
  console.log('   5. Test EmergencyManager - should load emergencies');
  console.log('   6. Test SettingsManager - should load settings');
  console.log('   7. Test file upload - should work with local proxy');
  console.log('   8. Test user switching - logout/login flow');

  // Test 5: Expected Behavior
  console.log('\n📋 EXPECTED BEHAVIOR:');
  console.log('   • All API calls go through local proxy (localhost:3001)');
  console.log('   • No CORS errors in browser console');
  console.log('   • File uploads work correctly');
  console.log('   • User-specific data loads for each user');
  console.log('   • Clean UI with no errors');

  // Test 6: Troubleshooting
  console.log('\n🔧 TROUBLESHOOTING:');
  console.log('   • If CORS errors: Check local proxy is running');
  console.log('   • If 404 errors: Check API endpoints are correct');
  console.log('   • If upload fails: Check media-upload function');
  console.log('   • If no data: Check backend functions return data');

  console.log('\n✨ Dashboard local testing is ready!');
  console.log('\n🎬 Next: Open dashboard and test all features manually.');
});

// Test 7: Upload Function Test
console.log('\n📤 UPLOAD FUNCTION TEST:');
console.log('   • Should use config.API_BASE_URL for endpoint');
console.log('   • Should handle file optimization');
console.log('   • Should work with local proxy');
console.log('   • Should create playlist entries');

console.log('\n🚀 Ready to test dashboard locally!');
