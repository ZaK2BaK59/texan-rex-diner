const express = require('express');
const router = express.Router();
const { createSale, getMySales, getAllSales, weeklyReset, updateSale, deleteSale } = require('../controllers/salesController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Routes employés (authentification requise)
router.use(auth);

// @route   POST /api/sales
// @desc    Créer une vente
// @access  Private
router.post('/', createSale);

// @route   GET /api/sales/my-sales
// @desc    Mes ventes
// @access  Private
router.get('/my-sales', getMySales);

// @route   PUT /api/sales/:id
// @desc    Modifier une vente
// @access  Private
router.put('/:id', updateSale);

// @route   DELETE /api/sales/:id
// @desc    Supprimer une vente
// @access  Private
router.delete('/:id', deleteSale);

// Routes admin seulement
router.get('/', adminAuth, getAllSales);
router.delete('/weekly-reset', adminAuth, weeklyReset);

module.exports = router;