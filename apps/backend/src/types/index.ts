// Shared Type Definitions
// TODO: After shared-types package is built, import from '@processflowpro/shared-types' instead

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  SENIOR = 'SENIOR',
  ACCOUNTANT = 'ACCOUNTANT',
  TRAINEE = 'TRAINEE',
}

export enum WorkflowInstanceStatus {
  ACTIVE = 'ACTIVE',
  DELAYED = 'DELAYED',
  CRITICAL = 'CRITICAL',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum WorkflowStepStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  DONE = 'DONE',
  SHIFTED = 'SHIFTED',
  SKIPPED = 'SKIPPED',
  REJECTED = 'REJECTED',
}

export enum WorkflowStepType {
  START = 'START',
  END = 'END',
  TASK = 'TASK',
  DECISION = 'DECISION',
  PARALLEL_GATEWAY = 'PARALLEL_GATEWAY',
  SYNC_GATEWAY = 'SYNC_GATEWAY',
  EVENT = 'EVENT',
  SUBPROCESS = 'SUBPROCESS',
  FORM_INPUT = 'FORM_INPUT',
  NOTIFICATION = 'NOTIFICATION',
  APPROVAL = 'APPROVAL',
}

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}

export interface DeadlineRule {
  type: string;
  value?: any;
}

export interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
}
