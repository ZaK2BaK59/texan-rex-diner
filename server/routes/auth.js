const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Inscription
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Connexion
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Profil utilisateur
// @access  Private
router.get('/me', auth, getMe);

router.get('/debug-users', async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find().select('username firstName lastName isAdmin isActive');
    res.json({ 
      success: true, 
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/create-new-adrien', async (req, res) => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    // Supprimer l'ancien
    await User.deleteOne({ username: 'adrien' });
    console.log('🗑️ Ancien Adrien supprimé');
    
    // Créer le nouveau
    const hashedPassword = await bcrypt.hash('Floflo1101*', 12);
    
    const newAdrien = new User({
      username: 'adrien',
      email: 'adrien@texan-rex.com',
      password: hashedPassword,
      firstName: 'Adrien',
      lastName: 'Rex',
      role: 'Directeur',
      isAdmin: true,
      isActive: true
    });
    
    await newAdrien.save();
    console.log('✅ Nouvel Adrien créé');
    
    res.json({ 
      success: true, 
      message: 'Nouvel Adrien créé avec succès !',
      user: {
        username: newAdrien.username,
        email: newAdrien.email,
        firstName: newAdrien.firstName,
        isAdmin: newAdrien.isAdmin
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;