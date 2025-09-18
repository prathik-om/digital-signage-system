#!/usr/bin/env node

/**
 * Test script to verify user data segregation
 * This script tests the complete user authentication and data mapping flow
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

// Test user data segregation
async function testUserSegregation() {
  console.log('🔍 Testing User Data Segregation...\n');
  
  try {
    // Step 1: Check users table
    console.log('📋 Step 1: Checking users table...');
    const usersResponse = await makeRequest(`${API_BASE_URL}/test-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'testDatabase'
      })
    });
    
    console.log('Users table response:', usersResponse);
    
    // Step 2: Check content table for user_id segregation
    console.log('\n📋 Step 2: Checking content table...');
    const contentResponse = await makeRequest(`${API_BASE_URL}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'getAll'
      })
    });
    
    console.log('Content table response:', contentResponse);
    
    // Step 3: Check playlist table for user_id segregation
    console.log('\n📋 Step 3: Checking playlist table...');
    const playlistResponse = await makeRequest(`${API_BASE_URL}/playlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'getAll'
      })
    });
    
    console.log('Playlist table response:', playlistResponse);
    
    // Step 4: Check media-upload table for user_id segregation
    console.log('\n📋 Step 4: Checking media-upload table...');
    const mediaResponse = await makeRequest(`${API_BASE_URL}/media-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'listMedia'
      })
    });
    
    console.log('Media-upload table response:', mediaResponse);
    
    // Analysis
    console.log('\n🔍 Analysis:');
    console.log('=====================================');
    
    if (usersResponse.data && usersResponse.data.success) {
      console.log('✅ Users table accessible');
      if (usersResponse.data.users) {
        console.log(`📊 Found ${usersResponse.data.users.length} users`);
        const testUser = usersResponse.data.users.find(u => u.email === TEST_EMAIL);
        if (testUser) {
          console.log(`✅ Found test user: ${testUser.email} with ID: ${testUser.ROWID}`);
        } else {
          console.log(`❌ Test user ${TEST_EMAIL} not found in users table`);
        }
      }
    } else {
      console.log('❌ Users table not accessible');
    }
    
    if (contentResponse.data && contentResponse.data.success) {
      console.log('✅ Content table accessible');
      if (contentResponse.data.content) {
        console.log(`📊 Found ${contentResponse.data.content.length} content items`);
        const userContent = contentResponse.data.content.filter(c => c.user_id);
        console.log(`📊 ${userContent.length} items have user_id`);
        const uniqueUserIds = [...new Set(userContent.map(c => c.user_id))];
        console.log(`📊 Unique user_ids: ${uniqueUserIds.join(', ')}`);
      }
    } else {
      console.log('❌ Content table not accessible');
    }
    
    if (playlistResponse.data && playlistResponse.data.success) {
      console.log('✅ Playlist table accessible');
      if (playlistResponse.data.playlists) {
        console.log(`📊 Found ${playlistResponse.data.playlists.length} playlists`);
        const userPlaylists = playlistResponse.data.playlists.filter(p => p.user_id);
        console.log(`📊 ${userPlaylists.length} playlists have user_id`);
        const uniqueUserIds = [...new Set(userPlaylists.map(p => p.user_id))];
        console.log(`📊 Unique user_ids: ${uniqueUserIds.join(', ')}`);
      }
    } else {
      console.log('❌ Playlist table not accessible');
    }
    
    if (mediaResponse.data && mediaResponse.data.success) {
      console.log('✅ Media-upload table accessible');
      if (mediaResponse.data.media) {
        console.log(`📊 Found ${mediaResponse.data.media.length} media items`);
        const userMedia = mediaResponse.data.media.filter(m => m.user_id);
        console.log(`📊 ${userMedia.length} media items have user_id`);
        const uniqueUserIds = [...new Set(userMedia.map(m => m.user_id))];
        console.log(`📊 Unique user_ids: ${uniqueUserIds.join(', ')}`);
      }
    } else {
      console.log('❌ Media-upload table not accessible');
    }
    
    console.log('\n🎯 Recommendations:');
    console.log('=====================================');
    console.log('1. If user_id is "default_user_001" everywhere, the fix is working');
    console.log('2. If user_id is missing, check the API functions');
    console.log('3. If user_id is the database ROWID, the system is correctly segregated');
    console.log('4. Test with a fresh login to verify the new user ID mapping');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserSegregation();
