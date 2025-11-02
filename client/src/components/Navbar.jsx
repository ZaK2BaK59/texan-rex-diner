import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>🤠 Texan Rex's Diner</h2>
      </div>
      
      <div className="navbar-menu">
        <button 
          className="nav-btn"
          onClick={() => navigate('/dashboard')}
        >
          📊 Dashboard
        </button>
        
        {isAdmin && (
          <button 
            className="nav-btn admin-btn"
            onClick={() => navigate('/admin')}
          >
            👑 Admin
          </button>
        )}
        
        <div className="user-info">
          <span>
            👤 {user.firstName} ({user.role})
            {isAdmin && ' 👑'}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;