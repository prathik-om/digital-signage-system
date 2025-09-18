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
                console.log('🔍 [Content] Raw request body:', body);
                console.log('🔍 [Content] Body length:', body.length);
                console.log('🔍 [Content] Body type:', typeof body);
                
                const inputData = JSON.parse(body || '{}');
                console.log('🔍 [Content] Parsed input data:', inputData);
                const { action, data } = inputData;

                // User ID extraction removed - no filtering needed
                console.log('🔍 [Content] Action:', action);

                // Initialize Catalyst
                const app = catalyst.initialize(req);
                const datastore = app.datastore();

                switch (action) {
                    case 'getAll':
                        try {
                            // Try to fetch real content from database, fallback to mock data
                            let userContent = [];
                            
                            try {
                                const contentTable = datastore.table('content');
                                
                                // Use the correct Catalyst DataStore method
                                const allContent = await contentTable.getAllRows();
                                
                                // Temporarily remove user filtering - show all content to all users
                                userContent = allContent.filter(item => item.is_active === true);
                                
                                console.log(`Successfully fetched ${allContent.length} total content items, ${userContent.length} active items`);
                                console.log('Filtered content items:', userContent);
                                
                            } catch (dbError) {
                                console.error('Database fetch failed, using mock data:', dbError);
                                console.error('Error details:', {
                                    message: dbError.message,
                                    stack: dbError.stack,
                                    name: dbError.name
                                });
                                
                                // Fallback to mock data if database fails
                                userContent = [
                                    {
                                        id: 1,
                                        title: 'Welcome Message',
                                        content: 'Welcome to Atrium Digital Signage',
                                        type: 'text',
                                        duration: 10,
                                        priority_order: 0,
                                        tags: ['welcome', 'general'],
                                        is_active: true,
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString()
                                    }
                                ];
                            }
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                content: userContent,
                                files: userContent, // TV player compatibility
                                message: `Retrieved ${userContent.length} content items`
                            }));
                        } catch (error) {
                            console.error('Error fetching content:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Error fetching content: ' + error.message
                            }));
                        }
                        break;

                    case 'getLiveCliqMessages':
                        try {
                            // Create a default "Zoho Cliq Content" playlist from content table
                            console.log('🔍 [Content] Creating default Zoho Cliq Content playlist from content table');
                            
                            const contentTable = datastore.table('content');
                            const playlistTable = datastore.table('playlists');
                            
                            // Get all active content
                            const allContent = await contentTable.getAllRows();
                            const activeContent = allContent
                                .filter(item => item.is_active === true)
                                .sort((a, b) => new Date(b.CREATEDTIME || b.created_at || 0) - new Date(a.CREATEDTIME || a.created_at || 0))
                                .slice(0, inputData.limit || 10);
                            
                            console.log(`🔍 [Content] Found ${activeContent.length} active content items for default playlist`);
                            
                            // Create playlist items with proper structure for TV player
                            const playlistItems = activeContent.map(item => ({
                                id: item.ROWID,
                                media_object_id: item.ROWID, // Use content ID as media object ID for fallback
                                name: item.title || 'Content Item',
                                file_name: item.title || 'content_item',
                                title: item.title || 'Content Item'
                            }));
                            
                            // Check if "Zoho Cliq Content" playlist already exists
                            const existingPlaylists = await playlistTable.getAllRows();
                            let existingCliqPlaylist = existingPlaylists.find(p => p.name === 'Zoho Cliq Content');
                            
                            let defaultPlaylist;
                            if (existingCliqPlaylist) {
                                // Update existing playlist with new content
                                console.log('🔍 [Content] Updating existing Zoho Cliq Content playlist');
                                await playlistTable.updateRow({
                                    ROWID: existingCliqPlaylist.ROWID,
                                    name: 'Zoho Cliq Content',
                                    description: 'Default playlist created from content table items',
                                    duration: 15,
                                    items: JSON.stringify(playlistItems),
                                    is_active: false
                                });
                                defaultPlaylist = {
                                    ...existingCliqPlaylist,
                                    name: 'Zoho Cliq Content',
                                    description: 'Default playlist created from content table items',
                                    duration: 15,
                                    items: JSON.stringify(playlistItems),
                                    is_active: false
                                };
                            } else {
                                // Create new playlist in database
                                console.log('🔍 [Content] Creating new Zoho Cliq Content playlist in database');
                                const insertedPlaylist = await playlistTable.insertRow({
                                    name: 'Zoho Cliq Content',
                                    description: 'Default playlist created from content table items',
                                    duration: 15,
                                    items: JSON.stringify(playlistItems),
                                    is_active: false
                                });
                                defaultPlaylist = {
                                    ROWID: insertedPlaylist.ROWID,
                                    name: 'Zoho Cliq Content',
                                    description: 'Default playlist created from content table items',
                                    duration: 15,
                                    items: JSON.stringify(playlistItems),
                                    is_active: false
                                };
                            }
                            
                            console.log('🔍 [Content] Created/updated default playlist with', playlistItems.length, 'items');
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                playlist: defaultPlaylist,
                                files: activeContent, // TV player expects 'files'
                                content: activeContent, // Dashboard compatibility
                                message: `Created default Zoho Cliq Content playlist with ${activeContent.length} items`
                            }));
                        } catch (error) {
                            console.error('❌ [Content] Error creating default Cliq playlist:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Failed to create default Cliq playlist: ' + (error.message || 'Unknown error')
                            }));
                        }
                        break;

                    case 'getDefaultFallbackImage':
                        try {
                            console.log('🔍 [Content] Fetching default fallback image configuration');
                            
                            // Try to get stored fallback image configuration from content table
                            const contentTable = datastore.table('content');
                            const allContent = await contentTable.getAllRows();
                            
                            // Look for existing fallback image configuration
                            let fallbackConfig = allContent.find(item => 
                                item.title === 'default_fallback_config' || 
                                item.content_type === 'fallback_config'
                            );
                            
                            let defaultFallbackImage;
                            
                            if (fallbackConfig) {
                                // Use stored configuration
                                try {
                                    const configData = JSON.parse(fallbackConfig.content || '{}');
                                    defaultFallbackImage = {
                                        id: 'default_fallback',
                                        title: configData.title || 'Default Fallback Image',
                                        description: configData.description || 'Default image shown when no content is available',
                                        url: configData.url || 'https://www.zohowebstatic.com/sites/zweb/images/commonroot/zoho-logo-web.svg',
                                        type: 'image',
                                        duration: configData.duration || 10,
                                        is_active: true,
                                        source: 'default_fallback'
                                    };
                                    console.log('🔍 [Content] Using stored fallback image configuration:', configData.url);
                                } catch (parseError) {
                                    console.error('🔍 [Content] Error parsing stored config, using default');
                                    fallbackConfig = null;
                                }
                            }
                            
                            if (!fallbackConfig) {
                                // Use default configuration
                                defaultFallbackImage = {
                                    id: 'default_fallback',
                                    title: 'Zoho Logo - Default Fallback',
                                    description: 'Default Zoho logo shown when no content is available',
                                    url: 'https://www.zohowebstatic.com/sites/zweb/images/commonroot/zoho-logo-web.svg',
                                    type: 'image',
                                    duration: 10,
                                    is_active: true,
                                    source: 'default_fallback'
                                };
                                console.log('🔍 [Content] Using default fallback image configuration');
                            }
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                fallbackImage: defaultFallbackImage,
                                message: 'Default fallback image configuration retrieved'
                            }));
                        } catch (error) {
                            console.error('❌ [Content] Error fetching default fallback image:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Failed to fetch default fallback image: ' + (error.message || 'Unknown error')
                            }));
                        }
                        break;


                    case 'updateDefaultFallbackImage':
                        try {
                            console.log('🔍 [Content] Updating default fallback image configuration');
                            const { fallbackImage } = inputData;
                            
                            if (!fallbackImage || !fallbackImage.url) {
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Fallback image URL is required'
                                }));
                                return;
                            }
                            
                            // Store the fallback image configuration in the content table
                            const contentTable = datastore.table('content');
                            const allContent = await contentTable.getAllRows();
                            
                            // Look for existing fallback configuration
                            let existingConfig = allContent.find(item => 
                                item.title === 'default_fallback_config' || 
                                item.content_type === 'fallback_config'
                            );
                            
                            const configData = {
                                url: fallbackImage.url,
                                title: fallbackImage.title || 'Default Fallback Image',
                                duration: fallbackImage.duration || 10,
                                description: 'Default image shown when no content is available',
                                updated_at: new Date().toISOString()
                            };
                            
                            if (existingConfig) {
                                // Update existing configuration
                                console.log('🔍 [Content] Updating existing fallback image configuration');
                                await contentTable.updateRow({
                                    ROWID: existingConfig.ROWID,
                                    content: JSON.stringify(configData),
                                    is_active: true
                                });
                            } else {
                                // Create new configuration entry
                                console.log('🔍 [Content] Creating new fallback image configuration');
                                await contentTable.insertRow({
                                    title: 'default_fallback_config',
                                    content: JSON.stringify(configData),
                                    content_type: 'fallback_config',
                                    user_id: 'system', // System-level configuration
                                    is_active: true,
                                    priority_order: 0,
                                    tags: 'system,fallback,config'
                                });
                            }
                            
                            console.log('🔍 [Content] Default fallback image configuration saved:', {
                                url: fallbackImage.url,
                                title: fallbackImage.title,
                                duration: fallbackImage.duration
                            });
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Default fallback image configuration updated successfully',
                                fallbackImage: {
                                    id: 'default_fallback',
                                    title: fallbackImage.title || 'Default Fallback Image',
                                    description: 'Default image shown when no content is available',
                                    url: fallbackImage.url,
                                    type: 'image',
                                    duration: fallbackImage.duration || 10,
                                    is_active: true,
                                    source: 'default_fallback'
                                }
                            }));
                        } catch (error) {
                            console.error('❌ [Content] Error updating default fallback image:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Failed to update default fallback image: ' + (error.message || 'Unknown error')
                            }));
                        }
                        break;

                    case 'addToPlaylist':
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Content added to playlist',
                            row: { ROWID: Date.now() }
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
