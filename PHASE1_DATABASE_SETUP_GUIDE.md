# 🗄️ **Phase 1: Database Schema Setup Guide**

## 🚨 **Important: Manual Table Creation Required**

Since Catalyst doesn't allow creating tables via API, we need to create the tables manually through the Catalyst Console.

## 📋 **Step 1: Create Tables in Catalyst Console**

### **1.1: Access Catalyst Console**
1. Go to [https://catalyst.zoho.com](https://catalyst.zoho.com)
2. Login with your account: `prathik.s@zohotest.com`
3. Select your project: **Atrium (17550000000010120)**

### **1.2: Create Data Store Tables**

Navigate to **Data Store** → **Tables** and create the following tables:

#### **Table 1: users**
```sql
CREATE TABLE users (
    ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at VARCHAR(255),
    updated_at VARCHAR(255),
    last_login VARCHAR(255)
);
```

#### **Table 2: content**
```sql
CREATE TABLE content (
    ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(255) DEFAULT 'text',
    media_object_id VARCHAR(255),
    stratus_bucket VARCHAR(255),
    stratus_object_key VARCHAR(255),
    source VARCHAR(255),
    channel VARCHAR(255),
    timestampz VARCHAR(255),
    duration INT DEFAULT 10,
    priority_order INT DEFAULT 0,
    tags TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_time VARCHAR(255),
    updated_time VARCHAR(255)
);
```

#### **Table 3: playlists**
```sql
CREATE TABLE playlists (
    ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_time VARCHAR(255),
    updated_time VARCHAR(255)
);
```

#### **Table 4: playlist_items**
```sql
CREATE TABLE playlist_items (
    ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    playlist_id BIGINT NOT NULL,
    content_id BIGINT NOT NULL,
    order_index INT DEFAULT 0,
    duration INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_time VARCHAR(255)
);
```

#### **Table 5: emergency_messages**
```sql
CREATE TABLE emergency_messages (
    ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(255) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    start_time VARCHAR(255),
    end_time VARCHAR(255),
    created_time VARCHAR(255),
    updated_time VARCHAR(255)
);
```

#### **Table 6: settings**
```sql
CREATE TABLE settings (
    ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(255) DEFAULT 'string',
    is_active BOOLEAN DEFAULT TRUE,
    created_time VARCHAR(255),
    updated_time VARCHAR(255)
);
```

#### **Table 7: user_sessions**
```sql
CREATE TABLE user_sessions (
    ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_time VARCHAR(255)
);
```

#### **Table 8: user_organizations**
```sql
CREATE TABLE user_organizations (
    ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_time VARCHAR(255),
    updated_time VARCHAR(255)
);
```

## 📋 **Step 2: Create Default User**

After creating the tables, run this script to create the default user:

```bash
node test-database-setup.js
```

## 📋 **Step 3: Verify Tables**

Check that all tables are created correctly in the Catalyst Console.

## ✅ **Phase 1 Complete When:**
- [ ] All 8 tables created in Catalyst Console
- [ ] Default user created successfully
- [ ] Tables are accessible via API
- [ ] Ready for Phase 2: Backend Functions Update

## 🚀 **Next Steps:**
Once tables are created, we'll proceed with:
1. **Phase 2**: Update backend functions for user isolation
2. **Phase 3**: Update frontend dashboard
3. **Phase 4**: Update TV player
4. **Phase 5**: Test multi-user functionality
5. **Phase 6**: Deploy to production

---

**Note**: This manual approach is necessary because Catalyst doesn't support programmatic table creation via API. Once the tables are created, the rest of the multi-user implementation can proceed automatically.
