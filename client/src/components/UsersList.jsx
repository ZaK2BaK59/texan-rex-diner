import React, { useState } from 'react';
import { usersAPI } from '../services/api';
import { roles } from '../utils/auth';

const UsersList = ({ users, onUserUpdate }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Stagiaire',
    isAdmin: false
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'Stagiaire',
      isAdmin: false
    });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersAPI.updateUser(editingUser._id, formData);
      } else {
        await usersAPI.createUser(formData);
      }
      onUserUpdate();
      resetForm();
    } catch (error) {
      alert('Erreur: ' + (error.response?.data?.message || 'Erreur serveur'));
    }
  };

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isAdmin: user.isAdmin
    });
    setEditingUser(user);
    setShowCreateForm(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await usersAPI.deleteUser(userId);
        onUserUpdate();
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="users-list">
      <div className="users-header">
        <button 
          className="create-user-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '❌ Annuler' : '➕ Nouvel employé'}
        </button>
      </div>

      {showCreateForm && (
        <div className="user-form-container">
          <h3>{editingUser ? 'Modifier l\'employé' : 'Créer un nouvel employé'}</h3>
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="form-row">
              <input
                type="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required={!editingUser}
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                {Object.keys(roles).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <input
                type="text"
                placeholder="Prénom"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Nom"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
            
            <div className="admin-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})}
                />
                Administrateur
              </label>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingUser ? 'Modifier' : 'Créer'}
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-grid">
        {users.map(user => (
          <div key={user._id} className="user-card">
            <div className="user-info">
              <h3>{user.firstName} {user.lastName}</h3>
              <p>@{user.username}</p>
              <p>{user.email}</p>
              <div className="user-role">
                {user.role} {user.isAdmin && '👑'}
              </div>
            </div>
            <div className="user-actions">
              <button onClick={() => handleEdit(user)} className="edit-btn">
                ✏️ Modifier
              </button>
              <button onClick={() => handleDelete(user._id)} className="delete-btn">
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;