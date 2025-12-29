import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI, categoriesAPI } from '../../services/api';
import {
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Eye,
  Edit,
  Trash2,
  FolderKanban
} from 'lucide-react';

const ProjectsListPage = () => {
  const { isCitizen, isAdmin, isOfficial } = useAuth();
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, categoriesRes] = await Promise.all([
        projectsAPI.getAll(filters),
        categoriesAPI.getAll()
      ]);
      setProjects(projectsRes.data);
      setCategories(categoriesRes.data);
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

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const statuses = [
    { value: '', label: 'Tous les statuts' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'pending', label: 'En attente' },
    { value: 'documents_requested', label: 'Documents requis' },
    { value: 'validated', label: 'Validé' },
    { value: 'approved', label: 'Approuvé' },
    { value: 'rejected', label: 'Rejeté' }
  ];

  return (
    <DashboardLayout title={isCitizen ? 'Mes Projets' : 'Projets'}>
      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                className="input-field pl-11"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              className="select-field"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              className="select-field"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">Toutes les catégories</option>
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          {isCitizen && (
            <Link to="/projects/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nouveau
            </Link>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban className="w-20 h-20 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Aucun projet trouvé</h3>
          <p className="text-[var(--text-muted)] mb-6">
            {filters.search || filters.status || filters.category 
              ? 'Essayez de modifier vos filtres'
              : isCitizen ? 'Commencez par créer votre premier projet' : 'Aucun projet à traiter pour le moment'}
          </p>
          {isCitizen && !filters.search && !filters.status && !filters.category && (
            <Link to="/projects/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Créer mon premier projet
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => {
            const StatusIcon = getStatusIcon(project.status);
            return (
              <div key={project.id} className="card hover-lift">
                <div className="flex items-start justify-between mb-4">
                  <span className={`badge badge-${project.status}`}>
                    <StatusIcon className="w-3 h-3" />
                    {getStatusLabel(project.status)}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {new Date(project.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 line-clamp-1">{project.title}</h3>
                <p className="text-[var(--text-muted)] text-sm mb-4 line-clamp-2">{project.description}</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge badge-draft text-xs">{project.category}</span>
                  {project.location && (
                    <span className="text-xs text-[var(--text-muted)]">• {project.location}</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Montant demandé</p>
                    <p className="font-bold text-[var(--primary)]">{formatAmount(project.funding_requested)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/projects/${project.id}`}
                      className="p-2 hover:bg-[var(--surface-light)] rounded-lg transition-colors"
                      title="Voir"
                    >
                      <Eye className="w-5 h-5 text-[var(--text-muted)]" />
                    </Link>
                    {isCitizen && (project.status === 'draft' || project.status === 'documents_requested') && (
                      <Link 
                        to={`/projects/${project.id}/edit`}
                        className="p-2 hover:bg-[var(--surface-light)] rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5 text-[var(--text-muted)]" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProjectsListPage;
