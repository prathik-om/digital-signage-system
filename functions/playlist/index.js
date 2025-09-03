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
                    case 'getAll':
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify({
                            success: true,
                            playlists: [
                                {
                                    ROWID: 1,
                                    name: 'Default Playlist',
                                    description: 'Main content playlist',
                                    items: JSON.stringify([]),
                                    is_active: true,
                                    created_at: new Date().toISOString()
                                }
                            ],
                            message: 'Playlists retrieved successfully'
                        }));
                        break;

                    case 'create':
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Playlist created successfully',
                            playlistId: Date.now()
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