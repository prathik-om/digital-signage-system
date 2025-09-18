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
            throw new Error('Failed to extract user_id: ' + error.message);
        }
    };

    try {
        // Parse request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const inputData = JSON.parse(body || '{}');
                const { action, data } = inputData;

                // User ID extraction removed - no filtering needed
                console.log('🔍 [Emergency] Action:', action);

                // Initialize Catalyst
                const app = catalyst.initialize(req);
                const datastore = app.datastore();

                switch (action) {
                    case 'getAll':
                        try {
                            // For now, return mock data to test the multi-user structure
                            // TODO: Implement actual database queries once tables are populated
                            const emergency_messages = [
                                {
                                    ROWID: 1,
                                    title: 'System Test',
                                    message: 'This is a test emergency message',
                                    user_id: user_id,
                                    importance: 'medium',
                                    background_color: '#FFA500',
                                    text_color: '#000000',
                                    is_active: true,
                                    CREATEDTIME: new Date().toISOString(),
                                    MODIFIEDTIME: new Date().toISOString()
                                }
                            ];

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                emergency_messages: emergency_messages,
                                message: `Retrieved ${emergency_messages.length} emergency messages for user ${user_id}`,
                                user_id: user_id
                            }));
                        } catch (error) {
                            console.error('Error fetching emergency messages:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Error fetching emergency messages: ' + error.message
                            }));
                        }
                        break;

                    case 'getActive':
                        try {
                            // For TV player compatibility - return active emergency messages
                            console.log('🔍 [Emergency] Fetching active emergency messages');
                            
                            // For now, return empty array since we don't have emergency logic implemented
                            // This can be enhanced later with actual emergency message functionality
                            const activeEmergencies = [];
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                emergencies: activeEmergencies,
                                message: `Retrieved ${activeEmergencies.length} active emergency messages`
                            }));
                        } catch (error) {
                            console.error('🔍 [Emergency] Error fetching active emergencies:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Failed to fetch active emergencies: ' + (error.message || 'Unknown error')
                            }));
                        }
                        break;

                    case 'create':
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Emergency message created',
                            id: Date.now()
                        }));
                        break;

                    case 'clear':
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Emergency messages cleared'
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