import React, { useState } from 'react';
import { salesAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/auth';

const SalesList = ({ sales, showEmployee = false, onSaleUpdate, currentUser }) => {
  const [editingSale, setEditingSale] = useState(null);
  const [editForm, setEditForm] = useState({ productName: '', price: '' });
  const [loading, setLoading] = useState(false);

  const handleEdit = (sale) => {
    setEditingSale(sale._id);
    setEditForm({
      productName: sale.productName,
      price: sale.price
    });
  };

  const handleSaveEdit = async (saleId) => {
    setLoading(true);
    try {
      await salesAPI.updateSale(saleId, editForm);
      setEditingSale(null);
      onSaleUpdate && onSaleUpdate();
    } catch (error) {
      alert('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (saleId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      setLoading(true);
      try {
        await salesAPI.deleteSale(saleId);
        onSaleUpdate && onSaleUpdate();
      } catch (error) {
        alert('Erreur lors de la suppression');
      } finally {
        setLoading(false);
      }
    }
  };

  const canModify = (sale) => {
    return currentUser?.isAdmin || sale.employeeId._id === currentUser?.id || sale.employeeId === currentUser?.id;
  };

  if (sales.length === 0) {
    return (
      <div className="no-data">
        📝 Aucune vente enregistrée
      </div>
    );
  }

  return (
    <div className="sales-list">
      <div className="sales-grid">
        {sales.map((sale) => (
          <div key={sale._id} className="sale-item">
            {editingSale === sale._id ? (
              // Mode édition
              <div className="edit-sale-form">
                <input
                  type="text"
                  value={editForm.productName}
                  onChange={(e) => setEditForm({...editForm, productName: e.target.value})}
                  placeholder="Nom du produit"
                />
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                  placeholder="Prix"
                />
                <div className="edit-actions">
                  <button 
                    onClick={() => handleSaveEdit(sale._id)}
                    disabled={loading}
                    className="save-btn"
                  >
                    ✅ Sauver
                  </button>
                  <button 
                    onClick={() => setEditingSale(null)}
                    className="cancel-btn"
                  >
                    ❌ Annuler
                  </button>
                </div>
              </div>
            ) : (
              // Mode affichage normal
              <>
                <div className="sale-header">
                  <h3>{sale.productName}</h3>
                  <span className="sale-price">{formatCurrency(sale.price)}</span>
                </div>
                
                {showEmployee && sale.employeeId && (
                  <div className="sale-employee">
                    👤 {sale.employeeId.firstName} {sale.employeeId.lastName}
                    <span className="employee-role">({sale.employeeId.role})</span>
                  </div>
                )}
                
                <div className="sale-bonus">
                  💰 Prime: {formatCurrency(sale.bonusAmount)} ({sale.bonusPercentage}%)
                </div>
                
                <div className="sale-date">
                  📅 {formatDate(sale.saleDate)}
                </div>

                {canModify(sale) && (
                  <div className="sale-actions">
                    <button 
                      onClick={() => handleEdit(sale)}
                      className="edit-btn"
                      disabled={loading}
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      onClick={() => handleDelete(sale._id)}
                      className="delete-btn"
                      disabled={loading}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesList;