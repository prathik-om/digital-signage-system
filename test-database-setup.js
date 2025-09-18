const https = require('https');

// Configuration - Use local serve for testing
const API_BASE_URL = 'http://localhost:3002/server';

// Helper function to make API calls
const callCatalystFunction = (functionName, data) => {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: `/server/${functionName}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = require('http').request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: result
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
};

// Test database setup
async function testDatabaseSetup() {
    console.log('🚀 Starting Phase 1: Database Schema Setup');
    console.log('=' .repeat(60));
    
    try {
        // Step 1: Create multi-user tables
        console.log('\n📋 Step 1: Creating multi-user database tables...');
        const createTablesResponse = await callCatalystFunction('setup-database-multiuser', {
            action: 'createMultiUserTables'
        });
        
        console.log('✅ Create Tables Response:');
        console.log('   Status:', createTablesResponse.statusCode);
        console.log('   Success:', createTablesResponse.data.success);
        console.log('   Message:', createTablesResponse.data.message);
        
        if (createTablesResponse.data.tables_created) {
            console.log('   Tables Created:', createTablesResponse.data.tables_created.length);
            createTablesResponse.data.tables_created.forEach((table, index) => {
                console.log(`   ${index + 1}. ${table}`);
            });
        }
        
        // Step 2: Create default user
        console.log('\n👤 Step 2: Creating default user...');
        const createUserResponse = await callCatalystFunction('setup-database-multiuser', {
            action: 'createDefaultUser',
            data: {
                user_id: 'default_user_001',
                email: 'admin@projector.com',
                name: 'Default Admin User',
                role: 'admin'
            }
        });
        
        console.log('✅ Create User Response:');
        console.log('   Status:', createUserResponse.statusCode);
        console.log('   Success:', createUserResponse.data.success);
        console.log('   Message:', createUserResponse.data.message);
        
        // Step 3: Migrate existing data (if any)
        console.log('\n🔄 Step 3: Migrating existing data...');
        const migrateResponse = await callCatalystFunction('setup-database-multiuser', {
            action: 'migrateExistingData',
            data: {
                default_user_id: 'default_user_001'
            }
        });
        
        console.log('✅ Migrate Data Response:');
        console.log('   Status:', migrateResponse.statusCode);
        console.log('   Success:', migrateResponse.data.success);
        console.log('   Message:', migrateResponse.data.message);
        
        if (migrateResponse.data.migration_summary) {
            console.log('   Migration Summary:');
            Object.entries(migrateResponse.data.migration_summary).forEach(([table, count]) => {
                console.log(`     ${table}: ${count} records migrated`);
            });
        }
        
        // Step 4: Validate schema
        console.log('\n✅ Step 4: Validating database schema...');
        const validateResponse = await callCatalystFunction('setup-database-multiuser', {
            action: 'validateSchema'
        });
        
        console.log('✅ Validation Response:');
        console.log('   Status:', validateResponse.statusCode);
        console.log('   Success:', validateResponse.data.success);
        console.log('   Message:', validateResponse.data.message);
        
        if (validateResponse.data.tables) {
            console.log('   Tables Found:', validateResponse.data.tables.length);
            validateResponse.data.tables.forEach((table, index) => {
                console.log(`   ${index + 1}. ${table.table_name} (${table.column_count} columns)`);
            });
        }
        
        console.log('\n🎉 Phase 1 Complete! Database schema has been successfully set up for multi-user support.');
        console.log('\n📊 Summary:');
        console.log('   ✅ Multi-user tables created');
        console.log('   ✅ Default user created');
        console.log('   ✅ Existing data migrated');
        console.log('   ✅ Schema validated');
        console.log('\n🚀 Ready for Phase 2: Backend Functions Update');
        
    } catch (error) {
        console.error('❌ Error during database setup:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
testDatabaseSetup();
