import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Bell,
  User,
  Users,
  BarChart3,
  Settings,
  LogOut,
  FileCheck,
  Shield,
  Sun,
  Moon
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout, isAdmin, isOfficial } = useAuth();
  const { unreadCount } = useNotifications();
  const { isDark, toggleTheme } = useTheme();

  const isActive = (path) => location.pathname === path;

  const citizenLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/projects', icon: FolderKanban, label: 'Mes Projets' },
    { path: '/projects/new', icon: PlusCircle, label: 'Nouveau Projet' },
  ];

  const officialLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/projects', icon: FolderKanban, label: 'Projets à traiter' },
    { path: '/validated', icon: FileCheck, label: 'Projets validés' },
  ];

  const adminLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/projects', icon: FolderKanban, label: 'Tous les Projets' },
    { path: '/users', icon: Users, label: 'Utilisateurs' },
    { path: '/stats', icon: BarChart3, label: 'Statistiques' },
  ];

  const getNavLinks = () => {
    if (isAdmin) return adminLinks;
    if (isOfficial) return officialLinks;
    return citizenLinks;
  };

  const getRoleBadge = () => {
    if (isAdmin) return { label: 'Admin', class: 'role-admin' };
    if (isOfficial) return { label: 'Fonctionnaire', class: 'role-official' };
    return { label: 'Citoyen', class: 'role-citizen' };
  };

  const role = getRoleBadge();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border)]">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-lg logo-text">PROJETS SN</h1>
              <p className="text-xs text-[var(--text-muted)]">Financement Citoyens</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-black font-bold">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.first_name} {user?.last_name}</p>
              <span className={`badge ${role.class} text-xs mt-1`}>{role.label}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 mb-2">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Navigation</p>
          </div>
          {getNavLinks().map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`sidebar-nav-item ${isActive(link.path) ? 'active' : ''}`}
              onClick={onClose}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          ))}

          <div className="px-4 mt-6 mb-2">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Compte</p>
          </div>
          <Link
            to="/notifications"
            className={`sidebar-nav-item ${isActive('/notifications') ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--error)] rounded-full text-[10px] flex items-center justify-center text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span>Notifications</span>
          </Link>
          <Link
            to="/profile"
            className={`sidebar-nav-item ${isActive('/profile') ? 'active' : ''}`}
            onClick={onClose}
          >
            <User className="w-5 h-5" />
            <span>Mon Profil</span>
          </Link>
          {isAdmin && (
            <Link
              to="/settings"
              className={`sidebar-nav-item ${isActive('/settings') ? 'active' : ''}`}
              onClick={onClose}
            >
              <Settings className="w-5 h-5" />
              <span>Paramètres</span>
            </Link>
          )}

          {/* Theme Toggle in Sidebar */}
          <div className="px-4 mt-6 mb-2">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Apparence</p>
          </div>
          <button
            onClick={toggleTheme}
            className="sidebar-nav-item w-full text-left"
            data-testid="theme-toggle-sidebar-btn"
          >
            {isDark ? (
              <>
                <Sun className="w-5 h-5" />
                <span>Thème clair</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span>Thème sombre</span>
              </>
            )}
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={logout}
            className="sidebar-nav-item w-full text-[var(--error)] hover:bg-red-500/10"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
