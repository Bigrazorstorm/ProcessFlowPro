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

export class NotificationDto {
  id!: string;
  userId!: string;
  type!: NotificationType;
  title!: string;
  message!: string;
  relatedItemId?: string;
  relatedItemType?: 'workflow_instance' | 'workflow_step' | 'client';
  isRead!: boolean;
  actionUrl?: string;
  createdAt!: Date;
}

export class CreateNotificationDto {
  userId!: string;
  type!: NotificationType;
  title!: string;
  message!: string;
  relatedItemId?: string;
  relatedItemType?: 'workflow_instance' | 'workflow_step' | 'client';
  actionUrl?: string;
}

export class NotificationPreferencesDto {
  userId!: string;
  emailOnStepAssigned!: boolean;
  emailOnApprovalRequested!: boolean;
  emailOnDeadlineApproaching!: boolean;
  emailOnDeadlineOverdue!: boolean;
  emailOnWorkflowCompleted!: boolean;
  pushNotificationsEnabled!: boolean;
  digestFrequency!: 'immediate' | 'daily' | 'weekly' | 'never';
}

export class UpdateNotificationPreferencesDto {
  emailOnStepAssigned?: boolean;
  emailOnApprovalRequested?: boolean;
  emailOnDeadlineApproaching?: boolean;
  emailOnDeadlineOverdue?: boolean;
  emailOnWorkflowCompleted?: boolean;
  pushNotificationsEnabled?: boolean;
  digestFrequency?: 'immediate' | 'daily' | 'weekly' | 'never';
}
