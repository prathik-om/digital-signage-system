# Production Deployment Guide

## 🚀 How to Deploy to Production

### **Current Setup (Development):**
- **Dashboard**: `http://localhost:3000` → Calls local proxy
- **Local Proxy**: `http://localhost:3001` → Routes to Catalyst APIs
- **Purpose**: Handle CORS, debugging, local testing

### **Production Setup:**
- **Dashboard**: Deployed to Vercel/Netlify → Calls Catalyst APIs directly
- **No Proxy**: Production APIs have proper CORS headers
- **Direct API**: `https://atrium-60045083855.development.catalystserverless.in`

---

## 📋 Production Deployment Steps

### **Step 1: Environment Variables**
Set these in your deployment platform (Vercel/Netlify):

```bash
# Production Environment Variables
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
REACT_APP_ZOHO_CLIENT_ID=your_production_client_id
REACT_APP_ZOHO_REDIRECT_URI=https://your-domain.com/oauth/callback
NODE_ENV=production
```

### **Step 2: Build for Production**
```bash
cd web-clients/dashboard
npm run build
```

### **Step 3: Deploy**
- **Vercel**: `vercel --prod`
- **Netlify**: Upload `build/` folder
- **Other**: Deploy `build/` folder to your hosting

---

## 🔧 How the Smart Configuration Works

### **Development (localhost):**
```javascript
// Automatically detected
API_BASE_URL: 'http://localhost:3001'  // Uses local proxy
```

### **Production (deployed):**
```javascript
// Automatically detected
API_BASE_URL: 'https://atrium-60045083855.development.catalystserverless.in'  // Direct API
```

### **Manual Override:**
```bash
# Force production API even in development
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
```

---

## 🛡️ Production Security Features

### **✅ What's Production-Ready:**
- **No UserSwitcher**: Removed for security
- **UserProfile**: Shows only current user
- **Data Isolation**: Each user sees only their data
- **Proper Authentication**: Real Zoho OAuth
- **CORS Headers**: Handled by Catalyst API Gateway

### **🔒 Security Checklist:**
- [ ] UserSwitcher component removed
- [ ] No hardcoded user IDs in production
- [ ] Real Zoho OAuth integration
- [ ] Proper CORS headers on APIs
- [ ] Data isolation working
- [ ] No development-only features

---

## 📊 Production vs Development Comparison

| Feature | Development | Production |
|---------|-------------|------------|
| **API Calls** | Local Proxy (`localhost:3001`) | Direct API (`catalystserverless.in`) |
| **CORS** | Handled by proxy | Handled by API Gateway |
| **User Switching** | UserSwitcher (removed) | Real login/logout |
| **Authentication** | Mock/default user | Real Zoho OAuth |
| **Data** | Mock/test data | Real user data |
| **Debugging** | Console logs enabled | Console logs disabled |

---

## 🎯 Production Testing Checklist

### **Before Deployment:**
- [ ] Test with `NODE_ENV=production`
- [ ] Verify no localhost references
- [ ] Test user authentication flow
- [ ] Verify data isolation
- [ ] Check CORS headers
- [ ] Test all API endpoints

### **After Deployment:**
- [ ] Test login/logout flow
- [ ] Verify user-specific data
- [ ] Test file uploads
- [ ] Check error handling
- [ ] Verify mobile responsiveness
- [ ] Test performance

---

## 🔄 Migration from Development to Production

### **What Changes:**
1. **API Base URL**: `localhost:3001` → `catalystserverless.in`
2. **Authentication**: Mock user → Real Zoho OAuth
3. **Data**: Test data → Real user data
4. **CORS**: Proxy handling → API Gateway handling

### **What Stays the Same:**
- All component logic
- Multi-user data isolation
- API service structure
- User interface
- Security features

---

## 🚨 Important Notes

### **Local Proxy is Development-Only:**
- ❌ **Never deploy** the local proxy to production
- ❌ **Never use** `localhost:3001` in production
- ✅ **Always use** direct Catalyst API in production

### **Environment Detection:**
The system automatically detects:
- **Development**: `localhost` or `NODE_ENV=development`
- **Production**: Any other domain or `NODE_ENV=production`

### **Manual Override:**
You can always override with environment variables:
```bash
REACT_APP_API_BASE_URL=https://your-api-url.com
```

---

## 🎉 Ready for Production!

Your dashboard is now production-ready with:
- ✅ Smart environment detection
- ✅ Automatic API URL switching
- ✅ Secure multi-user support
- ✅ No development-only features
- ✅ Proper CORS handling

Just set the environment variables and deploy! 🚀