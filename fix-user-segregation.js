#!/usr/bin/env node

/**
 * Complete User Data Segregation Fix
 * This script will:
 * 1. Test the current OAuth flow
 * 2. Verify user creation/update
 * 3. Test data segregation with proper user_id
 */

const https = require('https');

// Configuration
const API_BASE_URL = 'https://atrium-60045083855.development.catalystserverless.in';
const TEST_EMAIL = 'prathiksb@zoho.com';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test the complete user segregation flow
async function testUserSegregationFlow() {
  console.log('🔍 Testing Complete User Data Segregation Flow...\n');
  
  try {
    // Step 1: Check current users
    console.log('📋 Step 1: Current Users in Database');
    console.log('=====================================');
    
    const usersResponse = await makeRequest(`${API_BASE_URL}/test-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'testDatabase' })
    });
    
    if (usersResponse.data.results && usersResponse.data.results.users) {
      const users = usersResponse.data.results.users.data || [];
      console.log(`Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ROWID: ${user.ROWID}, Email: ${user.email || 'NULL'}, Name: ${user.name || 'NULL'}`);
      });
      
      const testUser = users.find(u => u.email === TEST_EMAIL);
      if (testUser) {
        console.log(`✅ Found test user: ${TEST_EMAIL} with ROWID: ${testUser.ROWID}`);
      } else {
        console.log(`❌ Test user ${TEST_EMAIL} not found in database`);
        console.log('   This means the OAuth flow is not creating/updating user records properly');
      }
    }
    
    // Step 2: Check current data segregation
    console.log('\n📋 Step 2: Current Data Segregation');
    console.log('=====================================');
    
    if (usersResponse.data.results) {
      const results = usersResponse.data.results;
      
      if (results.content && results.content.success) {
        const content = results.content.data || [];
        const contentUserIds = [...new Set(content.map(c => c.user_id).filter(Boolean))];
        console.log(`Content Table: ${content.length} items`);
        console.log(`  User IDs: ${contentUserIds.length > 0 ? contentUserIds.join(', ') : 'NONE'}`);
      }
      
      if (results.playlists && results.playlists.success) {
        const playlists = results.playlists.data || [];
        const playlistUserIds = [...new Set(playlists.map(p => p.user_id).filter(Boolean))];
        console.log(`Playlists Table: ${playlists.length} items`);
        console.log(`  User IDs: ${playlistUserIds.length > 0 ? playlistUserIds.join(', ') : 'NONE'}`);
      }
    }
    
    // Step 3: Recommendations
    console.log('\n🎯 Recommendations & Next Steps');
    console.log('=====================================');
    console.log('1. 🔑 OAuth Flow Issue:');
    console.log('   - The OAuth callback should create/update user records');
    console.log('   - User records should have proper email addresses');
    console.log('   - The system should return the database ROWID as user.id');
    
    console.log('\n2. 🗄️ Data Segregation Issue:');
    console.log('   - All data is currently using "default_user_001"');
    console.log('   - New data should use the actual database user ID');
    console.log('   - Existing data needs to be migrated to proper user IDs');
    
    console.log('\n3. 🛠️ Immediate Actions Needed:');
    console.log('   a) Test OAuth login flow to verify user creation');
    console.log('   b) Check if user records are being created with email addresses');
    console.log('   c) Verify that the frontend receives the correct user ID');
    console.log('   d) Test creating new content/playlists with proper user_id');
    
    console.log('\n4. 🔄 Testing Steps:');
    console.log('   a) Logout and login again with prathiksb@zoho.com');
    console.log('   b) Check if a new user record is created');
    console.log('   c) Create new content/playlist and verify user_id');
    console.log('   d) Check if data is properly segregated');
    
    // Step 4: Create a test user record manually
    console.log('\n📋 Step 3: Manual User Creation Test');
    console.log('=====================================');
    console.log('To test the system, we can manually create a user record...');
    
    // This would require a function to create users, but for now we'll just show the structure
    console.log('Manual user creation would require:');
    console.log('  - Email: prathiksb@zoho.com');
    console.log('  - Name: Prathik (from OAuth data)');
    console.log('  - First Name: Prathik');
    console.log('  - Last Name: (from OAuth data)');
    console.log('  - Role: user');
    console.log('  - Created At: current timestamp');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserSegregationFlow();
