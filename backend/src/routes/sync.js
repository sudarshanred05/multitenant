const express = require('express');
const syncController = require('../controllers/syncController');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Routes
router.post('/sync', syncController.syncData);
router.get('/status', syncController.getSyncStatus);

module.exports = router;
