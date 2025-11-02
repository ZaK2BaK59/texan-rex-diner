import React, { useState } from 'react';
import { salesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { calculateBonus, formatCurrency } from '../utils/auth';

// Menu des produits prédéfinis
const MENU_ITEMS = [
  { name: "Smoky Grandma's Chicken", price: 1000, category: "Plats" },
  { name: "Pulled Pork Sandwich Deluxe", price: 1000, category: "Plats" },
  { name: "Texas Brisket Smokehouse", price: 1000, category: "Plats" },
  { name: "Route 66 Ribs", price: 1100, category: "Plats" },
  { name: "Grilled Chicken Ranchero", price: 1100, category: "Plats" },
  { name: "Cowboy Steak & Onion", price: 1200, category: "Plats" },
  { name: "Brownie Maison", price: 300, category: "Desserts" },
  { name: "Donuts Speculos Caramel", price: 300, category: "Desserts" },
  { name: "Muffin Poire Chocolat", price: 400, category: "Desserts" },
  { name: "La Double P (Tarte Pomme & Poire)", price: 400, category: "Desserts" },
  { name: "Grandma's Coffee", price: 200, category: "Boissons" },
  { name: "Diabolo Plaisir", price: 500, category: "Boissons" },
  { name: "Pastèque Juice", price: 500, category: "Boissons" },
  { name: "Smoothie Exotique", price: 500, category: "Boissons" }
];

const SaleForm = ({ onSaleAdded }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    isCustom: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProductSelect = (e) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === 'custom') {
      setFormData({
        productName: '',
        price: '',
        isCustom: true
      });
    } else if (selectedValue) {
      const selectedItem = MENU_ITEMS.find(item => 
        `${item.name}-${item.price}` === selectedValue
      );
      
      if (selectedItem) {
        setFormData({
          productName: selectedItem.name,
          price: selectedItem.price.toString(),
          isCustom: false
        });
      }
    } else {
      setFormData({
        productName: '',
        price: '',
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
        price: parseFloat(formData.price)
      });
      
      onSaleAdded(response.data.sale);
      setFormData({ productName: '', price: '', isCustom: false });
      
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de l\'ajout de la vente');
    } finally {
      setLoading(false);
    }
  };

  const previewBonus = formData.price ? 
    calculateBonus(parseFloat(formData.price), user.role) : 0;

  // Grouper les items par catégorie
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
                 formData.productName ? `${formData.productName}-${formData.price}` : ''}
          className="product-select"
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
          <label htmlFor="productName">
            {formData.isCustom ? 'Nom du produit personnalisé' : 'Ou saisir manuellement'}
          </label>
          <input
            type="text"
            id="productName"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            required={formData.isCustom}
            placeholder="Ex: Burger spécial, Menu du jour..."
          />
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="price">Prix ($ Dollars FiveM)</label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
          min="0"
          step="1"
          placeholder="0"
          readOnly={!formData.isCustom && formData.productName}
        />
      </div>
      
      {formData.price && (
        <div className="bonus-preview">
          💰 Prime estimée: {formatCurrency(previewBonus)} ({user.bonusPercentage}%)
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