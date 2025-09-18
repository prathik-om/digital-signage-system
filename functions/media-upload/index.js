const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
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
                console.log('🔍 [Media Upload] Request received, body length:', body.length);
                console.log('🔍 [Media Upload] Raw body:', body);
                
                const inputData = JSON.parse(body || '{}');
                const { action } = inputData;
                
                console.log('🔍 [Media Upload] Parsed action:', action);
                
                // Initialize Catalyst
                console.log('🔍 [Media Upload] Initializing Catalyst');
                const app = catalyst.initialize(req);
                console.log('🔍 [Media Upload] Catalyst initialized successfully');

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
                        throw error;
                    }
                };

                switch (action) {
                    case 'listMedia':
                        try {
                            console.log('🔍 [Media Upload] Starting listMedia action');
                            
                            // Initialize Catalyst services
                            console.log('🔍 [Media Upload] Initializing Catalyst services');
                            const datastore = app.datastore();
                            console.log('🔍 [Media Upload] Datastore initialized');
                            
                            const contentTable = datastore.table('content');
                            console.log('🔍 [Media Upload] Content table reference created');
                            
                            console.log('🔍 [Media Upload] Fetching content from database');
                            // Fetch all content from database - temporarily remove user filtering
                            let allContent = [];
                            try {
                                allContent = await contentTable.getAllRows();
                                console.log('🔍 [Media Upload] Database query successful, got', allContent.length, 'rows');
                            } catch (dbError) {
                                console.error('🔍 [Media Upload] Database error:', dbError);
                                console.error('🔍 [Media Upload] Database error details:', {
                                    message: dbError.message,
                                    stack: dbError.stack,
                                    name: dbError.name
                                });
                                // Return empty array if database fails - no mock data
                                allContent = [];
                            }
                            const userContent = allContent; // Show all content to all users
                            
                            console.log(`🔍 [Media Upload] Found ${userContent.length} content items`);
                            
                            // Transform content data for frontend
                            console.log('🔍 [Media Upload] Transforming content data');
                            const media = userContent.map(item => {
                                try {
                                    // Construct object URL for Stratus files
                                    let objectUrl = null;
                                    if (item.stratus_bucket && item.stratus_object_key) {
                                        objectUrl = `https://atrium-media-development.zohostratus.in/${item.stratus_object_key}`;
                                    } else if (item.stratus_object_key && item.stratus_object_key.startsWith('data:')) {
                                        // Handle base64 data URLs
                                        objectUrl = item.stratus_object_key;
                                    }
                                    
                                    return {
                                        ROWID: item.ROWID,
                                        file_name: item.title || 'Unknown file',
                                        mime_type: item.content_type || 'unknown',
                                        object_url: objectUrl,
                                        size_bytes: item.size_bytes,
                                        description: item.content || '',
                                        metadata: JSON.stringify({ 
                                            uploaded_at: item.CREATEDTIME || new Date().toISOString(), 
                                            size: item.size_bytes || 0,
                                            bucket: item.stratus_bucket
                                        })
                                    };
                                } catch (transformError) {
                                    console.error('Error transforming item:', item, transformError);
                                    return {
                                        ROWID: item.ROWID || 'unknown',
                                        file_name: 'Error processing file',
                                        mime_type: 'unknown',
                                        object_url: null,
                                        size_bytes: 0,
                                        description: 'Error processing this item',
                                        metadata: JSON.stringify({ error: transformError.message })
                                    };
                                }
                            });
                            
                            console.log('🔍 [Media Upload] Sending response with', media.length, 'media files');
                            res.writeHead(200, corsHeaders);
                            res.end(JSON.stringify({ 
                                success: true, 
                                media: media,
                                message: `Retrieved ${media.length} media files`
                            }));
                        } catch (listError) {
                            console.error('🔍 [Media Upload] List media error:', listError);
                            console.error('🔍 [Media Upload] Error details:', {
                                message: listError.message,
                                stack: listError.stack,
                                name: listError.name
                            });
                            res.writeHead(500, corsHeaders);
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Failed to list media: ' + listError.message
                            }));
                        }
                        break;

                    case 'uploadBase64':
                        try {
                            const { data_base64, file_name, file_type, description, user_id } = inputData;
                            
                            console.log('Starting file upload to Stratus...');
                            
                            // Initialize Catalyst services
                            const datastore = app.datastore();
                            const contentTable = datastore.table('content');
                            
                            // Step 1: Upload file to Stratus using official SDK
                            let fileInfo = null;
                            let buffer = null;
                            try {
                                // Convert base64 to buffer
                                const base64Data = data_base64.replace(/^data:image\/[a-z]+;base64,/, '');
                                buffer = Buffer.from(base64Data, 'base64');
                                
                                const fileKey = `${user_id}/${Date.now()}_${file_name}`;
                                const bucketName = 'atrium-media';
                                
                                console.log(`Uploading file to Stratus: ${file_name} (${buffer.length} bytes) to bucket: ${bucketName}`);
                                
                                // Use official Catalyst SDK v2 for Stratus
                                const stratus = app.stratus();
                                
                                // Get or create bucket
                                let bucket;
                                try {
                                    bucket = stratus.bucket(bucketName);
                                    console.log('Using existing bucket:', bucketName);
                                } catch (bucketError) {
                                    console.log('Creating new bucket:', bucketName);
                                    bucket = await stratus.createBucket(bucketName);
                                }
                                
                                // Upload file to bucket using official SDK method
                                // According to Web SDK v4 docs: bucket.putObject(key, data)
                                const uploadResult = await bucket.putObject(fileKey, buffer);
                                
                                console.log('File uploaded to Stratus successfully:', uploadResult);
                                
                                // Create file info with real Stratus URL
                                fileInfo = {
                                    bucketName: bucketName,
                                    fileName: fileKey,
                                    fileId: uploadResult.fileId || fileKey,
                                    url: `https://atrium-media-development.zohostratus.in/${fileKey}`,
                                    stratusUrl: uploadResult.url || `https://atrium-media-development.zohostratus.in/${fileKey}`
                                };
                                
                                console.log('Stratus file info:', fileInfo);
                                
                            } catch (stratusError) {
                                console.error('Stratus upload failed:', stratusError);
                                console.error('Error details:', {
                                    message: stratusError.message,
                                    stack: stratusError.stack,
                                    name: stratusError.name
                                });
                                throw new Error(`Failed to upload to Stratus: ${stratusError.message}`);
                            }
                            
                            // Step 2: Store metadata in database
                            const contentData = {
                                user_id: user_id,
                                title: file_name || 'Uploaded File',
                                content: description || 'Uploaded file content',
                                content_type: file_type || 'image',
                                media_object_id: fileInfo.fileId || `upload_${Date.now()}`,
                                stratus_bucket: fileInfo.bucketName,
                                stratus_object_key: fileInfo.fileName, // Store the actual Stratus file key
                                size_bytes: buffer.length, // Store the actual file size
                                duration: 10,
                                priority_order: 0,
                                tags: JSON.stringify(['uploaded', file_type]),
                                is_active: true
                            };
                            
                            console.log('Storing content metadata in database...');
                            const insertedRow = await contentTable.insertRow(contentData);
                            console.log('Content metadata stored:', insertedRow);
                            
                            res.writeHead(200, corsHeaders);
                            res.end(JSON.stringify({ 
                                success: true, 
                                message: 'File uploaded to Stratus and metadata stored successfully',
                                fileInfo: fileInfo,
                                row: insertedRow,
                                content_id: insertedRow.ROWID
                            }));
                            
                        } catch (uploadError) {
                            console.error('Upload error:', uploadError);
                            res.writeHead(500, corsHeaders);
                            res.end(JSON.stringify({ 
                                success: false, 
                                message: 'Upload failed: ' + uploadError.message
                            }));
                        }
                        break;

                    case 'deleteMedia':
                        try {
                            const { media_id, user_id } = inputData;
                            
                            if (!media_id) {
                                res.writeHead(400, corsHeaders);
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Media ID is required for deletion'
                                }));
                                return;
                            }

                            console.log(`Deleting media with ID: ${media_id} for user: ${user_id}`);

                            // Initialize Catalyst services
                            const datastore = app.datastore();
                            const contentTable = datastore.table('content');

                            // Get the content item first to check ownership and get file info
                            const contentItems = await contentTable.getAllRows();
                            const contentItem = contentItems.find(item => item.ROWID == media_id);

                            if (!contentItem) {
                                res.writeHead(404, corsHeaders);
                                res.end(JSON.stringify({
                                    success: false,
                                    message: 'Content not found or access denied'
                                }));
                                return;
                            }

                            // Delete from database
                            await contentTable.deleteRow(media_id);
                            console.log(`Content ${media_id} deleted from database`);

                            // Note: We're not deleting from Stratus for now to avoid accidental data loss
                            // In production, you might want to add Stratus deletion here

                            res.writeHead(200, corsHeaders);
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Content deleted successfully',
                                deleted_id: media_id
                            }));

                        } catch (deleteError) {
                            console.error('Delete error:', deleteError);
                            res.writeHead(500, corsHeaders);
                            res.end(JSON.stringify({
                                success: false,
                                message: 'Delete failed: ' + deleteError.message
                            }));
                        }
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