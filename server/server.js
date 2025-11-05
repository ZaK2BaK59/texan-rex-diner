const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting - DÉSACTIVÉ EN DEV
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Plus souple en dev
  skip: (req) => process.env.NODE_ENV === 'development' // Skip en dev
});
app.use(limiter);

// MIDDLEWARE DE DEBUG - AJOUTER
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  console.log(`📋 Body:`, req.body);
  console.log(`📋 Headers:`, req.headers['content-type']);
  next();
});

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API de Texan Rex\'s Diner!' });
});

// Import des routes - ENLEVER /orders
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sales', require('./routes/sales'));
// app.use('/api/orders', require('./routes/orders')); // ← SUPPRIMER CETTE LIGNE !

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Erreur serveur interne' 
  });
});

// Route 404
app.use((req, res) => {
  console.log(`❌ Route 404: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    message: 'Route non trouvée' 
  });
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 API disponible sur http://localhost:${PORT}`);
});