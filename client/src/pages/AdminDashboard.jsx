import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import UsersList from '../components/UsersList';
import SalesList from '../components/SalesList';
import { salesAPI, usersAPI } from '../services/api';
import { formatCurrency } from '../utils/auth';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [employeeStats, setEmployeeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesResponse, usersResponse] = await Promise.all([
        salesAPI.getAllSales(),
        usersAPI.getAllUsers()
      ]);
      
      setSales(salesResponse.data.sales);
      setEmployeeStats(salesResponse.data.employeeStats);
      setUsers(usersResponse.data.users);
    } catch (error) {
      setError('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklyReset = async () => {
    if (window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer toutes les ventes ? Cette action est irréversible !')) {
      try {
        await salesAPI.weeklyReset();
        setSales([]);
        setEmployeeStats([]);
        alert('✅ Reset hebdomadaire effectué avec succès !');
      } catch (error) {
        setError('Erreur lors du reset');
      }
    }
  };

  const handleUserUpdate = () => {
    fetchData(); // Recharger les données après modification
  };

  if (loading) return <div className="loading">Chargement...</div>;

  const totalSales = sales.reduce((sum, sale) => sum + sale.price, 0);
  const totalBonus = sales.reduce((sum, sale) => sum + sale.bonusAmount, 0);

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-content">
        <div className="admin-header">
          <h1>Dashboard Administrateur</h1>
          <div className="admin-stats">
            <div className="stat-card">
              <h3>Ventes totales</h3>
              <p>{formatCurrency(totalSales)}</p>
            </div>
            <div className="stat-card">
              <h3>Primes totales</h3>
              <p>{formatCurrency(totalBonus)}</p>
            </div>
            <div className="stat-card">
              <h3>Nombre de ventes</h3>
              <p>{sales.length}</p>
            </div>
          </div>
          
          <button 
            className="danger-btn reset-btn"
            onClick={handleWeeklyReset}
          >
            🔄 Reset Hebdomadaire
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistiques Employés
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Toutes les Ventes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Gestion Employés
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'stats' && (
            <div className="card">
              <h2>Statistiques par employé</h2>
              <div className="employee-stats">
                {employeeStats.map(stat => (
                  <div key={stat.employee._id} className="employee-stat-card">
                    <h3>{stat.employee.firstName} {stat.employee.lastName}</h3>
                    <p>Rôle: {stat.employee.role}</p>
                    <p>Ventes: {stat.salesCount}</p>
                    <p>CA généré: {formatCurrency(stat.totalSales)}</p>
                    <p>Primes: {formatCurrency(stat.totalBonus)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="card">
              <h2>Toutes les ventes</h2>
              <SalesList sales={sales} showEmployee={true} />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card">
              <h2>Gestion des employés</h2>
              <UsersList users={users} onUserUpdate={handleUserUpdate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;