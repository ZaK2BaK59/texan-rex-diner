const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Stagiaire', 'Employé polyvalent', 'Chef d\'équipe', 'Co-patron', 'Directeur'],
    default: 'Stagiaire'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hasher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔥 FORCER ADRIEN EN ADMIN AUTOMATIQUEMENT
UserSchema.pre('save', function(next) {
  // Si c'est adrien, forcer admin = true
  if (this.username === 'adrien') {
    this.isAdmin = true;
    this.role = 'Directeur';
  }
  next();
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir le pourcentage de prime selon le rôle
UserSchema.methods.getBonusPercentage = function() {
  const bonusRates = {
    'Stagiaire': 30,
    'Employé polyvalent': 35,
    'Chef d\'équipe': 40,
    'Co-patron': 45,
    'Directeur': 50
  };
  return bonusRates[this.role] || 30;
};

module.exports = mongoose.model('User', UserSchema);