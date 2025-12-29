import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import {
  Users,
  Search,
  Filter,
  Shield,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers(filters);
      setUsers(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, data) => {
    try {
      await adminAPI.updateUser(userId, data);
      await fetchUsers();
      setActionMenu(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: 'Admin', class: 'role-admin' },
      official: { label: 'Fonctionnaire', class: 'role-official' },
      citizen: { label: 'Citoyen', class: 'role-citizen' }
    };
    return badges[role] || badges.citizen;
  };

  return (
    <DashboardLayout title="Gestion des utilisateurs">
      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                className="input-field pl-11"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <select
            className="select-field w-full md:w-48"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">Tous les rôles</option>
            <option value="citizen">Citoyens</option>
            <option value="official">Fonctionnaires</option>
            <option value="admin">Administrateurs</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-20 h-20 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Aucun utilisateur trouvé</h3>
          <p className="text-[var(--text-muted)]">Modifiez vos filtres de recherche</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Téléphone</th>
                <th>Statut</th>
                <th>Inscription</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleBadge = getRoleBadge(u.role);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-black font-bold text-sm">
                          {u.first_name?.charAt(0)}{u.last_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{u.first_name} {u.last_name}</p>
                          <p className="text-sm text-[var(--text-muted)]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${roleBadge.class}`}>{roleBadge.label}</span>
                    </td>
                    <td className="text-[var(--text-muted)]">{u.phone}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {u.is_verified ? (
                          <span className="badge badge-approved">
                            <CheckCircle2 className="w-3 h-3" />
                            Vérifié
                          </span>
                        ) : (
                          <span className="badge badge-pending">Non vérifié</span>
                        )}
                        {!u.is_active && (
                          <span className="badge badge-rejected">Désactivé</span>
                        )}
                      </div>
                    </td>
                    <td className="text-[var(--text-muted)] text-sm">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <div className="relative">
                        <button
                          onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}
                          className="p-2 hover:bg-[var(--surface-light)] rounded-lg"
                        >
                          <MoreVertical className="w-5 h-5 text-[var(--text-muted)]" />
                        </button>
                        {actionMenu === u.id && (
                          <div className="absolute right-0 top-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-10 py-1 min-w-[160px]">
                            <button
                              onClick={() => handleUpdateUser(u.id, { is_verified: !u.is_verified })}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-light)] flex items-center gap-2"
                            >
                              {u.is_verified ? 'Dévérifier' : 'Vérifier'}
                            </button>
                            <button
                              onClick={() => handleUpdateUser(u.id, { is_active: !u.is_active })}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-light)] flex items-center gap-2"
                            >
                              {u.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                            <hr className="my-1 border-[var(--border)]" />
                            <button
                              onClick={() => handleUpdateUser(u.id, { role: 'citizen' })}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-light)]"
                            >
                              Passer en Citoyen
                            </button>
                            <button
                              onClick={() => handleUpdateUser(u.id, { role: 'official' })}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-light)]"
                            >
                              Passer en Fonctionnaire
                            </button>
                            <button
                              onClick={() => handleUpdateUser(u.id, { role: 'admin' })}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-light)]"
                            >
                              Passer en Admin
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UsersPage;
