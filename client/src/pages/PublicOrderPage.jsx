import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../utils/auth';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://texan-rexs-diner.onrender.com/api'
  : 'http://localhost:5000/api';

const PublicOrderPage = () => {
  const [menu, setMenu] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [orderType, setOrderType] = useState('takeaway');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      console.log('🔄 Chargement du menu...');
      const response = await axios.get(`${API_URL}/client-orders/menu`);
      setMenu(response.data.menu);
      setError('');
    } catch (error) {
      console.error('❌ Erreur menu:', error);
      setError('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item, selectedIngredients = [], itemNotes = '') => {
    const ingredientsTotal = selectedIngredients.reduce((sum, ing) => sum + ing.price, 0);
    const itemTotal = item.price + ingredientsTotal;
    
    const cartItem = {
      id: Date.now() + Math.random(),
      productName: item.name,
      basePrice: item.price,
      quantity: 1,
      ingredients: selectedIngredients,
      itemTotal: itemTotal,
      notes: itemNotes
    };
    
    setCart([...cart, cartItem]);
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
        ? { 
            ...item, 
            quantity: newQuantity,
            itemTotal: (item.basePrice + item.ingredients.reduce((sum, ing) => sum + ing.price, 0)) * newQuantity
          }
        : item
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.itemTotal, 0);
  };

  const handleSubmitOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert('❌ Nom et téléphone requis !');
      return;
    }
    
    if (cart.length === 0) {
      alert('❌ Panier vide !');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const orderData = {
        customerInfo,
        items: cart,
        orderType,
        notes
      };
      
      const response = await axios.post(`${API_URL}/client-orders`, orderData);
      
      setOrderSuccess(response.data.order);
      setCart([]);
      setCustomerInfo({ name: '', phone: '', email: '' });
      setNotes('');
      
    } catch (error) {
      alert('❌ Erreur lors de la commande');
      console.error('Erreur commande:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-order-page">
        <div className="loading">🔥 Chargement du menu Texan...</div>
      </div>
    );
  }

  return (
    <div className="public-order-page">
      {/* Header */}
      <header className="public-header">
        <div className="header-content">
          <div className="brand">
            <h1>🤠 Texan Rex's Diner 🔥</h1>
            <p>Authentic BBQ & Steakhouse</p>
          </div>
          <div className="employee-area">
            <Link to="/login" className="employee-login-btn">
              👤 Connexion Employés
            </Link>
          </div>
        </div>
      </header>

      {/* Message de succès */}
      {orderSuccess && (
        <div className="order-success">
          <div className="success-content">
            <h2>🎉 Commande confirmée !</h2>
            <p><strong>N° de commande :</strong> {orderSuccess.orderNumber}</p>
            <p><strong>Total :</strong> {formatCurrency(orderSuccess.totalAmount)}</p>
            <p><strong>Temps estimé :</strong> {orderSuccess.estimatedTime}</p>
            <button onClick={() => setOrderSuccess(null)} className="continue-btn">
              🍖 Nouvelle commande
            </button>
          </div>
        </div>
      )}

      <div className="order-layout">
        {/* Section Menu */}
        <div className="menu-section">
          <h2>🍽️ Notre Menu</h2>
          
          {error ? (
            <div className="error-section">
              <h3>❌ {error}</h3>
              <button onClick={fetchMenu} className="retry-btn">
                🔄 Réessayer
              </button>
            </div>
          ) : menu ? (
            Object.entries(menu).map(([category, items]) => (
              <div key={category} className="menu-category">
                <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                <div className="menu-items">
                  {items.map((item, index) => (
                    <MenuItem 
                      key={index} 
                      item={item} 
                      onAddToCart={addToCart} 
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="no-menu">
              <h3>🍖 Menu bientôt disponible ! 🔥</h3>
            </div>
          )}
        </div>

        {/* Section Panier */}
        <div className="cart-section">
          <div className="cart-sticky">
            <h2>🛒 Votre Commande ({cart.length})</h2>
            
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>🥩 Panier vide</p>
                <p>Ajoutez des plats délicieux !</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="item-info">
                        <h4>{item.productName}</h4>
                        {item.ingredients.length > 0 && (
                          <p className="ingredients">+ {item.ingredients.map(ing => ing.name).join(', ')}</p>
                        )}
                        {item.notes && <p className="item-notes">📝 {item.notes}</p>}
                      </div>
                      <div className="item-controls">
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="qty-btn"
                        >
                          ➖
                        </button>
                        <span className="quantity">{item.quantity}</span>
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
                      <div className="item-price">
                        {formatCurrency(item.itemTotal)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="cart-total">
                  <strong>💰 Total: {formatCurrency(getTotalAmount())}</strong>
                </div>
                
                {/* Formulaire client */}
                <div className="customer-form">
                  <h3>📋 Vos informations</h3>
                  
                  <input
                    type="text"
                    placeholder="🤠 Votre nom *"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    required
                  />
                  
                  <input
                    type="tel"
                    placeholder="📞 Votre téléphone *"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    required
                  />
                  
                  <input
                    type="email"
                    placeholder="📧 Email (optionnel)"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  />
                  
                  <div className="order-type-section">
                    <h4>🍽️ Type de commande :</h4>
                    <div className="order-type-options">
                      <label className="order-type-option">
                        <input
                          type="radio"
                          value="takeaway"
                          checked={orderType === 'takeaway'}
                          onChange={(e) => setOrderType(e.target.value)}
                        />
                        <span>🥡 À emporter</span>
                      </label>
                      <label className="order-type-option">
                        <input
                          type="radio"
                          value="dine-in"
                          checked={orderType === 'dine-in'}
                          onChange={(e) => setOrderType(e.target.value)}
                        />
                        <span>🍽️ Sur place</span>
                      </label>
                    </div>
                  </div>
                  
                  <textarea
                    placeholder="📝 Notes spéciales (allergies, cuisson, etc.)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  
                  <button 
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="order-btn"
                  >
                    {submitting ? '🔄 Envoi...' : `🔥 Commander ${formatCurrency(getTotalAmount())}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant MenuItem avec bouton ajouter
const MenuItem = ({ item, onAddToCart }) => {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [itemNotes, setItemNotes] = useState('');
  const [showCustomizer, setShowCustomizer] = useState(false);

  const toggleIngredient = (ingredient) => {
    if (selectedIngredients.find(ing => ing.name === ingredient.name)) {
      setSelectedIngredients(selectedIngredients.filter(ing => ing.name !== ingredient.name));
    } else {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(item, selectedIngredients, itemNotes);
    setSelectedIngredients([]);
    setItemNotes('');
    setShowCustomizer(false);
  };

  const getItemTotal = () => {
    return item.price + selectedIngredients.reduce((sum, ing) => sum + ing.price, 0);
  };

  return (
    <div className="menu-item">
      <div className="item-main">
        <div className="item-info">
          <h4>{item.name}</h4>
          <p className="item-price">{formatCurrency(item.price)}</p>
        </div>
        <div className="item-actions">
            <button 
              onClick={() => onAddToCart(item, [], '')}
              className="add-btn"
            >
              ➕ Ajouter
            </button>
          
        </div>
      </div>
      
      {showCustomizer && (
        <div className="item-customizer">
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="ingredients-section">
              <h5>🧀 Ingrédients supplémentaires :</h5>
              {item.ingredients.map((ingredient, index) => (
                <label key={index} className="ingredient-option">
                  <input
                    type="checkbox"
                    checked={selectedIngredients.find(ing => ing.name === ingredient.name)}
                    onChange={() => toggleIngredient(ingredient)}
                  />
                  <span>{ingredient.name} (+{formatCurrency(ingredient.price)})</span>
                </label>
              ))}
            </div>
          )}
          
          <div className="notes-section">
            <input
              type="text"
              placeholder="📝 Notes (ex: bien cuit, sans oignon...)"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
            />
          </div>
          
          <div className="customizer-actions">
            <span className="total-preview">
              💰 Total: {formatCurrency(getItemTotal())}
            </span>
            <button onClick={handleAddToCart} className="add-customized-btn">
              ➕ Ajouter ({formatCurrency(getItemTotal())})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicOrderPage;