Shopify Insights Service
========================

Overview
--------
Multi-tenant Shopify data ingestion and analytics service. The backend (Node.js/Express with Sequelize and MySQL) ingests Customers, Products, Orders, and Order Items from the Shopify Admin API. The frontend (React) provides authentication, manual sync, and an analytics dashboard.

Contents
--------
- Setup instructions
- Architecture diagram
- API endpoints
- Database schema
- Known limitations and assumptions

Setup Instructions
------------------

Prerequisites
- Node.js 16 or newer
- MySQL 8 (local) or a managed MySQL instance
- Shopify store Admin API access token (per tenant)

Environment variables
Create a .env file for backend (backend/.env):

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopify_insights_dev
DB_USER=root
DB_PASS=
DB_DIALECT=mysql
SHOPIFY_API_VERSION=2023-10
CORS_ORIGIN=http://localhost:3000

Frontend environment (optional, if calling a remote backend) in frontend/.env:

REACT_APP_API_URL=http://localhost:5000/api

Install and run (local)
Backend
1. Open a terminal in backend
2. Install dependencies: npm install
3. Start dev server: npm run dev

Frontend
1. Open a terminal in frontend
2. Install dependencies: npm install
3. Start dev server: npm run dev

Deployment notes
- The repository contains Nixpacks.toml files for hosting on platforms like Railway.
- Ensure backend environment variables are configured in the platform.
- The server performs sequelize.sync({ alter: true }) on start to ensure tables exist; migrations are included for performance indexes.

Architecture Diagram
--------------------

High-level data flow

	[Shopify Admin API]
					|
					v
	ShopifyService (axios)
					|
					v
	DataSyncServiceBulk (bulk upserts)
					|
					v
	MySQL (Sequelize models)
					^
					|
	AnalyticsController (queries, aggregates)
					^
					|
	Express API (/api/*)  <——  React Frontend

Key components
- Backend: Express server with routes under /api/auth, /api/analytics, /api/sync
- Services: ShopifyService (Admin API), DataSyncServiceBulk (bulk persistence)
- Scheduler: node-cron job that periodically syncs for all tenants
- Frontend: React app with Login/Register, Profile (store and token), Dashboard

API Endpoints
-------------

Auth (/api/auth)
- POST /register
	- Request body: { email, password, shopifyStoreName, shopifyAccessToken? }
	- Response: { tenant, token }
- POST /login
	- Request body: { email, password }
	- Response: { tenant, token }
- GET /profile
	- Header: Authorization: Bearer <token>
	- Response: { tenant }
- PUT /profile
	- Header: Authorization: Bearer <token>
	- Request body: { shopifyStoreName?, shopifyAccessToken? }
	- Response: { tenant }

Sync (/api/sync)
- POST /sync
	- Header: Authorization: Bearer <token>
	- Triggers a manual data sync for the authenticated tenant
	- Response: sync summary
- GET /status
	- Header: Authorization: Bearer <token>
	- Response: { tenantId, lastSyncAt, shopifyStoreUrl, hasSynced }

Analytics (/api/analytics)
- GET /dashboard
	- Query: startDate?, endDate?
	- Returns: totals (customers, orders, revenue), AOV, counts in range
- GET /orders-by-date
	- Query: startDate?, endDate?, groupBy? (day|week|month)
	- Returns: { date, orderCount, revenue }[]
- GET /revenue
	- Query: period? (7days|30days|90days|1year)
	- Returns: series of daily revenue and orderCount
- GET /products
	- Query: limit? (default 10)
	- Returns: top-selling products by quantity and revenue
- GET /top-customers
	- Query: limit? (default 5)
	- Returns: customers ordered by totalSpent

Database Schema
---------------

All tables are multi-tenant via tenantId. UUID primary keys for local entities; Shopify IDs stored as BIGINT columns with composite unique indexes per tenant.

tenants
- id (UUID, PK)
- email (unique)
- password (hashed)
- shopifyStoreName (unique)
- shopifyAccessToken (sensitive)
- shopifyStoreUrl
- isActive (boolean)
- lastSyncAt (datetime)
- createdAt, updatedAt

customers
- id (UUID, PK)
- tenantId (UUID, FK -> tenants.id)
- shopifyCustomerId (BIGINT, unique per tenant)
- email, firstName, lastName, phone
- totalSpent (decimal), ordersCount (int), state, tags, acceptsMarketing
- shopifyCreatedAt, shopifyUpdatedAt
- createdAt, updatedAt
Indexes: unique(tenantId, shopifyCustomerId), (tenantId, email), (tenantId, totalSpent)

products
- id (UUID, PK)
- tenantId (UUID, FK)
- shopifyProductId (BIGINT, unique per tenant)
- title, vendor, productType, tags, status
- totalInventory (int), price, compareAtPrice, sku, weight, weightUnit, imageUrl
- shopifyCreatedAt, shopifyUpdatedAt
- createdAt, updatedAt
Indexes: unique(tenantId, shopifyProductId), (tenantId, status), (tenantId, productType)

orders
- id (UUID, PK)
- tenantId (UUID, FK)
- customerId (UUID, FK)
- shopifyOrderId (BIGINT, unique per tenant)
- orderNumber, email, currency, financialStatus, fulfillmentStatus, tags, note, gateway, paymentMethod
- totals: totalPrice (decimal), subtotalPrice, totalTax, totalDiscounts, totalWeight, lineItemsCount
- shopifyCreatedAt, shopifyUpdatedAt
- createdAt, updatedAt
Indexes: unique(tenantId, shopifyOrderId), (tenantId, customerId), (tenantId, shopifyCreatedAt), (tenantId, totalPrice), (tenantId, financialStatus)

order_items
- id (UUID, PK)
- tenantId (UUID, FK)
- orderId (UUID, FK)
- productId (UUID, FK)
- shopifyOrderItemId (BIGINT, unique per tenant)
- shopifyProductId (BIGINT), shopifyVariantId (BIGINT)
- title, variantTitle, sku, quantity (int), price (decimal), totalDiscount (decimal)
- vendor, weight, weightUnit, requiresShipping (bool), taxable (bool)
- createdAt, updatedAt
Indexes: unique(tenantId, shopifyOrderItemId), (tenantId, orderId), (tenantId, productId)

Notes on indexing
- Composite unique keys on (tenantId, shopifyId) support idempotent upserts and fast lookups.
- Additional per-tenant indexes optimize common analytics queries (date, totals, status).

Known Limitations and Assumptions
---------------------------------
- Shopify API rate limits: The service fetches in pages of up to 250 and may need retries/backoff under high load.
- Bulk upsert trade-offs: Faster DB writes with fewer round-trips, but less granular per-record error handling compared to per-row operations.
- Migrations vs sync: sequelize.sync({ alter: true }) is convenient but migrations are recommended for controlled production schema changes. A migration for performance indexes is included and should be executed in the hosting environment.
- Multi-tenant isolation: Logical isolation via tenantId; ensure tokens and store names are correctly scoped per tenant.
- Data freshness: Scheduler cadence determines freshness; manual sync is available from the UI.

Local Troubleshooting
- Confirm DB connectivity in backend/.env (host, port, user, password).
- If 401s occur, verify JWT_SECRET and that the frontend includes the token in requests.
- Ensure a valid Shopify Admin API token is configured in the Profile page for the tenant performing sync.

