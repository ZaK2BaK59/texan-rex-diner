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

// ============================================
// ROUTES SPÉCIFIQUES EN PREMIER (IMPORTANT!)
// ============================================

// @route   DELETE /api/sales/weekly-reset
// @desc    Reset hebdomadaire
// @access  Private/Admin
router.delete('/weekly-reset', adminAuth, (req, res, next) => {
  console.log('🛣️ ===== ROUTE WEEKLY-RESET APPELÉE =====');
  console.log('🛣️ Method:', req.method);
  console.log('🛣️ URL:', req.url);
  console.log('🛣️ User:', req.user?.username);
  console.log('🛣️ Passage à weeklyReset...');
  next();
}, weeklyReset);

// Routes admin
// @route   GET /api/sales
// @desc    Toutes les ventes (Admin)
// @access  Private/Admin
router.get('/', adminAuth, getAllSales);

// ============================================
// ROUTES AVEC PARAMÈTRES EN DERNIER
// ============================================

// @route   PUT /api/sales/:id
// @desc    Modifier une vente
// @access  Private
router.put('/:id', updateSale);

// @route   DELETE /api/sales/:id
// @desc    Supprimer une vente
// @access  Private
router.delete('/:id', deleteSale);

module.exports = router;