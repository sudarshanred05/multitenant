@echo off
REM Shopify Insights Service Setup Script for Windows

echo 🚀 Setting up Shopify Insights Service...

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Setup Backend
echo 📦 Setting up backend...
cd backend

REM Install backend dependencies
echo 📥 Installing backend dependencies...
call npm install

REM Check if .env exists, if not copy from example
if not exist .env (
    echo 📋 Creating .env file from example...
    copy .env.example .env
    echo ⚠️  Please configure your .env file with your database and Shopify credentials
)

cd ..

REM Setup Frontend
echo 📦 Setting up frontend...
cd frontend

REM Install frontend dependencies
echo 📥 Installing frontend dependencies...
call npm install

cd ..

echo ✅ Setup completed!
echo.
echo 📝 Next steps:
echo 1. Configure your .env file in the backend directory
echo 2. Set up your database (PostgreSQL or MySQL)
echo 3. Run 'npm run migrate' in the backend directory
echo 4. Start the backend: 'cd backend && npm run dev'
echo 5. Start the frontend: 'cd frontend && npm start'
echo.
echo 📚 Documentation:
echo - README.md - General documentation
echo - DEPLOYMENT_GUIDE.md - Deployment guide
echo.
echo 🎉 Happy coding!
pause
