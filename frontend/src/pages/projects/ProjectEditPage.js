import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { projectsAPI, categoriesAPI } from '../../services/api';
import {
  Save,
  Send,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const ProjectEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    funding_requested: '',
    start_date: '',
    duration_months: '',
    objectives: [''],
    location: ''
  });

  const [budgetItems, setBudgetItems] = useState([{ label: '', amount: '' }]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, categoriesRes] = await Promise.all([
        projectsAPI.getById(id),
        categoriesAPI.getAll()
      ]);
      
      const project = projectRes.data;
      setFormData({
        title: project.title || '',
        description: project.description || '',
        category: project.category || '',
        funding_requested: project.funding_requested || '',
        start_date: project.start_date || '',
        duration_months: project.duration_months || '',
        objectives: project.objectives?.length > 0 ? project.objectives : [''],
        location: project.location || ''
      });

      if (project.budget_breakdown && Object.keys(project.budget_breakdown).length > 0) {
        setBudgetItems(
          Object.entries(project.budget_breakdown).map(([label, amount]) => ({ label, amount: amount.toString() }))
        );
      }
      
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error:', error);
      navigate('/projects');
    } finally {
      setLoading(false);
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

      await projectsAPI.update(id, projectData);

      if (submit) {
        await projectsAPI.submit(id);
        setSuccess('Projet soumis avec succès !');
        setTimeout(() => navigate('/projects'), 2000);
      } else {
        setSuccess('Modifications enregistrées');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Modifier le projet">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Modifier le projet">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour au projet
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
                    <option value="">Sélectionner</option>
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
                <label className="form-label">Montant (FCFA) *</label>
                <input
                  type="number"
                  name="funding_requested"
                  className="input-field"
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
                      placeholder="Poste"
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
            <h2 className="text-xl font-semibold mb-6">Objectifs</h2>
            
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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Soumettre
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProjectEditPage;
