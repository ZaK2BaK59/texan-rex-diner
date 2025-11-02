import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SaleForm from '../components/SaleForm';
import OrderForm from '../components/OrderForm';
import SalesList from '../components/SalesList';
import OrdersList from '../components/OrdersList';
import Navbar from '../components/Navbar';
import { salesAPI, ordersAPI } from '../services/api';
import { formatCurrency } from '../utils/auth';

const Dashboard = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totalBonus, setTotalBonus] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMode, setActiveMode] = useState('orders'); // 'sales' ou 'orders'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesResponse, ordersResponse] = await Promise.all([
        salesAPI.getMySales(),
        ordersAPI.getMyOrders()
      ]);
      
      setSales(salesResponse.data.sales);
      setOrders(ordersResponse.data.orders);
      
      // Calculer le total des primes (ventes + commandes)
      const salesBonus = salesResponse.data.totalBonus || 0;
      const ordersBonus = ordersResponse.data.totalBonus || 0;
      setTotalBonus(salesBonus + ordersBonus);
      
    } catch (error) {
      setError('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleAdded = (newSale) => {
    setSales([newSale, ...sales]);
    setTotalBonus(totalBonus + newSale.bonusAmount);
  };

  const handleOrderAdded = (newOrder) => {
    setOrders([newOrder, ...orders]);
    setTotalBonus(totalBonus + newOrder.bonusAmount);
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

        {/* Sélecteur de mode */}
        <div className="mode-selector">
          <button 
            className={`mode-btn ${activeMode === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveMode('orders')}
          >
            🛒 Commandes (Nouveau système)
          </button>
          <button 
            className={`mode-btn ${activeMode === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveMode('sales')}
          >
            💰 Ventes simples (Ancien système)
          </button>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h2>
              {activeMode === 'orders' ? 'Nouvelle commande' : 'Nouvelle vente'}
            </h2>
            {activeMode === 'orders' ? (
              <OrderForm onOrderAdded={handleOrderAdded} />
            ) : (
              <SaleForm onSaleAdded={handleSaleAdded} />
            )}
          </div>
          
          <div className="card">
            <h2>
              {activeMode === 'orders' ? `Mes commandes (${orders.length})` : `Mes ventes (${sales.length})`}
            </h2>
            {activeMode === 'orders' ? (
              <OrdersList 
                orders={orders} 
                showEmployee={false} 
                onOrderUpdate={fetchData}
                currentUser={user}
              />
            ) : (
              <SalesList 
                sales={sales} 
                showEmployee={false} 
                onSaleUpdate={fetchData}
                currentUser={user}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;