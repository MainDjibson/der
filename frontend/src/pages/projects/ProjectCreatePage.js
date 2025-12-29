import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { projectsAPI, categoriesAPI } from '../../services/api';
import {
  Save,
  Send,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  File,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const ProjectCreatePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [projectId, setProjectId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    funding_requested: '',
    start_date: '',
    duration_months: '',
    objectives: [''],
    budget_breakdown: {},
    location: ''
  });

  const [budgetItems, setBudgetItems] = useState([{ label: '', amount: '' }]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleObjectiveChange = (index, value) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, objectives: newObjectives });
  };

  const addObjective = () => {
    setFormData({ ...formData, objectives: [...formData.objectives, ''] });
  };

  const removeObjective = (index) => {
    const newObjectives = formData.objectives.filter((_, i) => i !== index);
    setFormData({ ...formData, objectives: newObjectives });
  };

  const handleBudgetChange = (index, field, value) => {
    const newItems = [...budgetItems];
    newItems[index][field] = value;
    setBudgetItems(newItems);
  };

  const addBudgetItem = () => {
    setBudgetItems([...budgetItems, { label: '', amount: '' }]);
  };

  const removeBudgetItem = (index) => {
    setBudgetItems(budgetItems.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValid = file.type === 'application/pdf' || file.type.startsWith('image/');
      const isSmallEnough = file.size <= 5 * 1024 * 1024;
      return isValid && isSmallEnough;
    });
    setDocuments([...documents, ...validFiles]);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const prepareBudget = () => {
    const budget = {};
    budgetItems.forEach(item => {
      if (item.label && item.amount) {
        budget[item.label] = parseFloat(item.amount);
      }
    });
    return budget;
  };

  const handleSave = async (submit = false) => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const projectData = {
        ...formData,
        funding_requested: parseFloat(formData.funding_requested),
        duration_months: parseInt(formData.duration_months),
        objectives: formData.objectives.filter(o => o.trim()),
        budget_breakdown: prepareBudget()
      };

      let project;
      if (projectId) {
        const response = await projectsAPI.update(projectId, projectData);
        project = response.data;
      } else {
        const response = await projectsAPI.create(projectData);
        project = response.data;
        setProjectId(project.id);
      }

      // Upload documents
      for (const file of documents) {
        await projectsAPI.uploadDocument(project.id, file);
      }
      setDocuments([]);

      if (submit) {
        await projectsAPI.submit(project.id);
        setSuccess('Projet soumis avec succès !');
        setTimeout(() => navigate('/projects'), 2000);
      } else {
        setSuccess('Projet enregistré en brouillon');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Nouveau Projet">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux projets
        </button>

        {error && (
          <div className="flex items-center gap-3 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-[var(--error)]" />
            <p className="text-[var(--error)]">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-lg p-4 mb-6">
            <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
            <p className="text-[var(--success)]">{success}</p>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Informations générales</h2>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Titre du projet *</label>
                <input
                  type="text"
                  name="title"
                  className="input-field"
                  placeholder="Ex: Ferme agricole moderne"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  className="textarea-field"
                  placeholder="Décrivez votre projet en détail..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Catégorie *</label>
                  <select
                    name="category"
                    className="select-field"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Localisation</label>
                  <input
                    type="text"
                    name="location"
                    className="input-field"
                    placeholder="Ex: Dakar, Thiès..."
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Funding */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Financement</h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="form-label">Montant demandé (FCFA) *</label>
                <input
                  type="number"
                  name="funding_requested"
                  className="input-field"
                  placeholder="Ex: 5000000"
                  value={formData.funding_requested}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="form-label">Date de démarrage *</label>
                <input
                  type="date"
                  name="start_date"
                  className="input-field"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="form-label">Durée (mois) *</label>
                <input
                  type="number"
                  name="duration_months"
                  className="input-field"
                  placeholder="Ex: 12"
                  value={formData.duration_months}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Répartition du budget</label>
              <div className="space-y-3">
                {budgetItems.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      className="input-field flex-1"
                      placeholder="Poste de dépense"
                      value={item.label}
                      onChange={(e) => handleBudgetChange(index, 'label', e.target.value)}
                    />
                    <input
                      type="number"
                      className="input-field w-40"
                      placeholder="Montant"
                      value={item.amount}
                      onChange={(e) => handleBudgetChange(index, 'amount', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeBudgetItem(index)}
                      className="p-3 text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addBudgetItem}
                className="mt-3 text-[var(--primary)] hover:underline flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter un poste
              </button>
            </div>
          </div>

          {/* Objectives */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Objectifs du projet</h2>
            
            <div className="space-y-3">
              {formData.objectives.map((obj, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder={`Objectif ${index + 1}`}
                    value={obj}
                    onChange={(e) => handleObjectiveChange(index, e.target.value)}
                  />
                  {formData.objectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="p-3 text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addObjective}
              className="mt-3 text-[var(--primary)] hover:underline flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter un objectif
            </button>
          </div>

          {/* Documents */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Documents justificatifs</h2>
            
            <div className="file-upload-zone" onClick={() => document.getElementById('file-input').click()}>
              <Upload className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)] mb-1">Cliquez ou glissez vos fichiers ici</p>
              <p className="text-sm text-[var(--text-muted)]">PDF ou images, max 5Mo par fichier</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {documents.length > 0 && (
              <div className="mt-4 space-y-2">
                {documents.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[var(--surface-light)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-[var(--primary)]" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        ({(file.size / 1024 / 1024).toFixed(2)} Mo)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="text-[var(--error)] hover:bg-[var(--error)]/10 p-2 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Enregistrer en brouillon
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || !formData.title || !formData.description || !formData.category || !formData.funding_requested}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Soumettre le projet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProjectCreatePage;
