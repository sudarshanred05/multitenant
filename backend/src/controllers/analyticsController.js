const { Customer, Order, Product, OrderItem } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

class AnalyticsController {
  async getDashboardStats(req, res) {
    try {
      const { tenantId } = req;
      const { startDate, endDate } = req.query;

      // Set default date range if not provided
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate ? new Date(endDate) : new Date();

      // Get total customers
      const totalCustomers = await Customer.count({
        where: { tenantId }
      });

      // Get total orders
      const totalOrders = await Order.count({
        where: { tenantId }
      });

      // Get total revenue
      const revenueResult = await Order.findOne({
        where: { tenantId },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
        ],
        raw: true
      });

      // Get orders in date range
      const ordersInRange = await Order.count({
        where: {
          tenantId,
          shopifyCreatedAt: {
            [Op.between]: [start, end]
          }
        }
      });

      // Get revenue in date range
      const revenueInRangeResult = await Order.findOne({
        where: {
          tenantId,
          shopifyCreatedAt: {
            [Op.between]: [start, end]
          }
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'revenue']
        ],
        raw: true
      });

      // Get average order value
      const avgOrderValue = totalOrders > 0 
        ? (parseFloat(revenueResult.totalRevenue) || 0) / totalOrders 
        : 0;

      res.json({
        success: true,
        data: {
          totalCustomers,
          totalOrders,
          totalRevenue: parseFloat(revenueResult.totalRevenue) || 0,
          ordersInRange,
          revenueInRange: parseFloat(revenueInRangeResult.revenue) || 0,
          averageOrderValue: avgOrderValue,
          dateRange: { startDate: start, endDate: end }
        }
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard stats',
        error: error.message
      });
    }
  }

  async getOrdersByDate(req, res) {
    try {
      const { tenantId } = req;
      const { startDate, endDate, groupBy = 'day' } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Determine date format based on groupBy
      let dateFormat;
      switch (groupBy) {
        case 'month':
          dateFormat = '%Y-%m';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          break;
        case 'day':
        default:
          dateFormat = '%Y-%m-%d';
          break;
      }

      const orders = await Order.findAll({
        where: {
          tenantId,
          shopifyCreatedAt: {
            [Op.between]: [start, end]
          }
        },
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('shopifyCreatedAt'), dateFormat), 'date'],
          [sequelize.fn('COUNT', '*'), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'revenue']
        ],
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('shopifyCreatedAt'), dateFormat)],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('shopifyCreatedAt'), dateFormat), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: orders.map(order => ({
          date: order.date,
          orderCount: parseInt(order.orderCount),
          revenue: parseFloat(order.revenue) || 0
        }))
      });
    } catch (error) {
      console.error('Orders by date error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders by date',
        error: error.message
      });
    }
  }

  async getTopCustomers(req, res) {
    try {
      const { tenantId } = req;
      const { limit = 5 } = req.query;

      const topCustomers = await Customer.findAll({
        where: { tenantId },
        order: [['totalSpent', 'DESC']],
        limit: parseInt(limit),
        include: [{
          model: Order,
          as: 'orders',
          attributes: []
        }]
      });

      res.json({
        success: true,
        data: topCustomers
      });
    } catch (error) {
      console.error('Top customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get top customers',
        error: error.message
      });
    }
  }

  async getRevenueAnalytics(req, res) {
    try {
      const { tenantId } = req;
      const { period = '30days' } = req.query;

      let startDate;
      const endDate = new Date();

      switch (period) {
        case '7days':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const revenueData = await Order.findAll({
        where: {
          tenantId,
          shopifyCreatedAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('shopifyCreatedAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'revenue'],
          [sequelize.fn('COUNT', '*'), 'orderCount']
        ],
        group: [sequelize.fn('DATE', sequelize.col('shopifyCreatedAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('shopifyCreatedAt')), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: {
          period,
          dateRange: { startDate, endDate },
          analytics: revenueData.map(item => ({
            date: item.date,
            revenue: parseFloat(item.revenue) || 0,
            orderCount: parseInt(item.orderCount)
          }))
        }
      });
    } catch (error) {
      console.error('Revenue analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get revenue analytics',
        error: error.message
      });
    }
  }

  async getProductAnalytics(req, res) {
    try {
      const { tenantId } = req;
      const { limit = 10 } = req.query;

      // Get top selling products
      const topProducts = await OrderItem.findAll({
        where: { tenantId },
        attributes: [
          'productId',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
          [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'totalRevenue']
        ],
        include: [{
          model: Product,
          as: 'product',
          attributes: ['title', 'vendor', 'productType']
        }],
        group: ['productId', 'product.id'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: parseInt(limit),
        raw: true,
        nest: true
      });

      res.json({
        success: true,
        data: topProducts.map(item => ({
          product: item.product,
          totalQuantity: parseInt(item.totalQuantity),
          totalRevenue: parseFloat(item.totalRevenue) || 0
        }))
      });
    } catch (error) {
      console.error('Product analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product analytics',
        error: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();
