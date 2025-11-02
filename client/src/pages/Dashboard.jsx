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
      setTotalBonus(response.data.totalBonus);
    } catch (error) {
      setError('Erreur lors de la récupération des ventes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleAdded = (newSale) => {
    setSales([newSale, ...sales]);
    setTotalBonus(totalBonus + newSale.bonusAmount);
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
            <span className="total-bonus">Total primes: {formatCurrency(totalBonus)}</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="dashboard-grid">
          <div className="card">
            <h2>Nouvelle vente</h2>
            <SaleForm onSaleAdded={handleSaleAdded} />
          </div>
          
          <div className="card">
            <h2>Mes ventes ({sales.length})</h2>
            <SalesList sales={sales} showEmployee={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;