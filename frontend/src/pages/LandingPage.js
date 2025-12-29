import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Rocket, 
  Users, 
  BarChart3, 
  FileCheck,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe,
  Award
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: FileCheck,
      title: 'Dépôt de Projets Simplifié',
      description: 'Soumettez vos projets en quelques étapes avec un accompagnement guidé'
    },
    {
      icon: Zap,
      title: 'Traitement Rapide',
      description: 'Suivi en temps réel et notifications automatiques à chaque étape'
    },
    {
      icon: Shield,
      title: 'Sécurisé & Transparent',
      description: 'Vos données sont protégées et le processus est entièrement traçable'
    },
    {
      icon: BarChart3,
      title: 'Tableau de Bord Complet',
      description: 'Visualisez l\'état de vos demandes et les statistiques de financement'
    }
  ];

  const steps = [
    { number: '01', title: 'Créez votre compte', description: 'Inscription rapide avec vérification par email' },
    { number: '02', title: 'Complétez votre profil', description: 'Ajoutez vos informations personnelles et pièces d\'identité' },
    { number: '03', title: 'Soumettez votre projet', description: 'Décrivez votre projet et le financement souhaité' },
    { number: '04', title: 'Suivez l\'avancement', description: 'Recevez des mises à jour en temps réel' }
  ];

  const stats = [
    { value: '5000+', label: 'Projets financés' },
    { value: '2.5 Mrd', label: 'FCFA distribués' },
    { value: '14', label: 'Régions couvertes' },
    { value: '98%', label: 'Satisfaction' }
  ];

  return (
    <div className="futuristic-bg grid-pattern min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <span className="font-bold text-xl logo-text">PROJETS SN</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="btn-ghost" data-testid="login-nav-btn">
              Connexion
            </Link>
            <Link to="/register" className="btn-primary" data-testid="register-nav-btn">
              S'inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in">
              <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-full px-4 py-2 mb-6">
                <Globe className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm text-[var(--primary)]">Plateforme Officielle du Sénégal</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Financez vos
                <span className="block logo-text">Projets Citoyens</span>
              </h1>
              <p className="text-xl text-[var(--text-muted)] mb-8 leading-relaxed">
                La plateforme numérique de financement des projets citoyens au Sénégal. 
                Déposez, suivez et concrétisez vos idées pour le développement local.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-lg" data-testid="get-started-btn">
                  Commencer maintenant
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="btn-secondary inline-flex items-center gap-2 text-lg">
                  J'ai déjà un compte
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--secondary)]/20 rounded-3xl blur-3xl"></div>
              <div className="relative card-glass p-8 glow-cyan animate-float">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[var(--success)]/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="font-semibold">Projet Approuvé !</p>
                    <p className="text-sm text-[var(--text-muted)]">Ferme Agricole Moderne</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Financement accordé</span>
                    <span className="text-[var(--success)] font-semibold">15 000 000 FCFA</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: '100%' }}></div>
                  </div>
                  <div className="flex gap-2">
                    <span className="badge badge-approved">Agriculture</span>
                    <span className="badge badge-validated">Dakar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card text-center hover-lift">
                <p className="text-3xl lg:text-4xl font-bold logo-text mb-2">{stat.value}</p>
                <p className="text-[var(--text-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Pourquoi choisir notre plateforme ?</h2>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
              Une solution complète pour accompagner les citoyens sénégalais dans leurs projets de développement
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card hover-lift">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-[var(--text-muted)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 bg-[var(--surface)]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-[var(--text-muted)] text-lg">4 étapes simples pour obtenir votre financement</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-[var(--primary)]/10 mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-[var(--text-muted)]">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full">
                    <div className="border-t-2 border-dashed border-[var(--border)] w-3/4"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-glass p-12 glow-purple">
            <Award className="w-16 h-16 text-[var(--primary)] mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Prêt à concrétiser votre projet ?</h2>
            <p className="text-[var(--text-muted)] text-lg mb-8">
              Rejoignez des milliers de citoyens sénégalais qui ont déjà bénéficié de notre programme de financement.
            </p>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
              <Rocket className="w-5 h-5" />
              Créer mon compte gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <span className="font-bold text-xl">PROJETS SN</span>
            </div>
            <p className="text-[var(--text-muted)] text-sm">
              © 2024 Plateforme de Financement des Projets Citoyens - République du Sénégal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
