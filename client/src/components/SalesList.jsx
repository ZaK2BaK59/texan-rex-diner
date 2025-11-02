import React from 'react';
import { formatCurrency, formatDate } from '../utils/auth';

const SalesList = ({ sales, showEmployee = false }) => {
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesList;