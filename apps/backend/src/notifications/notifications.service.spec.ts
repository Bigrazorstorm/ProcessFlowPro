import { NotificationsService } from './notifications.service';
import { NotificationType } from './dto/notification.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const userId = 'user-1';

  beforeEach(() => {
    service = new NotificationsService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create and store a notification', async () => {
      const notification = await service.createNotification({
        userId,
        type: NotificationType.STEP_ASSIGNED,
        title: 'New Step',
        message: 'A step has been assigned to you',
      });

      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe(userId);
      expect(notification.type).toBe(NotificationType.STEP_ASSIGNED);
      expect(notification.title).toBe('New Step');
      expect(notification.isRead).toBe(false);
      expect(notification.createdAt).toBeInstanceOf(Date);
    });

    it('should store optional fields', async () => {
      const notification = await service.createNotification({
        userId,
        type: NotificationType.DEADLINE_APPROACHING,
        title: 'Deadline soon',
        message: 'Deadline in 2 days',
        relatedItemId: 'step-1',
        actionUrl: '/instances/1',
      });

      expect(notification.relatedItemId).toBe('step-1');
      expect(notification.actionUrl).toBe('/instances/1');
    });
  });

  describe('getUserNotifications', () => {
    it('should return empty array for user with no notifications', async () => {
      const result = await service.getUserNotifications('no-such-user');
      expect(result).toEqual([]);
    });

    it('should return notifications ordered unread first', async () => {
      await service.createNotification({ userId, type: NotificationType.STEP_ASSIGNED, title: 'A', message: 'a' });
      await service.createNotification({ userId, type: NotificationType.WORKFLOW_COMPLETED, title: 'B', message: 'b' });

      const all = await service.getUserNotifications(userId);
      await service.markAsRead(all[0].id, userId);

      const ordered = await service.getUserNotifications(userId);
      expect(ordered[0].isRead).toBe(false);
      expect(ordered[1].isRead).toBe(true);
    });

    it('should respect the limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await service.createNotification({
          userId,
          type: NotificationType.COMMENT_MENTIONED,
          title: `N${i}`,
          message: 'm',
        });
      }
      const result = await service.getUserNotifications(userId, 3);
      expect(result.length).toBe(3);
    });
  });

  describe('getUnreadCount', () => {
    it('should return 0 when there are no notifications', async () => {
      expect(await service.getUnreadCount(userId)).toBe(0);
    });

    it('should count only unread notifications', async () => {
      await service.createNotification({ userId, type: NotificationType.STEP_ASSIGNED, title: 'T1', message: 'm' });
      await service.createNotification({ userId, type: NotificationType.STEP_ASSIGNED, title: 'T2', message: 'm' });

      expect(await service.getUnreadCount(userId)).toBe(2);

      const all = await service.getUserNotifications(userId);
      await service.markAsRead(all[0].id, userId);

      expect(await service.getUnreadCount(userId)).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const n = await service.createNotification({
        userId,
        type: NotificationType.STEP_ASSIGNED,
        title: 'T',
        message: 'm',
      });
      const updated = await service.markAsRead(n.id, userId);

      expect(updated).not.toBeNull();
      expect(updated!.isRead).toBe(true);
    });

    it('should return null for unknown notification id', async () => {
      const result = await service.markAsRead('nonexistent', userId);
      expect(result).toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      await service.createNotification({ userId, type: NotificationType.STEP_ASSIGNED, title: 'T1', message: 'm' });
      await service.createNotification({ userId, type: NotificationType.STEP_ASSIGNED, title: 'T2', message: 'm' });

      const count = await service.markAllAsRead(userId);
      expect(count).toBe(2);
      expect(await service.getUnreadCount(userId)).toBe(0);
    });

    it('should return 0 when there are no unread notifications', async () => {
      const count = await service.markAllAsRead('empty-user');
      expect(count).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete an existing notification', async () => {
      const n = await service.createNotification({
        userId,
        type: NotificationType.STEP_ASSIGNED,
        title: 'T',
        message: 'm',
      });
      const deleted = await service.deleteNotification(n.id, userId);
      expect(deleted).toBe(true);

      const all = await service.getUserNotifications(userId);
      expect(all.find((x) => x.id === n.id)).toBeUndefined();
    });

    it('should return false for nonexistent notification', async () => {
      const result = await service.deleteNotification('nope', userId);
      expect(result).toBe(false);
    });
  });

  describe('getPreferences', () => {
    it('should return default preferences for new user', async () => {
      const prefs = await service.getPreferences(userId);
      expect(prefs.emailOnStepAssigned).toBe(true);
      expect(prefs.emailOnDeadlineApproaching).toBe(true);
      expect(prefs.digestFrequency).toBe('immediate');
    });
  });

  describe('updatePreferences', () => {
    it('should update only provided fields', async () => {
      await service.updatePreferences(userId, { emailOnStepAssigned: false, digestFrequency: 'daily' });
      const prefs = await service.getPreferences(userId);
      expect(prefs.emailOnStepAssigned).toBe(false);
      expect(prefs.digestFrequency).toBe('daily');
      expect(prefs.emailOnDeadlineApproaching).toBe(true); // unchanged
    });
  });

  describe('sendNotificationIfEnabled', () => {
    it('should create notification when type is enabled', async () => {
      const result = await service.sendNotificationIfEnabled(
        userId,
        NotificationType.STEP_ASSIGNED,
        'Assigned',
        'You have been assigned a step',
      );
      expect(result).not.toBeNull();
      expect(result!.type).toBe(NotificationType.STEP_ASSIGNED);
    });

    it('should not create notification when type is disabled', async () => {
      await service.updatePreferences(userId, { emailOnStepAssigned: false });
      const result = await service.sendNotificationIfEnabled(
        userId,
        NotificationType.STEP_ASSIGNED,
        'Assigned',
        'Step assigned',
      );
      expect(result).toBeNull();
    });

    it('should not create notification for WORKFLOW_STARTED (always off)', async () => {
      const result = await service.sendNotificationIfEnabled(
        userId,
        NotificationType.WORKFLOW_STARTED,
        'Started',
        'Workflow started',
      );
      expect(result).toBeNull();
    });
  });

  describe('clearOldNotifications', () => {
    it('should return 0 when there are no notifications', async () => {
      const count = await service.clearOldNotifications('empty-user');
      expect(count).toBe(0);
    });

    it('should keep recent notifications', async () => {
      await service.createNotification({ userId, type: NotificationType.STEP_ASSIGNED, title: 'T', message: 'm' });
      const count = await service.clearOldNotifications(userId);
      expect(count).toBe(0);
      expect((await service.getUserNotifications(userId)).length).toBe(1);
    });
  });
});
