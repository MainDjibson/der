import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Shield, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Sun, Moon } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="futuristic-bg grid-pattern min-h-screen flex items-center justify-center p-6 relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle fixed top-6 right-6 z-50"
          data-testid="theme-toggle-reset-invalid-btn"
          aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-md text-center">
          <div className="card-glass p-8">
            <AlertCircle className="w-16 h-16 text-[var(--error)] mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Lien invalide</h1>
            <p className="text-[var(--text-muted)] mb-6">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Link to="/forgot-password" className="btn-primary inline-flex items-center gap-2">
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="futuristic-bg grid-pattern min-h-screen flex items-center justify-center p-6 relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle fixed top-6 right-6 z-50"
          data-testid="theme-toggle-reset-success-btn"
          aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-md text-center">
          <div className="card-glass p-8 glow-green">
            <div className="w-20 h-20 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Mot de passe modifié !</h1>
            <p className="text-[var(--text-muted)] mb-6">
              Votre mot de passe a été réinitialisé avec succès. Redirection vers la connexion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="futuristic-bg grid-pattern min-h-screen flex items-center justify-center p-6 relative">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="theme-toggle fixed top-6 right-6 z-50"
        data-testid="theme-toggle-reset-btn"
        aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <Shield className="w-7 h-7 text-black" />
            </div>
            <span className="font-bold text-2xl logo-text">PROJETS SN</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Nouveau mot de passe</h1>
          <p className="text-[var(--text-muted)]">Choisissez un nouveau mot de passe sécurisé</p>
        </div>

        <div className="card-glass p-8 glow-cyan">
          {error && (
            <div className="flex items-center gap-3 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-[var(--error)]" />
              <p className="text-[var(--error)] text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-11 pr-11"
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                  className="input-field pl-11"
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  Réinitialiser
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
