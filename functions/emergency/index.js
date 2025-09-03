const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin',
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    try {
        // Parse request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const inputData = JSON.parse(body || '{}');
                const { action } = inputData;

                // Initialize Catalyst
                const app = catalyst.initialize(req);

                switch (action) {
                    case 'getActive':
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify({
                            success: true,
                            emergencies: [
                                {
                                    id: 1,
                                    title: 'System Test',
                                    message: 'This is a test emergency message',
                                    importance: 'medium',
                                    background_color: '#FFA500',
                                    text_color: '#000000',
                                    is_active: true,
                                    created_at: new Date().toISOString()
                                }
                            ],
                            message: 'Emergency messages retrieved'
                        }));
                        break;

                    case 'create':
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Emergency message created',
                            emergencyId: Date.now()
                        }));
                        break;

                    case 'clear':
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Emergency messages cleared'
                        }));
                        break;

                    default:
                        res.writeHead(400, corsHeaders);
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Invalid action'
                        }));
                }
            } catch (parseError) {
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid JSON format'
                }));
            }
        });

    } catch (error) {
        res.writeHead(500, corsHeaders);
        res.end(JSON.stringify({
            success: false,
            message: 'Server error',
            error: error.message
        }));
    }
};