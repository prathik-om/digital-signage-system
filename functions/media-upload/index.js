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
                    case 'listMedia':
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify({
                            success: true,
                            media: [
                                {
                                    ROWID: 1,
                                    file_name: 'sample-image.jpg',
                                    mime_type: 'image/jpeg',
                                    object_url: 'https://example.com/sample.jpg',
                                    metadata: JSON.stringify({
                                        uploaded_at: new Date().toISOString(),
                                        size: 150000
                                    })
                                }
                            ],
                            message: 'Media files retrieved'
                        }));
                        break;

                    case 'uploadBase64':
                        res.writeHead(200, corsHeaders);
                        res.end(JSON.stringify({
                            success: true,
                            message: 'File uploaded successfully',
                            row: { ROWID: Date.now() }
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