# 🤠 Texan Rex's Diner - Système de Gestion Interne

Site web de gestion interne pour le restaurant Texan Rex's Diner sur FiveM.

## 🚀 Installation et lancement

### Prérequis
- Node.js (v16 ou plus récent)
- MongoDB (local ou Azure)

### Installation rapide
```bash
# Cloner le projet
cd C:\Users\zak2b\Documents\rex

# Installer toutes les dépendances
npm run setup

# Lancer le projet (frontend + backend)
npm run dev
```

### Configuration
1. Modifier le fichier `server/.env` avec vos informations MongoDB
2. Le frontend sera accessible sur http://localhost:5173
3. L'API sera accessible sur http://localhost:5000

## 👑 Compte Admin par défaut
- Username: admin
- Password: 123456
- Créé automatiquement au premier lancement

## 📁 Structure du projet
- `client/` - Frontend React + Vite
- `server/` - Backend Node.js + Express + MongoDB

## 🎯 Fonctionnalités
- Authentification JWT
- Gestion des employés et rôles
- Système de ventes et primes automatiques
- Dashboard admin avec statistiques
- Reset hebdomadaire des données

## 🔧 Scripts disponibles
- `npm run dev` - Lancer frontend + backend
- `npm run client` - Lancer seulement le frontend
- `npm run server` - Lancer seulement le backend
- `npm run build` - Build de production