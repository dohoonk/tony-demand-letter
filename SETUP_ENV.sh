#!/bin/bash

# Setup script to create .env files from .env.example files

echo "🔧 Setting up environment files..."
echo ""

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "⚠️  backend/.env already exists (skipping)"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
else
    echo "⚠️  frontend/.env already exists (skipping)"
fi

# AI Service .env
if [ ! -f "ai-service/.env" ]; then
    cp ai-service/.env.example ai-service/.env
    echo "✅ Created ai-service/.env"
else
    echo "⚠️  ai-service/.env already exists (skipping)"
fi

echo ""
echo "📝 Next steps:"
echo ""
echo "1. Generate JWT secrets:"
echo "   openssl rand -base64 32"
echo "   (Run twice and update JWT_SECRET and JWT_REFRESH_SECRET in backend/.env)"
echo ""
echo "2. Get Anthropic API key:"
echo "   https://console.anthropic.com/"
echo "   Update ANTHROPIC_API_KEY in ai-service/.env"
echo ""
echo "3. Setup AWS S3:"
echo "   - Create S3 bucket"
echo "   - Get IAM credentials"
echo "   Update AWS credentials in backend/.env and ai-service/.env"
echo ""
echo "4. Start development:"
echo "   docker-compose up -d"
echo "   cd backend && npm run dev"
echo "   cd frontend && npm run dev"
echo "   cd ai-service && python lambda_handler.py"
echo ""
echo "See CREDENTIALS_GUIDE.md for detailed instructions!"
echo ""

