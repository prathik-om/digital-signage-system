const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
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

                // Helper function to extract user ID from request
                const extractUserId = (inputData) => {
                    try {
                        // Check for user_id in request body (primary method)
                        if (inputData && inputData.user_id) {
                            return inputData.user_id;
                        }
                        
                        // Check for TV player headers
                        const tvPlayerUserId = req.headers['x-tv-player-user-id'];
                        if (tvPlayerUserId) {
                            return tvPlayerUserId;
                        }
                        
                        throw new Error('No user_id provided in request');
                    } catch (error) {
                        console.error('Error extracting user ID:', error);
                        throw error;
                    }
                };

                // Initialize Catalyst
                const app = catalyst.initialize(req);

                switch (action) {
                    case 'sync':
                        try {
                            res.writeHead(200, corsHeaders);
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Zoho integration sync completed',
                                timestamp: new Date().toISOString()
                            }));
                        } catch (error) {
                            res.writeHead(400, corsHeaders);
                            res.end(JSON.stringify({
                                success: false,
                                message: error.message
                            }));
                        }
                        break;

                    case 'webhook':
                        try {
                            res.writeHead(200, corsHeaders);
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Webhook processed successfully'
                            }));
                        } catch (error) {
                            res.writeHead(400, corsHeaders);
                            res.end(JSON.stringify({
                                success: false,
                                message: error.message
                            }));
                        }
                        break;

                    case 'cliq':
                        try {
                            res.writeHead(200, corsHeaders);
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Cliq message processed'
                            }));
                        } catch (error) {
                            res.writeHead(400, corsHeaders);
                            res.end(JSON.stringify({
                                success: false,
                                message: error.message
                            }));
                        }
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