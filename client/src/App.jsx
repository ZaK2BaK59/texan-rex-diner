import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicOrderPage from './pages/PublicOrderPage'; // ← NOUVEAU
import './styles/App.css';
import './styles/components.css';

// Composant pour protéger les routes
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Chargement...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Composant pour rediriger si déjà connecté (SEULEMENT depuis /login)
const LoginRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Chargement...</div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* PAGE PUBLIQUE DE COMMANDE (ACCUEIL) */}
          <Route path="/" element={<PublicOrderPage />} />
          
          {/* CONNEXION EMPLOYÉS */}
          <Route 
            path="/login" 
            element={
              <LoginRoute>
                <Login />
              </LoginRoute>
            } 
          />
          
          {/* DASHBOARD EMPLOYÉ */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* DASHBOARD ADMIN */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ROUTES INCONNUES → ACCUEIL */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;