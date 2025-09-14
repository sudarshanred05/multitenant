const jwt = require('jsonwebtoken');
const { Tenant } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tenant = await Tenant.findByPk(decoded.tenantId);
    
    if (!tenant || !tenant.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or inactive account.' 
      });
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

module.exports = auth;
