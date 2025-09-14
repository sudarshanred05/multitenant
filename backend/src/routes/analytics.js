const express = require('express');
const { query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validation');

const router = express.Router();

// Validation rules
const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const periodValidation = [
  query('period')
    .optional()
    .isIn(['7days', '30days', '90days', '1year'])
    .withMessage('Invalid period')
];

// Apply authentication to all routes
router.use(auth);

// Routes
router.get('/dashboard', dateRangeValidation, validateRequest, analyticsController.getDashboardStats);
router.get('/orders-by-date', dateRangeValidation, validateRequest, analyticsController.getOrdersByDate);
router.get('/top-customers', dateRangeValidation, validateRequest, analyticsController.getTopCustomers);
router.get('/revenue', periodValidation, validateRequest, analyticsController.getRevenueAnalytics);
router.get('/products', dateRangeValidation, validateRequest, analyticsController.getProductAnalytics);

module.exports = router;
