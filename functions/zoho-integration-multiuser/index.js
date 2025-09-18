const catalyst = require('zcatalyst-sdk-node');
const https = require('https');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    // Set CORS headers immediately for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end();
        return;
    }

    // Helper function to extract user ID
    const extractUserId = (req) => {
        try {
            // Check for JWT token first
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const decoded = jwt.decode(token);
                return decoded?.sub || decoded?.user_id || null;
            }
            
            // Check for TV player headers
            const tvPlayerUserId = req.headers['x-tv-player-user-id'];
            if (tvPlayerUserId) {
                return tvPlayerUserId;
            }
            
            return null;
        } catch (error) {
            console.error('Error extracting user ID:', error);
            return null;
        }
    };

    // Helper function to get user's Cliq configuration
    const getUserCliqConfig = async (datastore, user_id) => {
        try {
            const query = `
                SELECT setting_value 
                FROM settings 
                WHERE user_id = ? AND setting_key = 'cliq_config' AND is_active = true
            `;
            const result = await datastore.executeQuery(query, [user_id]);
            
            if (result.rows && result.rows.length > 0) {
                return JSON.parse(result.rows[0].setting_value);
            }
            return null;
        } catch (error) {
            console.error('Error getting user Cliq config:', error);
            return null;
        }
    };

    // Helper function to fetch Cliq messages for a user
    const fetchCliqMessages = async (cliqConfig, channelId = null) => {
        return new Promise((resolve, reject) => {
            if (!cliqConfig || !cliqConfig.access_token) {
                reject(new Error('No valid Cliq configuration found'));
                return;
            }

            const options = {
                hostname: 'cliq.zoho.com',
                path: '/api/v2/channels' + (channelId ? `/${channelId}/messages` : ''),
                method: 'GET',
                headers: {
                    'Authorization': `Zoho-oauthtoken ${cliqConfig.access_token}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.status === 'success') {
                            resolve(result);
                        } else {
                            reject(new Error(result.message || 'Failed to fetch Cliq messages'));
                        }
                    } catch (error) {
                        reject(new Error('Invalid response from Cliq API'));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    };

    // Helper function to refresh Cliq access token
    const refreshCliqToken = async (cliqConfig) => {
        return new Promise((resolve, reject) => {
            if (!cliqConfig.refresh_token) {
                reject(new Error('No refresh token available'));
                return;
            }

            const options = {
                hostname: 'accounts.zoho.com',
                path: '/oauth/v2/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };

            const postData = `grant_type=refresh_token&refresh_token=${cliqConfig.refresh_token}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}`;

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.access_token) {
                            resolve(result);
                        } else {
                            reject(new Error(result.error_description || 'Failed to refresh token'));
                        }
                    } catch (error) {
                        reject(new Error('Invalid response from token refresh'));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
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

                console.log('🔍 [Zoho-Integration-Multiuser] Action:', action);

                // Initialize Catalyst
                const app = catalyst.initialize(req);
                const datastore = app.datastore();

                switch (action) {
                    case 'getLatestMessages':
                        try {
                            // Get user's Cliq configuration
                            const cliqConfig = await getUserCliqConfig(datastore, user_id);
                            if (!cliqConfig) {
                                res.statusCode = 404;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'No Cliq configuration found for user. Please set up Cliq integration first.'
                                }));
                                return;
                            }

                            // Try to fetch messages, refresh token if needed
                            let messages;
                            try {
                                messages = await fetchCliqMessages(cliqConfig);
                            } catch (error) {
                                if (error.message.includes('token') || error.message.includes('unauthorized')) {
                                    console.log('🔄 Token expired, attempting refresh...');
                                    const refreshed = await refreshCliqToken(cliqConfig);
                                    
                                    // Update stored config with new token
                                    const updatedConfig = {
                                        ...cliqConfig,
                                        access_token: refreshed.access_token,
                                        refresh_token: refreshed.refresh_token || cliqConfig.refresh_token
                                    };
                                    
                                    // Store updated config
                                    const now = new Date().toISOString();
                                    const updateQuery = `
                                        UPDATE settings 
                                        SET setting_value = ?, updated_time = ?
                                        WHERE user_id = ? AND setting_key = 'cliq_config'
                                    `;
                                    await datastore.executeQuery(updateQuery, [
                                        JSON.stringify(updatedConfig), 
                                        now, 
                                        user_id
                                    ]);
                                    
                                    // Retry with new token
                                    messages = await fetchCliqMessages(updatedConfig);
                                } else {
                                    throw error;
                                }
                            }
                            
                            // Format messages for display
                            const formattedMessages = messages.data?.map(msg => ({
                                id: msg.id,
                                message: msg.message,
                                timestamp: msg.time,
                                channel: msg.channel_name,
                                user: msg.user_name,
                                source: 'zoho_cliq'
                            })) || [];

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                messages: formattedMessages,
                                message: `Retrieved ${formattedMessages.length} messages from user's Cliq channels`,
                                user_id: user_id
                            }));
                        } catch (error) {
                            console.error('Error fetching Cliq messages:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Error fetching Cliq messages: ' + error.message
                            }));
                        }
                        break;

                    case 'setupCliqIntegration':
                        try {
                            const { access_token, refresh_token, channel_ids } = data || inputData;
                            
                            if (!access_token) {
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Access token is required for Cliq setup'
                                }));
                                return;
                            }

                            // Store user's Cliq configuration
                            const cliqConfig = {
                                access_token,
                                refresh_token,
                                channel_ids: channel_ids || [],
                                setup_time: new Date().toISOString()
                            };

                            const now = new Date().toISOString();
                            const query = `
                                INSERT INTO settings (user_id, setting_key, setting_value, setting_type, is_active, created_time, updated_time)
                                VALUES (?, 'cliq_config', ?, 'json', true, ?, ?)
                                ON DUPLICATE KEY UPDATE 
                                setting_value = VALUES(setting_value),
                                updated_time = VALUES(updated_time)
                            `;
                            
                            await datastore.executeQuery(query, [
                                user_id, 
                                JSON.stringify(cliqConfig), 
                                now, 
                                now
                            ]);
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Cliq integration setup successfully',
                                user_id: user_id
                            }));
                        } catch (error) {
                            console.error('Error setting up Cliq integration:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Error setting up Cliq integration: ' + error.message
                            }));
                        }
                        break;

                    case 'getCliqChannels':
                        try {
                            // Get user's Cliq configuration
                            const cliqConfig = await getUserCliqConfig(datastore, user_id);
                            if (!cliqConfig) {
                                res.statusCode = 404;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'No Cliq configuration found for user'
                                }));
                                return;
                            }

                            // Fetch user's Cliq channels
                            const channels = await fetchCliqMessages(cliqConfig);
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                channels: channels.data || [],
                                message: `Retrieved channels for user ${user_id}`,
                                user_id: user_id
                            }));
                        } catch (error) {
                            console.error('Error fetching Cliq channels:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Error fetching Cliq channels: ' + error.message
                            }));
                        }
                        break;

                    case 'testCliqConnection':
                        try {
                            // Get user's Cliq configuration
                            const cliqConfig = await getUserCliqConfig(datastore, user_id);
                            if (!cliqConfig) {
                                res.statusCode = 404;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'No Cliq configuration found for user'
                                }));
                                return;
                            }

                            // Test connection by fetching a small amount of data
                            const testResult = await fetchCliqMessages(cliqConfig);
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Cliq connection test successful',
                                channels_count: testResult.data?.length || 0,
                                user_id: user_id
                            }));
                        } catch (error) {
                            console.error('Error testing Cliq connection:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Cliq connection test failed: ' + error.message
                            }));
                        }
                        break;

                    default:
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Invalid action. Supported actions: getLatestMessages, setupCliqIntegration, getCliqChannels, testCliqConnection'
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
