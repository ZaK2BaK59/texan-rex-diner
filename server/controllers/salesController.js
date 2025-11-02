const Sale = require('../models/Sale');
const User = require('../models/User');

// @desc    Créer une vente
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res) => {
  try {
    const { productName, unitPrice, quantity = 1 } = req.body;
    
    // Calculer directement ici (plus fiable que pre-save)
    const parsedUnitPrice = parseFloat(unitPrice);
    const parsedQuantity = parseInt(quantity);
    const totalPrice = parsedUnitPrice * parsedQuantity;
    
    // Récupérer l'employé pour le bonus
    const employee = await User.findById(req.user._id);
    const bonusPercentage = employee.getBonusPercentage();
    const bonusAmount = (totalPrice * bonusPercentage) / 100;
    
    const sale = new Sale({
      employeeId: req.user._id,
      productName,
      unitPrice: parsedUnitPrice,
      quantity: parsedQuantity,
      totalPrice: totalPrice,           // ← Calculé ici
      bonusPercentage: bonusPercentage, // ← Calculé ici
      bonusAmount: bonusAmount          // ← Calculé ici
    });
    
    await sale.save();
    await sale.populate('employeeId', 'firstName lastName username role');
    
    res.status(201).json({ success: true, message: 'Vente ajoutée', sale });
  } catch (error) {
    console.error('Erreur création vente:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout de la vente' });
  }
};

// @desc    Obtenir les ventes de l'employé connecté
// @route   GET /api/sales/my-sales
// @access  Private
const getMySales = async (req, res) => {
  try {
    const sales = await Sale.find({ employeeId: req.user._id }).sort({ createdAt: -1 });
    const totalBonus = sales.reduce((total, sale) => total + sale.bonusAmount, 0);
    
    res.json({ success: true, sales, totalBonus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des ventes' });
  }
};

// @desc    Obtenir toutes les ventes (Admin seulement)
// @route   GET /api/sales
// @access  Private/Admin
const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate('employeeId', 'firstName lastName username role').sort({ createdAt: -1 });
    
    // Statistiques par employé
    const employeeStats = {};
    sales.forEach(sale => {
      const empId = sale.employeeId._id.toString();
      if (!employeeStats[empId]) {
        employeeStats[empId] = {
          employee: sale.employeeId,
          totalSales: 0,
          totalBonus: 0,
          salesCount: 0
        };
      }
      employeeStats[empId].totalSales += sale.totalPrice;
      employeeStats[empId].totalBonus += sale.bonusAmount;
      employeeStats[empId].salesCount += 1;
    });
    
    res.json({ success: true, sales, employeeStats: Object.values(employeeStats) });
  } catch (error) {
    console.error('Erreur getAllSales:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des ventes' });
  }
};

const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, unitPrice, quantity } = req.body;
    
    const sale = await Sale.findById(id);
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Vente non trouvée' });
    }
    
    // Vérifier les permissions
    if (sale.employeeId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    
    // Mettre à jour les champs
    if (productName) sale.productName = productName;
    if (unitPrice) sale.unitPrice = parseFloat(unitPrice);
    if (quantity) sale.quantity = parseInt(quantity);
    
    // Recalculer le total et bonus
    sale.totalPrice = sale.unitPrice * sale.quantity;
    
    const employee = await User.findById(sale.employeeId);
    sale.bonusPercentage = employee.getBonusPercentage();
    sale.bonusAmount = (sale.totalPrice * sale.bonusPercentage) / 100;
    
    await sale.save();
    await sale.populate('employeeId', 'firstName lastName username role');
    
    res.json({ success: true, message: 'Vente modifiée', sale });
  } catch (error) {
    console.error('Erreur modification:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la modification' });
  }
};
// @desc    Supprimer une vente
// @route   DELETE /api/sales/:id
// @access  Private
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Vente non trouvée' });
    }
    
    // Vérifier les permissions
    if (sale.employeeId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Vente supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

// @desc    Reset hebdomadaire
// @route   DELETE /api/sales/weekly-reset
// @access  Private/Admin
const weeklyReset = async (req, res) => {
  try {
    const result = await Sale.deleteMany({});
    res.json({ success: true, message: `Reset effectué - ${result.deletedCount} ventes supprimées` });
  } catch (error) {
    console.error('Erreur reset:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du reset' });
  }
};

module.exports = { createSale, getMySales, getAllSales, updateSale, deleteSale, weeklyReset };