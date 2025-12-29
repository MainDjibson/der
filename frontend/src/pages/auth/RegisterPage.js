import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Shield, Mail, Lock, Eye, EyeOff, User, Phone, 
  MapPin, ArrowRight, AlertCircle, CheckCircle2,
  Building2
} from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    role: 'citizen'
  });

  const regions = [
    'Dakar', 'Diourbel', 'Fatick', 'Kaffrine', 'Kaolack',
    'Kédougou', 'Kolda', 'Louga', 'Matam', 'Saint-Louis',
    'Sédhiou', 'Tambacounda', 'Thiès', 'Ziguinchor'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="futuristic-bg grid-pattern min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="card-glass p-8 glow-green">
            <div className="w-20 h-20 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Inscription réussie !</h1>
            <p className="text-[var(--text-muted)] mb-6">
              Un email de vérification a été envoyé à <strong>{formData.email}</strong>. 
              Veuillez vérifier votre boîte de réception pour activer votre compte.
            </p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2">
              Se connecter
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="futuristic-bg grid-pattern min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <Shield className="w-7 h-7 text-black" />
            </div>
            <span className="font-bold text-2xl logo-text">PROJETS SN</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Créer un compte</h1>
          <p className="text-[var(--text-muted)]">Rejoignez la plateforme de financement citoyens</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-[var(--primary)] text-black' : 'bg-[var(--surface)] border border-[var(--border)]'}`}>
              1
            </div>
            <span className="hidden sm:inline text-sm">Identifiants</span>
          </div>
          <div className="w-12 h-0.5 bg-[var(--border)]"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-[var(--primary)] text-black' : 'bg-[var(--surface)] border border-[var(--border)]'}`}>
              2
            </div>
            <span className="hidden sm:inline text-sm">Informations</span>
          </div>
        </div>

        <div className="card-glass p-8 glow-cyan">
          {error && (
            <div className="flex items-center gap-3 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
              <p className="text-[var(--error)] text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="form-label">Type de compte</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'citizen' })}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.role === 'citizen' ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:border-[var(--primary)]/50'}`}
                    >
                      <User className={`w-6 h-6 mx-auto mb-2 ${formData.role === 'citizen' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                      <p className="font-medium">Citoyen</p>
                      <p className="text-xs text-[var(--text-muted)]">Déposer des projets</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'official' })}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.role === 'official' ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:border-[var(--primary)]/50'}`}
                    >
                      <Building2 className={`w-6 h-6 mx-auto mb-2 ${formData.role === 'official' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                      <p className="font-medium">Fonctionnaire</p>
                      <p className="text-xs text-[var(--text-muted)]">Valider les projets</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Adresse email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      name="email"
                      className="input-field pl-11"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      data-testid="register-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="input-field pl-11 pr-11"
                      placeholder="Minimum 8 caractères"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      data-testid="register-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className="input-field pl-11"
                      placeholder="Confirmez votre mot de passe"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Prénom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        name="first_name"
                        className="input-field pl-11"
                        placeholder="Prénom"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        data-testid="register-firstname"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      name="last_name"
                      className="input-field"
                      placeholder="Nom"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      data-testid="register-lastname"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type="tel"
                      name="phone"
                      className="input-field pl-11"
                      placeholder="+221 XX XXX XX XX"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      data-testid="register-phone"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Adresse</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      name="address"
                      className="input-field pl-11"
                      placeholder="Votre adresse"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Ville</label>
                    <input
                      type="text"
                      name="city"
                      className="input-field"
                      placeholder="Ville"
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

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    data-testid="register-submit"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <>
                        S'inscrire
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--text-muted)]">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-[var(--primary)] hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
