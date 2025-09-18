const catalyst = require('zcatalyst-sdk-node');

// Test script to check if events and screens functions work
async function testFunctions() {
    console.log('🧪 Testing Events and Screens Functions...');
    
    try {
        // Test events function
        console.log('\n📅 Testing Events Function:');
        const eventsFunction = require('./functions/events/index.js');
        
        // Mock request and response objects
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
        
        const mockRes = {
            setHeader: () => {},
            statusCode: 200,
            end: (data) => {
                console.log('✅ Events function response:', JSON.parse(data));
            }
        };
        
        await eventsFunction(mockReq, mockRes);
        
    } catch (error) {
        console.error('❌ Events function error:', error.message);
    }
    
    try {
        // Test screens function
        console.log('\n📺 Testing Screens Function:');
        const screensFunction = require('./functions/screens/index.js');
        
        // Mock request and response objects
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
        
        const mockRes = {
            setHeader: () => {},
            statusCode: 200,
            end: (data) => {
                console.log('✅ Screens function response:', JSON.parse(data));
            }
        };
        
        await screensFunction(mockReq, mockRes);
        
    } catch (error) {
        console.error('❌ Screens function error:', error.message);
    }
}

testFunctions().catch(console.error);
