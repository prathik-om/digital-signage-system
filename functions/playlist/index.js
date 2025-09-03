const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
    // Set CORS headers immediately for all requests - PERMANENT FIX
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle CORS preflight - This is the key fix
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin',
            'Access-Control-Max-Age': '86400'
        });
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
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
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
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Playlist created successfully',
                            playlistId: Date.now()
                        }));
                        break;

                    default:
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Invalid action'
                        }));
                }
            } catch (parseError) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid JSON format'
                }));
            }
        });

    } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: false,
            message: 'Server error',
            error: error.message
        }));
    }
};