#!/bin/bash

# Digital Signage App - Catalyst Hosting Deployment Script
echo "🚀 Digital Signage App - Catalyst Hosting Deployment"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "catalyst.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-deployment Checklist:"
echo "1. ✅ Catalyst functions deployed"
echo "2. ✅ Web client builds ready"
echo "3. ✅ Configuration files created"
echo ""

# Deploy Catalyst functions
echo "🔧 Deploying Catalyst functions..."
catalyst deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Catalyst functions deployed successfully"
else
    echo "❌ Catalyst functions deployment failed"
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
echo "🎉 Build Process Complete!"
echo ""
echo "📋 Next Steps for Catalyst Console:"
echo "1. Go to Catalyst Console: https://catalyst.zoho.com/"
echo "2. Navigate to your project: Atrium"
echo "3. Go to CloudScale → Web Client Hosting"
echo "4. Upload dashboard build files"
echo "5. Upload TV player build files"
echo "6. Configure environment variables"
echo ""
echo "🔗 Your Apps will be available at:"
echo "- Dashboard: https://atrium-60045083855.development.catalystserverless.in/dashboard/"
echo "- TV Player: https://atrium-60045083855.development.catalystserverless.in/tv-player/"
echo "- API Functions: https://atrium-60045083855.development.catalystserverless.in/server/"
echo ""
echo "📚 Documentation:"
echo "- Catalyst Hosting Guide: CATALYST_HOSTING_GUIDE.md"
echo "- Milestone Documentation: MILESTONE_WORKING_VERSION.md"
echo ""
echo "🔐 OAuth Configuration:"
echo "Update Zoho OAuth redirect URI to:"
echo "https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback"
