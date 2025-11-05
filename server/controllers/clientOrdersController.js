const ClientOrder = require('../models/ClientOrder');
const axios = require('axios');

// Menu avec ingrédients disponibles
const MENU_WITH_INGREDIENTS = {
  plats: [
    { 
      name: "🍗 Smoky Grandma's Chicken", 
      price: 1000,
      ingredients: [
        { name: "🧀 Fromage extra", price: 150 },
        { name: "🥓 Bacon", price: 200 },
        { name: "🌶️ Sauce piquante", price: 50 },
        { name: "🥬 Salade extra", price: 100 }
      ]
    },
    { 
      name: "🥪 Pulled Pork Sandwich", 
      price: 1000,
      ingredients: [
        { name: "🧀 Cheddar", price: 150 },
        { name: "🥒 Cornichons", price: 50 },
        { name: "🍅 Tomates", price: 75 }
      ]
    },
    { 
      name: "🍖 Texas Brisket", 
      price: 1000,
      ingredients: [
        { name: "🔥 Sauce BBQ extra", price: 75 },
        { name: "🌽 Maïs grillé", price: 125 }
      ]
    },
    { 
      name: "🍖 Route 66 Ribs", 
      price: 1100,
      ingredients: [
        { name: "🍯 Sauce miel", price: 100 },
        { name: "🥔 Frites maison", price: 200 }
      ]
    },
    { 
      name: "🍗 Grilled Chicken Ranchero", 
      price: 1100,
      ingredients: [
        { name: "🥑 Guacamole", price: 175 },
        { name: "🌶️ Jalapeños", price: 75 }
      ]
    },
    { 
      name: "🥩 Cowboy Steak & Onion", 
      price: 1200,
      ingredients: [
        { name: "🧈 Beurre à l'ail", price: 100 },
        { name: "🍄 Champignons grillés", price: 150 }
      ]
    }
  ],
  desserts: [
    { name: "🍫 Brownie Maison", price: 300, ingredients: [] },
    { name: "🍩 Donuts Speculos", price: 300, ingredients: [] },
    { name: "🧁 Muffin Poire Chocolat", price: 400, ingredients: [] },
    { name: "🥧 Tarte Pomme & Poire", price: 400, ingredients: [] }
  ],
  boissons: [
    { name: "☕ Grandma's Coffee", price: 200, ingredients: [] },
    { name: "🥤 Diabolo Plaisir", price: 500, ingredients: [] },
    { name: "🍉 Pastèque Juice", price: 500, ingredients: [] },
    { name: "🥤 Smoothie Exotique", price: 500, ingredients: [] }
  ]
};

// @desc    Obtenir le menu public
// @route   GET /api/client-orders/menu
// @access  Public
const getPublicMenu = async (req, res) => {
  try {
    res.json({ 
      success: true, 
      menu: MENU_WITH_INGREDIENTS,
      restaurantInfo: {
        name: "Texan Rex's Diner 🤠",
        description: "Authentic BBQ & Steakhouse",
        phone: "+33 1 23 45 67 89"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du menu' });
  }
};

// @desc    Créer une commande client
// @route   POST /api/client-orders
// @access  Public
const createClientOrder = async (req, res) => {
  try {
    const { customerInfo, items, orderType, notes } = req.body;
    
    console.log('📋 Nouvelle commande reçue:', { customerInfo, items, orderType });
    
    // Validation
    if (!customerInfo.name || !customerInfo.phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nom et téléphone requis !' 
      });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Au moins un article requis !' 
      });
    }
    
    // Calculer les totaux AVANT de créer l'objet
    const processedItems = items.map(item => ({
      productName: item.productName,
      basePrice: parseFloat(item.basePrice) || 0,
      quantity: parseInt(item.quantity) || 1,
      itemTotal: (parseFloat(item.basePrice) || 0) * (parseInt(item.quantity) || 1),
      notes: item.notes || ''
    }));
    
    // Calculer le total général
    const totalAmount = processedItems.reduce((sum, item) => sum + item.itemTotal, 0);
    
    console.log('💰 Total calculé:', totalAmount);
    console.log('📦 Items traités:', processedItems);
    
    // Générer le numéro de commande
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const count = await ClientOrder.countDocuments({
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    });
    
    const orderNumber = `TEX${dateStr}${String(count + 1).padStart(3, '0')}`;
    
    // Créer la commande avec TOUS les champs calculés
    const order = new ClientOrder({
      orderNumber: orderNumber,
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email || ''
      },
      items: processedItems,
      totalAmount: totalAmount,  // ← Calculé explicitement
      orderType: orderType || 'takeaway',
      notes: notes || '',
      status: 'pending'
    });
    
    await order.save();
    console.log('✅ Commande sauvegardée:', order.orderNumber);
    
    // Envoyer webhook Discord
    try {
      await sendDiscordWebhook(order);
      console.log('✅ Webhook Discord envoyé');
    } catch (discordError) {
      console.error('❌ Erreur Discord webhook:', discordError.message);
      // Continue même si Discord échoue
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Commande créée avec succès !',
      order: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        estimatedTime: '15-25 minutes'
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création commande client:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de la commande' 
    });
  }
};

// Fonction webhook Discord
const sendDiscordWebhook = async (order) => {
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  
  if (!DISCORD_WEBHOOK_URL) {
    console.log('⚠️ Pas de webhook Discord configuré');
    return;
  }
  
  // Formater les items
  const itemsText = order.items.map(item => {
    let text = `**${item.productName}** x${item.quantity} - ${item.itemTotal}$`;
    if (item.ingredients && item.ingredients.length > 0) {
      text += `\n  ↳ *${item.ingredients.map(ing => ing.name).join(', ')}*`;
    }
    if (item.notes) {
      text += `\n  ↳ Note: *${item.notes}*`;
    }
    return text;
  }).join('\n\n');
  
  const embed = {
    title: '🔥 NOUVELLE COMMANDE - TEXAN REX\'S DINER 🤠',
    color: 0x8B0000, // Rouge Texas
    fields: [
      {
        name: '📋 Commande N°',
        value: `**${order.orderNumber}**`,
        inline: true
      },
      {
        name: '👤 Client',
        value: `**${order.customerInfo.name}**\n📞 ${order.customerInfo.phone}`,
        inline: true
      },
      {
        name: '🍽️ Type',
        value: order.orderType === 'takeaway' ? '🥡 À emporter' : 
               order.orderType === 'delivery' ? '🚗 Livraison' : '🍽️ Sur place',
        inline: true
      },
      {
        name: '🛒 Articles commandés',
        value: itemsText
      },
      {
        name: '💰 TOTAL',
        value: `**${order.totalAmount}$ 💵**`,
        inline: true
      },
      {
        name: '⏰ Heure',
        value: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
        inline: true
      }
    ],
    footer: {
      text: '🔥 Préparez cette commande cowboy ! 🤠'
    }
  };
  
  if (order.notes) {
    embed.fields.push({
      name: '📝 Notes spéciales',
      value: `*${order.notes}*`
    });
  }
  
  await axios.post(DISCORD_WEBHOOK_URL, {
    username: 'Texan Rex\'s Diner 🤠',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png',
    embeds: [embed]
  });
};

// @desc    Obtenir le statut d'une commande (pour le client)
// @route   GET /api/client-orders/status/:orderNumber
// @access  Public
const getOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await ClientOrder.findOne({ orderNumber }).select('-__v');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }
    
    res.json({ 
      success: true, 
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        estimatedTime: getEstimatedTime(order.status)
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du statut' });
  }
};

const getEstimatedTime = (status) => {
  switch (status) {
    case 'pending': return 'En attente de confirmation...';
    case 'confirmed': return '15-25 minutes';
    case 'preparing': return '10-15 minutes';
    case 'ready': return 'Prête ! 🔥';
    case 'delivered': return 'Livrée ✅';
    default: return 'Mise à jour en cours...';
  }
};

module.exports = {
  getPublicMenu,
  createClientOrder,
  getOrderStatus
};