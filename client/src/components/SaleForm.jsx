import React, { useState } from 'react';
import { salesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/auth';

const MENU_ITEMS = [
  { name: "🍗 Smoky Grandma's Chicken", price: 1000, category: "🥩 Plats" },
  { name: "🥪 Pulled Pork Sandwich Deluxe", price: 1000, category: "🥩 Plats" },
  { name: "🍖 Texas Brisket Smokehouse", price: 1000, category: "🥩 Plats" },
  { name: "🍖 Route 66 Ribs", price: 1100, category: "🥩 Plats" },
  { name: "🍗 Grilled Chicken Ranchero", price: 1100, category: "🥩 Plats" },
  { name: "🥩 Cowboy Steak & Onion", price: 1200, category: "🥩 Plats" },
  { name: "🍫 Brownie Maison", price: 300, category: "🍰 Desserts" },
  { name: "🍩 Donuts Speculos Caramel", price: 300, category: "🍰 Desserts" },
  { name: "🧁 Muffin Poire Chocolat", price: 400, category: "🍰 Desserts" },
  { name: "🥧 La Double P (Tarte Pomme & Poire)", price: 400, category: "🍰 Desserts" },
  { name: "☕ Grandma's Coffee", price: 200, category: "🥤 Boissons" },
  { name: "🥤 Diabolo Plaisir", price: 500, category: "🥤 Boissons" },
  { name: "🍉 Pastèque Juice", price: 500, category: "🥤 Boissons" },
  { name: "🥤 Smoothie Exotique", price: 500, category: "🥤 Boissons" }
];

const SaleForm = ({ onSaleAdded }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productName: '',
    unitPrice: '',
    quantity: 1,
    isCustom: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProductSelect = (e) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === 'custom') {
      setFormData({
        productName: '',
        unitPrice: '',
        quantity: 1,
        isCustom: true
      });
    } else if (selectedValue) {
      const selectedItem = MENU_ITEMS.find(item => 
        `${item.name}-${item.price}` === selectedValue
      );
      
      if (selectedItem) {
        setFormData({
          productName: selectedItem.name,
          unitPrice: selectedItem.price.toString(),
          quantity: 1,
          isCustom: false
        });
      }
    } else {
      setFormData({
        productName: '',
        unitPrice: '',
        quantity: 1,
        isCustom: false
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await salesAPI.createSale({
        productName: formData.productName,
        unitPrice: parseFloat(formData.unitPrice),
        quantity: parseInt(formData.quantity)
      });
      
      onSaleAdded(response.data.sale);
      setFormData({ productName: '', unitPrice: '', quantity: 1, isCustom: false });
      
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de l\'ajout de la vente');
    } finally {
      setLoading(false);
    }
  };

  const getTotalPrice = () => {
    return formData.unitPrice && formData.quantity ? 
      parseFloat(formData.unitPrice) * parseInt(formData.quantity) : 0;
  };

  const getEstimatedBonus = () => {
    const total = getTotalPrice();
    return total ? (total * user.bonusPercentage) / 100 : 0;
  };

  const menuByCategory = MENU_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="sale-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="productSelect">Sélectionner un produit</label>
        <select
          id="productSelect"
          onChange={handleProductSelect}
          value={formData.isCustom ? 'custom' : 
                 formData.productName ? `${formData.productName}-${formData.unitPrice}` : ''}
        >
          <option value="">-- Choisir un produit --</option>
          
          {Object.entries(menuByCategory).map(([category, items]) => (
            <optgroup key={category} label={`🍽️ ${category}`}>
              {items.map((item) => (
                <option 
                  key={`${item.name}-${item.price}`} 
                  value={`${item.name}-${item.price}`}
                >
                  {item.name} - {item.price}$
                </option>
              ))}
            </optgroup>
          ))}
          
          <option value="custom">✏️ Produit personnalisé</option>
        </select>
      </div>
      
      {(formData.isCustom || !formData.productName) && (
        <div className="form-group">
          <label htmlFor="productName">Nom du produit</label>
          <input
            type="text"
            id="productName"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            required
            placeholder="Ex: Burger spécial, Menu du jour..."
          />
        </div>
      )}
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="unitPrice">Prix unitaire ($)</label>
          <input
            type="number"
            id="unitPrice"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            required
            min="0"
            step="1"
            readOnly={!formData.isCustom && formData.productName}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="quantity">Quantité</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="1"
          />
        </div>
      </div>
      
      {getTotalPrice() > 0 && (
        <div className="sale-preview">
          <div className="total-price">
            💵 Total: {formatCurrency(getTotalPrice())}
          </div>
          <div className="estimated-bonus">
            💰 Prime estimée: {formatCurrency(getEstimatedBonus())} ({user.bonusPercentage}%)
          </div>
        </div>
      )}
      
      <button 
        type="submit" 
        className="submit-btn"
        disabled={loading}
      >
        {loading ? 'Ajout...' : '➕ Ajouter la vente'}
      </button>
    </form>
  );
};

export default SaleForm;