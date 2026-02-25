import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useWebSocket } from './useWebSocket';
import { useAuth } from '../contexts/AuthContext';

export enum NotificationType {
  STEP_ASSIGNED = 'STEP_ASSIGNED',
  STEP_BLOCKED = 'STEP_BLOCKED',
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  WORKFLOW_COMPLETED = 'WORKFLOW_COMPLETED',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  DEADLINE_OVERDUE = 'DEADLINE_OVERDUE',
  COMMENT_MENTIONED = 'COMMENT_MENTIONED',
  WORKFLOW_STARTED = 'WORKFLOW_STARTED',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedItemId?: string;
  relatedItemType?: 'workflow_instance' | 'workflow_step' | 'client';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  emailOnStepAssigned: boolean;
  emailOnApprovalRequested: boolean;
  emailOnDeadlineApproaching: boolean;
  emailOnDeadlineOverdue: boolean;
  emailOnWorkflowCompleted: boolean;
  pushNotificationsEnabled: boolean;
  digestFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Notification[]>('/notifications', {
        params: { limit },
      });
      setNotifications(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Laden der Benachrichtigungen');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await api.get<{ unreadCount: number }>('/notifications/unread/count');
      setUnreadCount(response.data.unreadCount);
    } catch (err: any) {
      console.error('Error loading unread count:', err);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const response = await api.get<NotificationPreferences>('/notifications/preferences');
      setPreferences(response.data);
    } catch (err: any) {
      console.error('Error loading preferences:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadPreferences();
    loadUnreadCount();
  }, [loadNotifications, loadPreferences, loadUnreadCount]);

  // Real-time WebSocket: reload notifications when a new one arrives
  useWebSocket(user?.id, () => {
    loadNotifications();
    loadUnreadCount();
  });

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(
        notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      await loadUnreadCount();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Markieren als gelesen');
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Markieren aller als gelesen');
    }
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      await loadUnreadCount();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Löschen der Benachrichtigung');
    }
  };

  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>): Promise<void> => {
    try {
      const response = await api.patch<NotificationPreferences>('/notifications/preferences', newPrefs);
      setPreferences(response.data);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Aktualisieren der Einstellungen');
    }
  };

  const clearOld = async (): Promise<number> => {
    try {
      const response = await api.post<{ clearedCount: number }>('/notifications/clear-old');
      await loadNotifications();
      return response.data.clearedCount;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Fehler beim Löschen alter Benachrichtigungen');
    }
  };

  const reload = () => {
    loadNotifications();
    loadUnreadCount();
  };

  return {
    notifications,
    preferences,
    unreadCount,
    loading,
    error,
    reload,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    clearOld,
  };
}
