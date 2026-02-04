#!/bin/bash
# Production Deployment Script cho Next.js Standalone
# Sử dụng: chmod +x deploy-production.sh && ./deploy-production.sh

set -e  # Exit on error

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  Warning: .env.production not found${NC}"
    echo "Please create .env.production with all required environment variables"
    echo "See DEPLOYMENT_FIX.md for required variables"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Load production environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Set production mode
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

echo "📦 Installing dependencies..."
npm ci --production=false

echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
    echo -e "${RED}❌ Build failed: .next directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Check standalone output
if [ -d ".next/standalone" ]; then
    echo "📋 Standalone output detected"
    echo "⚠️  Remember to copy the following to your server:"
    echo "   - .next/standalone/"
    echo "   - .next/static/ -> .next/standalone/.next/static/"
    echo "   - public/ -> .next/standalone/public/"
fi

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Copy the build files to your server"
echo "2. Set environment variables on the server"
echo "3. Start with: pm2 start ecosystem.config.js"
echo "   Or: cd .next/standalone && node server.js"
