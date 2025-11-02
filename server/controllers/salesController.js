const Sale = require('../models/Sale');
const User = require('../models/User');

// @desc    Créer une vente
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res) => {
  try {
    const { productName, price } = req.body;
    
    const sale = new Sale({
      employeeId: req.user._id,
      productName,
      price
    });
    
    await sale.save();
    await sale.populate('employeeId', 'firstName lastName username role');
    
    res.status(201).json({ success: true, message: 'Vente ajoutée', sale });
  } catch (error) {
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
      employeeStats[empId].totalSales += sale.price;
      employeeStats[empId].totalBonus += sale.bonusAmount;
      employeeStats[empId].salesCount += 1;
    });
    
    res.json({ success: true, sales, employeeStats: Object.values(employeeStats) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des ventes' });
  }
};

// @desc    Reset hebdomadaire - Supprimer toutes les ventes (Admin seulement)
// @route   DELETE /api/sales/weekly-reset
// @access  Private/Admin
const weeklyReset = async (req, res) => {
  try {
    const result = await Sale.deleteMany({});
    res.json({ success: true, message: `Reset effectué - ${result.deletedCount} ventes supprimées` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors du reset' });
  }
};

module.exports = { createSale, getMySales, getAllSales, weeklyReset };