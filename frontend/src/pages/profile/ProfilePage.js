import React, { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../services/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Camera,
  Save,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Users
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    region: user?.region || ''
  });

  const [filiation, setFiliation] = useState({
    father_name: user?.filiation?.father_name || '',
    mother_name: user?.filiation?.mother_name || '',
    birth_place: user?.filiation?.birth_place || '',
    birth_date: user?.filiation?.birth_date || '',
    nationality: user?.filiation?.nationality || 'Sénégalaise'
  });

  const [identityDoc, setIdentityDoc] = useState({
    type: user?.identity_document?.type || 'cni',
    number: user?.identity_document?.number || '',
    issue_date: user?.identity_document?.issue_date || '',
    expiry_date: user?.identity_document?.expiry_date || '',
    file: null
  });

  const regions = [
    'Dakar', 'Diourbel', 'Fatick', 'Kaffrine', 'Kaolack',
    'Kédougou', 'Kolda', 'Louga', 'Matam', 'Saint-Louis',
    'Sédhiou', 'Tambacounda', 'Thiès', 'Ziguinchor'
  ];

  const docTypes = [
    { value: 'cni', label: 'Carte Nationale d\'Identité' },
    { value: 'passport', label: 'Passeport' },
    { value: 'permis', label: 'Permis de conduire' },
    { value: 'autre', label: 'Autre' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFiliationChange = (e) => {
    setFiliation({ ...filiation, [e.target.name]: e.target.value });
  };

  const handleIdentityChange = (e) => {
    setIdentityDoc({ ...identityDoc, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      await usersAPI.uploadAvatar(file);
      setSuccess('Photo de profil mise à jour');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du téléchargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile({
        ...formData,
        filiation
      });
      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleIdentitySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!identityDoc.file && !user?.identity_document?.file_url) {
      setError('Veuillez ajouter un fichier de pièce d\'identité');
      return;
    }

    setLoading(true);

    try {
      if (identityDoc.file) {
        await usersAPI.uploadIdentityDocument({
          file: identityDoc.file,
          doc_type: identityDoc.type,
          doc_number: identityDoc.number,
          issue_date: identityDoc.issue_date,
          expiry_date: identityDoc.expiry_date
        });
      }
      setSuccess('Pièce d\'identité mise à jour');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = () => {
    if (user?.role === 'admin') return { label: 'Administrateur', class: 'role-admin' };
    if (user?.role === 'official') return { label: 'Fonctionnaire', class: 'role-official' };
    return { label: 'Citoyen', class: 'role-citizen' };
  };

  const role = getRoleBadge();

  return (
    <DashboardLayout title="Mon Profil">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-black text-3xl font-bold">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <>{user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}</>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center cursor-pointer hover:bg-[var(--primary-dark)] transition-colors">
                <Camera className="w-4 h-4 text-black" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold">{user?.first_name} {user?.last_name}</h2>
              <p className="text-[var(--text-muted)] mb-2">{user?.email}</p>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <span className={`badge ${role.class}`}>{role.label}</span>
                {user?.is_verified ? (
                  <span className="badge badge-approved">
                    <CheckCircle2 className="w-3 h-3" />
                    Vérifié
                  </span>
                ) : (
                  <span className="badge badge-pending">Non vérifié</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
          {[
            { id: 'info', label: 'Informations', icon: User },
            { id: 'filiation', label: 'Filiation', icon: Users },
            { id: 'identity', label: 'Pièce d\'identité', icon: FileText }
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
        {activeTab === 'info' && (
          <form onSubmit={handleSubmit} className="card">
            <h3 className="text-lg font-semibold mb-6">Informations personnelles</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    name="first_name"
                    className="input-field pl-11"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  name="last_name"
                  className="input-field"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="email"
                  className="input-field pl-11 opacity-60"
                  value={user?.email}
                  disabled
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="form-label">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="tel"
                  name="phone"
                  className="input-field pl-11"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="form-label">Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  name="address"
                  className="input-field pl-11"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">Ville</label>
                <input
                  type="text"
                  name="city"
                  className="input-field"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">Région</label>
                <select
                  name="region"
                  className="select-field"
                  value={formData.region}
                  onChange={handleChange}
                >
                  <option value="">Sélectionner</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-5 h-5" />
              Enregistrer
            </button>
          </form>
        )}

        {activeTab === 'filiation' && (
          <form onSubmit={handleSubmit} className="card">
            <h3 className="text-lg font-semibold mb-6">Informations de filiation</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">Nom du père</label>
                <input
                  type="text"
                  name="father_name"
                  className="input-field"
                  value={filiation.father_name}
                  onChange={handleFiliationChange}
                />
              </div>
              <div>
                <label className="form-label">Nom de la mère</label>
                <input
                  type="text"
                  name="mother_name"
                  className="input-field"
                  value={filiation.mother_name}
                  onChange={handleFiliationChange}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">Lieu de naissance</label>
                <input
                  type="text"
                  name="birth_place"
                  className="input-field"
                  value={filiation.birth_place}
                  onChange={handleFiliationChange}
                />
              </div>
              <div>
                <label className="form-label">Date de naissance</label>
                <input
                  type="date"
                  name="birth_date"
                  className="input-field"
                  value={filiation.birth_date}
                  onChange={handleFiliationChange}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="form-label">Nationalité</label>
              <input
                type="text"
                name="nationality"
                className="input-field"
                value={filiation.nationality}
                onChange={handleFiliationChange}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-5 h-5" />
              Enregistrer
            </button>
          </form>
        )}

        {activeTab === 'identity' && (
          <form onSubmit={handleIdentitySubmit} className="card">
            <h3 className="text-lg font-semibold mb-6">Pièce d'identité</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">Type de document</label>
                <select
                  name="type"
                  className="select-field"
                  value={identityDoc.type}
                  onChange={handleIdentityChange}
                >
                  {docTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Numéro</label>
                <input
                  type="text"
                  name="number"
                  className="input-field"
                  value={identityDoc.number}
                  onChange={handleIdentityChange}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">Date de délivrance</label>
                <input
                  type="date"
                  name="issue_date"
                  className="input-field"
                  value={identityDoc.issue_date}
                  onChange={handleIdentityChange}
                />
              </div>
              <div>
                <label className="form-label">Date d'expiration</label>
                <input
                  type="date"
                  name="expiry_date"
                  className="input-field"
                  value={identityDoc.expiry_date}
                  onChange={handleIdentityChange}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="form-label">Document (PDF ou image)</label>
              {user?.identity_document?.file_url && (
                <div className="mb-3 p-3 bg-[var(--surface-light)] rounded-lg flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[var(--primary)]" />
                  <span className="text-sm">Document actuel enregistré</span>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setIdentityDoc({ ...identityDoc, file: e.target.files[0] })}
                className="input-field"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-5 h-5" />
              Enregistrer
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
