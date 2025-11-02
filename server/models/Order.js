const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  items: [{
    productName: {
      type: String,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  bonusAmount: {
    type: Number,
    default: 0
  },
  bonusPercentage: {
    type: Number,
    default: 30
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Générer un numéro de commande automatique
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const prefix = `ORD_${year}${month}${day}`;
    const count = await this.constructor.countDocuments({
      orderNumber: { $regex: `^${prefix}` }
    });
    
    this.orderNumber = `${prefix}_${String(count + 1).padStart(3, '0')}`;
  }
  
  // Calculer les totaux
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculer la prime
  if (this.totalAmount > 0) {
    const User = require('./User');
    const employee = await User.findById(this.employeeId);
    if (employee) {
      this.bonusPercentage = employee.getBonusPercentage();
      this.bonusAmount = (this.totalAmount * this.bonusPercentage) / 100;
    }
  }
  
  next();
});

module.exports = mongoose.model('Order', OrderSchema);