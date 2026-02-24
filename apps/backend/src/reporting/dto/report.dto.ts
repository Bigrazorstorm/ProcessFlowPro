import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';

export enum ReportType {
  WORKFLOW_SUMMARY = 'WORKFLOW_SUMMARY',
  CLIENT_PERFORMANCE = 'CLIENT_PERFORMANCE',
  USER_WORKLOAD = 'USER_WORKLOAD',
  TEMPLATE_ANALYTICS = 'TEMPLATE_ANALYTICS',
  DEADLINE_COMPLIANCE = 'DEADLINE_COMPLIANCE',
  FINANCIAL_SUMMARY = 'FINANCIAL_SUMMARY',
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
}

export enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export class DateRangeFilterDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

export class ReportFilterDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsOptional()
  dateRange?: DateRangeFilterDto;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class GenerateReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsOptional()
  dateRange?: DateRangeFilterDto;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class ExportReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @IsOptional()
  dateRange?: DateRangeFilterDto;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class ScheduleReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @IsEnum(ReportFrequency)
  frequency!: ReportFrequency;

  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class ReportMetricsDto {
  totalCount!: number;
  completedCount!: number;
  incompleteCount!: number;
  overdueCount!: number;
  completionRate!: number;
  averageCompletionDays!: number;
  averageUtilization!: number;
}

export class WorkflowSummaryReportDto {
  generatedAt!: Date;
  periodStart!: Date;
  periodEnd!: Date;
  metrics!: {
    totalInstances: number;
    activeInstances: number;
    completedInstances: number;
    overdueInstances: number;
    averageCompletionTime: number;
    successRate: number;
    totalSteps: number;
    completedSteps: number;
    pendingSteps: number;
  };
  topTemplates!: Array<{
    templateId: string;
    templateName: string;
    instanceCount: number;
    averageCompletionTime: number;
  }>;
  bottlenecks!: Array<{
    stepName: string;
    delayedCount: number;
    averageDelayDays: number;
  }>;
}

export class ClientPerformanceReportDto {
  generatedAt!: Date;
  periodStart!: Date;
  periodEnd!: Date;
  clientMetrics!: Array<{
    clientId: string;
    clientName: string;
    activeWorkflows: number;
    completedWorkflows: number;
    completionRate: number;
    averageCompletionTime: number;
    overdueWorkflows: number;
  }>;
  topPerformers!: Array<{
    clientId: string;
    clientName: string;
    completionRate: number;
  }>;
  needsAttention!: Array<{
    clientId: string;
    clientName: string;
    overdueCount: number;
    delayedSteps: number;
  }>;
}

export class UserWorkloadReportDto {
  generatedAt!: Date;
  periodStart!: Date;
  periodEnd!: Date;
  userMetrics!: Array<{
    userId: string;
    userName: string;
    role: string;
    assignedSteps: number;
    completedSteps: number;
    inProgressSteps: number;
    overdueSteps: number;
    utilizationPercent: number;
    averageCompletionTime: number;
  }>;
  teamMetrics!: {
    totalUsers: number;
    averageUtilization: number;
    highestUtilization: string;
    lowestUtilization: string;
  };
}

export class TemplateAnalyticsReportDto {
  generatedAt!: Date;
  periodStart!: Date;
  periodEnd!: Date;
  templates!: Array<{
    templateId: string;
    templateName: string;
    totalInstances: number;
    successRate: number;
    averageCompletionTime: number;
    successfulInstances: number;
    failedInstances: number;
    totalSteps: number;
    averageStepComplexity: number;
  }>;
  trends!: {
    mostUsedTemplate: string;
    fastestTemplate: string;
    slowestTemplate: string;
  };
}

export class DeadlineComplianceReportDto {
  generatedAt!: Date;
  periodStart!: Date;
  periodEnd!: Date;
  complianceMetrics!: {
    totalDeadlines: number;
    metDeadlines: number;
    missedDeadlines: number;
    complianceRate: number;
    averageLatenessHours: number;
  };
  byRuleType!: Array<{
    ruleType: string;
    totalDeadlines: number;
    complianceRate: number;
    missedCount: number;
  }>;
  criticalItems!: Array<{
    workflowId: string;
    stepName: string;
    deadline: Date;
    daysOverdue: number;
  }>;
}

export class FinancialSummaryReportDto {
  generatedAt!: Date;
  periodStart!: Date;
  periodEnd!: Date;
  summary!: {
    totalTransactions: number;
    completedTransactions: number;
    failedTransactions: number;
    successRate: number;
    averageProcessingTime: number;
  };
  byClient!: Array<{
    clientId: string;
    clientName: string;
    transactionCount: number;
    successfulTransactions: number;
    failedTransactions: number;
  }>;
  exceptions!: Array<{
    clientId: string;
    clientName: string;
    exceptionCount: number;
    status: string;
  }>;
}
