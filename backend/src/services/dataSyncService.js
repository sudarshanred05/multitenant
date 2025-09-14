const { Tenant, Customer, Product, Order, OrderItem } = require('../models');
const ShopifyService = require('./shopifyService');

class DataSyncService {
  constructor() {
    this.syncStats = {
      customers: { created: 0, updated: 0, errors: 0 },
      products: { created: 0, updated: 0, errors: 0 },
      orders: { created: 0, updated: 0, errors: 0 },
      orderItems: { created: 0, updated: 0, errors: 0 }
    };
  }

  async syncTenantData(tenantId) {
    console.log(`Starting data sync for tenant: ${tenantId}`);
    
    try {
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant || !tenant.shopifyAccessToken) {
        throw new Error('Tenant not found or Shopify access token missing');
      }

      const shopify = new ShopifyService(tenant.shopifyStoreName, tenant.shopifyAccessToken);
      
      // Reset stats
      this.resetStats();

      // Sync data in order of dependencies
      await this.syncCustomers(tenant, shopify);
      await this.syncProducts(tenant, shopify);
      await this.syncOrders(tenant, shopify);

      // Update last sync timestamp
      await tenant.update({ lastSyncAt: new Date() });

      console.log(`Data sync completed for tenant: ${tenantId}`, this.syncStats);
      return this.syncStats;
    } catch (error) {
      console.error(`Data sync failed for tenant: ${tenantId}`, error);
      throw error;
    }
  }

  async syncCustomers(tenant, shopify) {
    try {
      console.log('Syncing customers...');
      const shopifyCustomers = await shopify.getAllCustomers();

      for (const shopifyCustomer of shopifyCustomers) {
        try {
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

          const [customer, created] = await Customer.findOrCreate({
            where: {
              tenantId: tenant.id,
              shopifyCustomerId: shopifyCustomer.id
            },
            defaults: customerData
          });

          if (!created) {
            await customer.update(customerData);
            this.syncStats.customers.updated++;
          } else {
            this.syncStats.customers.created++;
          }
        } catch (error) {
          console.error(`Error syncing customer ${shopifyCustomer.id}:`, error);
          this.syncStats.customers.errors++;
        }
      }
    } catch (error) {
      console.error('Error syncing customers:', error);
      throw error;
    }
  }

  async syncProducts(tenant, shopify) {
    try {
      console.log('Syncing products...');
      const shopifyProducts = await shopify.getAllProducts();

      for (const shopifyProduct of shopifyProducts) {
        try {
          // Get the first variant for price info
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

          const [product, created] = await Product.findOrCreate({
            where: {
              tenantId: tenant.id,
              shopifyProductId: shopifyProduct.id
            },
            defaults: productData
          });

          if (!created) {
            await product.update(productData);
            this.syncStats.products.updated++;
          } else {
            this.syncStats.products.created++;
          }
        } catch (error) {
          console.error(`Error syncing product ${shopifyProduct.id}:`, error);
          this.syncStats.products.errors++;
        }
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      throw error;
    }
  }

  async syncOrders(tenant, shopify) {
    try {
      console.log('Syncing orders...');
      const shopifyOrders = await shopify.getAllOrders();

      for (const shopifyOrder of shopifyOrders) {
        try {
          // Find customer
          let customer = null;
          if (shopifyOrder.customer) {
            customer = await Customer.findOne({
              where: {
                tenantId: tenant.id,
                shopifyCustomerId: shopifyOrder.customer.id
              }
            });
          }

          const orderData = {
            tenantId: tenant.id,
            customerId: customer?.id,
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

          const [order, created] = await Order.findOrCreate({
            where: {
              tenantId: tenant.id,
              shopifyOrderId: shopifyOrder.id
            },
            defaults: orderData
          });

          if (!created) {
            await order.update(orderData);
            this.syncStats.orders.updated++;
          } else {
            this.syncStats.orders.created++;
          }

          // Sync order items
          if (shopifyOrder.line_items) {
            await this.syncOrderItems(tenant, order, shopifyOrder.line_items);
          }
        } catch (error) {
          console.error(`Error syncing order ${shopifyOrder.id}:`, error);
          this.syncStats.orders.errors++;
        }
      }
    } catch (error) {
      console.error('Error syncing orders:', error);
      throw error;
    }
  }

  async syncOrderItems(tenant, order, lineItems) {
    for (const lineItem of lineItems) {
      try {
        // Find product
        let product = null;
        if (lineItem.product_id) {
          product = await Product.findOne({
            where: {
              tenantId: tenant.id,
              shopifyProductId: lineItem.product_id
            }
          });
        }

        const orderItemData = {
          tenantId: tenant.id,
          orderId: order.id,
          productId: product?.id,
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
        };

        const [orderItem, created] = await OrderItem.findOrCreate({
          where: {
            tenantId: tenant.id,
            shopifyOrderItemId: lineItem.id
          },
          defaults: orderItemData
        });

        if (!created) {
          await orderItem.update(orderItemData);
          this.syncStats.orderItems.updated++;
        } else {
          this.syncStats.orderItems.created++;
        }
      } catch (error) {
        console.error(`Error syncing order item ${lineItem.id}:`, error);
        this.syncStats.orderItems.errors++;
      }
    }
  }

  resetStats() {
    Object.keys(this.syncStats).forEach(key => {
      this.syncStats[key] = { created: 0, updated: 0, errors: 0 };
    });
  }
}

module.exports = DataSyncService;
