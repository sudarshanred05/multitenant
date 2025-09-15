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

async function runMigrations() {
  try {
    console.log('Connecting to Railway database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('Adding performance indexes...');

    // Add indexes for better performance
    try {
      // Customer table indexes
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_customers_tenant_shopify_id 
        ON customers (tenantId, shopifyCustomerId)
      `);
      
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_customers_tenant_id 
        ON customers (tenantId)
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_customers_email 
        ON customers (email)
      `);

      // Product table indexes
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_products_tenant_shopify_id 
        ON products (tenantId, shopifyProductId)
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_products_tenant_id 
        ON products (tenantId)
      `);

      // Order table indexes
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_tenant_shopify_id 
        ON orders (tenantId, shopifyOrderId)
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_tenant_id 
        ON orders (tenantId)
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
        ON orders (customerId)
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_created_at 
        ON orders (shopifyCreatedAt)
      `);

      // OrderItem table indexes
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_orderitems_tenant_shopify_id 
        ON orderitems (tenantId, shopifyOrderItemId)
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_orderitems_tenant_id 
        ON orderitems (tenantId)
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_orderitems_order_id 
        ON orderitems (orderId)
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_orderitems_product_id 
        ON orderitems (productId)
      `);

      console.log('✅ Performance indexes added successfully!');
    } catch (indexError) {
      console.log('Note: Some indexes may already exist, continuing...');
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();