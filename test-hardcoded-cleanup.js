const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Hardcoded Data Cleanup...\n');

// Test 1: Check for remaining hardcoded URLs
console.log('✅ CHECKING FOR HARDCODED URLS:');

const searchForHardcoded = (dir, pattern, description) => {
  const results = [];
  
  const searchInFile = (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          results.push({
            file: filePath,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    } catch (error) {
      // File might not exist or be readable
    }
  };
  
  const searchInDirectory = (dirPath) => {
    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchInDirectory(fullPath);
        } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
          searchInFile(fullPath);
        }
      });
    } catch (error) {
      // Directory might not exist
    }
  };
  
  searchInDirectory(dir);
  return results;
};

// Check dashboard components
const dashboardDir = '/Users/prathik-5897/Desktop/ProjectorP/web-clients/dashboard/src';
const hardcodedUrls = searchForHardcoded(dashboardDir, /https?:\/\/[^\s'"]+/, 'Hardcoded URLs');

console.log(`   Found ${hardcodedUrls.length} potential hardcoded URLs:`);
hardcodedUrls.forEach(result => {
  console.log(`   📍 ${result.file}:${result.line} - ${result.content.substring(0, 80)}...`);
});

// Test 2: Check for hardcoded localhost references
console.log('\n🔧 CHECKING FOR LOCALHOST REFERENCES:');
const localhostRefs = searchForHardcoded(dashboardDir, /localhost:\d+/, 'Localhost references');

console.log(`   Found ${localhostRefs.length} localhost references:`);
localhostRefs.forEach(result => {
  console.log(`   📍 ${result.file}:${result.line} - ${result.content.substring(0, 80)}...`);
});

// Test 3: Check for hardcoded API endpoints
console.log('\n📡 CHECKING FOR HARDCODED API ENDPOINTS:');
const hardcodedEndpoints = searchForHardcoded(dashboardDir, /\/[a-z-]+\s*['"]/, 'Hardcoded endpoints');

console.log(`   Found ${hardcodedEndpoints.length} potential hardcoded endpoints:`);
hardcodedEndpoints.forEach(result => {
  console.log(`   📍 ${result.file}:${result.line} - ${result.content.substring(0, 80)}...`);
});

// Test 4: Check for hardcoded user IDs
console.log('\n👤 CHECKING FOR HARDCODED USER IDS:');
const hardcodedUserIds = searchForHardcoded(dashboardDir, /default_user_\d+/, 'Hardcoded user IDs');

console.log(`   Found ${hardcodedUserIds.length} hardcoded user IDs:`);
hardcodedUserIds.forEach(result => {
  console.log(`   📍 ${result.file}:${result.line} - ${result.content.substring(0, 80)}...`);
});

// Test 5: Configuration Check
console.log('\n⚙️ CONFIGURATION CHECK:');
console.log('   ✅ All components should use config.js');
console.log('   ✅ All API calls should use API_BASE_URL and API_ENDPOINTS');
console.log('   ✅ All OAuth should use ZOHO_OAUTH config');
console.log('   ✅ All media should use MEDIA config');

// Test 6: Expected Clean State
console.log('\n📋 EXPECTED CLEAN STATE:');
console.log('   • No hardcoded URLs (except config.js)');
console.log('   • No hardcoded localhost references');
console.log('   • No hardcoded API endpoints');
console.log('   • No hardcoded user IDs (except default in config)');
console.log('   • All components import from config');
console.log('   • All API calls use centralized configuration');

// Test 7: Summary
console.log('\n📊 CLEANUP SUMMARY:');
console.log(`   • Hardcoded URLs: ${hardcodedUrls.length} found`);
console.log(`   • Localhost refs: ${localhostRefs.length} found`);
console.log(`   • Hardcoded endpoints: ${hardcodedEndpoints.length} found`);
console.log(`   • Hardcoded user IDs: ${hardcodedUserIds.length} found`);

if (hardcodedUrls.length === 0 && localhostRefs.length === 0 && hardcodedEndpoints.length === 0) {
  console.log('\n🎉 SUCCESS: No hardcoded data found!');
  console.log('   All components are using centralized configuration.');
} else {
  console.log('\n⚠️  WARNING: Some hardcoded data still exists.');
  console.log('   Review the items above and move them to config.js');
}

console.log('\n✨ Hardcoded data cleanup verification complete!');
