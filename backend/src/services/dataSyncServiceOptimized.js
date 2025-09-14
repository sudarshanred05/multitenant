const { Tenant, Customer, Product, Order, OrderItem } = require('../models');
const ShopifyService = require('./shopifyService');
const { Op } = require('sequelize');

class DataSyncServiceOptimized {
  constructor() {
    this.syncStats = {
      customers: { created: 0, updated: 0, errors: 0 },
      products: { created: 0, updated: 0, errors: 0 },
      orders: { created: 0, updated: 0, errors: 0 },
      orderItems: { created: 0, updated: 0, errors: 0 }
    };
  }

  async syncTenantData(tenantId) {
    console.log(`Starting optimized data sync for tenant: ${tenantId}`);
    
    try {
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant || !tenant.shopifyAccessToken) {
        throw new Error('Tenant not found or Shopify access token missing');
      }

      const shopify = new ShopifyService(tenant.shopifyStoreName, tenant.shopifyAccessToken);
      
      // Reset stats
      this.resetStats();

      console.log('Fetching data from Shopify...');
      // Fetch all data from Shopify in parallel
      const [shopifyCustomers, shopifyProducts, shopifyOrders] = await Promise.all([
        shopify.getAllCustomers(),
        shopify.getAllProducts(),
        shopify.getAllOrders()
      ]);

      console.log(`Fetched ${shopifyCustomers.length} customers, ${shopifyProducts.length} products, ${shopifyOrders.length} orders`);

      // Sync data with bulk operations
      await this.syncCustomersBulk(tenant, shopifyCustomers);
      await this.syncProductsBulk(tenant, shopifyProducts);
      await this.syncOrdersBulk(tenant, shopifyOrders, shopifyCustomers, shopifyProducts);

      // Update last sync timestamp
      await tenant.update({ lastSyncAt: new Date() });

      console.log(`Optimized data sync completed for tenant: ${tenantId}`, this.syncStats);
      return this.syncStats;
    } catch (error) {
      console.error(`Optimized data sync failed for tenant: ${tenantId}`, error);
      throw error;
    }
  }

  async syncCustomersBulk(tenant, shopifyCustomers) {
    console.log('Bulk syncing customers...');
    try {
      const shopifyCustomerIds = shopifyCustomers.map(c => c.id);
      
      // Get existing customers in one query
      const existingCustomers = await Customer.findAll({
        where: {
          tenantId: tenant.id,
          shopifyCustomerId: { [Op.in]: shopifyCustomerIds }
        }
      });

      const existingCustomerMap = {};
      existingCustomers.forEach(customer => {
        existingCustomerMap[customer.shopifyCustomerId] = customer;
      });

      const customersToCreate = [];
      const customersToUpdate = [];

      for (const shopifyCustomer of shopifyCustomers) {
        const customerData = {
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
          shopifyUpdatedAt: shopifyCustomer.updated_at
        };

        if (existingCustomerMap[shopifyCustomer.id]) {
          customersToUpdate.push({
            ...customerData,
            id: existingCustomerMap[shopifyCustomer.id].id
          });
        } else {
          customersToCreate.push(customerData);
        }
      }

      // Bulk create new customers
      if (customersToCreate.length > 0) {
        await Customer.bulkCreate(customersToCreate);
        this.syncStats.customers.created = customersToCreate.length;
      }

      // Bulk update existing customers
      for (const customerData of customersToUpdate) {
        await Customer.update(customerData, {
          where: { id: customerData.id }
        });
        this.syncStats.customers.updated++;
      }

      console.log(`Customers sync complete: ${this.syncStats.customers.created} created, ${this.syncStats.customers.updated} updated`);
    } catch (error) {
      console.error('Error in bulk customer sync:', error);
      this.syncStats.customers.errors++;
      throw error;
    }
  }

  async syncProductsBulk(tenant, shopifyProducts) {
    console.log('Bulk syncing products...');
    try {
      const shopifyProductIds = shopifyProducts.map(p => p.id);
      
      // Get existing products in one query
      const existingProducts = await Product.findAll({
        where: {
          tenantId: tenant.id,
          shopifyProductId: { [Op.in]: shopifyProductIds }
        }
      });

      const existingProductMap = {};
      existingProducts.forEach(product => {
        existingProductMap[product.shopifyProductId] = product;
      });

      const productsToCreate = [];
      const productsToUpdate = [];

      for (const shopifyProduct of shopifyProducts) {
        const firstVariant = shopifyProduct.variants?.[0];
        
        const productData = {
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
          shopifyUpdatedAt: shopifyProduct.updated_at
        };

        if (existingProductMap[shopifyProduct.id]) {
          productsToUpdate.push({
            ...productData,
            id: existingProductMap[shopifyProduct.id].id
          });
        } else {
          productsToCreate.push(productData);
        }
      }

      // Bulk create new products
      if (productsToCreate.length > 0) {
        await Product.bulkCreate(productsToCreate);
        this.syncStats.products.created = productsToCreate.length;
      }

      // Bulk update existing products
      for (const productData of productsToUpdate) {
        await Product.update(productData, {
          where: { id: productData.id }
        });
        this.syncStats.products.updated++;
      }

      console.log(`Products sync complete: ${this.syncStats.products.created} created, ${this.syncStats.products.updated} updated`);
    } catch (error) {
      console.error('Error in bulk product sync:', error);
      this.syncStats.products.errors++;
      throw error;
    }
  }

  async syncOrdersBulk(tenant, shopifyOrders, shopifyCustomers, shopifyProducts) {
    console.log('Bulk syncing orders...');
    try {
      // Create lookup maps for customers and products
      const customerMap = {};
      const existingCustomers = await Customer.findAll({
        where: { tenantId: tenant.id }
      });
      existingCustomers.forEach(customer => {
        customerMap[customer.shopifyCustomerId] = customer.id;
      });

      const productMap = {};
      const existingProducts = await Product.findAll({
        where: { tenantId: tenant.id }
      });
      existingProducts.forEach(product => {
        productMap[product.shopifyProductId] = product.id;
      });

      const shopifyOrderIds = shopifyOrders.map(o => o.id);
      
      // Get existing orders in one query
      const existingOrders = await Order.findAll({
        where: {
          tenantId: tenant.id,
          shopifyOrderId: { [Op.in]: shopifyOrderIds }
        }
      });

      const existingOrderMap = {};
      existingOrders.forEach(order => {
        existingOrderMap[order.shopifyOrderId] = order;
      });

      const ordersToCreate = [];
      const ordersToUpdate = [];
      const orderItemsToCreate = [];

      for (const shopifyOrder of shopifyOrders) {
        const customerId = shopifyOrder.customer ? customerMap[shopifyOrder.customer.id] : null;

        const orderData = {
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
          shopifyUpdatedAt: shopifyOrder.updated_at
        };

        if (existingOrderMap[shopifyOrder.id]) {
          ordersToUpdate.push({
            ...orderData,
            id: existingOrderMap[shopifyOrder.id].id
          });
        } else {
          ordersToCreate.push(orderData);
        }
      }

      // Bulk create new orders
      let createdOrders = [];
      if (ordersToCreate.length > 0) {
        createdOrders = await Order.bulkCreate(ordersToCreate, { returning: true });
        this.syncStats.orders.created = ordersToCreate.length;
      }

      // Bulk update existing orders
      for (const orderData of ordersToUpdate) {
        await Order.update(orderData, {
          where: { id: orderData.id }
        });
        this.syncStats.orders.updated++;
      }

      // Now handle order items for created orders
      const allOrders = [...createdOrders, ...existingOrders];
      const orderMap = {};
      allOrders.forEach(order => {
        orderMap[order.shopifyOrderId] = order.id;
      });

      // Prepare order items for bulk creation
      for (const shopifyOrder of shopifyOrders) {
        const orderId = orderMap[shopifyOrder.id];
        
        if (shopifyOrder.line_items && orderId) {
          for (const lineItem of shopifyOrder.line_items) {
            const productId = lineItem.product_id ? productMap[lineItem.product_id] : null;

            orderItemsToCreate.push({
              tenantId: tenant.id,
              orderId: orderId,
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
              taxable: lineItem.taxable
            });
          }
        }
      }

      // Remove existing order items for orders being updated and bulk create all
      if (orderItemsToCreate.length > 0) {
        // Delete existing order items for orders being processed
        await OrderItem.destroy({
          where: {
            tenantId: tenant.id,
            orderId: { [Op.in]: Object.values(orderMap) }
          }
        });

        // Bulk create all order items
        await OrderItem.bulkCreate(orderItemsToCreate);
        this.syncStats.orderItems.created = orderItemsToCreate.length;
      }

      console.log(`Orders sync complete: ${this.syncStats.orders.created} created, ${this.syncStats.orders.updated} updated`);
      console.log(`Order items sync complete: ${this.syncStats.orderItems.created} created`);
    } catch (error) {
      console.error('Error in bulk order sync:', error);
      this.syncStats.orders.errors++;
      throw error;
    }
  }

  resetStats() {
    Object.keys(this.syncStats).forEach(key => {
      this.syncStats[key] = { created: 0, updated: 0, errors: 0 };
    });
  }
}

module.exports = DataSyncServiceOptimized;