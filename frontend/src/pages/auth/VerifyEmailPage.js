import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Shield, CheckCircle2, XCircle, Loader2, Sun, Moon } from 'lucide-react';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      handleVerify();
    } else {
      setLoading(false);
      setError('Token de vérification manquant');
    }
  }, [token]);

  const handleVerify = async () => {
    try {
      await verifyEmail(token);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="futuristic-bg grid-pattern min-h-screen flex items-center justify-center p-6 relative">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="theme-toggle fixed top-6 right-6 z-50"
        data-testid="theme-toggle-verify-btn"
        aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
            <Shield className="w-7 h-7 text-black" />
          </div>
          <span className="font-bold text-2xl logo-text">PROJETS SN</span>
        </Link>

        <div className={`card-glass p-8 ${success ? 'glow-green' : error ? '' : 'glow-cyan'}`}>
          {loading ? (
            <>
              <Loader2 className="w-16 h-16 text-[var(--primary)] mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Vérification en cours...</h1>
              <p className="text-[var(--text-muted)]">Veuillez patienter</p>
            </>
          ) : success ? (
            <>
              <div className="w-20 h-20 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Email vérifié !</h1>
              <p className="text-[var(--text-muted)] mb-6">
                Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                Se connecter
              </Link>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-[var(--error)]/20 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-[var(--error)]" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Erreur de vérification</h1>
              <p className="text-[var(--text-muted)] mb-6">{error}</p>
              <Link to="/login" className="btn-secondary inline-flex items-center gap-2">
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
