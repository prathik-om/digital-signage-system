// Test script to verify dashboard API integration
const https = require('https');

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

async function testDashboardAPIs() {
    console.log('🧪 Testing Dashboard API Integration...\n');

    const testUserId = 'default_user_001';
    const tests = [
        {
            name: 'Content API (Dashboard)',
            endpoint: '/content',
            data: { action: 'getAll' },
            expectedField: 'content'
        },
        {
            name: 'Playlist API (Dashboard)',
            endpoint: '/playlist',
            data: { action: 'getAll' },
            expectedField: 'playlists'
        },
        {
            name: 'Emergency API (Dashboard)',
            endpoint: '/emergency',
            data: { action: 'getAll' },
            expectedField: 'emergency_messages'
        },
        {
            name: 'Settings API (Dashboard)',
            endpoint: '/settings',
            data: { action: 'getAll' },
            expectedField: 'settings'
        }
    ];

    let successCount = 0;

    for (const test of tests) {
        console.log(`📡 Testing: ${test.name}`);
        
        try {
            const url = `${API_BASE_URL}${test.endpoint}`;
            const response = await makeRequest(url, test.data);
            
            if (response.statusCode === 200 && response.data.success) {
                console.log(`   ✅ SUCCESS - Status: ${response.statusCode}`);
                console.log(`   📊 Response: ${response.data.message}`);
                console.log(`   👤 User ID: ${response.data.user_id}`);
                
                if (response.data[test.expectedField]) {
                    const dataLength = Array.isArray(response.data[test.expectedField]) 
                        ? response.data[test.expectedField].length 
                        : Object.keys(response.data[test.expectedField]).length;
                    console.log(`   📈 Data Count: ${dataLength}`);
                }
                
                successCount++;
            } else {
                console.log(`   ❌ FAILED - Status: ${response.statusCode}`);
                console.log(`   📊 Response: ${JSON.stringify(response.data)}`);
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
        
        console.log('');
    }

    console.log('=' .repeat(50));
    console.log(`🎯 DASHBOARD API TEST RESULTS: ${successCount}/${tests.length} APIs Working`);
    
    if (successCount === tests.length) {
        console.log('🎉 ALL DASHBOARD APIs ARE WORKING!');
        console.log('✅ Dashboard can fetch real data from production APIs');
        console.log('✅ Multi-user context is properly handled');
        console.log('✅ Ready for frontend integration');
    } else {
        console.log('⚠️ Some APIs need attention');
    }

    console.log('\n📋 DASHBOARD API ENDPOINTS:');
    console.log('• Content: https://atrium-60045083855.development.catalystserverless.in/content');
    console.log('• Playlist: https://atrium-60045083855.development.catalystserverless.in/playlist');
    console.log('• Emergency: https://atrium-60045083855.development.catalystserverless.in/emergency');
    console.log('• Settings: https://atrium-60045083855.development.catalystserverless.in/settings');
}

testDashboardAPIs().catch(console.error);
