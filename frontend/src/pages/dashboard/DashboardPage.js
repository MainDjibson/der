import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI, adminAPI } from '../../services/api';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  XCircle,
  FileQuestion,
  TrendingUp,
  Users,
  Banknote,
  ArrowRight,
  Plus
} from 'lucide-react';

const DashboardPage = () => {
  const { user, isAdmin, isOfficial, isCitizen } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const projectsRes = await projectsAPI.getAll();
      setProjects(projectsRes.data);

      if (isAdmin) {
        const statsRes = await adminAPI.getStats();
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: Clock,
      pending: Clock,
      documents_requested: FileQuestion,
      validated: CheckCircle2,
      approved: CheckCircle2,
      rejected: XCircle
    };
    return icons[status] || Clock;
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Brouillon',
      pending: 'En attente',
      documents_requested: 'Documents requis',
      validated: 'Validé',
      approved: 'Approuvé',
      rejected: 'Rejeté'
    };
    return labels[status] || status;
  };

  const getProjectStats = () => {
    if (isAdmin && stats) {
      return [
        { label: 'Total Projets', value: stats.projects.total, icon: FolderKanban, color: 'var(--primary)' },
        { label: 'En attente', value: stats.projects.by_status.pending || 0, icon: Clock, color: 'var(--warning)' },
        { label: 'Approuvés', value: stats.projects.by_status.approved || 0, icon: CheckCircle2, color: 'var(--success)' },
        { label: 'Utilisateurs', value: stats.users.total, icon: Users, color: 'var(--secondary)' }
      ];
    }

    const statusCounts = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    return [
      { label: 'Mes Projets', value: projects.length, icon: FolderKanban, color: 'var(--primary)' },
      { label: 'En attente', value: statusCounts.pending || 0, icon: Clock, color: 'var(--warning)' },
      { label: 'Approuvés', value: statusCounts.approved || 0, icon: CheckCircle2, color: 'var(--success)' },
      { label: 'Rejetés', value: statusCounts.rejected || 0, icon: XCircle, color: 'var(--error)' }
    ];
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const recentProjects = projects.slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout title="Tableau de bord">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tableau de bord">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getProjectStats().map((stat, index) => (
          <div key={index} className="stat-card hover-lift">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[var(--text-muted)] text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}20` }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Stats */}
      {isAdmin && stats && (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[var(--success)]" />
              Financement
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-[var(--surface-light)] rounded-lg">
                <span className="text-[var(--text-muted)]">Total approuvé</span>
                <span className="text-xl font-bold text-[var(--success)]">{formatAmount(stats.funding.approved)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-[var(--surface-light)] rounded-lg">
                <span className="text-[var(--text-muted)]">En attente</span>
                <span className="text-xl font-bold text-[var(--warning)]">{formatAmount(stats.funding.pending)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--primary)]" />
              Utilisateurs
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Citoyens</span>
                <span className="font-semibold">{stats.users.citizens}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Fonctionnaires</span>
                <span className="font-semibold">{stats.users.officials}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Vérifiés</span>
                <span className="font-semibold text-[var(--success)]">{stats.users.verified}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions for Citizens */}
      {isCitizen && (
        <div className="card mb-8 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--secondary)]/10 border-[var(--primary)]/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Prêt à lancer votre projet ?</h3>
              <p className="text-[var(--text-muted)]">Créez une nouvelle demande de financement en quelques étapes</p>
            </div>
            <Link to="/projects/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nouveau Projet
            </Link>
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {isCitizen ? 'Mes projets récents' : 'Projets récents'}
          </h3>
          <Link to="/projects" className="text-[var(--primary)] hover:underline flex items-center gap-1 text-sm">
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--text-muted)] mb-4">Aucun projet pour le moment</p>
            {isCitizen && (
              <Link to="/projects/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Créer mon premier projet
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Catégorie</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project) => {
                  const StatusIcon = getStatusIcon(project.status);
                  return (
                    <tr key={project.id}>
                      <td>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-[var(--text-muted)] truncate max-w-xs">{project.description}</p>
                      </td>
                      <td>
                        <span className="badge badge-draft">{project.category}</span>
                      </td>
                      <td className="font-medium">{formatAmount(project.funding_requested)}</td>
                      <td>
                        <span className={`badge badge-${project.status}`}>
                          <StatusIcon className="w-3 h-3" />
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="text-[var(--text-muted)] text-sm">
                        {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <Link 
                          to={`/projects/${project.id}`}
                          className="text-[var(--primary)] hover:underline text-sm"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
