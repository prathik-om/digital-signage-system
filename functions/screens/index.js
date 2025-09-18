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
                console.log('🔍 [Screens] Request received, body length:', body.length);
                console.log('🔍 [Screens] Raw body:', body);
                
                const inputData = JSON.parse(body || '{}');
                const { action } = inputData;
                
                console.log('🔍 [Screens] Parsed action:', action);

                // Initialize Catalyst
                const app = catalyst.initialize(req);
                const datastore = app.datastore();

        switch (action) {
            case 'getAll':
                try {
                    console.log('🔍 [Screens] Fetching all screens');
                    
                    // For now, return mock screens data since table access is problematic
                    const mockScreens = [
                        {
                            ROWID: 1,
                            name: 'Main Lobby Screen',
                            location: 'Main Lobby',
                            ip_address: '192.168.1.100',
                            resolution: '1920x1080',
                            status: 'online',
                            current_playlist: null,
                            last_seen: new Date().toISOString(),
                            is_active: true,
                            created_at: new Date().toISOString()
                        },
                        {
                            ROWID: 2,
                            name: 'Conference Room Display',
                            location: 'Conference Room A',
                            ip_address: '192.168.1.101',
                            resolution: '1920x1080',
                            status: 'offline',
                            current_playlist: null,
                            last_seen: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
                            is_active: true,
                            created_at: new Date().toISOString()
                        },
                        {
                            ROWID: 3,
                            name: 'Reception Area Screen',
                            location: 'Reception',
                            ip_address: '192.168.1.102',
                            resolution: '3840x2160',
                            status: 'online',
                            current_playlist: null,
                            last_seen: new Date().toISOString(),
                            is_active: true,
                            created_at: new Date().toISOString()
                        }
                    ];
                    
                    console.log(`🔍 [Screens] Returning ${mockScreens.length} mock screens`);
                    
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        screens: mockScreens,
                        message: `Retrieved ${mockScreens.length} screens (mock data)`
                    }));
                } catch (error) {
                    console.error('❌ [Screens] Error fetching screens:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Failed to fetch screens: ' + (error.message || 'Unknown error')
                    }));
                }
                break;

            case 'create':
                try {
                    const { name, location, ip_address, resolution } = inputData;
                    
                    if (!name || !location) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Name and location are required'
                        }));
                        return;
                    }

                    // Create mock screen with generated ID
                    const newScreen = {
                        ROWID: Date.now(),
                        name: name.trim(),
                        location: location.trim(),
                        ip_address: ip_address ? ip_address.trim() : null,
                        resolution: resolution || '1920x1080',
                        status: 'offline',
                        current_playlist: null,
                        last_seen: null,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    console.log('✅ [Screens] Created mock screen:', newScreen.ROWID);

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        screen: newScreen,
                        message: 'Screen created successfully (mock data)'
                    }));
                } catch (error) {
                    console.error('❌ [Screens] Error creating screen:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Failed to create screen: ' + (error.message || 'Unknown error')
                    }));
                }
                break;

            case 'update':
                try {
                    const { screen_id, name, location, ip_address, resolution, status, current_playlist, is_active } = inputData;
                    
                    if (!screen_id) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Screen ID is required'
                        }));
                        return;
                    }

                    // Mock update
                    const updatedScreen = {
                        ROWID: screen_id,
                        name: name ? name.trim() : 'Updated Screen',
                        location: location ? location.trim() : 'Updated Location',
                        ip_address: ip_address || null,
                        resolution: resolution || '1920x1080',
                        status: status || 'offline',
                        current_playlist: current_playlist || null,
                        last_seen: status === 'online' ? new Date().toISOString() : null,
                        is_active: is_active !== undefined ? is_active : true,
                        updated_at: new Date().toISOString()
                    };

                    console.log('✅ [Screens] Updated mock screen:', screen_id);

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        screen: updatedScreen,
                        message: 'Screen updated successfully (mock data)'
                    }));
                } catch (error) {
                    console.error('❌ [Screens] Error updating screen:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Failed to update screen: ' + (error.message || 'Unknown error')
                    }));
                }
                break;

            case 'delete':
                try {
                    const { screen_id } = inputData;
                    
                    if (!screen_id) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Screen ID is required'
                        }));
                        return;
                    }

                    console.log('✅ [Screens] Deleted mock screen:', screen_id);

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Screen deleted successfully (mock data)'
                    }));
                } catch (error) {
                    console.error('❌ [Screens] Error deleting screen:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Failed to delete screen: ' + (error.message || 'Unknown error')
                    }));
                }
                break;

            case 'updateStatus':
                try {
                    const { screen_id, status, current_playlist } = inputData;
                    
                    if (!screen_id || !status) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Screen ID and status are required'
                        }));
                        return;
                    }

                    console.log('✅ [Screens] Updated screen status:', screen_id, 'to', status);

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        message: `Screen status updated to ${status} (mock data)`
                    }));
                } catch (error) {
                    console.error('❌ [Screens] Error updating screen status:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Failed to update screen status: ' + (error.message || 'Unknown error')
                    }));
                }
                break;

            default:
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid action. Supported actions: getAll, create, update, delete, updateStatus'
                }));
        }
            } catch (parseError) {
                console.error('❌ [Screens] JSON parse error:', parseError);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid JSON format: ' + parseError.message
                }));
            }
        });
    } catch (error) {
        console.error('❌ [Screens] Server error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: false,
            message: 'Server error',
            error: error.message
        }));
    }
};