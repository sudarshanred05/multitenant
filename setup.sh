#!/bin/bash

# Shopify Insights Service Setup Script
echo "🚀 Setting up Shopify Insights Service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "16" ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Setup Backend
echo "📦 Setting up backend..."
cd backend

# Install backend dependencies
echo "📥 Installing backend dependencies..."
npm install

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "📋 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please configure your .env file with your database and Shopify credentials"
fi

cd ..

# Setup Frontend
echo "📦 Setting up frontend..."
cd frontend

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
npm install

cd ..

echo "✅ Setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Configure your .env file in the backend directory"
echo "2. Set up your database (PostgreSQL or MySQL)"
echo "3. Run 'npm run migrate' in the backend directory"
echo "4. Start the backend: 'cd backend && npm run dev'"
echo "5. Start the frontend: 'cd frontend && npm start'"
echo ""
echo "📚 Documentation:"
echo "- README.md - General documentation"
echo "- DEPLOYMENT_GUIDE.md - Deployment guide"
echo ""
echo "🎉 Happy coding!"
