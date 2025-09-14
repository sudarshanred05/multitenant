# Railway Deployment Guide

This guide covers deploying the Shopify Insights Service to Railway, a modern deployment platform that's perfect for full-stack applications.

## Prerequisites

- Railway account (free tier available)
- Railway CLI installed
- Your project files ready
- Environment variables prepared

## Overview

Railway offers several advantages for this project:
- Automatic deployments from GitHub
- Built-in database hosting (MySQL/PostgreSQL)
- Easy environment variable management
- Automatic HTTPS
- Zero-config deployments

## Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

## Step 2: Login to Railway

```bash
railway login
```

This will open your browser for authentication.

## Step 3: Deploy Backend Service

### 3.1 Navigate to Backend Directory

```bash
cd backend
```

### 3.2 Initialize Railway Project

```bash
railway init
```

Choose "Create new project" and give it a meaningful name like "shopify-insights-backend".

### 3.3 Deploy Backend

```bash
railway up
```

Railway will automatically:
- Detect Node.js
- Install dependencies
- Start the application
- Provide a public URL

### 3.4 Add Database

1. Go to your Railway dashboard
2. Click "Add Service" → "Database" → "MySQL"
3. Railway will provision a MySQL database automatically

### 3.5 Configure Environment Variables

In the Railway dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=5000

# Database (automatically provided by Railway MySQL service)
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASS=${{MySQL.MYSQL_PASSWORD}}
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_customers,read_orders,read_products,read_checkouts

# CORS (will be updated after frontend deployment)
CORS_ORIGIN=https://your-frontend-domain.railway.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Data Sync Configuration
SYNC_INTERVAL_HOURS=6
MAX_SYNC_RETRIES=3
```

### 3.6 Run Database Migrations

Connect to your Railway backend and run:

```bash
railway shell
npm run migrate
```

## Step 4: Deploy Frontend Service

### 4.1 Navigate to Frontend Directory

```bash
cd ../frontend
```

### 4.2 Initialize Railway Project

```bash
railway init
```

Choose "Create new project" and name it "shopify-insights-frontend".

### 4.3 Configure Frontend Environment Variables

Add this environment variable in Railway dashboard:

```env
REACT_APP_API_URL=https://your-backend-domain.railway.app
```

Replace `your-backend-domain` with the actual domain Railway assigned to your backend.

### 4.4 Deploy Frontend

```bash
railway up
```

## Step 5: Update CORS Configuration

After frontend deployment:

1. Copy your frontend Railway URL
2. Go to backend service environment variables
3. Update `CORS_ORIGIN` to your frontend URL
4. Redeploy backend service

## Step 6: Testing Deployment

### 6.1 Test Backend

Visit your backend URL and check:
- Health endpoint: `https://your-backend-domain.railway.app/health`
- Should return JSON with service status

### 6.2 Test Frontend

Visit your frontend URL:
- Should load the login/register page
- Try registering a new account
- Test the sync functionality

### 6.3 Test Database Connection

After registering:
- Check if data is saved in database
- Test manual sync functionality
- Verify scheduled jobs are working

## Step 7: Production Optimizations

### 7.1 Domain Configuration (Optional)

1. Purchase a custom domain
2. In Railway dashboard: Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed

### 7.2 Monitoring

Railway provides built-in monitoring:
- View logs in the dashboard
- Monitor resource usage
- Set up alerts for downtime

### 7.3 Environment-Specific Configurations

Ensure production environment variables are properly set:
- Use strong, unique JWT secrets
- Enable proper logging levels
- Configure appropriate rate limits

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check package.json scripts
   - Verify Node.js version compatibility
   - Review build logs in Railway dashboard

2. **Database Connection Issues**:
   - Verify environment variables are set correctly
   - Check if database service is running
   - Ensure SSL configuration is correct

3. **CORS Errors**:
   - Update CORS_ORIGIN environment variable
   - Ensure frontend URL is correct
   - Redeploy backend after changes

4. **Environment Variable Issues**:
   - Double-check all required variables are set
   - Verify Railway service references (${MySQL.MYSQL_HOST})
   - Use Railway dashboard to manage variables

### Logs and Debugging

View logs:
```bash
railway logs
```

Connect to shell:
```bash
railway shell
```

## Scaling and Performance

### Automatic Scaling

Railway automatically scales based on:
- Request volume
- Resource utilization
- Response times

### Performance Optimization

1. **Database Optimization**:
   - Use connection pooling (already configured)
   - Optimize queries
   - Add appropriate indexes

2. **Caching**:
   - Implement Redis for session storage
   - Cache frequently accessed data

3. **CDN**:
   - Use Railway's built-in CDN
   - Optimize static assets

## Security Considerations

1. **Environment Variables**:
   - Never commit secrets to git
   - Use Railway's secure variable storage
   - Rotate keys regularly

2. **Database Security**:
   - Use strong passwords
   - Enable SSL connections
   - Regular backups

3. **API Security**:
   - Implement rate limiting (already configured)
   - Use HTTPS only
   - Validate all inputs

## Backup and Recovery

### Database Backups

Railway provides automatic backups, but you can also:

1. **Manual Backup**:
```bash
railway connect mysql
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME > backup.sql
```

2. **Automated Backups**:
   - Set up scheduled backups in Railway dashboard
   - Store backups in external storage (S3, etc.)

### Recovery Process

1. Restore from Railway backup
2. Or restore from manual backup:
```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME < backup.sql
```

## Cost Optimization

### Railway Pricing

- **Starter Plan**: $5/month per service
- **Pro Plan**: $20/month per service
- **Resource-based billing**

### Optimization Tips

1. **Right-size services**: Don't over-provision resources
2. **Use sleep mode**: For development environments
3. **Monitor usage**: Track resource consumption
4. **Optimize database**: Regular maintenance and optimization

## Support and Documentation

- **Railway Documentation**: https://docs.railway.app
- **Railway Discord**: Community support
- **Project Issues**: GitHub repository issues

---

## Quick Reference

### Essential Commands

```bash
# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# View logs
railway logs

# Connect to shell
railway shell

# Connect to database
railway connect mysql

# Environment variables
railway variables
```

### Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Backend Service: https://your-backend-domain.railway.app
- Frontend Service: https://your-frontend-domain.railway.app
- Database: Accessible via Railway dashboard

This guide should get your Shopify Insights Service running on Railway successfully!