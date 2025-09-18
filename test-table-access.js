const catalyst = require('zcatalyst-sdk-node');

// Test script to check table access
async function testTableAccess() {
    console.log('🧪 Testing Table Access...');
    
    try {
        // Mock request object
        const mockReq = {
            method: 'POST',
            headers: {},
            on: (event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(JSON.stringify({ action: 'getAll' })));
                } else if (event === 'end') {
                    callback();
                }
            }
        };
        
        // Mock response object
        const mockRes = {
            setHeader: () => {},
            statusCode: 200,
            end: (data) => {
                console.log('✅ Response:', JSON.parse(data));
            }
        };
        
        // Test events function
        console.log('\n📅 Testing Events Function:');
        const eventsFunction = require('./functions/events/index.js');
        await eventsFunction(mockReq, mockRes);
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testTableAccess().catch(console.error);
