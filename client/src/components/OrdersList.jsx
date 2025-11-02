import React, { useState } from 'react';
import { ordersAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/auth';

const OrdersList = ({ orders, showEmployee = false, onOrderUpdate, currentUser }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (orderId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      setLoading(true);
      try {
        await ordersAPI.deleteOrder(orderId);
        onOrderUpdate && onOrderUpdate();
      } catch (error) {
        alert('Erreur lors de la suppression');
      } finally {
        setLoading(false);
      }
    }
  };

  const canModify = (order) => {
    return currentUser?.isAdmin || order.employeeId._id === currentUser?.id || order.employeeId === currentUser?.id;
  };

  if (orders.length === 0) {
    return (
      <div className="no-data">
        📝 Aucune commande enregistrée
      </div>
    );
  }

  return (
    <div className="orders-list">
      <div className="orders-grid">
        {orders.map((order) => (
          <div key={order._id} className="order-item">
            <div className="order-header">
              <h3>📦 {order.orderNumber}</h3>
              <span className="order-total">{formatCurrency(order.totalAmount)}</span>
            </div>
            
            {showEmployee && order.employeeId && (
              <div className="order-employee">
                👤 {order.employeeId.firstName} {order.employeeId.lastName}
                <span className="employee-role">({order.employeeId.role})</span>
              </div>
            )}

            <div className="order-items">
              {order.items.map((item, index) => (
                <div key={index} className="order-item-detail">
                  <span className="item-name">{item.productName}</span>
                  <span className="item-details">
                    {formatCurrency(item.unitPrice)} x {item.quantity} = {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="order-bonus">
              💰 Prime: {formatCurrency(order.bonusAmount)} ({order.bonusPercentage}%)
            </div>
            
            <div className="order-date">
              📅 {formatDate(order.orderDate)}
            </div>

            {canModify(order) && (
              <div className="order-actions">
                <button 
                  onClick={() => handleDelete(order._id)}
                  className="delete-btn"
                  disabled={loading}
                >
                  🗑️ Supprimer
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersList;