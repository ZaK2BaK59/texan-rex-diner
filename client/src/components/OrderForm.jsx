import React, { useState } from 'react';
import { ordersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { calculateBonus, formatCurrency } from '../utils/auth';

// Menu des produits
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

const OrderForm = ({ onOrderAdded }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [currentItem, setCurrentItem] = useState({
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
      setCurrentItem({
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
        setCurrentItem({
          productName: selectedItem.name,
          unitPrice: selectedItem.price.toString(),
          quantity: 1,
          isCustom: false
        });
      }
    } else {
      setCurrentItem({
        productName: '',
        unitPrice: '',
        quantity: 1,
        isCustom: false
      });
    }
  };

  const handleChange = (e) => {
    setCurrentItem({
      ...currentItem,
      [e.target.name]: e.target.value
    });
  };

  const addToCart = () => {
    if (!currentItem.productName || !currentItem.unitPrice || !currentItem.quantity) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const item = {
      id: Date.now(), // ID temporaire pour le panier
      productName: currentItem.productName,
      unitPrice: parseFloat(currentItem.unitPrice),
      quantity: parseInt(currentItem.quantity),
      totalPrice: parseFloat(currentItem.unitPrice) * parseInt(currentItem.quantity)
    };

    setCart([...cart, item]);
    setCurrentItem({
      productName: '',
      unitPrice: '',
      quantity: 1,
      isCustom: false
    });
    setError('');
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(cart.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
        : item
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getEstimatedBonus = () => {
    return calculateBonus(getTotalAmount(), user.role);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      setError('Le panier est vide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: cart.map(item => ({
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity
        }))
      };

      const response = await ordersAPI.createOrder(orderData);
      onOrderAdded(response.data.order);
      setCart([]);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  // Grouper les items par catégorie
  const menuByCategory = MENU_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="order-form">
      <h3>🛒 Nouvelle Commande</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Sélection de produit */}
      <div className="product-selection">
        <h4>Ajouter un produit</h4>
        
        <div className="form-group">
          <label>Sélectionner un produit</label>
          <select
            onChange={handleProductSelect}
            value={currentItem.isCustom ? 'custom' : 
                   currentItem.productName ? `${currentItem.productName}-${currentItem.unitPrice}` : ''}
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

        {(currentItem.isCustom || !currentItem.productName) && (
          <div className="form-group">
            <label>Nom du produit</label>
            <input
              type="text"
              name="productName"
              value={currentItem.productName}
              onChange={handleChange}
              placeholder="Nom du produit"
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Prix unitaire ($)</label>
            <input
              type="number"
              name="unitPrice"
              value={currentItem.unitPrice}
              onChange={handleChange}
              min="0"
              step="1"
              readOnly={!currentItem.isCustom && currentItem.productName}
            />
          </div>
          
          <div className="form-group">
            <label>Quantité</label>
            <input
              type="number"
              name="quantity"
              value={currentItem.quantity}
              onChange={handleChange}
              min="1"
            />
          </div>
        </div>

        {currentItem.unitPrice && currentItem.quantity && (
          <div className="item-preview">
            💰 Total: {formatCurrency(parseFloat(currentItem.unitPrice) * parseInt(currentItem.quantity))}
          </div>
        )}

        <button 
          type="button" 
          onClick={addToCart}
          className="add-to-cart-btn"
          disabled={!currentItem.productName || !currentItem.unitPrice}
        >
          ➕ Ajouter au panier
        </button>
      </div>

      {/* Panier */}
      {cart.length > 0 && (
        <div className="cart">
          <h4>📦 Panier ({cart.length} articles)</h4>
          
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <strong>{item.productName}</strong>
                  <span>{formatCurrency(item.unitPrice)} x {item.quantity}</span>
                </div>
                <div className="item-controls">
                  <button 
                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    className="qty-btn"
                  >
                    ➖
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    className="qty-btn"
                  >
                    ➕
                  </button>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="remove-btn"
                  >
                    🗑️
                  </button>
                </div>
                <div className="item-total">
                  {formatCurrency(item.totalPrice)}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="total-amount">
              💵 Total: {formatCurrency(getTotalAmount())}
            </div>
            <div className="estimated-bonus">
              💰 Prime estimée: {formatCurrency(getEstimatedBonus())} ({user.bonusPercentage}%)
            </div>
          </div>

          <button 
            onClick={handleSubmitOrder}
            disabled={loading}
            className="submit-order-btn"
          >
            {loading ? 'Validation...' : '✅ Valider la commande'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderForm;