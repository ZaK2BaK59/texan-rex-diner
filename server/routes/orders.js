const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getAllOrders, deleteOrder, weeklyResetOrders } = require('../controllers/ordersController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Routes employés
router.use(auth);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.delete('/:id', deleteOrder);

// Routes admin
router.get('/', adminAuth, getAllOrders);
router.delete('/weekly-reset', adminAuth, weeklyResetOrders);

module.exports = router;