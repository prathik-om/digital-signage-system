# Digital Signage App - Hosting Setup Guide

## 🚀 Production Hosting Configuration

### 1. Catalyst Whitelisting Setup

#### A. Authorized Domains Configuration
1. Go to Catalyst Console → Authentication → Whitelisting
2. Add your production domains:
   - **Dashboard**: `https://your-dashboard-domain.com`
   - **TV Player**: `https://your-tv-player-domain.com`
   - **Development**: `http://localhost:3000`

#### B. CORS Configuration
Enable CORS for all your domains to allow API calls.

### 2. Environment Variables

#### Dashboard (.env.production)
```bash
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
REACT_APP_ZOHO_CLIENT_ID=your_production_client_id
REACT_APP_ZOHO_REDIRECT_URI=https://your-dashboard-domain.com/auth/callback
NODE_ENV=production
```

#### TV Player (.env.production)
```bash
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
NODE_ENV=production
```

### 3. Deployment Steps

#### Dashboard Deployment (Vercel)
```bash
cd web-clients/dashboard
npm run build
# Deploy to Vercel with environment variables
```

#### TV Player Deployment
```bash
cd web-clients/tv-player
npm run build
# Deploy to your hosting service
```

### 4. API Endpoint Verification

Your API calls follow the correct Catalyst pattern:
- Dashboard → `/content` → Catalyst `/server/content`
- Dashboard → `/playlist` → Catalyst `/server/playlist`
- TV Player → `/content` → Catalyst `/server/content`

### 5. Testing Checklist

- [ ] Dashboard loads correctly
- [ ] Authentication works
- [ ] Content management functions
- [ ] Playlist management functions
- [ ] TV player displays content
- [ ] Fallback system works
- [ ] CORS errors resolved

### 6. Troubleshooting

#### CORS Issues
- Verify domains are whitelisted in Catalyst
- Check API_BASE_URL configuration
- Ensure HTTPS for production domains

#### Authentication Issues
- Verify OAuth client ID and redirect URI
- Check Zoho OAuth configuration
- Ensure callback URL matches exactly

#### API Issues
- Verify Catalyst functions are deployed
- Check API endpoint URLs
- Review function logs in Catalyst console
