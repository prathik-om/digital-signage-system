const catalyst = require('zcatalyst-sdk-node');
const https = require('https');
const crypto = require('crypto');

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map();

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

// Helper function for rate limiting
function checkRateLimit(ip, action) {
    // Skip rate limiting for OAuth actions in development
    if (action === 'exchangeCode' || action === 'decodeIdToken') {
        return true;
    }

    const key = `${ip}:${action}`;
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutes (reduced from 15)
    const maxRequests = 20; // Max 20 requests per window (increased from 10)

    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }

    const record = rateLimitStore.get(key);
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        return true;
    }

    if (record.count >= maxRequests) {
        return false;
    }

    record.count++;
    return true;
}

// Helper function to validate input
function validateInput(data, requiredFields) {
    const errors = [];
    
    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            errors.push(`${field} is required`);
        }
    }
    
    // Email validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
    }
    
    // Code validation - OAuth codes can have various formats, let Zoho validate them
    // Only check that the code is not empty
    if (data.code && data.code.length < 10) {
        errors.push('Authorization code appears to be too short');
    }
    
    return errors;
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

    // Get client IP for rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

    try {
        // Parse request body (handle both JSON and form data)
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                let inputData;
                
                // Handle GET requests with query parameters
                if (req.method === 'GET') {
                    const url = new URL(req.url, `http://${req.headers.host}`);
                    inputData = {
                        action: url.searchParams.get('action'),
                        email: url.searchParams.get('email'),
                        password: url.searchParams.get('password'),
                        name: url.searchParams.get('name'),
                        code: url.searchParams.get('code'),
                        redirectUri: url.searchParams.get('redirectUri'),
                        accessToken: url.searchParams.get('accessToken'),
                        idToken: url.searchParams.get('idToken')
                    };
                } else {
                    // Handle POST requests
                    if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
                        // Handle form-encoded data
                        const formData = new URLSearchParams(body);
                        inputData = {
                            action: formData.get('action'),
                            email: formData.get('email'),
                            password: formData.get('password'),
                            name: formData.get('name'),
                            code: formData.get('code'),
                            redirectUri: formData.get('redirectUri'),
                            accessToken: formData.get('accessToken'),
                            idToken: formData.get('idToken')
                        };
                    } else if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
                        // Handle multipart form data
                        const formData = new URLSearchParams(body);
                        inputData = {
                            action: formData.get('action'),
                            email: formData.get('email'),
                            password: formData.get('password'),
                            name: formData.get('name'),
                            code: formData.get('code'),
                            redirectUri: formData.get('redirectUri'),
                            accessToken: formData.get('accessToken'),
                            idToken: formData.get('idToken')
                        };
                    } else if (req.headers['content-type'] && req.headers['content-type'].includes('text/plain')) {
                        // Handle text/plain (JSON as text)
                        inputData = JSON.parse(body || '{}');
                    } else {
                        // Handle JSON
                        inputData = JSON.parse(body || '{}');
                    }
                }
                
                const { action, email, password, name, code, redirectUri, accessToken, idToken } = inputData;

                // Validate action is provided
                if (!action) {
                    return sendJSONResponse(res, 400, {
                        success: false,
                        message: 'Action parameter is required'
                    });
                }

                // Check rate limiting
                if (!checkRateLimit(clientIP, action)) {
                    return sendJSONResponse(res, 429, {
                        success: false,
                        message: 'Too many requests. Please try again later.'
                    });
                }

                // Initialize Catalyst
                const app = catalyst.initialize(req);
                const datastore = app.datastore();
                const usersTable = datastore.table('users');

                switch (action) {
                    case 'login':
                        // Validate required fields
                        const loginErrors = validateInput(inputData, ['email', 'password']);
                        if (loginErrors.length > 0) {
                            return sendJSONResponse(res, 400, {
                                success: false,
                                message: 'Validation failed',
                                errors: loginErrors
                            });
                        }

                        try {
                            // Simple auth check (in production, use proper password hashing)
                            if (email === 'admin@atrium.com' && password === 'admin123') {
                                // Create or update user in database
                                const userData = {
                                    id: 1,
                                    name: 'Admin User',
                                    email: 'admin@atrium.com',
                                    role: 'admin',
                                    last_login: new Date().toISOString(),
                                    created_at: new Date().toISOString()
                                };

                                // Store user data in database
                                const insertResult = await usersTable.insertRow({
                                    ...userData
                                }).catch(async () => {
                                    // If user exists, update last login and return existing user
                                    const existingUser = await usersTable.getRow(1);
                                    await usersTable.updateRow({
                                        ROWID: 1,
                                        last_login: new Date().toISOString()
                                    });
                                    return existingUser;
                                });
                                
                                // Use the database ROWID as the user ID
                                const userId = insertResult.ROWID || 1;

                                return sendJSONResponse(res, 200, {
                                    success: true,
                                    user: userData,
                                    message: 'Login successful'
                                });
                            } else {
                                return sendJSONResponse(res, 401, {
                                    success: false,
                                    message: 'Invalid credentials'
                                });
                            }
                        } catch (error) {
                            console.error('Login error:', error);
                            return sendJSONResponse(res, 500, {
                                success: false,
                                message: 'Login failed due to server error'
                            });
                        }
                        break;

                    case 'register':
                        // Validate required fields
                        const registerErrors = validateInput(inputData, ['email', 'password', 'name']);
                        if (registerErrors.length > 0) {
                            return sendJSONResponse(res, 400, {
                                success: false,
                                message: 'Validation failed',
                                errors: registerErrors
                            });
                        }

                        try {
                            // Check if user already exists
                            const existingUsers = await usersTable.getRows({
                                criteria: `email = '${email}'`
                            });

                            if (existingUsers.length > 0) {
                                return sendJSONResponse(res, 409, {
                                    success: false,
                                    message: 'User with this email already exists'
                                });
                            }

                            // Create new user (in production, hash the password)
                            const newUser = {
                                name: name,
                                email: email,
                                password: password, // In production, hash this
                                role: 'user',
                                created_at: new Date().toISOString(),
                                last_login: null
                            };

                            const insertResult = await usersTable.insertRow(newUser);
                            
                            return sendJSONResponse(res, 201, {
                                success: true,
                                message: 'User registered successfully',
                                user: {
                                    id: insertResult.ROWID,
                                    name: newUser.name,
                                    email: newUser.email,
                                    role: newUser.role
                                }
                            });
                        } catch (error) {
                            console.error('Registration error:', error);
                            return sendJSONResponse(res, 500, {
                                success: false,
                                message: 'Registration failed due to server error'
                            });
                        }
                        break;

                    case 'ping':
                        // Warm-up ping to reduce cold start delays
                        return sendJSONResponse(res, 200, {
                            success: true,
                            message: 'Backend warmed up',
                            timestamp: Date.now()
                        });

                    case 'debugUsers':
                        console.log('🔍 [Debug] Checking all tables...');
                        try {
                            const usersTable = datastore.table('users');
                            const contentTable = datastore.table('content');
                            const playlistsTable = datastore.table('playlists');
                            
                            const allUsers = await usersTable.getAllRows();
                            const allContent = await contentTable.getAllRows();
                            const allPlaylists = await playlistsTable.getAllRows();
                            
                            console.log('👥 [Debug] Total users found:', allUsers.length);
                            console.log('📄 [Debug] Total content found:', allContent.length);
                            console.log('📋 [Debug] Total playlists found:', allPlaylists.length);
                            
                            const userSummary = allUsers.map(user => ({
                                ROWID: user.ROWID,
                                email: user.email,
                                name: user.name,
                                role: user.role,
                                created_at: user.created_at,
                                last_login: user.last_login
                            }));
                            
                            const contentSummary = allContent.map(item => ({
                                ROWID: item.ROWID,
                                title: item.title,
                                user_id: item.user_id,
                                file_type: item.file_type
                            }));
                            
                            const playlistSummary = allPlaylists.map(playlist => ({
                                ROWID: playlist.ROWID,
                                name: playlist.name,
                                user_id: playlist.user_id
                            }));
                            
                            console.log('👥 [Debug] Users:', JSON.stringify(userSummary, null, 2));
                            console.log('📄 [Debug] Content:', JSON.stringify(contentSummary, null, 2));
                            console.log('📋 [Debug] Playlists:', JSON.stringify(playlistSummary, null, 2));
                            
                            return sendJSONResponse(res, 200, {
                                success: true,
                                message: 'Database debug info',
                                totalUsers: allUsers.length,
                                totalContent: allContent.length,
                                totalPlaylists: allPlaylists.length,
                                users: userSummary,
                                content: contentSummary,
                                playlists: playlistSummary
                            });
                        } catch (error) {
                            console.error('❌ [Debug] Error checking tables:', error);
                            return sendJSONResponse(res, 500, {
                                success: false,
                                message: 'Failed to check database tables',
                                error: error.message
                            });
                        }

                    case 'fixUserSchema':
                        console.log('🔧 [Schema] Fixing users table schema for OAuth...');
                        try {
                            const usersTable = datastore.table('users');
                            
                            // Note: We can't directly ALTER TABLE via Catalyst SDK
                            // This will provide instructions for manual schema updates
                            const missingColumns = [
                                'first_name VARCHAR(255) NULL',
                                'last_name VARCHAR(255) NULL', 
                                'picture VARCHAR(500) NULL',
                                'phone VARCHAR(50) NULL',
                                'email_verified BOOLEAN DEFAULT FALSE'
                            ];
                            
                            const instructions = [
                                '1. Go to Catalyst Console > Data Store > users table',
                                '2. Add these columns:',
                                ...missingColumns.map(col => `   - ${col}`),
                                '3. Also make the "password" column NULLABLE (for OAuth users)',
                                '4. After making these changes, try logging in again'
                            ];
                            
                            console.log('📋 [Schema] Manual schema update required:');
                            instructions.forEach(instruction => console.log(instruction));
                            
                            return sendJSONResponse(res, 200, {
                                success: true,
                                message: 'Users table schema fix instructions',
                                instructions: instructions,
                                missingColumns: missingColumns
                            });
                        } catch (error) {
                            console.error('❌ [Schema] Error with schema fix:', error);
                            return sendJSONResponse(res, 500, {
                                success: false,
                                message: 'Failed to provide schema fix instructions',
                                error: error.message
                            });
                        }

                    case 'testUserInsert':
                        console.log('🧪 [Test] Testing user insert with minimal data...');
                        try {
                            const usersTable = datastore.table('users');
                            
                            // Try to insert a test user with all required columns
                            const testUserData = {
                                name: 'Test OAuth User',
                                email: 'test@example.com',
                                role: 'user',
                                last_login: new Date().toISOString(),
                                user_id: 'test_user_001'
                            };
                            
                            console.log('🧪 [Test] Attempting to insert test user:', testUserData);
                            
                            const insertResult = await usersTable.insertRow(testUserData);
                            console.log('✅ [Test] Test user insert successful:', insertResult);
                            
                            // Clean up - delete the test user
                            await usersTable.deleteRow(insertResult.ROWID);
                            console.log('🧹 [Test] Test user cleaned up');
                            
                            return sendJSONResponse(res, 200, {
                                success: true,
                                message: 'Test user insert successful - basic schema is working',
                                testResult: insertResult
                            });
                        } catch (error) {
                            console.error('❌ [Test] Test user insert failed:', error);
                            return sendJSONResponse(res, 500, {
                                success: false,
                                message: 'Test user insert failed - schema issue detected',
                                error: error.message,
                                errorCode: error.code,
                                fullError: error.toString(),
                                stack: error.stack
                            });
                        }

                    case 'testOAuthUserInsert':
                        console.log('🧪 [Test] Testing OAuth user insert with real data...');
                        try {
                            const usersTable = datastore.table('users');
                            
                            // Try to insert a user with the exact same data structure as OAuth
                            const oauthUserData = {
                                name: 'Sbprathik',
                                email: 'prathik@bathija.zillum.in',
                                role: 'user',
                                last_login: new Date().toISOString(),
                                user_id: 'prathik@bathija.zillum.in'
                            };
                            
                            console.log('🧪 [Test] Attempting to insert OAuth user:', oauthUserData);
                            
                            const insertResult = await usersTable.insertRow(oauthUserData);
                            console.log('✅ [Test] OAuth user insert successful:', insertResult);
                            
                            // Clean up - delete the test user
                            await usersTable.deleteRow(insertResult.ROWID);
                            console.log('🧹 [Test] OAuth test user cleaned up');
                            
                            return sendJSONResponse(res, 200, {
                                success: true,
                                message: 'OAuth user insert successful - OAuth flow should work',
                                testResult: insertResult
                            });
                        } catch (error) {
                            console.error('❌ [Test] OAuth user insert failed:', error);
                            return sendJSONResponse(res, 500, {
                                success: false,
                                message: 'OAuth user insert failed',
                                error: error.message,
                                errorCode: error.code,
                                fullError: error.toString()
                            });
                        }

                    case 'checkExistingUser':
                        console.log('🔍 [Check] Checking if OAuth user already exists...');
                        try {
                            const usersTable = datastore.table('users');
                            
                            // Check if user exists by email
                            const allUsers = await usersTable.getAllRows();
                            const existingUsers = allUsers.filter(user => user.email === 'prathik@bathija.zillum.in');
                            
                            console.log('🔍 [Check] Existing users found:', existingUsers.length);
                            
                            if (existingUsers.length > 0) {
                                console.log('👤 [Check] Found existing user:', existingUsers[0]);
                            }
                            
                            // Also check by user_id
                            const existingByUserId = allUsers.filter(user => user.user_id === 'prathik@bathija.zillum.in');
                            
                            console.log('🔍 [Check] Existing users by user_id:', existingByUserId.length);
                            
                            return sendJSONResponse(res, 200, {
                                success: true,
                                message: 'User existence check completed',
                                byEmail: existingUsers.length,
                                byUserId: existingByUserId.length,
                                existingUser: existingUsers.length > 0 ? existingUsers[0] : null
                            });
                        } catch (error) {
                            console.error('❌ [Check] Error checking existing user:', error);
                            return sendJSONResponse(res, 500, {
                                success: false,
                                message: 'Failed to check existing user',
                                error: error.message
                            });
                        }

                    case 'migrateUserData':
                        console.log('🔄 [Migrate] Migrating user data from default_user_001 to real user ID...');
                        try {
                            const contentTable = datastore.table('content');
                            const playlistsTable = datastore.table('playlists');
                            
                            // Get your real user ID
                            const allUsers = await usersTable.getAllRows();
                            const yourUser = allUsers.find(user => user.email === 'prathik@bathija.zillum.in');
                            
                            if (!yourUser) {
                                return sendJSONResponse(res, 400, {
                                    success: false,
                                    message: 'User not found in database'
                                });
                            }
                            
                            const realUserId = yourUser.ROWID.toString();
                            console.log('🔄 [Migrate] Real user ID:', realUserId);
                            
                            // Update content
                            const allContent = await contentTable.getAllRows();
                            const contentToUpdate = allContent.filter(item => item.user_id === 'default_user_001');
                            
                            console.log('🔄 [Migrate] Found content to update:', contentToUpdate.length);
                            
                            let updatedContent = 0;
                            for (const item of contentToUpdate) {
                                try {
                                    await contentTable.updateRow({
                                        ROWID: item.ROWID,
                                        user_id: realUserId
                                    });
                                    updatedContent++;
                                } catch (error) {
                                    console.error('❌ [Migrate] Failed to update content item:', item.ROWID, error);
                                }
                            }
                            
                            // Update playlists
                            const allPlaylists = await playlistsTable.getAllRows();
                            const playlistsToUpdate = allPlaylists.filter(playlist => playlist.user_id === 'default_user_001');
                            
                            console.log('🔄 [Migrate] Found playlists to update:', playlistsToUpdate.length);
                            
                            let updatedPlaylists = 0;
                            for (const playlist of playlistsToUpdate) {
                                try {
                                    await playlistsTable.updateRow({
                                        ROWID: playlist.ROWID,
                                        user_id: realUserId
                                    });
                                    updatedPlaylists++;
                                } catch (error) {
                                    console.error('❌ [Migrate] Failed to update playlist:', playlist.ROWID, error);
                                }
                            }
                            
                            return sendJSONResponse(res, 200, {
                                success: true,
                                message: 'User data migration completed',
                                realUserId: realUserId,
                                updatedContent: updatedContent,
                                updatedPlaylists: updatedPlaylists
                            });
                        } catch (error) {
                            console.error('❌ [Migrate] Error migrating user data:', error);
                            return sendJSONResponse(res, 500, {
                                success: false,
                                message: 'Failed to migrate user data',
                                error: error.message
                            });
                        }
                        
                    case 'exchangeCode':
                        // Debug logging with timing
                        const receivedAt = Date.now();
                        const clientTimestamp = inputData.timestamp || 'not provided';
                        const processingDelay = clientTimestamp !== 'not provided' ? receivedAt - clientTimestamp : 'unknown';
                        
                        console.log('ExchangeCode request received:', {
                            action: inputData.action,
                            code: inputData.code ? inputData.code.substring(0, 10) + '...' : 'undefined',
                            redirectUri: inputData.redirectUri,
                            hasCode: !!inputData.code,
                            hasRedirectUri: !!inputData.redirectUri,
                            clientTimestamp: clientTimestamp,
                            receivedAt: receivedAt,
                            processingDelay: processingDelay + 'ms'
                        });
                        
                        // Validate required fields
                        const exchangeErrors = validateInput(inputData, ['code', 'redirectUri']);
                        if (exchangeErrors.length > 0) {
                            console.log('Validation errors:', exchangeErrors);
                            return sendJSONResponse(res, 400, {
                                success: false,
                                message: 'Validation failed',
                                errors: exchangeErrors
                            });
                        }

                        try {
                            console.log('Starting token exchange for code:', code.substring(0, 10) + '...');
                            
                            // Exchange authorization code for access token and ID token
                            const tokenData = await exchangeCodeForToken(code, redirectUri);
                            
                            console.log('Token exchange successful');
                            
                            return sendJSONResponse(res, 200, {
                                success: true,
                                access_token: tokenData.access_token,
                                id_token: tokenData.id_token,
                                refresh_token: tokenData.refresh_token,
                                expires_in: tokenData.expires_in,
                                token_type: tokenData.token_type || 'Bearer'
                            });
                        } catch (error) {
                            console.error('Token exchange error:', error);
                            return sendJSONResponse(res, 400, {
                                success: false,
                                message: 'Failed to exchange code for token',
                                error: error.message
                            });
                        }
                        break;

                    case 'getUserInfo':
                        // Validate required fields
                        const userInfoErrors = validateInput(inputData, ['accessToken']);
                        if (userInfoErrors.length > 0) {
                            return sendJSONResponse(res, 400, {
                                success: false,
                                message: 'Validation failed',
                                errors: userInfoErrors
                            });
                        }

                        try {
                            // Get user information from Zoho
                            const userInfo = await getZohoUserInfo(accessToken);
                            
                            return sendJSONResponse(res, 200, {
                                success: true,
                                user: userInfo
                            });
                        } catch (error) {
                            console.error('Get user info error:', error);
                            return sendJSONResponse(res, 400, {
                                success: false,
                                message: 'Failed to get user information',
                                error: error.message
                            });
                        }
                        break;

                    case 'decodeIdToken':
                        // Validate required fields
                        const decodeErrors = validateInput(inputData, ['idToken']);
                        if (decodeErrors.length > 0) {
                            return sendJSONResponse(res, 400, {
                                success: false,
                                message: 'Validation failed',
                                errors: decodeErrors
                            });
                        }

                        try {
                            // Decode ID token to get user information
                            console.log('🔍 [Auth] Starting decodeIdToken action...');
                            console.log('🔍 [Auth] ID token length:', idToken ? idToken.length : 'null');
                            
                            const userInfo = decodeIdToken(idToken);
                            console.log('✅ [Auth] ID token decoded successfully');
                            console.log('👤 [Auth] Decoded user info:', {
                                email: userInfo.email,
                                first_name: userInfo.first_name,
                                last_name: userInfo.last_name,
                                full_name: userInfo.full_name
                            });
                            
                            // Store user in database if not exists
                            console.log('💾 [Auth] Attempting to store user in database...');
                            console.log('👤 [Auth] User info to store:', {
                                email: userInfo.email,
                                name: userInfo.full_name || `${userInfo.first_name} ${userInfo.last_name}`,
                                first_name: userInfo.first_name,
                                last_name: userInfo.last_name,
                                picture: userInfo.picture,
                                phone: userInfo.phone,
                                email_verified: userInfo.email_verified
                            });
                            
                            try {
                                const allUsers = await usersTable.getAllRows();
                                const existingUsers = allUsers.filter(user => user.email === userInfo.email);
                                console.log('🔍 [Auth] Existing users found:', existingUsers.length);

                                let userId;
                                if (existingUsers.length === 0) {
                                    console.log('🆕 [Auth] Creating new user...');
                                    // Create new user from OAuth data (using all required columns)
                                    const insertResult = await usersTable.insertRow({
                                        name: userInfo.full_name || `${userInfo.first_name} ${userInfo.last_name}`,
                                        email: userInfo.email,
                                        role: 'user',
                                        last_login: new Date().toISOString(),
                                        created_at: new Date().toISOString()
                                    });
                                    userId = insertResult.ROWID;
                                    console.log('✅ [Auth] Successfully created new user with ID:', userId);
                                } else {
                                    console.log('🔄 [Auth] Updating existing user...');
                                    // Update last login
                                    userId = existingUsers[0].ROWID;
                                    await usersTable.updateRow({
                                        ROWID: userId,
                                        last_login: new Date().toISOString()
                                    });
                                    console.log('✅ [Auth] Successfully updated existing user with ID:', userId);
                                }
                                
                                // Add the database user ID to the user info
                                userInfo.id = userId.toString();
                                console.log('🎯 [Auth] Final user ID set to:', userInfo.id);
                            } catch (dbError) {
                                console.error('❌ [Auth] Database operation failed:', dbError);
                                console.error('❌ [Auth] Error details:', {
                                    message: dbError.message,
                                    code: dbError.code,
                                    stack: dbError.stack
                                });
                                // Continue with token decode even if DB fails
                            }
                            
                            return sendJSONResponse(res, 200, {
                                success: true,
                                user: userInfo
                            });
                        } catch (error) {
                            console.error('Decode ID token error:', error);
                            return sendJSONResponse(res, 400, {
                                success: false,
                                message: 'Failed to decode ID token',
                                error: error.message
                            });
                        }
                        break;

                    case 'refreshToken':
                        // Validate required fields
                        const refreshErrors = validateInput(inputData, ['refreshToken']);
                        if (refreshErrors.length > 0) {
                            return sendJSONResponse(res, 400, {
                                success: false,
                                message: 'Validation failed',
                                errors: refreshErrors
                            });
                        }

                        try {
                            const { refreshToken } = inputData;
                            console.log('Refresh token request received for token:', refreshToken.substring(0, 10) + '...');

                            // Exchange refresh token for new access token
                            const newTokens = await refreshAccessToken(refreshToken);
                            
                            console.log('Token refresh successful');
                            return sendJSONResponse(res, 200, {
                                success: true,
                                access_token: newTokens.access_token,
                                refresh_token: newTokens.refresh_token,
                                expires_in: newTokens.expires_in,
                                token_type: newTokens.token_type
                            });

                        } catch (error) {
                            console.error('Token refresh error:', error);
                            return sendJSONResponse(res, 400, {
                                success: false,
                                message: 'Failed to refresh token',
                                error: error.message
                            });
                        }
                        break;

                    default:
                        return sendJSONResponse(res, 400, {
                            success: false,
                            message: 'Invalid action. Supported actions: login, register, exchangeCode, getUserInfo, decodeIdToken, refreshToken'
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

// Helper function to refresh access token using refresh token
async function refreshAccessToken(refreshToken) {
    return new Promise((resolve, reject) => {
        const postData = new URLSearchParams({
            refresh_token: refreshToken,
            client_id: '1000.A7GBW3AR476CCTVPXTK10OXJ8CRNXL',
            client_secret: 'f3095200dfc571690de631ebe22b8c15685d074f31',
            grant_type: 'refresh_token'
        }).toString();

        const options = {
            hostname: 'accounts.zoho.in',
            port: 443,
            path: '/oauth/v2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    console.log('Zoho refresh token response status:', res.statusCode);
                    console.log('Zoho refresh token response headers:', res.headers);
                    console.log('Zoho refresh token response body:', data);

                    if (res.statusCode !== 200) {
                        throw new Error(`HTTP ${res.statusCode}: ${data}`);
                    }

                    // Check if response is HTML (error page)
                    if (data.trim().startsWith('<')) {
                        throw new Error('Received HTML error page instead of JSON');
                    }

                    const tokenData = JSON.parse(data);
                    
                    if (tokenData.error) {
                        throw new Error(`Zoho error: ${tokenData.error} - ${tokenData.error_description || ''}`);
                    }

                    if (!tokenData.access_token) {
                        throw new Error('No access token in response');
                    }

                    resolve(tokenData);
                } catch (error) {
                    console.error('Failed to parse Zoho refresh token response:', error);
                    reject(new Error(`Failed to refresh token: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error during token refresh:', error);
            reject(new Error(`Request failed: ${error.message}`));
        });

        req.write(postData);
        req.end();
    });
}

// Helper function to exchange authorization code for access token
async function exchangeCodeForToken(code, redirectUri) {
    return new Promise((resolve, reject) => {
        // Validate inputs
        if (!code || !redirectUri) {
            return reject(new Error('Code and redirectUri are required'));
        }

        // Zoho expects form-encoded data, not JSON
        const postParams = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.ZOHO_CLIENT_ID || '1000.A7GBW3AR476CCTVPXTK10OXJ8CRNXL',
            client_secret: process.env.ZOHO_CLIENT_SECRET || 'f3095200dfc571690de631ebe22b8c15685d074f31',
            redirect_uri: redirectUri,
            code: code
        });
        
        const postData = postParams.toString();

        console.log('Making token request to Zoho with redirectUri:', redirectUri);
        console.log('Request data:', postData);
        console.log('Environment variables:', {
            ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID,
            ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET ? 'SET' : 'NOT SET'
        });

        const options = {
            hostname: 'accounts.zoho.in',
            port: 443,
            path: '/oauth/v2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'ProjectorP-Auth/1.0'
            },
            timeout: 30000 // 30 second timeout
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    console.log('Zoho token response status:', res.statusCode);
                    console.log('Zoho token response headers:', res.headers);
                    console.log('Zoho token response body:', data);
                    
                    // Check if response is HTML (error page)
                    if (data.trim().startsWith('<')) {
                        console.error('Zoho returned HTML error page:', data.substring(0, 200));
                        return reject(new Error(`Zoho returned HTML error page (status ${res.statusCode}). Check client credentials and redirect URI.`));
                    }
                    
                    const response = JSON.parse(data);
                    
                    if (res.statusCode !== 200) {
                        return reject(new Error(`HTTP ${res.statusCode}: ${response.error_description || response.error || 'Unknown error'}`));
                    }
                    
                    if (response.error) {
                        return reject(new Error(response.error_description || response.error));
                    }
                    
                    if (!response.access_token) {
                        return reject(new Error('No access token received from Zoho'));
                    }
                    
                    resolve(response);
                } catch (parseError) {
                    console.error('Failed to parse Zoho response:', data);
                    reject(new Error(`Failed to parse Zoho response: ${parseError.message}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('HTTPS request error:', error);
            reject(new Error(`Network error: ${error.message}`));
        });

        req.on('timeout', () => {
            console.error('Request timeout');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
    });
}

// Helper function to get user information from Zoho using OpenID Connect
async function getZohoUserInfo(accessToken) {
    return new Promise((resolve, reject) => {
        // Validate input
        if (!accessToken) {
            return reject(new Error('Access token is required'));
        }

        const options = {
            hostname: 'accounts.zoho.in',
            port: 443,
            path: '/oauth/user/info',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'ProjectorP-Auth/1.0'
            },
            timeout: 30000 // 30 second timeout
        };

        console.log('Making user info request to Zoho');

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    console.log('Zoho user info response status:', res.statusCode);
                    console.log('Zoho user info response body:', data);
                    
                    const response = JSON.parse(data);
                    
                    if (res.statusCode !== 200) {
                        return reject(new Error(`HTTP ${res.statusCode}: ${response.error_description || response.error || 'Unknown error'}`));
                    }
                    
                    if (response.error) {
                        return reject(new Error(response.error_description || response.error));
                    }
                    
                    // Map the OIDC user info response to our expected format
                    const userInfo = {
                        id: response.sub || response.id,
                        email: response.email,
                        first_name: response.given_name || response.first_name,
                        last_name: response.family_name || response.last_name,
                        full_name: response.name,
                        picture: response.picture,
                        phone: response.phone_number,
                        email_verified: response.email_verified,
                        phone_verified: response.phone_number_verified,
                        gender: response.gender
                    };
                    
                    resolve(userInfo);
                } catch (parseError) {
                    console.error('Failed to parse Zoho user info response:', data);
                    reject(new Error(`Failed to parse Zoho user info response: ${parseError.message}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('HTTPS request error:', error);
            reject(new Error(`Network error: ${error.message}`));
        });

        req.on('timeout', () => {
            console.error('Request timeout');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Helper function to decode ID token (JWT)
function decodeIdToken(idToken) {
    try {
        // Validate input
        if (!idToken || typeof idToken !== 'string') {
            throw new Error('ID token is required and must be a string');
        }

        // JWT has three parts: header.payload.signature
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format - must have 3 parts separated by dots');
        }

        // Decode the payload (second part)
        const payload = parts[1];
        
        // Add padding if needed for base64 decoding
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        
        let decodedPayload;
        try {
            decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8');
        } catch (base64Error) {
            throw new Error('Invalid base64 encoding in JWT payload');
        }
        
        let claims;
        try {
            claims = JSON.parse(decodedPayload);
        } catch (jsonError) {
            throw new Error('Invalid JSON in JWT payload');
        }

        // Validate required claims
        if (!claims.sub) {
            throw new Error('Missing required claim: sub (subject)');
        }

        if (!claims.email) {
            throw new Error('Missing required claim: email');
        }

        // Check token expiration
        if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('ID token has expired');
        }

        console.log('Successfully decoded ID token for user:', claims.email);

        // Map the OIDC claims to our expected format
        return {
            id: claims.sub,
            email: claims.email,
            first_name: claims.first_name || claims.given_name || '',
            last_name: claims.last_name || claims.family_name || '',
            full_name: claims.name || `${claims.first_name || claims.given_name || ''} ${claims.last_name || claims.family_name || ''}`.trim(),
            picture: claims.picture || null,
            phone: claims.phone_number || null,
            email_verified: claims.email_verified || false,
            phone_verified: claims.phone_number_verified || false,
            gender: claims.gender || null,
            iss: claims.iss, // issuer
            aud: claims.aud, // audience
            exp: claims.exp, // expiration
            iat: claims.iat  // issued at
        };
    } catch (error) {
        console.error('ID token decode error:', error);
        throw new Error(`Failed to decode ID token: ${error.message}`);
    }
}