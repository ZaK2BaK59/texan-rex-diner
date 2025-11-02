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

// @desc    Obtenir les ventes de l'employé connecté (SANS les supprimées)
// @route   GET /api/sales/my-sales
// @access  Private
const getMySales = async (req, res) => {
  try {
    // Employé voit seulement ses ventes NON supprimées
    const sales = await Sale.find({ 
      employeeId: req.user._id,
      isDeleted: false  // ← Filtrer les supprimées
    }).sort({ createdAt: -1 });
    
    const totalBonus = sales.reduce((total, sale) => total + sale.bonusAmount, 0);
    
    res.json({ success: true, sales, totalBonus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des ventes' });
  }
};

// @desc    Obtenir toutes les ventes (Admin voit TOUT, même supprimées)
// @route   GET /api/sales
// @access  Private/Admin
const getAllSales = async (req, res) => {
  try {
    // Admin voit TOUTES les ventes (supprimées et non supprimées)
    const sales = await Sale.find()
      .populate('employeeId', 'firstName lastName username role')
      .populate('deletedBy', 'firstName lastName username')
      .sort({ createdAt: -1 });
    
    // Statistiques par employé (TOUTES les ventes pour admin)
    const employeeStats = {};
    sales.forEach(sale => {
      const empId = sale.employeeId._id.toString();
      if (!employeeStats[empId]) {
        employeeStats[empId] = {
          employee: sale.employeeId,
          totalSales: 0,
          totalBonus: 0,
          salesCount: 0,
          deletedSalesCount: 0
        };
      }
      employeeStats[empId].totalSales += sale.totalPrice;
      employeeStats[empId].totalBonus += sale.bonusAmount;
      
      if (sale.isDeleted) {
        employeeStats[empId].deletedSalesCount += 1;
      } else {
        employeeStats[empId].salesCount += 1;
      }
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
// @desc    "Supprimer" une vente (SOFT DELETE)
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
    
    // SOFT DELETE : marquer comme supprimée
    sale.isDeleted = true;
    sale.deletedAt = new Date();
    sale.deletedBy = req.user._id;
    
    await sale.save();
    
    res.json({ success: true, message: '🗑️ Vente masquée (admin peut encore la voir)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

// @desc    Reset hebdomadaire - VERSION ULTRA DEBUG
// @route   DELETE /api/sales/weekly-reset
// @access  Private/Admin
const weeklyReset = async (req, res) => {
  console.log('🚀 ===== DÉBUT DU RESET =====');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('👤 User qui fait le reset:', req.user?.username || 'INCONNU');
  console.log('🔒 IsAdmin:', req.user?.isAdmin || 'INCONNU');
  
  try {
    console.log('✅ Entrée dans le try block');
    
    // Vérifier si Sale est bien importé
    console.log('📦 Sale model:', typeof Sale);
    console.log('📦 Sale model name:', Sale.modelName || 'UNDEFINED');
    
    // Vérifier la connexion MongoDB
    const mongoose = require('mongoose');
    console.log('🗄️ MongoDB état:', mongoose.connection.readyState);
    console.log('🗄️ MongoDB nom DB:', mongoose.connection.name || 'UNDEFINED');
    
    // Compter les ventes avant suppression
    console.log('🔢 Comptage des ventes...');
    const countBefore = await Sale.countDocuments();
    console.log('🔢 Nombre de ventes AVANT:', countBefore);
    
    // Test de lecture simple
    console.log('📖 Test de lecture...');
    const testSales = await Sale.find().limit(1);
    console.log('📖 Test lecture réussi, résultat:', testSales.length > 0 ? 'TROUVÉ' : 'VIDE');
    
    // SUPPRESSION
    console.log('🗑️ Début de la suppression...');
    const result = await Sale.deleteMany({});
    console.log('🗑️ Résultat deleteMany:', result);
    console.log('🗑️ deletedCount:', result.deletedCount);
    console.log('🗑️ acknowledged:', result.acknowledged);
    
    // Vérifier après suppression
    console.log('🔢 Comptage APRÈS suppression...');
    const countAfter = await Sale.countDocuments();
    console.log('🔢 Nombre de ventes APRÈS:', countAfter);
    
    console.log('✅ ===== RESET TERMINÉ AVEC SUCCÈS =====');
    
    res.json({ 
      success: true, 
      message: `Reset effectué - ${result.deletedCount} ventes supprimées`,
      debug: {
        countBefore,
        countAfter,
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.log('❌ ===== ERREUR DANS LE RESET =====');
    console.log('❌ Error name:', error.name);
    console.log('❌ Error message:', error.message);
    console.log('❌ Error stack:', error.stack);
    console.log('❌ Error code:', error.code);
    console.log('❌ Error full object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    res.status(500).json({ 
      success: false, 
      message: `Erreur lors du reset: ${error.message}`,
      debug: {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = { createSale, getMySales, getAllSales, updateSale, deleteSale, weeklyReset };