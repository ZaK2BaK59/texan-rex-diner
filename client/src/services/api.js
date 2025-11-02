import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://texan-rexs-diner.onrender.com/api'  // ← TON vrai backend qui fonctionne !
  : 'http://localhost:5000/api';

// Configuration axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Services d'authentification
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me')
};

// Services des ventes
export const salesAPI = {
  createSale: (saleData) => api.post('/sales', saleData),
  getMySales: () => api.get('/sales/my-sales'),
  getAllSales: () => api.get('/sales'),
  weeklyReset: () => api.delete('/sales/weekly-reset')
};

// Services des utilisateurs
export const usersAPI = {
  getAllUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

export default api;