export class DashboardMetricsDto {
  totalClients!: number;
  activeWorkflows!: number;
  completedToday!: number;
  overdueSteps!: number;
  pendingApprovals!: number;
  teamUtilization!: number; // percentage
}

export class UserWorkloadDto {
  userId!: string;
  userName!: string;
  assignedSteps!: number;
  completedSteps!: number;
  inProgressSteps!: number;
  overdueSteps!: number;
  utilizationPercent!: number;
}

export class ClientProgressDto {
  clientId!: string;
  clientName!: string;
  totalInstances!: number;
  activeInstances!: number;
  completedInstances!: number;
  averageCompletePercent!: number;
}

export class WorkflowMetricsDto {
  templateId!: string;
  templateName!: string;
  totalInstancesCreated!: number;
  averageCompletionTime!: number; // in days
  successRate!: number; // percentage
  averageStepsCompleted!: number;
}

export class TenantDashboardDto {
  metrics!: DashboardMetricsDto;
  userWorkload!: UserWorkloadDto[];
  clientProgress!: ClientProgressDto[];
  workflowMetrics!: WorkflowMetricsDto[];
  recentActivity!: TenantActivityDto[];
}

export class TenantActivityDto {
  id!: string;
  type!: 'workflow_created' | 'step_completed' | 'step_blocked' | 'approval_requested' | 'workflow_completed';
  description!: string;
  relatedItemId!: string;
  createdAt!: Date;
  userId?: string;
}
