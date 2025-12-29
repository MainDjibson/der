import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Shield, Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft, Sun, Moon } from 'lucide-react';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="futuristic-bg grid-pattern min-h-screen flex items-center justify-center p-6 relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle fixed top-6 right-6 z-50"
          data-testid="theme-toggle-forgot-success-btn"
          aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-md text-center">
          <div className="card-glass p-8 glow-green">
            <div className="w-20 h-20 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Email envoyé !</h1>
            <p className="text-[var(--text-muted)] mb-6">
              Si un compte existe avec l'adresse <strong>{email}</strong>, 
              vous recevrez un lien de réinitialisation.
            </p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2">
              Retour à la connexion
            </Link>
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
        data-testid="theme-toggle-forgot-btn"
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
          <h1 className="text-3xl font-bold mb-2">Mot de passe oublié ?</h1>
          <p className="text-[var(--text-muted)]">Entrez votre email pour recevoir un lien de réinitialisation</p>
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
              <label className="form-label">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="email"
                  className="input-field pl-11"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  Envoyer le lien
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
