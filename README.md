# Shopify Insights Service

A comprehensive multi-tenant Shopify Data Ingestion & Analytics platform built with Node.js, React.js, and MySQL.

## 🚀 Features

### Backend Features
- **Multi-tenant Architecture**: Secure data isolation per tenant
- **Shopify API Integration**: Complete data ingestion for customers, orders, products, and abandoned carts
- **Automated Data Sync**: Scheduled background jobs for continuous data updates
- **RESTful APIs**: Comprehensive analytics endpoints
- **Authentication & Authorization**: JWT-based secure access
- **Rate Limiting**: Protection against API abuse
- **Error Handling**: Comprehensive error management and logging

### Frontend Features
- **Modern React Dashboard**: Clean, responsive analytics interface
- **Interactive Charts**: Revenue trends, order analytics with Recharts
- **Real-time Data**: Live sync capabilities with progress indicators
- **Date Range Filtering**: Flexible time period selection
- **Top Customer Analytics**: Customer spend analysis
- **Mobile Responsive**: Optimized for all device types

### Database Features
- **Relational Design**: Normalized schema with proper relationships
- **Multi-tenant Support**: Data segregation by tenant_id
- **Optimized Queries**: Indexed columns for performance
- **Migration Support**: Sequelize-based database migrations

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React.js)    │◄──►│  (Node.js)      │◄──►│    (MySQL)      │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST APIs     │    │ • Tenants       │
│ • Auth Pages    │    │ • Shopify APIs  │    │ • Customers     │
│ • Charts        │    │ • Cron Jobs     │    │ • Orders        │
│ • Analytics     │    │ • Auth System   │    │ • Products      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │ Shopify Store   │
                        │ (External API)  │
                        └─────────────────┘
```

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Shopify Store with API access
- Git

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd shopify-insights-service
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopify_insights
DB_USER=your_username
DB_PASS=your_password
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_customers,read_orders,read_products,read_checkouts

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Database Setup

Create your database:

```sql
-- MySQL
CREATE DATABASE shopify_insights CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run database migrations:

```bash
npm run migrate
```

### 5. Start Backend Server

```bash
# Development
npm run dev

# Production
npm start
```

### 6. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api

## 📊 Database Schema

### Core Tables

```sql
-- Tenants (Multi-tenant support)
tenants
├── id (UUID, Primary Key)
├── email (String, Unique)
├── password (String, Hashed)
├── shopifyStoreName (String)
├── shopifyAccessToken (String)
├── shopifyStoreUrl (String)
├── isActive (Boolean)
├── lastSyncAt (DateTime)
└── timestamps

-- Customers
customers
├── id (UUID, Primary Key)
├── tenantId (UUID, Foreign Key)
├── shopifyCustomerId (BigInt)
├── email (String)
├── firstName (String)
├── lastName (String)
├── totalSpent (Decimal)
├── ordersCount (Integer)
└── timestamps

-- Products
products
├── id (UUID, Primary Key)
├── tenantId (UUID, Foreign Key)
├── shopifyProductId (BigInt)
├── title (String)
├── vendor (String)
├── price (Decimal)
├── totalInventory (Integer)
└── timestamps

-- Orders
orders
├── id (UUID, Primary Key)
├── tenantId (UUID, Foreign Key)
├── customerId (UUID, Foreign Key)
├── shopifyOrderId (BigInt)
├── totalPrice (Decimal)
├── financialStatus (String)
├── fulfillmentStatus (String)
└── timestamps

-- Order Items
order_items
├── id (UUID, Primary Key)
├── tenantId (UUID, Foreign Key)
├── orderId (UUID, Foreign Key)
├── productId (UUID, Foreign Key)
├── quantity (Integer)
├── price (Decimal)
└── timestamps

-- Abandoned Carts (Bonus)
abandoned_carts
├── id (UUID, Primary Key)
├── tenantId (UUID, Foreign Key)
├── customerId (UUID, Foreign Key)
├── shopifyCartId (String)
├── totalPrice (Decimal)
├── isRecovered (Boolean)
└── timestamps
```

## 🔌 API Endpoints

### Authentication

```http
POST /api/auth/register     # Register new tenant
POST /api/auth/login        # Login tenant
GET  /api/auth/profile      # Get tenant profile
PUT  /api/auth/profile      # Update tenant profile
```

### Analytics

```http
GET /api/analytics/dashboard           # Dashboard statistics
GET /api/analytics/orders-by-date      # Orders grouped by date
GET /api/analytics/top-customers       # Top customers by spend
GET /api/analytics/revenue             # Revenue analytics
GET /api/analytics/products            # Product analytics
GET /api/analytics/abandoned-carts     # Abandoned cart analytics
```

### Data Sync

```http
POST /api/sync/sync         # Trigger manual data sync
GET  /api/sync/status       # Get sync status
```

### Example API Calls

#### Register Tenant
```bash
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "store@example.com",
    "password": "password123",
    "shopifyStoreName": "my-store",
    "shopifyAccessToken": "shpat_xxxxxxxxxxxxxxxx"
  }'
```

#### Get Dashboard Data
```bash
curl -X GET http://localhost:5000/api/analytics/dashboard \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -G -d "startDate=2024-01-01" -d "endDate=2024-01-31"
```

#### Trigger Data Sync
```bash
curl -X POST http://localhost:5000/api/sync/sync \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
DB_HOST=your-production-db-host
DB_NAME=shopify_insights_prod
# ... other production settings
```

### Heroku Deployment

1. **Prepare for Heroku**:
```bash
# Create Procfile
echo "web: node src/server.js" > backend/Procfile
```

2. **Deploy Backend**:
```bash
cd backend
heroku create your-app-name-backend
heroku addons:create cleardb:ignite
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-jwt-secret
# ... set other environment variables
git subtree push --prefix=backend heroku main
```

3. **Deploy Frontend**:
```bash
cd frontend
# Build for production
npm run build

# Deploy to Netlify, Vercel, or Heroku
# Update REACT_APP_API_URL to point to your backend
```

### Render Deployment

1. **Backend on Render**:
   - Connect your GitHub repository
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Add environment variables in Render dashboard

2. **Frontend on Render**:
   - Connect your GitHub repository
   - Set build command: `cd frontend && npm install && npm run build`
   - Set publish directory: `frontend/build`

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## 🔧 Configuration

### Shopify API Setup

1. **Create a Shopify App**:
   - Go to your Shopify Partner Dashboard
   - Create a new app
   - Generate API credentials

2. **Required Shopify Scopes**:
   - `read_customers`
   - `read_orders`
   - `read_products`
   - `read_checkouts` (for abandoned carts)

3. **Get Access Token**:
   - Install your app on a development store
   - Generate a permanent access token

### Sync Configuration

The system automatically syncs data every 6 hours by default. Configure in environment:

```env
SYNC_INTERVAL_HOURS=6
MAX_SYNC_RETRIES=3
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### API Testing with Postman

Import the Postman collection from `docs/postman-collection.json`

## 📝 Development

### Adding New Analytics

1. **Create Controller Method**:
```javascript
// backend/src/controllers/analyticsController.js
async getNewAnalytic(req, res) {
  // Implementation
}
```

2. **Add Route**:
```javascript
// backend/src/routes/analytics.js
router.get('/new-analytic', analyticsController.getNewAnalytic);
```

3. **Update Frontend**:
```javascript
// frontend/src/services/api.js
getNewAnalytic: () => api.get('/analytics/new-analytic')
```

### Database Changes

```bash
# Create new migration
npx sequelize-cli migration:generate --name add-new-field

# Run migrations
npm run migrate
```

## ⚠️ Assumptions & Limitations

### Assumptions
- Each tenant has one Shopify store
- Shopify API rate limits are respected (40 calls/second)
- Data sync happens once every 6 hours by default
- Currency is primarily USD (configurable per store)

### Current Limitations
- No real-time data updates (scheduled sync only)
- Limited to Shopify Plus features for some APIs
- No multi-currency analytics aggregation
- Single-region deployment (no global CDN)

### Future Enhancements
- Real-time webhooks integration
- Multi-currency support
- Advanced segmentation analytics
- Custom dashboard builder
- Mobile app
- Advanced reporting exports (PDF, Excel)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review API examples in `docs/api-examples.md`

## 🙏 Acknowledgments

- Shopify for their comprehensive API
- The Node.js and React.js communities
- All contributors and supporters

---

**Built with ❤️ for the Xeno FDE Internship Assignment 2025**
