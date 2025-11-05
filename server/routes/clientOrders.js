const express = require('express');
const router = express.Router();
const {
  getPublicMenu,
  createClientOrder,
  getOrderStatus
} = require('../controllers/clientOrdersController');

// Routes PUBLIQUES (pas d'auth)

// @route   GET /api/client-orders/menu
router.get('/menu', getPublicMenu);

// @route   POST /api/client-orders
router.post('/', createClientOrder);

// @route   GET /api/client-orders/status/:orderNumber
router.get('/status/:orderNumber', getOrderStatus);

module.exports = router;