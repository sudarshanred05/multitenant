const { QueryInterface, Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding database indexes for better performance...');

    try {
      // Add indexes for Customer table
      await queryInterface.addIndex('customers', ['tenantId', 'shopifyCustomerId'], {
        name: 'idx_customers_tenant_shopify_id',
        unique: true
      });

      await queryInterface.addIndex('customers', ['tenantId'], {
        name: 'idx_customers_tenant_id'
      });

      await queryInterface.addIndex('customers', ['email'], {
        name: 'idx_customers_email'
      });

      // Add indexes for Product table
      await queryInterface.addIndex('products', ['tenantId', 'shopifyProductId'], {
        name: 'idx_products_tenant_shopify_id',
        unique: true
      });

      await queryInterface.addIndex('products', ['tenantId'], {
        name: 'idx_products_tenant_id'
      });

      // Add indexes for Order table
      await queryInterface.addIndex('orders', ['tenantId', 'shopifyOrderId'], {
        name: 'idx_orders_tenant_shopify_id',
        unique: true
      });

      await queryInterface.addIndex('orders', ['tenantId'], {
        name: 'idx_orders_tenant_id'
      });

      await queryInterface.addIndex('orders', ['customerId'], {
        name: 'idx_orders_customer_id'
      });

      await queryInterface.addIndex('orders', ['shopifyCreatedAt'], {
        name: 'idx_orders_created_at'
      });

      // Add indexes for OrderItem table
      await queryInterface.addIndex('orderitems', ['tenantId', 'shopifyOrderItemId'], {
        name: 'idx_orderitems_tenant_shopify_id',
        unique: true
      });

      await queryInterface.addIndex('orderitems', ['tenantId'], {
        name: 'idx_orderitems_tenant_id'
      });

      await queryInterface.addIndex('orderitems', ['orderId'], {
        name: 'idx_orderitems_order_id'
      });

      await queryInterface.addIndex('orderitems', ['productId'], {
        name: 'idx_orderitems_product_id'
      });

      // Add indexes for Tenant table
      await queryInterface.addIndex('tenants', ['email'], {
        name: 'idx_tenants_email',
        unique: true
      });

      console.log('✅ Database indexes added successfully');
    } catch (error) {
      console.error('❌ Error adding database indexes:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Removing database indexes...');

    try {
      // Remove indexes for Customer table
      await queryInterface.removeIndex('customers', 'idx_customers_tenant_shopify_id');
      await queryInterface.removeIndex('customers', 'idx_customers_tenant_id');
      await queryInterface.removeIndex('customers', 'idx_customers_email');

      // Remove indexes for Product table
      await queryInterface.removeIndex('products', 'idx_products_tenant_shopify_id');
      await queryInterface.removeIndex('products', 'idx_products_tenant_id');

      // Remove indexes for Order table
      await queryInterface.removeIndex('orders', 'idx_orders_tenant_shopify_id');
      await queryInterface.removeIndex('orders', 'idx_orders_tenant_id');
      await queryInterface.removeIndex('orders', 'idx_orders_customer_id');
      await queryInterface.removeIndex('orders', 'idx_orders_created_at');

      // Remove indexes for OrderItem table
      await queryInterface.removeIndex('orderitems', 'idx_orderitems_tenant_shopify_id');
      await queryInterface.removeIndex('orderitems', 'idx_orderitems_tenant_id');
      await queryInterface.removeIndex('orderitems', 'idx_orderitems_order_id');
      await queryInterface.removeIndex('orderitems', 'idx_orderitems_product_id');

      // Remove indexes for Tenant table
      await queryInterface.removeIndex('tenants', 'idx_tenants_email');

      console.log('✅ Database indexes removed successfully');
    } catch (error) {
      console.error('❌ Error removing database indexes:', error);
      throw error;
    }
  }
};