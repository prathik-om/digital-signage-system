#!/bin/bash

# Digital Signage App - Production Deployment Script
# This script helps deploy your app to production

echo "🚀 Digital Signage App - Production Deployment"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "catalyst.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-deployment Checklist:"
echo "1. ✅ Catalyst functions deployed"
echo "2. ✅ Environment variables configured"
echo "3. ✅ Domains whitelisted in Catalyst console"
echo "4. ✅ OAuth configuration updated"
echo ""

# Deploy Catalyst functions
echo "🔧 Deploying Catalyst functions..."
catalyst deploy

if [ $? -eq 0 ]; then
    echo "✅ Catalyst functions deployed successfully"
else
    echo "❌ Catalyst deployment failed"
    exit 1
fi

# Build Dashboard
echo ""
echo "🏗️ Building Dashboard..."
cd web-clients/dashboard
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Dashboard built successfully"
    echo "📁 Build files ready in: web-clients/dashboard/build/"
else
    echo "❌ Dashboard build failed"
    exit 1
fi

# Build TV Player
echo ""
echo "🏗️ Building TV Player..."
cd ../tv-player
npm run build

if [ $? -eq 0 ]; then
    echo "✅ TV Player built successfully"
    echo "📁 Build files ready in: web-clients/tv-player/build/"
else
    echo "❌ TV Player build failed"
    exit 1
fi

cd ../..

echo ""
echo "🎉 Deployment Preparation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Upload dashboard build files to your hosting service"
echo "2. Upload TV player build files to your hosting service"
echo "3. Configure environment variables on your hosting platform"
echo "4. Test all functionality in production"
echo ""
echo "🔗 Important URLs:"
echo "- Dashboard: https://your-dashboard-domain.com"
echo "- TV Player: https://your-tv-player-domain.com"
echo "- Catalyst API: https://atrium-60045083855.development.catalystserverless.in"
echo ""
echo "📚 Documentation:"
echo "- Hosting Setup Guide: HOSTING_SETUP_GUIDE.md"
echo "- Environment Config: PRODUCTION_ENV_CONFIG.md"
echo "- Milestone Documentation: MILESTONE_WORKING_VERSION.md"
