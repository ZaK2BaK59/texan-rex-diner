import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SaleForm from '../components/SaleForm';
import SalesList from '../components/SalesList';
import Navbar from '../components/Navbar';
import { salesAPI } from '../services/api';
import { formatCurrency } from '../utils/auth';

const Dashboard = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalBonus, setTotalBonus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMySales();
  }, []);

  const fetchMySales = async () => {
    try {
      const response = await salesAPI.getMySales();
      setSales(response.data.sales);
      setTotalSales(response.data.totalSales || 0);  // ← NOUVEAU
      setTotalBonus(response.data.totalBonus || 0);
    } catch (error) {
      setError('Erreur lors de la récupération des ventes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleAdded = (newSale) => {
    setSales([newSale, ...sales]);
    setTotalSales(totalSales + (newSale.totalPrice || 0));
    setTotalBonus(totalBonus + (newSale.bonusAmount || 0));
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Bienvenue, {user.firstName}!</h1>
          <div className="user-info">
            <span className="role">Rôle: {user.role}</span>
            <span className="bonus-rate">Prime: {user.bonusPercentage}%</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="dashboard-grid">
          <div className="card">
            <h2>🔥 Nouvelle vente</h2>
            <SaleForm onSaleAdded={handleSaleAdded} />
          </div>
          
          <div className="card">
            <div className="sales-header">
              <h2>🥩 Mes ventes ({sales.length})</h2>
              
              {/* TOTAUX EN HAUT */}
              <div className="sales-totals">
                <div className="total-item">
                  <span className="total-label">💵 Total ventes:</span>
                  <span className="total-value">{formatCurrency(totalSales)}</span>
                </div>
                <div className="total-item">
                  <span className="total-label">💰 Total primes:</span>
                  <span className="total-value">{formatCurrency(totalBonus)}</span>
                </div>
              </div>
            </div>
            
            <SalesList 
              sales={sales} 
              showEmployee={false} 
              onSaleUpdate={fetchMySales}  // ← Recharge tout après masquage
              currentUser={user}
            />
            
            {/* TOTAUX EN BAS AUSSI */}
            <div className="sales-footer">
              <div className="footer-totals">
                <div className="footer-total">
                  <strong>🔥 Total du jour: {formatCurrency(totalSales)}</strong>
                </div>
                <div className="footer-bonus">
                  <strong>💰 Tes primes: {formatCurrency(totalBonus)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;