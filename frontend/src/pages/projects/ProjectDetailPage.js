import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI } from '../../services/api';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Send,
  Edit,
  File,
  Download,
  Trash2,
  MessageSquare,
  History,
  Upload,
  AlertCircle,
  Banknote,
  Calendar,
  MapPin,
  Target,
  FileText
} from 'lucide-react';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isCitizen, isOfficial, isAdmin } = useAuth();
  
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const [projectRes, commentsRes, historyRes] = await Promise.all([
        projectsAPI.getById(id),
        projectsAPI.getComments(id),
        projectsAPI.getHistory(id)
      ]);
      setProject(projectRes.data);
      setComments(commentsRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      console.error('Error:', error);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const info = {
      draft: { label: 'Brouillon', icon: Clock, color: 'var(--text-muted)' },
      pending: { label: 'En attente de validation', icon: Clock, color: 'var(--warning)' },
      documents_requested: { label: 'Documents supplémentaires requis', icon: FileQuestion, color: 'var(--info)' },
      validated: { label: 'Validé', icon: CheckCircle2, color: 'var(--secondary)' },
      approved: { label: 'Approuvé', icon: CheckCircle2, color: 'var(--success)' },
      rejected: { label: 'Rejeté', icon: XCircle, color: 'var(--error)' }
    };
    return info[status] || info.draft;
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      await projectsAPI.submit(id);
      await fetchProject();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setActionLoading(true);
      await projectsAPI.validate(id);
      await fetchProject();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await projectsAPI.approve(id);
      await fetchProject();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await projectsAPI.reject(id, actionReason);
      setActionModal(null);
      await fetchProject();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDocs = async () => {
    try {
      setActionLoading(true);
      await projectsAPI.requestDocuments(id, actionReason);
      setActionModal(null);
      await fetchProject();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await projectsAPI.addComment(id, newComment);
      setNewComment('');
      const commentsRes = await projectsAPI.getComments(id);
      setComments(commentsRes.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await projectsAPI.uploadDocument(id, file);
      await fetchProject();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Détails du projet">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) return null;

  const statusInfo = getStatusInfo(project.status);
  const StatusIcon = statusInfo.icon;
  const canEdit = isCitizen && (project.status === 'draft' || project.status === 'documents_requested');
  const canSubmit = isCitizen && (project.status === 'draft' || project.status === 'documents_requested');
  const canValidate = (isOfficial || isAdmin) && project.status === 'pending';
  const canApprove = isAdmin && project.status === 'validated';
  const canReject = (isOfficial || isAdmin) && ['pending', 'validated'].includes(project.status);
  const canRequestDocs = (isOfficial || isAdmin) && project.status === 'pending';

  return (
    <DashboardLayout title="Détails du projet">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour aux projets
      </button>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`badge badge-${project.status}`}>
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </span>
              <span className="badge badge-draft">{project.category}</span>
            </div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {canEdit && (
              <Link to={`/projects/${id}/edit`} className="btn-secondary flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Modifier
              </Link>
            )}
            {canSubmit && (
              <button onClick={handleSubmit} disabled={actionLoading} className="btn-primary flex items-center gap-2">
                <Send className="w-4 h-4" />
                Soumettre
              </button>
            )}
            {canValidate && (
              <button onClick={handleValidate} disabled={actionLoading} className="btn-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Valider
              </button>
            )}
            {canApprove && (
              <button onClick={handleApprove} disabled={actionLoading} className="btn-primary flex items-center gap-2 bg-[var(--success)]">
                <CheckCircle2 className="w-4 h-4" />
                Approuver
              </button>
            )}
            {canRequestDocs && (
              <button onClick={() => setActionModal('docs')} className="btn-secondary flex items-center gap-2">
                <FileQuestion className="w-4 h-4" />
                Demander docs
              </button>
            )}
            {canReject && (
              <button onClick={() => setActionModal('reject')} className="btn-secondary flex items-center gap-2 text-[var(--error)] border-[var(--error)]">
                <XCircle className="w-4 h-4" />
                Rejeter
              </button>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {project.status === 'documents_requested' && project.documents_request_reason && (
          <div className="mt-4 p-4 bg-[var(--info)]/10 border border-[var(--info)]/30 rounded-lg">
            <p className="text-sm font-medium text-[var(--info)] mb-1">Documents supplémentaires demandés</p>
            <p className="text-[var(--text-muted)]">{project.documents_request_reason}</p>
          </div>
        )}
        {project.status === 'rejected' && project.rejection_reason && (
          <div className="mt-4 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg">
            <p className="text-sm font-medium text-[var(--error)] mb-1">Raison du rejet</p>
            <p className="text-[var(--text-muted)]">{project.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        {[{ id: 'details', label: 'Détails', icon: FileText },
          { id: 'documents', label: 'Documents', icon: File },
          { id: 'comments', label: 'Commentaires', icon: MessageSquare },
          { id: 'history', label: 'Historique', icon: History }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-[var(--primary)] text-[var(--primary)]' 
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Description</h3>
              <p className="text-[var(--text-muted)] whitespace-pre-wrap">{project.description}</p>
            </div>

            {project.objectives && project.objectives.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[var(--primary)]" />
                  Objectifs
                </h3>
                <ul className="space-y-2">
                  {project.objectives.map((obj, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[var(--success)] mt-0.5" />
                      <span className="text-[var(--text-muted)]">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {project.budget_breakdown && Object.keys(project.budget_breakdown).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Répartition du budget</h3>
                <div className="space-y-3">
                  {Object.entries(project.budget_breakdown).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-[var(--surface-light)] rounded-lg">
                      <span>{key}</span>
                      <span className="font-semibold">{formatAmount(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Informations</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Montant demandé</p>
                    <p className="font-bold text-[var(--primary)]">{formatAmount(project.funding_requested)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--secondary)]/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[var(--secondary)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Date de démarrage</p>
                    <p className="font-medium">{new Date(project.start_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--success)]/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Durée</p>
                    <p className="font-medium">{project.duration_months} mois</p>
                  </div>
                </div>
                {project.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--warning)]/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[var(--warning)]" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-muted)]">Localisation</p>
                      <p className="font-medium">{project.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <p className="text-sm text-[var(--text-muted)] mb-1">Créé le</p>
              <p>{new Date(project.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card">
          {(canEdit || project.status === 'documents_requested') && (
            <div className="mb-6">
              <label className="file-upload-zone cursor-pointer block">
                <Upload className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-[var(--text-muted)]">Cliquez pour ajouter un document</p>
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
              </label>
            </div>
          )}

          {project.documents && project.documents.length > 0 ? (
            <div className="space-y-3">
              {project.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-[var(--surface-light)] rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="w-8 h-8 text-[var(--primary)]" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {(doc.file_size / 1024 / 1024).toFixed(2)} Mo • {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-[var(--surface)] rounded-lg">
                      <Download className="w-5 h-5 text-[var(--text-muted)]" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--text-muted)] py-8">Aucun document</p>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="card">
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              className="textarea-field mb-3"
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" disabled={!newComment.trim()} className="btn-primary">
              Envoyer
            </button>
          </form>

          <div className="space-y-4">
            {comments.length > 0 ? comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-[var(--surface-light)] rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-black text-sm font-bold">
                    {comment.user_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{comment.user_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(comment.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <span className={`badge ${comment.user_role === 'official' ? 'role-official' : comment.user_role === 'admin' ? 'role-admin' : 'role-citizen'} text-xs`}>
                    {comment.user_role === 'official' ? 'Fonctionnaire' : comment.user_role === 'admin' ? 'Admin' : 'Citoyen'}
                  </span>
                </div>
                <p className="text-[var(--text-muted)]">{comment.content}</p>
              </div>
            )) : (
              <p className="text-center text-[var(--text-muted)] py-8">Aucun commentaire</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-[var(--surface-light)] rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
                    <History className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="font-medium">{item.action}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      Par {item.user_name} • {new Date(item.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--text-muted)] py-8">Aucun historique</p>
          )}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">
              {actionModal === 'reject' ? 'Rejeter le projet' : 'Demander des documents'}
            </h3>
            <textarea
              className="textarea-field mb-4"
              placeholder={actionModal === 'reject' ? 'Raison du rejet...' : 'Documents demandés...'}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setActionModal(null)} className="btn-secondary flex-1">
                Annuler
              </button>
              <button 
                onClick={actionModal === 'reject' ? handleReject : handleRequestDocs}
                disabled={!actionReason.trim() || actionLoading}
                className={`btn-primary flex-1 ${actionModal === 'reject' ? 'bg-[var(--error)]' : ''}`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
