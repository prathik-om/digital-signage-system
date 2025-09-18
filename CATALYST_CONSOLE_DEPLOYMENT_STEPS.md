# 🚀 Catalyst Console Deployment Steps

## ✅ Pre-Deployment Status

Your Digital Signage app is now ready for Catalyst hosting! Here's what's been completed:

- ✅ **Backend Functions**: All 11 functions deployed successfully
- ✅ **Dashboard Build**: Production-ready build created (95.17 kB)
- ✅ **TV Player Build**: Production-ready build created (64.13 kB)
- ✅ **Configuration Files**: Catalyst hosting configs created
- ✅ **OAuth Redirect**: Updated for Catalyst domain

## 🎯 Your App URLs (After Deployment)

- **Dashboard**: `https://atrium-60045083855.development.catalystserverless.in/dashboard/`
- **TV Player**: `https://atrium-60045083855.development.catalystserverless.in/tv-player/`
- **API Functions**: `https://atrium-60045083855.development.catalystserverless.in/server/`

## 📋 Step-by-Step Catalyst Console Deployment

### Step 1: Access Catalyst Console

1. Go to [Catalyst Console](https://catalyst.zoho.com/)
2. Navigate to your **Atrium** project
3. Make sure you're in the **Development** environment

### Step 2: Deploy Dashboard

1. **Navigate to Web Client Hosting**:
   - Go to **CloudScale** → **Web Client Hosting**
   - Click **"Add Web Client"** or **"Create New"**

2. **Configure Dashboard**:
   - **Name**: `dashboard`
   - **Framework**: `React`
   - **Source**: Upload the contents of `web-clients/dashboard/build/` folder
   - **Route**: `/dashboard/`

3. **Set Environment Variables**:
   ```
   REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
   REACT_APP_ZOHO_CLIENT_ID=1000.A7GBW3AR476CCTVPXTK10OXJ8CRNXL
   REACT_APP_ZOHO_REDIRECT_URI=https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback
   NODE_ENV=production
   ```

4. **Deploy Dashboard**:
   - Click **"Deploy"** or **"Save"**
   - Wait for deployment to complete

### Step 3: Deploy TV Player

1. **Add Another Web Client**:
   - Click **"Add Web Client"** again
   - **Name**: `tv-player`
   - **Framework**: `React`
   - **Source**: Upload the contents of `web-clients/tv-player/build/` folder
   - **Route**: `/tv-player/`

2. **Set Environment Variables**:
   ```
   REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
   NODE_ENV=production
   ```

3. **Deploy TV Player**:
   - Click **"Deploy"** or **"Save"**
   - Wait for deployment to complete

### Step 4: Configure OAuth (Critical!)

1. **Go to Zoho Developer Console**:
   - Visit [Zoho API Console](https://api-console.zoho.com/)
   - Navigate to your OAuth client

2. **Update Redirect URI**:
   - Change the redirect URI to:
   ```
   https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback
   ```
   - **Important**: This must match exactly!

3. **Save Configuration**:
   - Click **"Save"** in the Zoho console

### Step 5: Test Your Deployment

1. **Test Dashboard**:
   - Visit: `https://atrium-60045083855.development.catalystserverless.in/dashboard/`
   - Try logging in with Zoho OAuth
   - Test content and playlist management

2. **Test TV Player**:
   - Visit: `https://atrium-60045083855.development.catalystserverless.in/tv-player/`
   - Verify it displays content correctly
   - Check fallback system works

3. **Test API Functions**:
   ```bash
   # Test content API
   curl -X POST https://atrium-60045083855.development.catalystserverless.in/server/content \
     -H "Content-Type: application/json" \
     -d '{"action": "getAll"}'
   ```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Authentication Redirect Issues
**Problem**: OAuth redirect fails
**Solution**: 
- Double-check redirect URI in Zoho console
- Ensure it's exactly: `https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback`
- Clear browser cache and try again

#### 2. App Not Loading
**Problem**: 404 errors when accessing apps
**Solution**:
- Verify web clients are deployed successfully
- Check routes are set correctly (`/dashboard/` and `/tv-player/`)
- Ensure build files were uploaded completely

#### 3. API Calls Failing
**Problem**: Functions return errors
**Solution**:
- Verify functions are deployed (they should be already)
- Check API URLs are correct
- Test functions directly via curl

#### 4. CORS Errors
**Problem**: Browser blocks API calls
**Solution**:
- This shouldn't happen with Catalyst hosting (same domain)
- If it does, check environment variables are set correctly

## 🎉 Success Indicators

### ✅ Dashboard Working
- [ ] Loads at `/dashboard/`
- [ ] OAuth login works
- [ ] Content management functions
- [ ] Playlist management functions
- [ ] Settings work
- [ ] No console errors

### ✅ TV Player Working
- [ ] Loads at `/tv-player/`
- [ ] Displays content correctly
- [ ] Cycles through playlists
- [ ] Shows fallback content
- [ ] No console errors

### ✅ API Functions Working
- [ ] Content API responds
- [ ] Playlist API responds
- [ ] Authentication API works
- [ ] All functions accessible

## 🚀 Production Deployment

Once development is working:

1. **Switch to Production Environment**:
   - In Catalyst console, switch to **Production** environment
   - Deploy functions to production
   - Deploy web clients to production

2. **Update OAuth for Production**:
   - Update redirect URI to:
   ```
   https://atrium-60045083855.production.catalystserverless.in/dashboard/auth/callback
   ```

3. **Production URLs**:
   - Dashboard: `https://atrium-60045083855.production.catalystserverless.in/dashboard/`
   - TV Player: `https://atrium-60045083855.production.catalystserverless.in/tv-player/`

## 📚 Documentation References

- **Catalyst Hosting Guide**: `CATALYST_HOSTING_GUIDE.md`
- **Milestone Documentation**: `MILESTONE_WORKING_VERSION.md`
- **Build Files**: Ready in `web-clients/*/build/` directories

## 🎯 You're Ready!

Your Digital Signage application is now fully prepared for Catalyst hosting. Follow the steps above to deploy via the Catalyst console, and you'll have a production-ready application hosted on Zoho Catalyst with no CORS issues and proper authentication configuration!
