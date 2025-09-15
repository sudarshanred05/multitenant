const { Tenant, Customer, Product, Order, OrderItem } = require('../models');
const ShopifyService = require('./shopifyService');
const { Op } = require('sequelize');

class DataSyncServiceBulk {
  constructor() {
    this.syncStats = {
      customers: { created: 0, updated: 0, errors: 0 },
      products: { created: 0, updated: 0, errors: 0 },
      orders: { created: 0, updated: 0, errors: 0 },
      orderItems: { created: 0, updated: 0, errors: 0 }
    };
  }

  async syncTenantData(tenantId) {
    console.log(`🚀 Starting OPTIMIZED bulk data sync for tenant: ${tenantId}`);
    
    try {
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant || !tenant.shopifyAccessToken) {
        throw new Error('Tenant not found or Shopify access token missing');
      }

      const shopify = new ShopifyService(tenant.shopifyStoreName, tenant.shopifyAccessToken);
      
      // Reset stats
      this.resetStats();

      // Sync data using bulk operations (much faster!)
      await this.syncCustomersBulk(tenant, shopify);
      await this.syncProductsBulk(tenant, shopify);
      await this.syncOrdersBulk(tenant, shopify);

      // Update last sync timestamp
      await tenant.update({ lastSyncAt: new Date() });

      console.log(`✅ OPTIMIZED bulk data sync completed for tenant: ${tenantId}`, this.syncStats);
      return this.syncStats;
    } catch (error) {
      console.error(`❌ OPTIMIZED bulk data sync failed for tenant: ${tenantId}`, error);
      throw error;
    }
  }

  async syncCustomersBulk(tenant, shopify) {
    try {
      console.log('🔄 Bulk syncing customers...');
      const shopifyCustomers = await shopify.getAllCustomers();

      if (!shopifyCustomers || shopifyCustomers.length === 0) {
        console.log('No customers to sync');
        return;
      }

      // Prepare all customer data for bulk insert
      const customerData = shopifyCustomers.map(shopifyCustomer => ({
        tenantId: tenant.id,
        shopifyCustomerId: shopifyCustomer.id,
        email: shopifyCustomer.email,
        firstName: shopifyCustomer.first_name,
        lastName: shopifyCustomer.last_name,
        phone: shopifyCustomer.phone,
        totalSpent: parseFloat(shopifyCustomer.total_spent) || 0,
        ordersCount: shopifyCustomer.orders_count || 0,
        state: shopifyCustomer.state,
        tags: shopifyCustomer.tags,
        acceptsMarketing: shopifyCustomer.accepts_marketing || false,
        shopifyCreatedAt: shopifyCustomer.created_at,
        shopifyUpdatedAt: shopifyCustomer.updated_at,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Use bulkCreate with updateOnDuplicate for upsert behavior
      const result = await Customer.bulkCreate(customerData, {
        updateOnDuplicate: [
          'email', 'firstName', 'lastName', 'phone', 'totalSpent', 
          'ordersCount', 'state', 'tags', 'acceptsMarketing', 
          'shopifyCreatedAt', 'shopifyUpdatedAt', 'updatedAt'
        ],
        ignoreDuplicates: false
      });

      // Get existing customers to calculate created vs updated
      const existingCustomers = await Customer.findAll({
        where: {
          tenantId: tenant.id,
          shopifyCustomerId: {
            [Op.in]: shopifyCustomers.map(c => c.id)
          }
        }
      });

      this.syncStats.customers.created = customerData.length - existingCustomers.length;
      this.syncStats.customers.updated = existingCustomers.length;

      console.log(`✅ Bulk synced ${customerData.length} customers (${this.syncStats.customers.created} created, ${this.syncStats.customers.updated} updated)`);

    } catch (error) {
      console.error('❌ Error in bulk customer sync:', error);
      this.syncStats.customers.errors++;
      throw error;
    }
  }

  async syncProductsBulk(tenant, shopify) {
    try {
      console.log('🔄 Bulk syncing products...');
      const shopifyProducts = await shopify.getAllProducts();

      if (!shopifyProducts || shopifyProducts.length === 0) {
        console.log('No products to sync');
        return;
      }

      // Prepare all product data for bulk insert
      const productData = shopifyProducts.map(shopifyProduct => {
        const firstVariant = shopifyProduct.variants?.[0];
        
        return {
          tenantId: tenant.id,
          shopifyProductId: shopifyProduct.id,
          title: shopifyProduct.title,
          vendor: shopifyProduct.vendor,
          productType: shopifyProduct.product_type,
          tags: shopifyProduct.tags,
          status: shopifyProduct.status,
          totalInventory: shopifyProduct.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0,
          price: firstVariant?.price ? parseFloat(firstVariant.price) : null,
          compareAtPrice: firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
          sku: firstVariant?.sku,
          weight: firstVariant?.weight ? parseFloat(firstVariant.weight) : null,
          weightUnit: firstVariant?.weight_unit,
          imageUrl: shopifyProduct.images?.[0]?.src,
          shopifyCreatedAt: shopifyProduct.created_at,
          shopifyUpdatedAt: shopifyProduct.updated_at,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      // Use bulkCreate with updateOnDuplicate for upsert behavior
      await Product.bulkCreate(productData, {
        updateOnDuplicate: [
          'title', 'vendor', 'productType', 'tags', 'status', 'totalInventory',
          'price', 'compareAtPrice', 'sku', 'weight', 'weightUnit', 'imageUrl',
          'shopifyCreatedAt', 'shopifyUpdatedAt', 'updatedAt'
        ],
        ignoreDuplicates: false
      });

      // Get existing products to calculate created vs updated
      const existingProducts = await Product.findAll({
        where: {
          tenantId: tenant.id,
          shopifyProductId: {
            [Op.in]: shopifyProducts.map(p => p.id)
          }
        }
      });

      this.syncStats.products.created = productData.length - existingProducts.length;
      this.syncStats.products.updated = existingProducts.length;

      console.log(`✅ Bulk synced ${productData.length} products (${this.syncStats.products.created} created, ${this.syncStats.products.updated} updated)`);

    } catch (error) {
      console.error('❌ Error in bulk product sync:', error);
      this.syncStats.products.errors++;
      throw error;
    }
  }

  async syncOrdersBulk(tenant, shopify) {
    try {
      console.log('🔄 Bulk syncing orders...');
      const shopifyOrders = await shopify.getAllOrders();

      if (!shopifyOrders || shopifyOrders.length === 0) {
        console.log('No orders to sync');
        return;
      }

      // Get all customers and products in bulk for reference mapping
      const customers = await Customer.findAll({
        where: { tenantId: tenant.id },
        attributes: ['id', 'shopifyCustomerId']
      });
      const customerMap = new Map(customers.map(c => [c.shopifyCustomerId, c.id]));

      const products = await Product.findAll({
        where: { tenantId: tenant.id },
        attributes: ['id', 'shopifyProductId']
      });
      const productMap = new Map(products.map(p => [p.shopifyProductId, p.id]));

      // Prepare all order data for bulk insert
      const orderData = [];
      const allOrderItems = [];

      for (const shopifyOrder of shopifyOrders) {
        const customerId = shopifyOrder.customer ? customerMap.get(shopifyOrder.customer.id) : null;

        const orderRecord = {
          tenantId: tenant.id,
          customerId: customerId,
          shopifyOrderId: shopifyOrder.id,
          orderNumber: shopifyOrder.order_number?.toString(),
          email: shopifyOrder.email,
          totalPrice: parseFloat(shopifyOrder.total_price),
          subtotalPrice: parseFloat(shopifyOrder.subtotal_price) || 0,
          totalTax: parseFloat(shopifyOrder.total_tax) || 0,
          totalDiscounts: parseFloat(shopifyOrder.total_discounts) || 0,
          currency: shopifyOrder.currency,
          financialStatus: shopifyOrder.financial_status,
          fulfillmentStatus: shopifyOrder.fulfillment_status,
          tags: shopifyOrder.tags,
          note: shopifyOrder.note,
          gateway: shopifyOrder.gateway,
          paymentMethod: shopifyOrder.payment_gateway_names?.[0],
          totalWeight: parseFloat(shopifyOrder.total_weight) || 0,
          lineItemsCount: shopifyOrder.line_items?.length || 0,
          shopifyCreatedAt: shopifyOrder.created_at,
          shopifyUpdatedAt: shopifyOrder.updated_at,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        orderData.push(orderRecord);

        // Prepare order items for this order
        if (shopifyOrder.line_items && shopifyOrder.line_items.length > 0) {
          for (const lineItem of shopifyOrder.line_items) {
            const productId = lineItem.product_id ? productMap.get(lineItem.product_id) : null;

            allOrderItems.push({
              tenantId: tenant.id,
              // orderId will be set after orders are created
              shopifyOrderId: shopifyOrder.id,
              productId: productId,
              shopifyOrderItemId: lineItem.id,
              shopifyProductId: lineItem.product_id,
              shopifyVariantId: lineItem.variant_id,
              title: lineItem.title,
              variantTitle: lineItem.variant_title,
              sku: lineItem.sku,
              quantity: lineItem.quantity,
              price: parseFloat(lineItem.price),
              totalDiscount: parseFloat(lineItem.total_discount) || 0,
              vendor: lineItem.vendor,
              weight: lineItem.grams ? parseFloat(lineItem.grams) : null,
              weightUnit: 'g',
              requiresShipping: lineItem.requires_shipping,
              taxable: lineItem.taxable,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }

      // Bulk create orders
      await Order.bulkCreate(orderData, {
        updateOnDuplicate: [
          'customerId', 'orderNumber', 'email', 'totalPrice', 'subtotalPrice',
          'totalTax', 'totalDiscounts', 'currency', 'financialStatus', 'fulfillmentStatus',
          'tags', 'note', 'gateway', 'paymentMethod', 'totalWeight', 'lineItemsCount',
          'shopifyCreatedAt', 'shopifyUpdatedAt', 'updatedAt'
        ],
        ignoreDuplicates: false
      });

      // Get the created orders to map orderIds for order items
      const createdOrders = await Order.findAll({
        where: {
          tenantId: tenant.id,
          shopifyOrderId: {
            [Op.in]: shopifyOrders.map(o => o.id)
          }
        },
        attributes: ['id', 'shopifyOrderId']
      });
      const orderMap = new Map(createdOrders.map(o => [o.shopifyOrderId, o.id]));

      // Set orderIds for order items
      allOrderItems.forEach(item => {
        item.orderId = orderMap.get(item.shopifyOrderId);
        delete item.shopifyOrderId; // Remove temporary field
      });

      // Bulk create order items
      if (allOrderItems.length > 0) {
        await OrderItem.bulkCreate(allOrderItems, {
          updateOnDuplicate: [
            'orderId', 'productId', 'shopifyProductId', 'shopifyVariantId',
            'title', 'variantTitle', 'sku', 'quantity', 'price', 'totalDiscount',
            'vendor', 'weight', 'weightUnit', 'requiresShipping', 'taxable', 'updatedAt'
          ],
          ignoreDuplicates: false
        });
      }

      // Calculate stats
      const existingOrders = await Order.findAll({
        where: {
          tenantId: tenant.id,
          shopifyOrderId: {
            [Op.in]: shopifyOrders.map(o => o.id)
          }
        }
      });

      this.syncStats.orders.created = orderData.length - existingOrders.length;
      this.syncStats.orders.updated = existingOrders.length;
      this.syncStats.orderItems.created = allOrderItems.length;

      console.log(`✅ Bulk synced ${orderData.length} orders (${this.syncStats.orders.created} created, ${this.syncStats.orders.updated} updated)`);
      console.log(`✅ Bulk synced ${allOrderItems.length} order items`);

    } catch (error) {
      console.error('❌ Error in bulk order sync:', error);
      this.syncStats.orders.errors++;
      throw error;
    }
  }

  resetStats() {
    this.syncStats = {
      customers: { created: 0, updated: 0, errors: 0 },
      products: { created: 0, updated: 0, errors: 0 },
      orders: { created: 0, updated: 0, errors: 0 },
      orderItems: { created: 0, updated: 0, errors: 0 }
    };
  }
}

module.exports = DataSyncServiceBulk;