const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    // Add CORS headers to all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    };

    try {
        // Manual body parsing for Advanced I/O
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                let inputData = {};
                if (body && body.trim()) {
                    try {
                        inputData = JSON.parse(body);
                    } catch (parseError) {
                        res.writeHead(400, { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        });
                        res.end(JSON.stringify({ success: false, message: 'Invalid JSON format' }));
                        return;
                    }
                }
                
                const { action } = inputData;
                
                const app = catalyst.initialize(req);
                const zcql = app.zcql();
                
                switch (action) {
                    case 'createTables': {
                        console.log('🗄️ [Setup] Creating database tables...');
                        
                        const tableQueries = [
                            `CREATE TABLE content (
                                ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
                                title VARCHAR(255) NOT NULL,
                                content TEXT NOT NULL,
                                source VARCHAR(255),
                                channel VARCHAR(255),
                                timestamp VARCHAR(255),
                                content_type VARCHAR(255) DEFAULT 'text',
                                is_active BOOLEAN DEFAULT TRUE,
                                created_time VARCHAR(255),
                                updated_time VARCHAR(255)
                            )`,
                            
                            `CREATE TABLE users (
                                ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
                                name VARCHAR(255) NOT NULL,
                                email VARCHAR(255) NOT NULL,
                                password VARCHAR(255) NOT NULL,
                                role VARCHAR(255) DEFAULT 'user',
                                is_active BOOLEAN DEFAULT TRUE,
                                last_login VARCHAR(255),
                                created_at VARCHAR(255),
                                updated_at VARCHAR(255)
                            )`,
                            
                            `CREATE TABLE media (
                                ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
                                name VARCHAR(255) NOT NULL,
                                description TEXT,
                                file_id VARCHAR(255),
                                file_name VARCHAR(255),
                                mime_type VARCHAR(255),
                                size_bytes BIGINT,
                                object_url VARCHAR(500),
                                bucket VARCHAR(255),
                                object_key VARCHAR(255),
                                is_public BOOLEAN DEFAULT TRUE,
                                metadata TEXT,
                                created_time VARCHAR(255),
                                updated_time VARCHAR(255)
                            )`,
                            
                            `CREATE TABLE playlists (
                                ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
                                name VARCHAR(255) NOT NULL,
                                description TEXT,
                                items TEXT,
                                is_active BOOLEAN DEFAULT FALSE,
                                created_at VARCHAR(255),
                                updated_at VARCHAR(255)
                            )`,
                            
                            `CREATE TABLE emergency_messages (
                                ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
                                title VARCHAR(255) NOT NULL,
                                message TEXT NOT NULL,
                                importance VARCHAR(255) DEFAULT 'high',
                                display_duration INT DEFAULT 30,
                                is_active BOOLEAN DEFAULT TRUE,
                                created_at VARCHAR(255),
                                updated_at VARCHAR(255)
                            )`
                        ];

                        const results = [];
                        let tablesCreated = 0;

                        // Execute each table creation query
                        for (let i = 0; i < tableQueries.length; i++) {
                            const query = tableQueries[i];
                            const tableName = query.match(/CREATE TABLE (\w+)/)[1];
                            
                            try {
                                console.log(`🔧 [Setup] Creating table: ${tableName}...`);
                                await zcql.executeZCQLQuery(query);
                                console.log(`✅ [Setup] Table ${tableName} created successfully`);
                                results.push({ table: tableName, status: 'created' });
                                tablesCreated++;
                            } catch (error) {
                                console.log(`⚠️ [Setup] Table ${tableName}: ${error.message}`);
                                if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                                    results.push({ table: tableName, status: 'exists' });
                                } else {
                                    results.push({ table: tableName, status: 'error', message: error.message });
                                }
                            }
                        }

                        // Add sample data
                        try {
                            console.log('📝 [Setup] Adding sample data...');
                            
                            const sampleDataQueries = [
                                `INSERT INTO users (name, email, password, role, created_at) VALUES 
                                ('Admin User', 'admin@atrium.com', 'admin123', 'admin', '${new Date().toISOString()}')`,
                                
                                `INSERT INTO content (title, content, source, content_type, is_active, created_time) VALUES 
                                ('Welcome Message', 'Welcome to Atrium!', 'manual', 'text', TRUE, '${new Date().toISOString()}'),
                                ('Test Bot Message', 'This is a test message from the bot', 'zoho_cliq', 'cliq_message', TRUE, '${new Date().toISOString()}')`,
                                
                                `INSERT INTO playlists (name, description, items, is_active, created_at) VALUES 
                                ('Default Playlist', 'Default content playlist', '[]', TRUE, '${new Date().toISOString()}')`,
                                
                                `INSERT INTO emergency_messages (title, message, importance, is_active, created_at) VALUES 
                                ('Test Emergency', 'This is a test emergency message', 'high', FALSE, '${new Date().toISOString()}')`
                            ];

                            for (const query of sampleDataQueries) {
                                try {
                                    await zcql.executeZCQLQuery(query);
                                    console.log('✅ [Setup] Sample data added successfully');
                                } catch (error) {
                                    console.log(`⚠️ [Setup] Sample data error: ${error.message}`);
                                }
                            }
                        } catch (error) {
                            console.log(`⚠️ [Setup] Sample data error: ${error.message}`);
                        }

                        res.writeHead(200, { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: `Database setup completed. ${tablesCreated} tables created.`,
                            results: results
                        }));
                        break;
                    }
                    
                    case 'testTables': {
                        console.log('🧪 [Setup] Testing database tables...');
                        
                        const testQueries = [
                            'SELECT COUNT(*) as count FROM content',
                            'SELECT COUNT(*) as count FROM users',
                            'SELECT COUNT(*) as count FROM media',
                            'SELECT COUNT(*) as count FROM playlists',
                            'SELECT COUNT(*) as count FROM emergency_messages'
                        ];

                        const results = [];
                        
                        for (const query of testQueries) {
                            try {
                                const result = await zcql.executeZCQLQuery(query);
                                const tableName = query.match(/FROM (\w+)/)[1];
                                results.push({ 
                                    table: tableName, 
                                    status: 'exists', 
                                    count: result[0].count || result[0].COUNT 
                                });
                            } catch (error) {
                                const tableName = query.match(/FROM (\w+)/)[1];
                                results.push({ 
                                    table: tableName, 
                                    status: 'missing', 
                                    error: error.message 
                                });
                            }
                        }

                        res.writeHead(200, { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: 'Database test completed',
                            results: results
                        }));
                        break;
                    }
                    
                    default:
                        res.writeHead(400, { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        });
                        res.end(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid action. Use "createTables" or "testTables"' 
                        }));
                }
            } catch (error) {
                res.writeHead(500, { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Database setup error: ' + error.message 
                }));
            }
        });
        
    } catch (error) {
        res.writeHead(500, { 
            'Content-Type': 'application/json',
            ...corsHeaders
        });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'Setup error: ' + error.message 
        }));
    }
};
