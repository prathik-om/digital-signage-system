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

    // Helper function to validate user access to content
    const validateUserAccess = async (datastore, user_id, resource_id = null) => {
        try {
            // Check if user exists and is active
            const userQuery = `SELECT user_id FROM users WHERE user_id = ? AND is_active = true`;
            const userResult = await datastore.executeQuery(userQuery, [user_id]);
            
            if (!userResult.rows || userResult.rows.length === 0) {
                return { valid: false, error: 'User not found or inactive' };
            }
            
            // If checking specific resource access
            if (resource_id) {
                const ownershipQuery = `SELECT user_id FROM content WHERE ROWID = ? AND user_id = ?`;
                const ownershipResult = await datastore.executeQuery(ownershipQuery, [resource_id, user_id]);
                if (!ownershipResult.rows || ownershipResult.rows.length === 0) {
                    return { valid: false, error: 'Access denied: Resource not found or not owned by user' };
                }
            }
            
            return { valid: true };
        } catch (error) {
            console.error('Error validating user access:', error);
            return { valid: false, error: 'Access validation failed' };
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
                console.log('🔍 [Content-Multiuser] Action:', action);

                // Initialize Catalyst
                const app = catalyst.initialize(req);
                const datastore = app.datastore();

                // User access validation removed - no filtering needed

                switch (action) {
                    case 'getAll':
                        try {
                            // Get all content for the user
                            const query = `
                                SELECT ROWID, title, content, content_type, media_object_id, 
                                       stratus_bucket, stratus_object_key, source, channel, 
                                       timestampz, duration, priority_order, tags, is_active, 
                                       CREATEDTIME, MODIFIEDTIME
                                FROM content 
                                WHERE user_id = ? AND is_active = true
                                ORDER BY priority_order ASC, CREATEDTIME DESC
                            `;
                            
                            const result = await datastore.executeQuery(query, [user_id]);
                            
                            const content = result.rows.map(row => ({
                                id: row.ROWID,
                                title: row.title,
                                content: row.content,
                                type: row.content_type,
                                media_object_id: row.media_object_id,
                                stratus_bucket: row.stratus_bucket,
                                stratus_object_key: row.stratus_object_key,
                                source: row.source,
                                channel: row.channel,
                                timestamp: row.timestampz,
                                duration: row.duration,
                                priority_order: row.priority_order,
                                tags: row.tags ? row.tags.split(',') : [],
                                is_active: row.is_active,
                                created_at: row.CREATEDTIME,
                                updated_at: row.MODIFIEDTIME
                            }));

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                content: content,
                                message: `Retrieved ${content.length} content items for user ${user_id}`,
                                user_id: user_id
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

                    case 'add':
                        try {
                            const { title, content, content_type, duration, tags, source, channel } = data || inputData;
                            
                            if (!title || !content) {
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Title and content are required'
                                }));
                                return;
                            }

                            const now = new Date().toISOString();
                            const query = `
                                INSERT INTO content (user_id, title, content, content_type, duration, 
                                                    tags, source, channel, timestampz, priority_order, is_active, CREATEDTIME, MODIFIEDTIME)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, true, ?, ?)
                            `;
                            
                            const result = await datastore.executeQuery(query, [
                                user_id, title, content, content_type, duration, 
                                tags.join(','), source, channel, now, now, now
                            ]);
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Content added successfully',
                                content_id: result.insertId,
                                user_id: user_id
                            }));
                        } catch (error) {
                            console.error('Error adding content:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Error adding content: ' + error.message
                            }));
                        }
                        break;

                    case 'update':
                        try {
                            const { content_id, title, content, content_type, duration, tags, source, channel } = data || inputData;
                            
                            if (!content_id) {
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Content ID is required'
                                }));
                                return;
                            }

                            // Validate user access to this specific content
                            const resourceValidation = await validateUserAccess(datastore, user_id, content_id);
                            if (!resourceValidation.valid) {
                                res.statusCode = 403;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: resourceValidation.error
                                }));
                                return;
                            }

                            const now = new Date().toISOString();
                            const updateFields = [];
                            const updateValues = [];
                            
                            if (title !== undefined) {
                                updateFields.push('title = ?');
                                updateValues.push(title);
                            }
                            if (content !== undefined) {
                                updateFields.push('content = ?');
                                updateValues.push(content);
                            }
                            if (content_type !== undefined) {
                                updateFields.push('content_type = ?');
                                updateValues.push(content_type);
                            }
                            if (duration !== undefined) {
                                updateFields.push('duration = ?');
                                updateValues.push(duration);
                            }
                            if (tags !== undefined) {
                                updateFields.push('tags = ?');
                                updateValues.push(tags.join(','));
                            }
                            if (source !== undefined) {
                                updateFields.push('source = ?');
                                updateValues.push(source);
                            }
                            if (channel !== undefined) {
                                updateFields.push('channel = ?');
                                updateValues.push(channel);
                            }
                            
                            updateFields.push('MODIFIEDTIME = ?');
                            updateValues.push(now);
                            updateValues.push(content_id, user_id);

                            const query = `
                                UPDATE content 
                                SET ${updateFields.join(', ')}
                                WHERE ROWID = ? AND user_id = ?
                            `;
                            
                            await datastore.executeQuery(query, updateValues);
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Content updated successfully',
                                content_id: content_id,
                                user_id: user_id
                            }));
                        } catch (error) {
                            console.error('Error updating content:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Error updating content: ' + error.message
                            }));
                        }
                        break;

                    case 'delete':
                        try {
                            const { content_id } = data || inputData;
                            
                            if (!content_id) {
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Content ID is required'
                                }));
                                return;
                            }

                            // Validate user access to this specific content
                            const resourceValidation = await validateUserAccess(datastore, user_id, content_id);
                            if (!resourceValidation.valid) {
                                res.statusCode = 403;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({
                                    success: false,
                                    message: resourceValidation.error
                                }));
                                return;
                            }

                            const query = `DELETE FROM content WHERE ROWID = ? AND user_id = ?`;
                            await datastore.executeQuery(query, [content_id, user_id]);
                            
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Content deleted successfully',
                                content_id: content_id,
                                user_id: user_id
                            }));
                        } catch (error) {
                            console.error('Error deleting content:', error);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Error deleting content: ' + error.message
                            }));
                        }
                        break;

                    default:
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Invalid action. Supported actions: getAll, add, update, delete'
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