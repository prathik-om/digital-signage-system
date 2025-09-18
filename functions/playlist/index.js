const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
    // Set CORS headers immediately for all requests - PERMANENT FIX
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle CORS preflight - This is the key fix
    if (req.method === 'OPTIONS') {
        console.log('OPTIONS request received - setting CORS headers');
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json'
        });
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
                console.log('🔍 [Playlist] Raw request body:', body);
                console.log('🔍 [Playlist] Body length:', body.length);
                console.log('🔍 [Playlist] Body type:', typeof body);
                
                const inputData = JSON.parse(body || '{}');
                console.log('🔍 [Playlist] Parsed input data:', inputData);
                const { action, data } = inputData;

                // User ID extraction removed - no filtering needed
                console.log('🔍 [Playlist] Action:', action);

                // Initialize Catalyst
                const app = catalyst.initialize(req);
                const datastore = app.datastore();
                const playlistTable = datastore.table('playlists');

                switch (action) {
                    case 'getAll':
                        try {
                            // Fetch playlists from database - temporarily remove user filtering
                            const allPlaylists = await playlistTable.getAllRows();
                            const playlists = allPlaylists; // Show all playlists to all users
                            
                            console.log(`Found ${playlists.length} playlists`);

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                playlists: playlists,
                                message: `Retrieved ${playlists.length} playlists`
                            }));
                        } catch (error) {
                            console.error('Error fetching playlists:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Error fetching playlists: ' + error.message
                            }));
                        }
                        break;

                    case 'create':
                        try {
                            const { name, description, duration, items, selectedContent, isActive } = inputData;
                            
                            if (!name) {
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Name is required'
                                }));
                                return;
                            }

                            // Handle both selectedContent (from frontend) and items (legacy)
                            const contentItems = selectedContent || items || [];

                            // If setting this playlist as active, deactivate all other playlists first
                            if (isActive) {
                                console.log('🔍 [Playlist] Deactivating all existing playlists before creating new active playlist');
                                const allPlaylists = await playlistTable.getAllRows();
                                for (const playlist of allPlaylists) {
                                    if (playlist.is_active) {
                                        console.log('🔍 [Playlist] Deactivating playlist:', playlist.ROWID, playlist.name);
                                        await playlistTable.updateRow({
                                            ROWID: playlist.ROWID,
                                            is_active: false
                                        });
                                    }
                                }
                            }

                            // Create playlist data
                            const playlistData = {
                                name: name.trim(),
                                description: description ? description.trim() : '',
                                duration: duration || 10,
                                items: JSON.stringify(contentItems),
                                is_active: isActive !== undefined ? isActive : false
                            };

                            console.log('Creating playlist with data:', playlistData);
                            const insertedRow = await playlistTable.insertRow(playlistData);
                            console.log('Playlist created:', insertedRow);

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Playlist created successfully',
                                playlistId: insertedRow.ROWID
                            }));
                        } catch (createError) {
                            console.error('Create playlist error:', createError);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Failed to create playlist: ' + createError.message
                            }));
                        }
                        break;

                    case 'checkSchema':
                        try {
                            // Try to access the playlist table to see if it exists
                            const testRows = await playlistTable.getAllRows();
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                available_columns: ['ROWID', 'name', 'description', 'items', 'is_active', 'created_at', 'updated_at'],
                                sample_row: {
                                    ROWID: 1,
                                    name: 'Sample Playlist',
                                    description: 'Sample description',
                                    items: [],
                                    is_active: true,
                                    created_at: new Date().toISOString()
                                },
                                message: 'Schema check completed',
                                table_exists: true,
                                row_count: testRows.length
                            }));
                        } catch (schemaError) {
                            console.error('Schema check error:', schemaError);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Playlist table does not exist or is not accessible',
                                error: schemaError.message,
                                table_exists: false
                            }));
                        }
                        break;

                    case 'addContent':
                        try {
                            const { playlist_id, content_id } = inputData;
                            
                            if (!playlist_id || !content_id) {
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Playlist ID and content ID are required'
                                }));
                                return;
                            }

                            // Get the current playlist - temporarily remove user filtering
                            const allPlaylists = await playlistTable.getAllRows();
                            const playlist = allPlaylists.find(p => p.ROWID == playlist_id);
                            
                            if (!playlist) {
                                res.statusCode = 404;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Playlist not found or access denied'
                                }));
                                return;
                            }

                            // Parse existing items
                            let items = [];
                            try {
                                items = JSON.parse(playlist.items || '[]');
                            } catch (parseError) {
                                console.warn('Failed to parse playlist items, starting with empty array:', parseError);
                                items = [];
                            }

                            // Check if content is already in playlist
                            const contentExists = items.some(item => item.id == content_id);
                            if (contentExists) {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: true,
                                    message: 'Content already exists in playlist'
                                }));
                                return;
                            }

                            // Add content to playlist
                            items.push({ id: content_id });
                            
                            // Update playlist with new items
                            const updateData = {
                                ROWID: playlist_id,
                                items: JSON.stringify(items)
                            };

                            console.log('Adding content to playlist:', { playlist_id, content_id, items });
                            await playlistTable.updateRow(updateData);
                            console.log('Content added to playlist successfully');

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Content added to playlist successfully'
                            }));
                        } catch (addError) {
                            console.error('Add content error:', addError);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Failed to add content to playlist: ' + addError.message
                            }));
                        }
                        break;

                    case 'update':
                        try {
                            const { playlist_id, name, description, duration, selectedContent, items, isActive } = inputData;
                            
                            if (!playlist_id || !name) {
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Playlist ID and name are required'
                                }));
                                return;
                            }

                            // Handle both selectedContent (from frontend) and items (legacy)
                            const contentItems = selectedContent || items || [];

                            // If setting this playlist as active, deactivate all other playlists first
                            if (isActive === true) {
                                console.log('🔍 [Playlist] Deactivating all existing playlists before activating playlist:', playlist_id);
                                const allPlaylists = await playlistTable.getAllRows();
                                for (const playlist of allPlaylists) {
                                    if (playlist.is_active && playlist.ROWID != playlist_id) {
                                        console.log('🔍 [Playlist] Deactivating playlist:', playlist.ROWID, playlist.name);
                                        await playlistTable.updateRow({
                                            ROWID: playlist.ROWID,
                                            is_active: false
                                        });
                                    }
                                }
                            }

                            const updateData = {
                                ROWID: playlist_id,
                                name: name.trim(),
                                description: description ? description.trim() : '',
                                duration: duration || 10,
                                items: JSON.stringify(contentItems)
                            };

                            // Add isActive if provided
                            if (isActive !== undefined) {
                                updateData.is_active = isActive;
                            }

                            console.log('Updating playlist with data:', updateData);
                            const updatedRow = await playlistTable.updateRow(updateData);
                            console.log('Playlist updated successfully:', updatedRow);

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Playlist updated successfully'
                            }));
                        } catch (updateError) {
                            console.error('Update playlist error:', updateError);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Failed to update playlist: ' + updateError.message
                            }));
                        }
                        break;

                    case 'getScheduled':
                        try {
                            // For now, return empty array since we don't have scheduling logic yet
                            // This can be enhanced later with actual scheduling functionality
                            console.log('🔍 [Playlist] Fetching scheduled playlists (not implemented yet)');
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                playlists: [], // Empty for now
                                message: 'No scheduled playlists found'
                            }));
                        } catch (error) {
                            console.error('🔍 [Playlist] Error fetching scheduled playlists:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Failed to fetch scheduled playlists: ' + (error.message || 'Unknown error')
                            }));
                        }
                        break;

                    case 'delete':
                        try {
                            const { playlist_id } = inputData;
                            
                            if (!playlist_id) {
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Playlist ID is required'
                                }));
                                return;
                            }

                            // Get the current playlist - temporarily remove user filtering
                            const allPlaylists = await playlistTable.getAllRows();
                            const playlist = allPlaylists.find(p => p.ROWID == playlist_id);
                            
                            if (!playlist) {
                                res.statusCode = 404;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Playlist not found'
                                }));
                                return;
                            }

                            // Delete the playlist
                            console.log('Deleting playlist:', playlist_id);
                            await playlistTable.deleteRow(playlist_id);
                            console.log('Playlist deleted successfully');

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Playlist deleted successfully'
                            }));
                        } catch (deleteError) {
                            console.error('Delete playlist error:', deleteError);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Failed to delete playlist: ' + deleteError.message
                            }));
                        }
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