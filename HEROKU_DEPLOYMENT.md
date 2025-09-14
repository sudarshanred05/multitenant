# Heroku Deployment Guide - Simple Steps

## Prerequisites
1. Create a free Heroku account at https://heroku.com
2. Install Git if not already installed
3. Have your project ready

## Step 1: Install Heroku CLI
Download and install from: https://devcenter.heroku.com/articles/heroku-cli

Or use these commands:
```powershell
# Windows (if you have chocolatey)
choco install heroku-cli

# Or download from official site
```

## Step 2: Login to Heroku
Open PowerShell and run:
```powershell
heroku login
```
This will open a browser to login.

## Step 3: Prepare Your Project
Navigate to your project folder:
```powershell
cd "c:\Users\sudar\Downloads\xeno\shopify-insights-service"
```

Initialize git (if not already done):
```powershell
git init
git add .
git commit -m "Initial commit for Heroku deployment"
```

## Step 4: Create Heroku App
```powershell
heroku create your-app-name-here
# Example: heroku create sudar-shopify-insights
```

## Step 5: Add MySQL Database
```powershell
heroku addons:create cleardb:ignite
```

Get database URL:
```powershell
heroku config:get CLEARDB_DATABASE_URL
```

## Step 6: Set Environment Variables
```powershell
# Set Node environment
heroku config:set NODE_ENV=production

# Set JWT secret (use a strong random string)
heroku config:set JWT_SECRET="your-super-secure-jwt-secret-for-production-2025"

# Set JWT expiry
heroku config:set JWT_EXPIRES_IN="7d"

# Set database URL (replace with your ClearDB URL from step 5)
heroku config:set DATABASE_URL="mysql://username:password@host:port/database"

# Set CORS origin (your app URL)
heroku config:set CORS_ORIGIN="https://your-app-name-here.herokuapp.com"

# Set rate limiting
heroku config:set RATE_LIMIT_WINDOW_MS=900000
heroku config:set RATE_LIMIT_MAX_REQUESTS=100
```

## Step 7: Deploy to Heroku
```powershell
git push heroku main
```

## Step 8: Open Your App
```powershell
heroku open
```

## Troubleshooting Commands
```powershell
# View logs
heroku logs --tail

# Check app status
heroku ps

# Restart app
heroku restart

# Check config variables
heroku config
```

## Important Notes:
1. Your app will be available at: https://your-app-name-here.herokuapp.com
2. Frontend and backend will run on the same URL
3. API endpoints will be at: https://your-app-name-here.herokuapp.com/api/
4. Free tier apps sleep after 30 minutes of inactivity
5. Database has row limits on free tier

## Database Setup:
After deployment, you may need to register the first user through your app's web interface to create the initial tenant.