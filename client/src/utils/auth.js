export const roles = {
  'Stagiaire': { percentage: 30, level: 1 },
  'Employé polyvalent': { percentage: 35, level: 2 },
  'Chef d\'équipe': { percentage: 40, level: 3 },
  'Co-patron': { percentage: 45, level: 4 },
  'Directeur': { percentage: 50, level: 5 }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const calculateBonus = (price, role) => {
  const percentage = roles[role]?.percentage || 30;
  return (price * percentage) / 100;
};