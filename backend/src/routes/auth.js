const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validation');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('shopifyStoreName')
    .notEmpty()
    .withMessage('Shopify store name is required')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Invalid store name format'),
  body('shopifyAccessToken')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 10 })
    .withMessage('Invalid Shopify access token')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('shopifyStoreName')
    .optional()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Invalid store name format'),
  body('shopifyAccessToken')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 10 })
    .withMessage('Invalid Shopify access token')
];

// Routes
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, updateProfileValidation, validateRequest, authController.updateProfile);

module.exports = router;
