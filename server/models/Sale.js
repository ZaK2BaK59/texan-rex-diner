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
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  bonusAmount: {
    type: Number,
    default: 0
  },
  bonusPercentage: {
    type: Number,
    default: 30
  },
  saleDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Plus de pre-save hook compliqué !
module.exports = mongoose.model('Sale', SaleSchema);