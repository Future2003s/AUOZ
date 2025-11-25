#!/bin/bash
# Production Start Script cho server nhỏ
# Sử dụng: chmod +x start-production.sh && ./start-production.sh

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=128"

# Disable telemetry
export NEXT_TELEMETRY_DISABLED=1

# Set image optimization workers
export NEXT_IMAGE_OPTIMIZATION_WORKERS=1

# Start Next.js
echo "🚀 Starting Next.js with optimized settings for small server..."
echo "📊 Memory limit: 2GB"
echo "🔧 Image workers: 1"
echo ""

exec next start -p 3000

