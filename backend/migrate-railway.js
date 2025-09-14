require('dotenv').config();
const { Sequelize } = require('sequelize');

// Use Railway database configuration directly
const sequelize = new Sequelize({
  host: 'mysql.railway.internal',
  port: 3306,
  username: 'root',
  password: 'eZXStDOCTbOpfuqRpEqAHfraEbKWIaXp',
  database: 'railway',
  dialect: 'mysql',
  logging: console.log,
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timezone: '+00:00'
  }
});

// Import models
const Tenant = require('./src/models/Tenant');
const Customer = require('./src/models/Customer');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const OrderItem = require('./src/models/OrderItem');

// Initialize models
Tenant.init(Tenant.getAttributes(), { sequelize, modelName: 'Tenant', tableName: 'tenants' });
Customer.init(Customer.getAttributes(), { sequelize, modelName: 'Customer', tableName: 'customers' });
Product.init(Product.getAttributes(), { sequelize, modelName: 'Product', tableName: 'products' });
Order.init(Order.getAttributes(), { sequelize, modelName: 'Order', tableName: 'orders' });
OrderItem.init(OrderItem.getAttributes(), { sequelize, modelName: 'OrderItem', tableName: 'order_items' });

// Set up associations
Customer.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Product.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Order.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
OrderItem.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

async function runMigrations() {
  try {
    console.log('Connecting to Railway database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('Running database sync...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables created/updated successfully.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();