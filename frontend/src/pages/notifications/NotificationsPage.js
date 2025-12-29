import React from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  XCircle,
  FileQuestion,
  MessageSquare,
  Mail,
  Shield,
  Check
} from 'lucide-react';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type) => {
    const icons = {
      project_submitted: Bell,
      project_validated: CheckCircle2,
      project_approved: CheckCircle2,
      project_rejected: XCircle,
      documents_requested: FileQuestion,
      new_comment: MessageSquare,
      account_verified: Shield,
      password_reset: Mail
    };
    return icons[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colors = {
      project_submitted: 'var(--primary)',
      project_validated: 'var(--secondary)',
      project_approved: 'var(--success)',
      project_rejected: 'var(--error)',
      documents_requested: 'var(--info)',
      new_comment: 'var(--primary)',
      account_verified: 'var(--success)',
      password_reset: 'var(--warning)'
    };
    return colors[type] || 'var(--primary)';
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.data?.project_id) {
      navigate(`/projects/${notification.data.project_id}`);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[var(--text-muted)]">
              {unreadNotifications.length > 0 
                ? `${unreadNotifications.length} notification(s) non lue(s)` 
                : 'Toutes vos notifications sont lues'}
            </p>
          </div>
          {unreadNotifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[var(--primary)] hover:underline flex items-center gap-2 text-sm"
            >
              <Check className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-16">
            <Bell className="w-20 h-20 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Aucune notification</h3>
            <p className="text-[var(--text-muted)]">Vous n'avez pas encore reçu de notification</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unread */}
            {unreadNotifications.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Non lues</h3>
                <div className="space-y-2">
                  {unreadNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const color = getNotificationColor(notification.type);
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="card cursor-pointer border-l-4 hover:bg-[var(--surface-light)] transition-colors"
                        style={{ borderLeftColor: color }}
                      >
                        <div className="flex gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}20` }}
                          >
                            <Icon className="w-6 h-6" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold mb-1">{notification.title}</p>
                            <p className="text-[var(--text-muted)] text-sm line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                              {new Date(notification.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Read */}
            {readNotifications.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Lues</h3>
                <div className="space-y-2">
                  {readNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="card cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--surface-light)] flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-[var(--text-muted)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium mb-1">{notification.title}</p>
                            <p className="text-[var(--text-muted)] text-sm line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                              {new Date(notification.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
