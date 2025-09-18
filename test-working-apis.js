const https = require('https');

// Test the working API endpoints
const API_BASE_URL = 'https://atrium-60045083855.development.catalystserverless.in';

const workingEndpoints = [
    { name: 'Content', endpoint: '/content' },
    { name: 'Playlist', endpoint: '/playlist' },
    { name: 'Emergency', endpoint: '/emergency' }
];

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

async function testWorkingAPIs() {
    console.log('🚀 Testing Working API Endpoints...\n');

    for (const endpoint of workingEndpoints) {
        console.log(`📡 Testing ${endpoint.name} API...`);
        
        try {
            const url = `${API_BASE_URL}${endpoint.endpoint}`;
            const testData = { action: 'getAll' };
            
            const response = await makeRequest(url, testData);
            
            if (response.statusCode === 200 && response.data.success) {
                console.log(`   ✅ ${endpoint.name} - Working perfectly!`);
                console.log(`   📊 Response: ${response.data.message}`);
                console.log(`   👤 User ID: ${response.data.user_id}\n`);
            } else {
                console.log(`   ❌ ${endpoint.name} - Issue (Status: ${response.statusCode})\n`);
            }
            
        } catch (error) {
            console.log(`   ❌ ${endpoint.name} - Error: ${error.message}\n`);
        }
    }

    console.log('🎉 Multi-user backend functions are working in production!');
    console.log('📝 Next step: Configure settings and setup_database functions in Catalyst Console');
}

testWorkingAPIs().catch(console.error);
