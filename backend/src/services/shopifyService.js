const axios = require('axios');

class ShopifyService {
  constructor(storeName, accessToken) {
    this.storeName = storeName;
    this.accessToken = accessToken;
    this.baseURL = `https://${storeName}.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION || '2023-10'}`;
  }

  async makeRequest(endpoint, params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 250,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Shopify API Error for ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getCustomers(sinceId = null) {
    const params = sinceId ? { since_id: sinceId } : {};
    const data = await this.makeRequest('/customers.json', params);
    return data.customers;
  }

  async getOrders(sinceId = null, status = 'any') {
    const params = { 
      status,
      ...(sinceId && { since_id: sinceId })
    };
    const data = await this.makeRequest('/orders.json', params);
    return data.orders;
  }

  async getProducts(sinceId = null) {
    const params = sinceId ? { since_id: sinceId } : {};
    const data = await this.makeRequest('/products.json', params);
    return data.products;
  }

  async getCheckouts() {
    try {
      const data = await this.makeRequest('/checkouts.json');
      return data.checkouts || [];
    } catch (error) {
      // Checkouts API might not be available for all plans
      console.warn('Checkouts API not available:', error.message);
      return [];
    }
  }

  async getAbandonedCheckouts(sinceId = null) {
    try {
      const params = sinceId ? { since_id: sinceId } : {};
      const data = await this.makeRequest('/checkouts.json', {
        ...params,
        status: 'abandoned'
      });
      return data.checkouts || [];
    } catch (error) {
      console.warn('Abandoned checkouts API not available:', error.message);
      return [];
    }
  }

  async getOrdersByDate(startDate, endDate) {
    const params = {
      created_at_min: startDate,
      created_at_max: endDate,
      status: 'any'
    };
    const data = await this.makeRequest('/orders.json', params);
    return data.orders;
  }

  async getCustomerById(customerId) {
    const data = await this.makeRequest(`/customers/${customerId}.json`);
    return data.customer;
  }

  async getOrderById(orderId) {
    const data = await this.makeRequest(`/orders/${orderId}.json`);
    return data.order;
  }

  async getProductById(productId) {
    const data = await this.makeRequest(`/products/${productId}.json`);
    return data.product;
  }

  // Paginated fetch for large datasets
  async getAllCustomers() {
    let allCustomers = [];
    let sinceId = null;
    let hasMore = true;

    while (hasMore) {
      const customers = await this.getCustomers(sinceId);
      if (customers.length === 0) {
        hasMore = false;
      } else {
        allCustomers = allCustomers.concat(customers);
        sinceId = customers[customers.length - 1].id;
        
        // If we got less than the limit, we're done
        if (customers.length < 250) {
          hasMore = false;
        }
      }
    }

    return allCustomers;
  }

  async getAllOrders() {
    let allOrders = [];
    let sinceId = null;
    let hasMore = true;

    while (hasMore) {
      const orders = await this.getOrders(sinceId);
      if (orders.length === 0) {
        hasMore = false;
      } else {
        allOrders = allOrders.concat(orders);
        sinceId = orders[orders.length - 1].id;
        
        if (orders.length < 250) {
          hasMore = false;
        }
      }
    }

    return allOrders;
  }

  async getAllProducts() {
    let allProducts = [];
    let sinceId = null;
    let hasMore = true;

    while (hasMore) {
      const products = await this.getProducts(sinceId);
      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts = allProducts.concat(products);
        sinceId = products[products.length - 1].id;
        
        if (products.length < 250) {
          hasMore = false;
        }
      }
    }

    return allProducts;
  }
}

module.exports = ShopifyService;
