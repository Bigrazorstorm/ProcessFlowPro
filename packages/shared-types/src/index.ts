// Enums - User Roles
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner',
  SENIOR = 'senior',
  ACCOUNTANT = 'accountant',
  TRAINEE = 'trainee',
}

// Enums - Workflow Status
export enum WorkflowInstanceStatus {
  ACTIVE = 'active',
  DELAYED = 'delayed',
  CRITICAL = 'critical',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

// Enums - Step Status
export enum WorkflowStepStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_APPROVAL = 'pending_approval',
  DONE = 'done',
  SHIFTED = 'shifted',
  SKIPPED = 'skipped',
  REJECTED = 'rejected',
}

// Enums - Step Type
export enum WorkflowStepType {
  START = 'start',
  END = 'end',
  TASK = 'task',
  DECISION = 'decision',
  PARALLEL_GATEWAY = 'parallel_gateway',
  SYNC_GATEWAY = 'sync_gateway',
  EVENT = 'event',
  SUBPROCESS = 'subprocess',
  FORM_INPUT = 'form_input',
  NOTIFICATION = 'notification',
  APPROVAL = 'approval',
}

// Enums - Ticket Type
export enum TicketType {
  PROBLEM = 'problem',
  ADDITIONAL_TASK = 'additional_task',
  INQUIRY = 'inquiry',
  CORRECTION = 'correction',
  CARRYOVER = 'carryover',
  EMPLOYEE_EVENT = 'employee_event',
  EXPIRY_WARNING = 'expiry_warning',
}

// Enums - Ticket Status
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_EXTERNAL = 'waiting_external',
  DONE = 'done',
  SHIFTED = 'shifted',
  CANCELLED = 'cancelled',
}

// Enums - Ticket Priority
export enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Enums - Deadline Rule Type
export enum DeadlineRuleType {
  RELATIVE_WORKDAYS = 'relative_workdays',
  RELATIVE_CALENDAR_END = 'relative_calendar_end',
  FIXED_DAY_OF_MONTH = 'fixed_day_of_month',
  LEGAL = 'legal',
  DEPENDENT = 'dependent',
}

// Interfaces - User
export interface UserDto {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  capacityPointsLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces - Tenant
export interface TenantDto {
  id: string;
  name: string;
  plan: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces - Client
export interface ClientDto {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  taxNumber: string;
  companyNumber: string;
  industry: string;
  employeeCount: number;
  reliabilityFactor: number;
  primaryUserId: string;
  secondaryUserId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces - Workflow Template
export interface WorkflowTemplateDto {
  id: string;
  tenantId: string;
  name: string;
  industry: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces - Workflow Step Template
export interface TemplateStepDto {
  id: string;
  templateId: string;
  type: WorkflowStepType;
  name: string;
  order: number;
  description: string;
  checklist: ChecklistItem[];
  tips: string;
  errors: string[];
  deadlineRule: DeadlineRule;
  assignedRole: UserRole;
  estimationAllowed: boolean;
  blocksNext: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces - Checklist Item
export interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  completed?: boolean;
}

// Interfaces - Deadline Rule
export interface DeadlineRule {
  type: DeadlineRuleType;
  value?: number; // For relative rules (days/weeks)
  dayOfMonth?: number; // For fixed day rules
  dependsOnStepId?: string; // For dependent rules
  jurisdiction?: string; // For legal deadlines
}

// Interfaces - Workflow Instance
export interface WorkflowInstanceDto {
  id: string;
  clientId: string;
  templateId: string;
  periodYear: number;
  periodMonth: number;
  status: WorkflowInstanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces - Workflow Step
export interface WorkflowStepDto {
  id: string;
  instanceId: string;
  templateStepId: string;
  status: WorkflowStepStatus;
  assignedUserId: string;
  dueDate: Date;
  completedAt?: Date;
  isEstimation: boolean;
  estimationValue?: number;
  estimationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces - Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
