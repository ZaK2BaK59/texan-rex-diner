const adminAuth = (req, res, next) => {
  // Ce middleware doit être utilisé après le middleware auth
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentification requise.' 
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Accès refusé. Privilèges administrateur requis.' 
    });
  }

  next();
};

module.exports = adminAuth;