# 🚀 Vercel Deployment Guide

This guide will help you deploy your Digital Signage frontend applications to Vercel.

## 📋 Prerequisites

- [GitHub account](https://github.com)
- [Vercel account](https://vercel.com)
- Your project code ready for GitHub

## 🔧 Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: Digital Signage System"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name it: `digital-signage-system`
4. Make it **Private** (recommended for business use)
5. Don't initialize with README (we already have one)

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/digital-signage-system.git
git branch -M main
git push -u origin main
```

## 🚀 Step 2: Deploy to Vercel

### 2.1 Connect Vercel to GitHub
1. Go to [Vercel](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your `digital-signage-system` repository

### 2.2 Configure Dashboard Deployment
1. **Project Name**: `digital-signage-dashboard`
2. **Framework Preset**: Create React App
3. **Root Directory**: `web-clients/dashboard`
4. **Build Command**: `npm run build`
5. **Output Directory**: `build`
6. **Install Command**: `npm install`

### 2.3 Configure TV Player Deployment
1. **Project Name**: `digital-signage-tv-player`
2. **Framework Preset**: Create React App
3. **Root Directory**: `web-clients/tv-player`
4. **Build Command**: `npm run build`
5. **Output Directory**: `build`
6. **Install Command**: `npm install`

## ⚙️ Step 3: Environment Variables

### 3.1 Dashboard Environment Variables
In Vercel dashboard settings:
```
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
```

### 3.2 TV Player Environment Variables
Same as dashboard:
```
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
```

## 🌐 Step 4: Custom Domains (Optional)

### 4.1 Dashboard Domain
- **Production**: `dashboard.yourcompany.com`
- **Development**: `dashboard-dev.yourcompany.com`

### 4.2 TV Player Domain
- **Production**: `tv.yourcompany.com`
- **Development**: `tv-dev.yourcompany.com`

## 🔄 Step 5: Automatic Deployments

### 5.1 How It Works
- **Push to main branch** → Automatic production deployment
- **Push to any branch** → Automatic preview deployment
- **Pull request** → Preview deployment for testing

### 5.2 Deployment URLs
- **Dashboard**: `https://digital-signage-dashboard.vercel.app`
- **TV Player**: `https://digital-signage-tv-player.vercel.app`

## 🧪 Step 6: Testing

### 6.1 Test Dashboard
1. Visit your dashboard URL
2. Test login functionality
3. Test content management
4. Test playlist creation
5. Test emergency messages

### 6.2 Test TV Player
1. Visit your TV player URL
2. Test content display
3. Test emergency message overlay
4. Test on different screen sizes

## 🔧 Step 7: Troubleshooting

### 7.1 Build Failures
- Check build logs in Vercel
- Verify all dependencies are in `package.json`
- Ensure build command is correct

### 7.2 API Connection Issues
- Verify `REACT_APP_API_BASE_URL` is correct
- Check CORS settings in Catalyst functions
- Test API endpoints directly

### 7.3 Environment Variables
- Ensure variables are set in Vercel
- Check variable names match exactly
- Redeploy after changing variables

## 📱 Step 8: Production Checklist

- [ ] Both apps deploy successfully
- [ ] Environment variables are set
- [ ] API connections work
- [ ] Custom domains configured (if using)
- [ ] SSL certificates active
- [ ] Performance monitoring enabled
- [ ] Error tracking configured

## 🎯 Benefits of This Setup

✅ **Reliable hosting** - No more Catalyst Web Client issues  
✅ **Automatic deployments** - Push to GitHub, Vercel deploys  
✅ **Global CDN** - Fast loading worldwide  
✅ **Custom domains** - Professional URLs  
✅ **Preview deployments** - Test before going live  
✅ **Performance monitoring** - Built-in analytics  
✅ **Easy rollbacks** - Revert to previous versions  

## 🚀 Next Steps

1. **Deploy both apps** to Vercel
2. **Test all functionality** thoroughly
3. **Configure custom domains** (optional)
4. **Set up monitoring** and alerts
5. **Train your team** on the new workflow

Your Digital Signage System is now ready for production! 🎉
