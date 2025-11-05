const mongoose = require('mongoose');

const ClientOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerInfo: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: ''
    }
  },
  items: [{
    productName: {
      type: String,
      required: true
    },
    basePrice: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    itemTotal: {
      type: Number,
      required: true
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered'],
    default: 'pending'
  },
  orderType: {
    type: String,
    enum: ['takeaway', 'dine-in'],
    default: 'takeaway'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Plus de pre-save hook compliqué !
module.exports = mongoose.model('ClientOrder', ClientOrderSchema);