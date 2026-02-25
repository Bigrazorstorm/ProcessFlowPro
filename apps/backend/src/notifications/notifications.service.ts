import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateNotificationDto,
  NotificationType,
  UpdateNotificationPreferencesDto,
  NotificationPreferencesDto,
} from './dto/notification.dto';
import { EventsGateway } from '../websockets/events.gateway';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedItemId?: string;
  relatedItemType?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export interface NotificationPreference {
  userId: string;
  emailOnStepAssigned: boolean;
  emailOnApprovalRequested: boolean;
  emailOnDeadlineApproaching: boolean;
  emailOnDeadlineOverdue: boolean;
  emailOnWorkflowCompleted: boolean;
  pushNotificationsEnabled: boolean;
  digestFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

@Injectable()
export class NotificationsService {
  // In-memory storage for demo (would use database in production)
  private notifications: Map<string, Notification[]> = new Map();
  private preferences: Map<string, NotificationPreference> = new Map();

  constructor(@Optional() private readonly eventsGateway?: EventsGateway) {}

  /**
   * Create a notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      relatedItemId: dto.relatedItemId,
      relatedItemType: dto.relatedItemType,
      isRead: false,
      actionUrl: dto.actionUrl,
      createdAt: new Date(),
    };

    if (!this.notifications.has(dto.userId)) {
      this.notifications.set(dto.userId, []);
    }

    this.notifications.get(dto.userId)!.push(notification);

    // Emit real-time WebSocket event
    this.eventsGateway?.emitNotification(dto.userId, {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedItemId: notification.relatedItemId,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  /**
   * Get user notifications (unread first)
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications
      .sort((a, b) => {
        if (a.isRead === b.isRead) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return a.isRead ? 1 : -1;
      })
      .slice(0, limit);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter((n) => !n.isRead).length;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find((n) => n.id === notificationId);

    if (notification) {
      notification.isRead = true;
    }

    return notification || null;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const userNotifications = this.notifications.get(userId) || [];
    let count = 0;

    for (const notification of userNotifications) {
      if (!notification.isRead) {
        notification.isRead = true;
        count++;
      }
    }

    return count;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const userNotifications = this.notifications.get(userId) || [];
    const index = userNotifications.findIndex((n) => n.id === notificationId);

    if (index !== -1) {
      userNotifications.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferencesDto> {
    const prefs = this.preferences.get(userId) || {
      userId,
      emailOnStepAssigned: true,
      emailOnApprovalRequested: true,
      emailOnDeadlineApproaching: true,
      emailOnDeadlineOverdue: true,
      emailOnWorkflowCompleted: true,
      pushNotificationsEnabled: true,
      digestFrequency: 'immediate' as const,
    };

    return prefs;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, dto: UpdateNotificationPreferencesDto): Promise<NotificationPreferencesDto> {
    const prefs = this.preferences.get(userId) || {
      userId,
      emailOnStepAssigned: true,
      emailOnApprovalRequested: true,
      emailOnDeadlineApproaching: true,
      emailOnDeadlineOverdue: true,
      emailOnWorkflowCompleted: true,
      pushNotificationsEnabled: true,
      digestFrequency: 'immediate' as const,
    };

    if (dto.emailOnStepAssigned !== undefined) prefs.emailOnStepAssigned = dto.emailOnStepAssigned;
    if (dto.emailOnApprovalRequested !== undefined) prefs.emailOnApprovalRequested = dto.emailOnApprovalRequested;
    if (dto.emailOnDeadlineApproaching !== undefined) prefs.emailOnDeadlineApproaching = dto.emailOnDeadlineApproaching;
    if (dto.emailOnDeadlineOverdue !== undefined) prefs.emailOnDeadlineOverdue = dto.emailOnDeadlineOverdue;
    if (dto.emailOnWorkflowCompleted !== undefined) prefs.emailOnWorkflowCompleted = dto.emailOnWorkflowCompleted;
    if (dto.pushNotificationsEnabled !== undefined) prefs.pushNotificationsEnabled = dto.pushNotificationsEnabled;
    if (dto.digestFrequency !== undefined) prefs.digestFrequency = dto.digestFrequency;

    this.preferences.set(userId, prefs);
    return prefs;
  }

  /**
   * Send notification to user (trigger based on preferences)
   */
  async sendNotificationIfEnabled(
    userId: string,
    notificationType: NotificationType,
    title: string,
    message: string,
    relatedItemId?: string,
  ): Promise<Notification | null> {
    const prefs = await this.getPreferences(userId);

    // Check if this notification type is enabled
    const typeEnabledMap: Record<NotificationType, boolean> = {
      [NotificationType.STEP_ASSIGNED]: prefs.emailOnStepAssigned,
      [NotificationType.APPROVAL_REQUESTED]: prefs.emailOnApprovalRequested,
      [NotificationType.DEADLINE_APPROACHING]: prefs.emailOnDeadlineApproaching,
      [NotificationType.DEADLINE_OVERDUE]: prefs.emailOnDeadlineOverdue,
      [NotificationType.WORKFLOW_COMPLETED]: prefs.emailOnWorkflowCompleted,
      [NotificationType.STEP_BLOCKED]: prefs.emailOnApprovalRequested,
      [NotificationType.APPROVAL_REJECTED]: prefs.emailOnApprovalRequested,
      [NotificationType.COMMENT_MENTIONED]: true,
      [NotificationType.WORKFLOW_STARTED]: false,
    };

    if (!typeEnabledMap[notificationType]) {
      return null;
    }

    return this.createNotification({
      userId,
      type: notificationType,
      title,
      message,
      relatedItemId,
    });
  }

  /**
   * Clear old notifications (older than 30 days)
   */
  async clearOldNotifications(userId: string): Promise<number> {
    const userNotifications = this.notifications.get(userId) || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const beforeCount = userNotifications.length;
    const filtered = userNotifications.filter((n) => n.createdAt > thirtyDaysAgo);

    if (filtered.length !== beforeCount) {
      this.notifications.set(userId, filtered);
    }

    return beforeCount - filtered.length;
  }
}
