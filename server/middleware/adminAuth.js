const adminAuth = (req, res, next) => {
  console.log('🔒 AdminAuth check...');
  console.log('🔒 req.user exists:', !!req.user);
  console.log('🔒 req.user.isAdmin:', req.user?.isAdmin);
  console.log('🔒 req.user.username:', req.user?.username);
  
  if (!req.user) {
    console.log('❌ AdminAuth: No user');
    return res.status(401).json({ 
      success: false, 
      message: 'Authentification requise.' 
    });
  }

  if (!req.user.isAdmin) {
    console.log('❌ AdminAuth: User not admin');
    return res.status(403).json({ 
      success: false, 
      message: 'Accès refusé. Privilèges administrateur requis.' 
    });
  }

  console.log('✅ AdminAuth: OK, user is admin');
  next();
};

module.exports = adminAuth;