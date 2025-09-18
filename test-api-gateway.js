const https = require('https');

// Test API Gateway configuration
const API_BASE_URL = 'https://atrium-60045083855.development.catalystserverless.in';

// Function to make HTTP requests
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
                        headers: res.headers,
                        data: parsedData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
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

// Test functions
async function testAPIGateway() {
    console.log('🔍 Testing API Gateway Configuration...\n');

    const functions = [
        { name: 'content', endpoint: '/content' },
        { name: 'playlist', endpoint: '/playlist' },
        { name: 'emergency', endpoint: '/emergency' },
        { name: 'settings', endpoint: '/settings' },
        { name: 'setup_database_multiuser', endpoint: '/setup_database_multiuser' }
    ];

    for (const func of functions) {
        console.log(`📡 Testing ${func.name} function...`);
        
        try {
            const url = `${API_BASE_URL}${func.endpoint}`;
            const testData = { action: 'getAll' };
            
            const response = await makeRequest(url, testData);
            
            console.log(`   Status: ${response.statusCode}`);
            console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
            
            if (response.statusCode === 200) {
                console.log(`   ✅ ${func.name} - API Gateway working!\n`);
            } else {
                console.log(`   ❌ ${func.name} - API Gateway issue (Status: ${response.statusCode})\n`);
            }
            
        } catch (error) {
            console.log(`   ❌ ${func.name} - Error: ${error.message}\n`);
        }
    }
}

// Run the test
testAPIGateway().catch(console.error);
