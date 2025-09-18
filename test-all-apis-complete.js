const https = require('https');

// Complete API Gateway test
const API_BASE_URL = 'https://atrium-60045083855.development.catalystserverless.in';

function makeRequest(url, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(url, options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: parsedData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function testAllAPIs() {
    console.log('🚀 COMPLETE API GATEWAY TEST - Multi-User Backend System\n');
    console.log('=' .repeat(60));

    // Test all endpoints
    const tests = [
        {
            name: 'Content Management',
            endpoint: '/content',
            action: 'getAll',
            description: 'Retrieve user-specific content'
        },
        {
            name: 'Playlist Management',
            endpoint: '/playlist',
            action: 'getAll',
            description: 'Retrieve user-specific playlists'
        },
        {
            name: 'Emergency Messages',
            endpoint: '/emergency',
            action: 'getAll',
            description: 'Retrieve user-specific emergency messages'
        },
        {
            name: 'Settings Management',
            endpoint: '/settings',
            action: 'getAll',
            description: 'Retrieve user-specific settings'
        },
        {
            name: 'Database Schema Validation',
            endpoint: '/setup_database_multiuser',
            action: 'validateSchema',
            description: 'Validate multi-user database schema'
        },
        {
            name: 'User Creation',
            endpoint: '/setup_database_multiuser',
            action: 'createDefaultUser',
            data: {
                user_id: 'api_test_user_001',
                email: 'apitest@projector.com',
                name: 'API Test User'
            },
            description: 'Create a new user in the system'
        }
    ];

    let successCount = 0;
    let totalTests = tests.length;

    for (const test of tests) {
        console.log(`\n📡 Testing: ${test.name}`);
        console.log(`   Description: ${test.description}`);
        
        try {
            const url = `${API_BASE_URL}${test.endpoint}`;
            const testData = test.data || { action: test.action };
            
            const response = await makeRequest(url, testData);
            
            if (response.statusCode === 200 && response.data.success) {
                console.log(`   ✅ SUCCESS - Status: ${response.statusCode}`);
                console.log(`   📊 Response: ${response.data.message}`);
                
                if (response.data.user_id) {
                    console.log(`   👤 User ID: ${response.data.user_id}`);
                }
                
                if (test.name === 'Database Schema Validation') {
                    console.log(`   🗄️ Tables Validated: ${response.data.total_tables}`);
                }
                
                successCount++;
            } else {
                console.log(`   ❌ FAILED - Status: ${response.statusCode}`);
                console.log(`   📊 Response: ${JSON.stringify(response.data)}`);
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
    }

    console.log('\n' + '=' .repeat(60));
    console.log(`🎯 TEST RESULTS: ${successCount}/${totalTests} APIs Working`);
    
    if (successCount === totalTests) {
        console.log('🎉 ALL APIs ARE WORKING PERFECTLY!');
        console.log('✅ Multi-user backend system is fully operational');
        console.log('✅ API Gateway configuration is complete');
        console.log('✅ Ready for Phase 3: Frontend Dashboard Update');
    } else {
        console.log('⚠️ Some APIs need attention');
    }

    console.log('\n📋 WORKING API ENDPOINTS:');
    console.log('• Content: https://atrium-60045083855.development.catalystserverless.in/content');
    console.log('• Playlist: https://atrium-60045083855.development.catalystserverless.in/playlist');
    console.log('• Emergency: https://atrium-60045083855.development.catalystserverless.in/emergency');
    console.log('• Settings: https://atrium-60045083855.development.catalystserverless.in/settings');
    console.log('• Database: https://atrium-60045083855.development.catalystserverless.in/setup_database_multiuser');
}

testAllAPIs().catch(console.error);
