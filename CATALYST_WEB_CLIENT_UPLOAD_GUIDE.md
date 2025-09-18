# 🚀 Catalyst Web Client Upload Guide

## ✅ Problem Solved!

Based on the [Catalyst Web Client Hosting documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/web-client-hosting/key-concepts/), I've created the proper directory structure and files for your web client hosting.

## 📁 **Correct Directory Structure**

According to the [Key Concepts documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/web-client-hosting/key-concepts/), Catalyst expects:

```
client/
├── dashboard/
│   ├── index.html          ← Homepage of your web app
│   ├── client-package.json ← Configuration information
│   ├── static/             ← CSS and JavaScript files
│   └── ... (other files)
└── tv-player/
    ├── index.html          ← Homepage of your web app
    ├── client-package.json ← Configuration information
    ├── static/             ← CSS and JavaScript files
    └── ... (other files)
```

## 📦 **Ready-to-Upload ZIP Files**

I've created the proper ZIP files with the correct structure:

### **Dashboard Client**
- **File**: `dashboard-client.zip`
- **Location**: `/Users/prathik-5897/Desktop/ProjectorP/client/dashboard-client.zip`
- **Contains**: All dashboard files + `client-package.json`

### **TV Player Client**
- **File**: `tv-player-client.zip`
- **Location**: `/Users/prathik-5897/Desktop/ProjectorP/client/tv-player-client.zip`
- **Contains**: All TV player files + `client-package.json`

## 🎯 **Upload Instructions**

Based on the [Implementation documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/web-client-hosting/implementation/):

### **Step 1: Access Catalyst Console**
1. Go to [Catalyst Console](https://catalyst.zoho.com/)
2. Navigate to your **Atrium** project
3. Go to **CloudScale** → **Web Client Hosting**

### **Step 2: Upload Dashboard**
1. Click **"Upload"** button
2. Select **`dashboard-client.zip`** from your file system
3. Click **"Upload"**
4. Wait for hosting to complete

### **Step 3: Upload TV Player**
1. Click **"Upload"** button again
2. Select **`tv-player-client.zip`** from your file system
3. Click **"Upload"**
4. Wait for hosting to complete

## 🔗 **Your App URLs**

After successful upload, your apps will be available at:

- **Dashboard**: `https://atrium-60045083855.development.catalystserverless.in/dashboard/`
- **TV Player**: `https://atrium-60045083855.development.catalystserverless.in/tv-player/`

## 📋 **What's Inside Each ZIP**

### **Dashboard Client (`dashboard-client.zip`)**
- ✅ `index.html` - Main entry point
- ✅ `client-package.json` - Configuration with name "dashboard"
- ✅ `static/` folder - CSS and JavaScript files
- ✅ `asset-manifest.json` - Build manifest
- ✅ All OAuth test files

### **TV Player Client (`tv-player-client.zip`)**
- ✅ `index.html` - Main entry point
- ✅ `client-package.json` - Configuration with name "tv-player"
- ✅ `static/` folder - CSS and JavaScript files
- ✅ `asset-manifest.json` - Build manifest

## 🔧 **Key Configuration Details**

### **client-package.json Structure**
According to the documentation, each `client-package.json` contains:

```json
{
  "name": "dashboard",           ← App name (cannot be changed after hosting)
  "version": "1.0.0",           ← Version number (must increment for updates)
  "description": "...",         ← App description
  "main": "index.html",         ← Entry point
  "homepage": "/dashboard/",    ← URL path
  "environment": {              ← Environment variables
    "REACT_APP_API_BASE_URL": "https://atrium-60045083855.development.catalystserverless.in",
    "REACT_APP_ZOHO_CLIENT_ID": "1000.A7GBW3AR476CCTVPXTK10OXJ8CRNXL",
    "REACT_APP_ZOHO_REDIRECT_URI": "https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback",
    "NODE_ENV": "production"
  }
}
```

## 🚨 **Important Notes**

### **Version Management**
According to the [Key Concepts documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/web-client-hosting/key-concepts/):

1. **Version Format**: Must be in decimal format (e.g., "1.0.0")
2. **Version Increment**: Must increment for each update
3. **No Decrement**: Cannot use lower version numbers
4. **Same Version**: Cannot reuse same version for updates

### **App Naming**
- **Name Field**: Set in `client-package.json` as "dashboard" and "tv-player"
- **Cannot Change**: Once hosted, the name cannot be changed
- **Unique Names**: Each app must have a unique name

## 🧪 **Testing After Upload**

### **Dashboard Testing**
1. Visit: `https://atrium-60045083855.development.catalystserverless.in/dashboard/`
2. Test OAuth login
3. Test content management
4. Test playlist management

### **TV Player Testing**
1. Visit: `https://atrium-60045083855.development.catalystserverless.in/tv-player/`
2. Verify content display
3. Test playlist cycling
4. Check fallback system

## 🔄 **Updating Your Apps**

According to the [Implementation documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/web-client-hosting/implementation/):

1. **Update Version**: Increment version in `client-package.json`
2. **Rebuild**: Run `npm run build` in your source directories
3. **Copy Files**: Copy new build files to client directories
4. **Create ZIP**: Create new ZIP files
5. **Upload**: Use "Update" option in Catalyst console

## 🎉 **Success!**

Your Digital Signage application is now properly structured for Catalyst Web Client Hosting according to the official documentation. The "client-package.json not found" error should be resolved!

**Upload the ZIP files and your apps will be live on Catalyst!** 🚀
