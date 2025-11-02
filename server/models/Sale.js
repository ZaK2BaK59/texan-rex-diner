const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  bonusAmount: {
    type: Number,
    default: 0
  },
  bonusPercentage: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

// Calculer automatiquement le bonus avant de sauvegarder
SaleSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('price')) {
    try {
      const User = require('./User');
      const employee = await User.findById(this.employeeId);
      
      if (employee) {
        this.bonusPercentage = employee.getBonusPercentage();
        this.bonusAmount = (this.price * this.bonusPercentage) / 100;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Sale', SaleSchema);