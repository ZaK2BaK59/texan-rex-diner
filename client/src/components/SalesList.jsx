import React, { useState } from 'react';
import { salesAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/auth';

const SalesList = ({ sales, showEmployee = false, onSaleUpdate, currentUser }) => {
  const [editingSale, setEditingSale] = useState(null);
  const [editForm, setEditForm] = useState({ productName: '', unitPrice: '', quantity: 1 });
  const [loading, setLoading] = useState(false);

  const handleEdit = (sale) => {
    setEditingSale(sale._id);
    setEditForm({
      productName: sale.productName,
      unitPrice: sale.unitPrice,
      quantity: sale.quantity
    });
  };

  const handleSaveEdit = async (saleId) => {
    setLoading(true);
    try {
      await salesAPI.updateSale(saleId, editForm);
      setEditingSale(null);
      onSaleUpdate && onSaleUpdate(); // Recharge les données + totaux
    } catch (error) {
      alert('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (saleId) => {
    const message = showEmployee ? 
      'Êtes-vous sûr de vouloir masquer cette vente ?' : 
      'Masquer cette vente ? (Elle disparaîtra de votre total)';
      
    if (window.confirm(message)) {
      setLoading(true);
      try {
        await salesAPI.deleteSale(saleId);
        onSaleUpdate && onSaleUpdate(); // Recharge tout + recalcule les totaux
      } catch (error) {
        alert('Erreur lors du masquage');
      } finally {
        setLoading(false);
      }
    }
  };

  const canModify = (sale) => {
    // Ne peut pas modifier une vente masquée
    if (sale.isDeleted) return false;
    return currentUser?.isAdmin || sale.employeeId._id === currentUser?.id || sale.employeeId === currentUser?.id;
  };

  if (sales.length === 0) {
    return (
      <div className="no-data">
        🥩 Aucune vente pour aujourd'hui
        <br />
        <small>Ajoute tes premières ventes cowboy ! 🤠</small>
      </div>
    );
  }

  return (
    <div className="sales-list">
      <div className="sales-grid">
        {sales.map((sale) => (
          <div key={sale._id} className={`sale-item ${sale.isDeleted ? 'deleted-sale' : ''}`}>
            
            {/* Bannière pour ventes masquées (vue admin) */}
            {sale.isDeleted && showEmployee && (
              <div className="deleted-banner">
                🗑️ MASQUÉE {sale.deletedBy && `par ${sale.deletedBy.firstName}`}
                <br />📅 {formatDate(sale.deletedAt)}
              </div>
            )}
            
            {editingSale === sale._id ? (
              // Mode édition
              <div className="edit-sale-form">
                <input
                  type="text"
                  value={editForm.productName}
                  onChange={(e) => setEditForm({...editForm, productName: e.target.value})}
                  placeholder="Nom du produit"
                />
                <div className="edit-row">
                  <input
                    type="number"
                    value={editForm.unitPrice}
                    onChange={(e) => setEditForm({...editForm, unitPrice: e.target.value})}
                    placeholder="Prix unitaire"
                  />
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                    placeholder="Quantité"
                    min="1"
                  />
                </div>
                <div className="edit-actions">
                  <button onClick={() => handleSaveEdit(sale._id)} disabled={loading} className="save-btn">
                    ✅ Sauver
                  </button>
                  <button onClick={() => setEditingSale(null)} className="cancel-btn">
                    ❌ Annuler
                  </button>
                </div>
              </div>
            ) : (
              // Mode affichage normal
              <>
                <div className="sale-header">
                  <h3>{sale.productName}</h3>
                  <span className="sale-price">{formatCurrency(sale.totalPrice || sale.unitPrice * sale.quantity)}</span>
                </div>
                
                <div className="sale-details">
                  <span className="unit-price">{formatCurrency(sale.unitPrice)} x {sale.quantity}</span>
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
                    <button onClick={() => handleEdit(sale)} className="edit-btn" disabled={loading}>
                      ✏️ Modifier
                    </button>
                    <button onClick={() => handleDelete(sale._id)} className="hide-btn" disabled={loading}>
                      👁️‍🗨️ Masquer
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