import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-[var(--surface)] rounded-lg transition-colors"
          data-testid="menu-toggle-btn"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-[var(--text-muted)] text-sm">Bienvenue, {user?.first_name}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-[var(--surface)] rounded-lg px-4 py-2 border border-[var(--border)] transition-colors">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent border-none outline-none text-sm w-48"
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          data-testid="theme-toggle-header-btn"
          aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
        >
          {isDark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <Link
          to="/notifications"
          className={`p-2 hover:bg-[var(--surface)] rounded-lg relative notification-bell transition-colors ${unreadCount > 0 ? 'has-new' : ''}`}
          data-testid="notifications-btn"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-[var(--error)] rounded-full text-[10px] flex items-center justify-center font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <Link to="/profile" className="flex items-center gap-3" data-testid="profile-btn">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-black font-bold text-sm">
            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
