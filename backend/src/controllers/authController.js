const jwt = require('jsonwebtoken');
const { Tenant } = require('../models');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, shopifyStoreName, shopifyAccessToken } = req.body;

      const existingTenant = await Tenant.findOne({ where: { email } });
      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Create new tenant
      const tenant = await Tenant.create({
        email,
        password,
        shopifyStoreName,
        shopifyAccessToken,
        shopifyStoreUrl: `https://${shopifyStoreName}.myshopify.com`
      });

      // Generate JWT token
      const token = jwt.sign(
        { tenantId: tenant.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'Tenant registered successfully',
        data: {
          tenant: tenant.toJSON(),
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find tenant
      const tenant = await Tenant.findOne({ where: { email } });
      if (!tenant) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Validate password
      const isValidPassword = await tenant.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is active
      if (!tenant.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { tenantId: tenant.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          tenant: tenant.toJSON(),
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          tenant: req.tenant.toJSON()
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { shopifyStoreName, shopifyAccessToken } = req.body;
      
      const updateData = {};
      if (shopifyStoreName) {
        updateData.shopifyStoreName = shopifyStoreName;
        updateData.shopifyStoreUrl = `https://${shopifyStoreName}.myshopify.com`;
      }
      if (shopifyAccessToken) {
        updateData.shopifyAccessToken = shopifyAccessToken;
      }

      await req.tenant.update(updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          tenant: req.tenant.toJSON()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
