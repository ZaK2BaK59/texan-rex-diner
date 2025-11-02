const auth = async (req, res, next) => {
  console.log('🔐 Auth middleware...');
  
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔐 Token exists:', !!token);
    console.log('🔐 Token preview:', token ? token.substring(0, 20) + '...' : 'NONE');
    
    if (!token) {
      console.log('❌ Auth: No token');
      return res.status(401).json({ 
        success: false, 
        message: 'Accès refusé. Aucun token fourni.' 
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Token decoded:', decoded);
    
    const User = require('../models/User');
    const user = await User.findById(decoded.userId).select('-password');
    console.log('🔐 User found:', user ? user.username : 'NOT FOUND');
    console.log('🔐 User isAdmin:', user?.isAdmin);
    
    if (!user || !user.isActive) {
      console.log('❌ Auth: User invalid or inactive');
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide ou utilisateur inactif.' 
      });
    }

    req.user = user;
    console.log('✅ Auth: Success for user', user.username);
    next();
  } catch (error) {
    console.log('❌ Auth error:', error.message);
    res.status(401).json({ 
      success: false, 
      message: 'Token invalide.' 
    });
  }
};

module.exports = auth;