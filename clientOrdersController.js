const ClientOrder = require('../models/ClientOrder');
const axios = require('axios');

// Menu simple sans personnalisation
const MENU_WITH_PRICES = {
  plats: [
    { name: "🍗 Smoky Grandma's Chicken", price: 1000 },
    { name: "🥪 Pulled Pork Sandwich Deluxe", price: 1000 },
    { name: "🍖 Texas Brisket Smokehouse", price: 1000 },
    { name: "🍖 Route 66 Ribs", price: 1100 },
    { name: "🍗 Grilled Chicken Ranchero", price: 1100 },
    { name: "🥩 Cowboy Steak & Onion", price: 1200 }
  ],
  desserts: [
    { name: "🍫 Brownie Maison", price: 300 },
    { name: "🍩 Donuts Speculos Caramel", price: 300 },
    { name: "🧁 Muffin Poire Chocolat", price: 400 },
    { name: "🥧 La Double P (Tarte Pomme & Poire)", price: 400 }
  ],
  boissons: [
    { name: "☕ Grandma's Coffee", price: 200 },
    { name: "🥤 Diabolo Plaisir", price: 500 },
    { name: "🍉 Pastèque Juice", price: 500 },
    { name: "🥤 Smoothie Exotique", price: 500 }
  ]
};

// @desc    Obtenir le menu public
// @route   GET /api/client-orders/menu
// @access  Public
const getPublicMenu = async (req, res) => {
  try {
    console.log('📍 Menu demandé');
    res.json({ 
      success: true, 
      menu: MENU_WITH_PRICES,
      restaurantInfo: {
        name: "Texan Rex's Diner 🤠",
        description: "Authentic BBQ & Steakhouse",
        phone: "+33 1 23 45 67 89"
      }
    });
  } catch (error) {
    console.error('❌ Erreur menu:', error);
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
    
    // Calculer les totaux
    const processedItems = items.map(item => ({
      productName: item.productName,
      basePrice: item.basePrice,
      quantity: item.quantity,
      itemTotal: item.basePrice * item.quantity,
      notes: item.notes || ''
    }));
    
    // Créer la commande
    const order = new ClientOrder({
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email || ''
      },
      items: processedItems,
      orderType: orderType || 'takeaway',
      notes: notes || ''
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
    if (item.notes) {
      text += `\n  ↳ *Note: ${item.notes}*`;
    }
    return text;
  }).join('\n');
  
  // Déterminer l'emoji du type de commande
  const orderTypeEmoji = {
    'takeaway': '🥡',
    'delivery': '🚗',
    'dine-in': '🍽️'
  };
  
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
        value: `**${order.customerInfo.name}**`,
        inline: true
      },
      {
        name: '📞 TÉLÉPHONE',
        value: `**${order.customerInfo.phone}**`,
        inline: true
      },
      {
        name: '🍽️ Type',
        value: `${orderTypeEmoji[order.orderType]} ${order.orderType === 'takeaway' ? 'À emporter' : order.orderType === 'delivery' ? 'Livraison' : 'Sur place'}`,
        inline: true
      },
      {
        name: '⏰ Heure',
        value: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
        inline: true
      },
      {
        name: '💰 TOTAL',
        value: `**${order.totalAmount}$ 💵**`,
        inline: true
      },
      {
        name: '🛒 Articles commandés',
        value: itemsText
      }
    ],
    footer: {
      text: '🔥 PRÉPAREZ CETTE COMMANDE ET APPELEZ LE CLIENT ! 🤠📞'
    },
    timestamp: new Date().toISOString()
  };
  
  if (order.notes) {
    embed.fields.push({
      name: '📝 Notes spéciales',
      value: `*${order.notes}*`
    });
  }
  
  // Message avec mention pour alerter
  const messageData = {
    content: '@here **🚨 NOUVELLE COMMANDE ! 🚨**',
    username: 'Texan Rex\'s Diner 🤠',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png',
    embeds: [embed]
  };
  
  await axios.post(DISCORD_WEBHOOK_URL, messageData);
};

module.exports = {
  getPublicMenu,
  createClientOrder
};