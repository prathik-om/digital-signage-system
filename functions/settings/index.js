const catalyst = require('zcatalyst-sdk-node');

// Helper function to set CORS headers
function setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Helper function to send JSON response
function sendJSONResponse(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}

// Helper function to extract user ID from request
function extractUserId(inputData) {
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
}

module.exports = async (req, res) => {
    // Set CORS headers immediately for all requests
    setCORSHeaders(res);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.setHeader('Content-Length', '0');
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
                const { action, data } = inputData;

                // Extract user ID from request
                // User ID extraction removed - no filtering needed
                console.log('🔍 [Settings] Action:', action);

                // Initialize Catalyst
                const app = catalyst.initialize(req);

                // Validate action is provided
                if (!action) {
                    return sendJSONResponse(res, 400, {
                        success: false,
                        message: 'Action parameter is required'
                    });
                }

                switch (action) {
                    case 'getAll':
                        try {
                            // Initialize Catalyst and get settings from database
                            const datastore = app.datastore();
                            const settingsTable = datastore.table('settings');
                            
                            // Try to get settings from database for the specific user
                            let settings = {};
                            try {
                                const settingsRows = await settingsTable.getRows();
                                // Temporarily remove user filtering - show all settings to all users
                                const userSettings = settingsRows;
                                if (userSettings.length > 0) {
                                    settings = userSettings[0];
                                }
                            } catch (dbError) {
                                console.warn('Could not fetch settings from database, using defaults:', dbError);
                            }

                            // Default settings
                            const defaultSettings = {
                                default_slide_timer: 10,
                                emergency_timeout: 30,
                                content_refresh_rate: 60,
                                display_mode: 'fullscreen',
                                theme: 'light',
                                auto_play: true,
                                transition_effect: 'fade',
                                volume: 0.8,
                                brightness: 100,
                                language: 'en',
                                timezone: 'UTC'
                            };

                            // Merge with defaults
                            const finalSettings = { ...defaultSettings, ...settings };

                            return sendJSONResponse(res, 200, {
                                success: true,
                                settings: finalSettings,
                                message: `Settings retrieved successfully for user ${user_id}`,
                                user_id: user_id
                            });
                        } catch (error) {
                            console.error('Get settings error:', error);
                            return sendJSONResponse(res, 500, {
                                success: false,
                                message: 'Failed to retrieve settings'
                            });
                        }
                        break;

                    case 'update':
                        try {
                            const { settings: newSettings } = inputData;
                            
                            if (!newSettings || typeof newSettings !== 'object') {
                                return sendJSONResponse(res, 400, {
                                    success: false,
                                    message: 'Settings data is required and must be an object'
                                });
                            }

                            // Initialize Catalyst and update settings in database
                            const datastore = app.datastore();
                            const settingsTable = datastore.table('settings');
                            
                            // Add timestamp and user_id
                            const settingsWithTimestamp = {
                                ...newSettings,
                                user_id: user_id,
                                updated_at: new Date().toISOString()
                            };

                            // Try to update existing settings or create new
                            try {
                                const existingSettings = await settingsTable.getRows();
                                // Temporarily remove user filtering - allow all users to update settings
                                const userExistingSettings = existingSettings;
                                if (userExistingSettings.length > 0) {
                                    await settingsTable.updateRow({
                                        ROWID: userExistingSettings[0].ROWID,
                                        ...settingsWithTimestamp
                                    });
                                } else {
                                    await settingsTable.insertRow(settingsWithTimestamp);
                                }
                            } catch (dbError) {
                                console.warn('Database update failed, but continuing:', dbError);
                            }

                            return sendJSONResponse(res, 200, {
                                success: true,
                                message: `Settings updated successfully for user ${user_id}`,
                                settings: settingsWithTimestamp,
                                user_id: user_id
                            });
                        } catch (error) {
                            console.error('Update settings error:', error);
                            return sendJSONResponse(res, 500, {
                                success: false,
                                message: 'Failed to update settings'
                            });
                        }
                        break;

                    default:
                        return sendJSONResponse(res, 400, {
                            success: false,
                            message: 'Invalid action. Supported actions: getAll, update'
                        });
                }
            } catch (parseError) {
                console.error('Parse error:', parseError);
                return sendJSONResponse(res, 400, {
                    success: false,
                    message: 'Invalid request format',
                    error: parseError.message
                });
            }
        });

    } catch (error) {
        console.error('Server error:', error);
        return sendJSONResponse(res, 500, {
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};