import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { adminAPI } from '../../services/api';
import {
  BarChart3,
  Users,
  FolderKanban,
  Banknote,
  TrendingUp,
  Download,
  PieChart
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartPie,
  Pie,
  Cell,
  Legend
} from 'recharts';

const StatsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await adminAPI.exportProjects(format);
      const data = response.data;
      
      // Create download
      const blob = new Blob([format === 'csv' ? data.data : JSON.stringify(data.data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-SN', { 
      style: 'currency', 
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  if (loading) {
    return (
      <DashboardLayout title="Statistiques">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) return null;

  const statusData = Object.entries(stats.projects.by_status).map(([key, value]) => ({
    name: key === 'draft' ? 'Brouillon' 
      : key === 'pending' ? 'En attente'
      : key === 'documents_requested' ? 'Docs requis'
      : key === 'validated' ? 'Validé'
      : key === 'approved' ? 'Approuvé'
      : 'Rejeté',
    value
  }));

  const categoryData = Object.entries(stats.projects.by_category || {}).slice(0, 8).map(([key, value]) => ({
    name: key,
    count: value
  }));

  return (
    <DashboardLayout title="Statistiques">
      {/* Export Buttons */}
      <div className="flex justify-end gap-3 mb-6">
        <button
          onClick={() => handleExport('csv')}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
        <button
          onClick={() => handleExport('json')}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter JSON
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-sm mb-1">Total Projets</p>
              <p className="text-3xl font-bold text-[var(--primary)]">{stats.projects.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-[var(--primary)]" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-sm mb-1">Utilisateurs</p>
              <p className="text-3xl font-bold text-[var(--secondary)]">{stats.users.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--secondary)]/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-[var(--secondary)]" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-sm mb-1">Financement Approuvé</p>
              <p className="text-2xl font-bold text-[var(--success)]">{formatAmount(stats.funding.approved)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--success)]/20 flex items-center justify-center">
              <Banknote className="w-6 h-6 text-[var(--success)]" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-sm mb-1">En attente</p>
              <p className="text-2xl font-bold text-[var(--warning)]">{formatAmount(stats.funding.pending)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--warning)]/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[var(--warning)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Status Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[var(--primary)]" />
            Répartition par statut
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPie>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartPie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--secondary)]" />
            Projets par catégorie
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d5a" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#12122a', 
                    border: '1px solid #2d2d5a',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-6">Détail Utilisateurs</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-[var(--surface-light)] rounded-lg text-center">
            <p className="text-3xl font-bold text-[var(--success)] mb-1">{stats.users.citizens}</p>
            <p className="text-[var(--text-muted)]">Citoyens</p>
          </div>
          <div className="p-4 bg-[var(--surface-light)] rounded-lg text-center">
            <p className="text-3xl font-bold text-[var(--info)] mb-1">{stats.users.officials}</p>
            <p className="text-[var(--text-muted)]">Fonctionnaires</p>
          </div>
          <div className="p-4 bg-[var(--surface-light)] rounded-lg text-center">
            <p className="text-3xl font-bold text-[var(--primary)] mb-1">{stats.users.verified}</p>
            <p className="text-[var(--text-muted)]">Comptes vérifiés</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StatsPage;
