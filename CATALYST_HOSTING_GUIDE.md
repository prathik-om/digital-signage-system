# 🚀 Zoho Catalyst Web Client Hosting Guide

## 📋 Overview

This guide will help you host both your Dashboard and TV Player applications on Zoho Catalyst using the default Catalyst domain, avoiding the authentication redirect issues you encountered before.

## 🏗️ Architecture

```
Catalyst Default Domain: https://atrium-60045083855.development.catalystserverless.in
├── /dashboard/          → Dashboard App
├── /tv-player/          → TV Player App  
└── /server/             → Backend Functions
    ├── /content
    ├── /playlist
    ├── /auth
    └── ... (other functions)
```

## 🔧 Configuration Files Created

### 1. Dashboard Configuration
- **File**: `web-clients/dashboard/catalyst-config.json`
- **Purpose**: Configures dashboard for Catalyst hosting
- **Key Settings**:
  - Build command: `npm run build`
  - Output directory: `build`
  - Environment variables for Catalyst domain
  - OAuth redirect URI: `https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback`

### 2. TV Player Configuration  
- **File**: `web-clients/tv-player/catalyst-config.json`
- **Purpose**: Configures TV player for Catalyst hosting
- **Key Settings**:
  - Build command: `npm run build`
  - Output directory: `build`
  - Environment variables for Catalyst domain

### 3. Main Catalyst Configuration
- **File**: `catalyst.json` (updated)
- **Purpose**: Defines both web clients for deployment
- **Appsail & Slate**: Both configured for dashboard and tv-player

## 🚀 Deployment Steps

### Step 1: Build Both Applications

```bash
# Build Dashboard
cd web-clients/dashboard
npm run build

# Build TV Player  
cd ../tv-player
npm run build
```

### Step 2: Deploy to Catalyst

```bash
# From project root
catalyst deploy
```

This will deploy:
- ✅ All backend functions
- ✅ Dashboard web client
- ✅ TV Player web client

### Step 3: Access Your Applications

After deployment, your apps will be available at:

- **Dashboard**: `https://atrium-60045083855.development.catalystserverless.in/dashboard/`
- **TV Player**: `https://atrium-60045083855.development.catalystserverless.in/tv-player/`
- **API Functions**: `https://atrium-60045083855.development.catalystserverless.in/server/`

## 🔐 Authentication Configuration

### OAuth Redirect URI Setup

The authentication redirect URI is now configured as:
```
https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback
```

### Zoho OAuth Console Configuration

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Navigate to your OAuth client
3. Update the **Redirect URI** to:
   ```
   https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback
   ```
4. Save the configuration

## 🧪 Testing Checklist

### Dashboard Testing
- [ ] App loads at `/dashboard/`
- [ ] Authentication works (login/logout)
- [ ] Content management functions
- [ ] Playlist management functions
- [ ] Settings configuration works
- [ ] No CORS errors

### TV Player Testing
- [ ] App loads at `/tv-player/`
- [ ] Displays active playlist content
- [ ] Cycles through content correctly
- [ ] Shows fallback content when no playlist active
- [ ] No CORS errors

### API Testing
```bash
# Test content API
curl -X POST https://atrium-60045083855.development.catalystserverless.in/server/content \
  -H "Content-Type: application/json" \
  -d '{"action": "getAll"}'

# Test playlist API
curl -X POST https://atrium-60045083855.development.catalystserverless.in/server/playlist \
  -H "Content-Type: application/json" \
  -d '{"action": "getAll"}'
```

## 🔧 Environment Variables

### Dashboard Environment
```bash
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
REACT_APP_ZOHO_CLIENT_ID=1000.A7GBW3AR476CCTVPXTK10OXJ8CRNXL
REACT_APP_ZOHO_REDIRECT_URI=https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback
NODE_ENV=production
```

### TV Player Environment
```bash
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
NODE_ENV=production
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. Authentication Redirect Issues
**Problem**: OAuth redirect fails
**Solution**: 
- Verify redirect URI in Zoho OAuth console matches exactly
- Check that the URL is `https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback`

#### 2. CORS Errors
**Problem**: API calls blocked by CORS
**Solution**:
- All API calls now go to the same domain (`catalystserverless.in`)
- No CORS issues should occur with same-domain requests

#### 3. App Not Loading
**Problem**: 404 errors when accessing apps
**Solution**:
- Verify both apps are deployed successfully
- Check Catalyst console for deployment status
- Ensure build files are in the correct directories

#### 4. API Endpoints Not Working
**Problem**: Functions return 404 or errors
**Solution**:
- Verify functions are deployed: `catalyst deploy`
- Check function URLs in Catalyst console
- Test API endpoints directly

## 📊 Production Deployment

### Deploy to Production Environment

1. **Enable Production Environment**:
   - Go to Catalyst Console
   - Navigate to Environments
   - Click "Deploy to Production"

2. **Update OAuth Configuration**:
   - Update redirect URI to production domain:
   ```
   https://atrium-60045083855.production.catalystserverless.in/dashboard/auth/callback
   ```

3. **Deploy to Production**:
   ```bash
   catalyst deploy --env production
   ```

### Production URLs
- **Dashboard**: `https://atrium-60045083855.production.catalystserverless.in/dashboard/`
- **TV Player**: `https://atrium-60045083855.production.catalystserverless.in/tv-player/`
- **API Functions**: `https://atrium-60045083855.production.catalystserverless.in/server/`

## 🎯 Benefits of Catalyst Hosting

### ✅ Advantages
- **Same Domain**: No CORS issues
- **Integrated**: Backend and frontend on same platform
- **SSL**: Automatic HTTPS
- **Scalable**: Catalyst handles scaling
- **Monitoring**: Built-in monitoring and logs
- **Cost Effective**: Single platform billing

### 🔧 Key Features
- **Automatic Builds**: Catalyst handles build process
- **Environment Variables**: Secure configuration
- **Custom Domains**: Can add custom domains later
- **Production Environment**: Separate production deployment

## 📚 Next Steps

1. **Deploy**: Run `catalyst deploy` to deploy both apps
2. **Test**: Verify both apps work correctly
3. **Configure OAuth**: Update Zoho OAuth redirect URI
4. **Go Live**: Your apps are now hosted on Catalyst!

## 🎉 Success!

Your Digital Signage application is now ready for Catalyst hosting with:
- ✅ Dashboard hosted at `/dashboard/`
- ✅ TV Player hosted at `/tv-player/`
- ✅ Backend functions at `/server/`
- ✅ No CORS issues
- ✅ Proper authentication configuration
- ✅ Production-ready setup
