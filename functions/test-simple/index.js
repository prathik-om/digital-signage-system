const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
    // Set CORS headers immediately for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        console.log('OPTIONS request received - setting CORS headers');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
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

                console.log('🧪 [Test Simple] Action:', action);

                switch (action) {
                    case 'test':
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Test function is working!',
                            timestamp: new Date().toISOString()
                        }));
                        break;

                    case 'testDatabase':
                        try {
                            const app = catalyst.initialize(req);
                            const datastore = app.datastore();
                            
                            // Test multiple tables
                            const results = {};
                            
                            // Test users table
                            try {
                                const usersTable = datastore.table('users');
                                const users = await usersTable.getAllRows();
                                results.users = {
                                    success: true,
                                    count: users.length,
                                    data: users
                                };
                            } catch (usersError) {
                                results.users = {
                                    success: false,
                                    error: usersError.message
                                };
                            }
                            
                            // Test content table
                            try {
                                const contentTable = datastore.table('content');
                                const content = await contentTable.getAllRows();
                                results.content = {
                                    success: true,
                                    count: content.length,
                                    data: content
                                };
                            } catch (contentError) {
                                results.content = {
                                    success: false,
                                    error: contentError.message
                                };
                            }
                            
                            // Test playlists table
                            try {
                                const playlistsTable = datastore.table('playlists');
                                const playlists = await playlistsTable.getAllRows();
                                results.playlists = {
                                    success: true,
                                    count: playlists.length,
                                    data: playlists
                                };
                            } catch (playlistsError) {
                                results.playlists = {
                                    success: false,
                                    error: playlistsError.message
                                };
                            }
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Database test successful!',
                                results: results,
                                timestamp: new Date().toISOString()
                            }));
                        } catch (dbError) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Database test failed',
                                error: dbError.message,
                                timestamp: new Date().toISOString()
                            }));
                        }
                        break;

                    default:
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Invalid action. Use: test, testDatabase'
                        }));
                }
            } catch (parseError) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid JSON in request body',
                    error: parseError.message
                }));
            }
        });
        
    } catch (error) {
        console.error('Server error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: false,
            message: 'Internal server error',
            error: error.message
        }));
    }
};
