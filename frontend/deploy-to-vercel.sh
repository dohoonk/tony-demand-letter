#!/bin/bash

# Quick deployment script for Vercel
# Make sure you have Vercel CLI installed: npm install -g vercel

echo "🚀 Deploying frontend to Vercel..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd "$(dirname "$0")"

echo "📦 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "⚙️  Next steps:"
echo "1. Set environment variable in Vercel dashboard:"
echo "   VITE_API_URL = https://your-backend-app.herokuapp.com"
echo ""
echo "2. Update backend CORS:"
echo "   heroku config:set FRONTEND_URL=https://your-project.vercel.app --app your-backend-app"
echo ""

