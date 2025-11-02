const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Créer une commande
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    
    // Valider et calculer les totaux des items
    const processedItems = items.map(item => ({
      productName: item.productName,
      unitPrice: parseFloat(item.unitPrice),
      quantity: parseInt(item.quantity),
      totalPrice: parseFloat(item.unitPrice) * parseInt(item.quantity)
    }));
    
    const order = new Order({
      employeeId: req.user._id,
      items: processedItems
    });
    
    await order.save();
    await order.populate('employeeId', 'firstName lastName username role');
    
    res.status(201).json({ success: true, message: 'Commande créée', order });
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la commande' });
  }
};

// @desc    Obtenir mes commandes
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ employeeId: req.user._id }).sort({ createdAt: -1 });
    const totalBonus = orders.reduce((total, order) => total + order.bonusAmount, 0);
    
    res.json({ success: true, orders, totalBonus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commandes' });
  }
};

// @desc    Obtenir toutes les commandes (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('employeeId', 'firstName lastName username role').sort({ createdAt: -1 });
    
    // Statistiques par employé
    const employeeStats = {};
    orders.forEach(order => {
      const empId = order.employeeId._id.toString();
      if (!employeeStats[empId]) {
        employeeStats[empId] = {
          employee: order.employeeId,
          totalRevenue: 0,
          totalBonus: 0,
          ordersCount: 0
        };
      }
      employeeStats[empId].totalRevenue += order.totalAmount;
      employeeStats[empId].totalBonus += order.bonusAmount;
      employeeStats[empId].ordersCount += 1;
    });
    
    res.json({ success: true, orders, employeeStats: Object.values(employeeStats) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commandes' });
  }
};

// @desc    Supprimer une commande
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    
    // Vérifier les permissions
    if (order.employeeId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Non autorisé à supprimer cette commande' });
    }
    
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Commande supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

// @desc    Reset hebdomadaire des commandes
// @route   DELETE /api/orders/weekly-reset
// @access  Private/Admin
const weeklyResetOrders = async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.json({ success: true, message: `Reset effectué - ${result.deletedCount} commandes supprimées` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors du reset' });
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, deleteOrder, weeklyResetOrders };