import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowInstance, WorkflowInstanceStatus } from '../database/entities/workflow-instance.entity';
import { WorkflowStep, WorkflowStepStatus } from '../database/entities/workflow-step.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';
import {
  ReportType,
  ExportFormat,
  ReportFrequency,
  GenerateReportDto,
  ExportReportDto,
  ScheduleReportDto,
  WorkflowSummaryReportDto,
  ClientPerformanceReportDto,
  UserWorkloadReportDto,
  TemplateAnalyticsReportDto,
  DeadlineComplianceReportDto,
  FinancialSummaryReportDto,
} from './dto/report.dto';

@Injectable()
export class ReportingService {
  private scheduledReports = new Map<string, any>();

  constructor(
    @InjectRepository(WorkflowInstance)
    private instancesRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private stepsRepository: Repository<WorkflowStep>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(WorkflowTemplate)
    private templatesRepository: Repository<WorkflowTemplate>,
  ) {}

  async generateReport(dto: GenerateReportDto, tenantId: string): Promise<any> {
    const dateRange = this.getDateRange(dto.dateRange);

    switch (dto.type) {
      case ReportType.WORKFLOW_SUMMARY:
        return this.generateWorkflowSummary(tenantId, dateRange, dto);
      case ReportType.CLIENT_PERFORMANCE:
        return this.generateClientPerformance(tenantId, dateRange, dto);
      case ReportType.USER_WORKLOAD:
        return this.generateUserWorkload(tenantId, dateRange, dto);
      case ReportType.TEMPLATE_ANALYTICS:
        return this.generateTemplateAnalytics(tenantId, dateRange, dto);
      case ReportType.DEADLINE_COMPLIANCE:
        return this.generateDeadlineCompliance(tenantId, dateRange, dto);
      case ReportType.FINANCIAL_SUMMARY:
        return this.generateFinancialSummary(tenantId, dateRange, dto);
      default:
        throw new BadRequestException(`Unknown report type: ${dto.type}`);
    }
  }

  async exportReport(
    dto: ExportReportDto,
    tenantId: string,
  ): Promise<{ data: string; filename: string; mimeType: string }> {
    const report = await this.generateReport(dto, tenantId);

    switch (dto.format) {
      case ExportFormat.JSON:
        return this.exportAsJson(report, dto.type);
      case ExportFormat.CSV:
        return this.exportAsCsv(report, dto.type);
      case ExportFormat.PDF:
        return this.exportAsPdf(report, dto.type);
      default:
        throw new BadRequestException(`Unknown export format: ${dto.format}`);
    }
  }

  async scheduleReport(
    dto: ScheduleReportDto,
    tenantId: string,
    userId: string,
  ): Promise<{ scheduleId: string; nextRun: Date }> {
    const scheduleId = `${tenantId}-${dto.type}-${Date.now()}`;
    const nextRun = this.getNextRunDate(dto.frequency);

    this.scheduledReports.set(scheduleId, {
      tenantId,
      userId,
      type: dto.type,
      format: dto.format,
      frequency: dto.frequency,
      recipientEmail: dto.recipientEmail,
      createdAt: new Date(),
      nextRun,
    });

    return { scheduleId, nextRun };
  }

  async getScheduledReports(tenantId: string): Promise<any[]> {
    const reports: any[] = [];
    this.scheduledReports.forEach((report, scheduleId) => {
      if (report.tenantId === tenantId) {
        reports.push({
          scheduleId,
          ...report,
        });
      }
    });
    return reports;
  }

  async deleteScheduledReport(scheduleId: string, tenantId: string): Promise<void> {
    const report = this.scheduledReports.get(scheduleId);
    if (!report || report.tenantId !== tenantId) {
      throw new BadRequestException('Scheduled report not found');
    }
    this.scheduledReports.delete(scheduleId);
  }

  private async generateWorkflowSummary(
    tenantId: string,
    dateRange: { startDate: Date; endDate: Date },
    dto: GenerateReportDto,
  ): Promise<WorkflowSummaryReportDto> {
    const query = this.instancesRepository
      .createQueryBuilder('instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('instance.createdAt >= :startDate', { startDate: dateRange.startDate })
      .andWhere('instance.createdAt <= :endDate', { endDate: dateRange.endDate });

    if (dto.clientId) {
      query.andWhere('instance.clientId = :clientId', { clientId: dto.clientId });
    }
    if (dto.templateId) {
      query.andWhere('instance.templateId = :templateId', { templateId: dto.templateId });
    }

    const instances = await query.getMany();
    const totalInstances = instances.length;
    const activies = instances.filter(
      (i) => i.status !== WorkflowInstanceStatus.COMPLETED && i.status !== WorkflowInstanceStatus.ARCHIVED,
    ).length;
    const completedInstances = instances.filter((i) => i.status === WorkflowInstanceStatus.COMPLETED).length;
    const overdueInstances = 0; // Can be calculated from steps overdue

    const steps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoin('step.instance', 'instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('instance.createdAt >= :startDate', { startDate: dateRange.startDate })
      .andWhere('instance.createdAt <= :endDate', { endDate: dateRange.endDate })
      .getMany();

    const completedSteps = steps.filter((s) => s.status === WorkflowStepStatus.DONE).length;
    const pendingSteps = steps.filter((s) => s.status !== WorkflowStepStatus.DONE).length;

    const templates = await this.templatesRepository.find({ where: { tenantId } });
    const topTemplates = templates
      .map((t) => ({
        templateId: t.id,
        templateName: t.name,
        instanceCount: instances.filter((i) => i.templateId === t.id).length,
        averageCompletionTime: 0,
      }))
      .sort((a, b) => b.instanceCount - a.instanceCount)
      .slice(0, 5);

    return {
      generatedAt: new Date(),
      periodStart: dateRange.startDate,
      periodEnd: dateRange.endDate,
      metrics: {
        totalInstances,
        activeInstances: activies,
        completedInstances,
        overdueInstances,
        averageCompletionTime: 0,
        successRate: totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0,
        totalSteps: steps.length,
        completedSteps,
        pendingSteps,
      },
      topTemplates,
      bottlenecks: [],
    };
  }

  private async generateClientPerformance(
    tenantId: string,
    dateRange: { startDate: Date; endDate: Date },
    dto: GenerateReportDto,
  ): Promise<ClientPerformanceReportDto> {
    const clients = await this.clientsRepository.find({ where: { tenantId } });

    const clientMetrics = await Promise.all(
      clients.map(async (client) => {
        const instances = await this.instancesRepository.find({
          where: {
            tenantId,
            clientId: client.id,
          },
        });

        const filteredInstances = instances.filter(
          (i) => i.createdAt >= dateRange.startDate && i.createdAt <= dateRange.endDate,
        );

        const completedCount = filteredInstances.filter((i) => i.status === WorkflowInstanceStatus.COMPLETED).length;
        const completionRate = filteredInstances.length > 0 ? (completedCount / filteredInstances.length) * 100 : 0;

        return {
          clientId: client.id,
          clientName: client.name,
          activeWorkflows: filteredInstances.filter(
            (i) => i.status !== WorkflowInstanceStatus.COMPLETED && i.status !== WorkflowInstanceStatus.ARCHIVED,
          ).length,
          completedWorkflows: completedCount,
          completionRate,
          averageCompletionTime: 0,
          overdueWorkflows: 0, // Can be counted from overdue steps
        };
      }),
    );

    const topPerformers = clientMetrics
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5)
      .map((m) => ({
        clientId: m.clientId,
        clientName: m.clientName,
        completionRate: m.completionRate,
      }));

    const needsAttention = clientMetrics
      .filter((m) => m.overdueWorkflows > 0)
      .sort((a, b) => b.overdueWorkflows - a.overdueWorkflows)
      .slice(0, 5)
      .map((m) => ({
        clientId: m.clientId,
        clientName: m.clientName,
        overdueCount: m.overdueWorkflows,
        delayedSteps: 0,
      }));

    return {
      generatedAt: new Date(),
      periodStart: dateRange.startDate,
      periodEnd: dateRange.endDate,
      clientMetrics,
      topPerformers,
      needsAttention,
    };
  }

  private async generateUserWorkload(
    tenantId: string,
    dateRange: { startDate: Date; endDate: Date },
    dto: GenerateReportDto,
  ): Promise<UserWorkloadReportDto> {
    const users = await this.usersRepository.find({ where: { tenantId } });

    const userMetrics = await Promise.all(
      users.map(async (user) => {
        const steps = await this.stepsRepository
          .createQueryBuilder('step')
          .where('step.assignedTo = :userId', { userId: user.id })
          .andWhere('step.tenantId = :tenantId', { tenantId })
          .getMany();

        const filteredSteps = steps.filter(
          (s) => s.createdAt >= dateRange.startDate && s.createdAt <= dateRange.endDate,
        );

        const completedSteps = filteredSteps.filter((s) => s.status === WorkflowStepStatus.DONE).length;
        const totalAssigned = filteredSteps.length;
        const utilizationPercent = totalAssigned > 0 ? (completedSteps / totalAssigned) * 100 : 0;

        return {
          userId: user.id,
          userName: user.name,
          role: user.role,
          assignedSteps: totalAssigned,
          completedSteps,
          inProgressSteps: filteredSteps.filter((s) => s.status === WorkflowStepStatus.IN_PROGRESS).length,
          overdueSteps: filteredSteps.filter(
            (s) => s.dueDate && s.dueDate < new Date() && s.status !== WorkflowStepStatus.DONE,
          ).length,
          utilizationPercent,
          averageCompletionTime: 0,
        };
      }),
    );

    const avgUtilization =
      userMetrics.length > 0 ? userMetrics.reduce((sum, m) => sum + m.utilizationPercent, 0) / userMetrics.length : 0;

    return {
      generatedAt: new Date(),
      periodStart: dateRange.startDate,
      periodEnd: dateRange.endDate,
      userMetrics,
      teamMetrics: {
        totalUsers: users.length,
        averageUtilization: avgUtilization,
        highestUtilization:
          userMetrics.length > 0
            ? userMetrics.sort((a, b) => b.utilizationPercent - a.utilizationPercent)[0].userName
            : 'N/A',
        lowestUtilization:
          userMetrics.length > 0
            ? userMetrics.sort((a, b) => a.utilizationPercent - b.utilizationPercent)[0].userName
            : 'N/A',
      },
    };
  }

  private async generateTemplateAnalytics(
    tenantId: string,
    dateRange: { startDate: Date; endDate: Date },
    dto: GenerateReportDto,
  ): Promise<TemplateAnalyticsReportDto> {
    const templates = await this.templatesRepository.find({ where: { tenantId } });

    const templates_data = await Promise.all(
      templates.map(async (template) => {
        const instances = await this.instancesRepository.find({
          where: { tenantId, templateId: template.id },
        });

        const filteredInstances = instances.filter(
          (i) => i.createdAt >= dateRange.startDate && i.createdAt <= dateRange.endDate,
        );

        const successfulInstances = filteredInstances.filter(
          (i) => i.status === WorkflowInstanceStatus.COMPLETED,
        ).length;
        const successRate = filteredInstances.length > 0 ? (successfulInstances / filteredInstances.length) * 100 : 0;

        return {
          templateId: template.id,
          templateName: template.name,
          totalInstances: filteredInstances.length,
          successRate,
          averageCompletionTime: 0,
          successfulInstances,
          failedInstances: filteredInstances.filter((i) => i.status === WorkflowInstanceStatus.ARCHIVED).length,
          totalSteps: template.steps?.length || 0,
          averageStepComplexity: 0,
        };
      }),
    );

    const mostUsedTemplate =
      templates_data.length > 0
        ? templates_data.sort((a, b) => b.totalInstances - a.totalInstances)[0].templateName
        : 'N/A';

    const fastestTemplate =
      templates_data.length > 0
        ? templates_data.sort((a, b) => a.averageCompletionTime - b.averageCompletionTime)[0].templateName
        : 'N/A';

    const slowestTemplate =
      templates_data.length > 0
        ? templates_data.sort((a, b) => b.averageCompletionTime - a.averageCompletionTime)[0].templateName
        : 'N/A';

    return {
      generatedAt: new Date(),
      periodStart: dateRange.startDate,
      periodEnd: dateRange.endDate,
      templates: templates_data,
      trends: {
        mostUsedTemplate,
        fastestTemplate,
        slowestTemplate,
      },
    };
  }

  private async generateDeadlineCompliance(
    tenantId: string,
    dateRange: { startDate: Date; endDate: Date },
    dto: GenerateReportDto,
  ): Promise<DeadlineComplianceReportDto> {
    const instances = await this.instancesRepository
      .createQueryBuilder('instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('instance.dueDate IS NOT NULL')
      .getMany();

    const filteredInstances = instances.filter(
      (i) => i.createdAt >= dateRange.startDate && i.createdAt <= dateRange.endDate,
    );

    const metDeadlines = filteredInstances.filter(
      (i) => !i.status || i.status === WorkflowInstanceStatus.COMPLETED,
    ).length;
    const missedDeadlines = filteredInstances.length - metDeadlines;
    const complianceRate = filteredInstances.length > 0 ? (metDeadlines / filteredInstances.length) * 100 : 0;

    return {
      generatedAt: new Date(),
      periodStart: dateRange.startDate,
      periodEnd: dateRange.endDate,
      complianceMetrics: {
        totalDeadlines: filteredInstances.length,
        metDeadlines,
        missedDeadlines,
        complianceRate,
        averageLatenessHours: 0,
      },
      byRuleType: [],
      criticalItems: [],
    };
  }

  private async generateFinancialSummary(
    tenantId: string,
    dateRange: { startDate: Date; endDate: Date },
    dto: GenerateReportDto,
  ): Promise<FinancialSummaryReportDto> {
    const instances = await this.instancesRepository
      .createQueryBuilder('instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('instance.createdAt >= :startDate', { startDate: dateRange.startDate })
      .andWhere('instance.createdAt <= :endDate', { endDate: dateRange.endDate })
      .getMany();

    const completedTransactions = instances.filter((i) => i.status === WorkflowInstanceStatus.COMPLETED).length;
    const failedTransactions = instances.filter((i) => i.status === WorkflowInstanceStatus.ARCHIVED).length;
    const totalTransactions = instances.length;
    const successRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0;

    const clients = await this.clientsRepository.find({ where: { tenantId } });
    const byClient = clients.map((client) => {
      const clientInstances = instances.filter((i) => i.clientId === client.id);
      return {
        clientId: client.id,
        clientName: client.name,
        transactionCount: clientInstances.length,
        successfulTransactions: clientInstances.filter((i) => i.status === WorkflowInstanceStatus.COMPLETED).length,
        failedTransactions: clientInstances.filter((i) => i.status === WorkflowInstanceStatus.ARCHIVED).length,
      };
    });

    return {
      generatedAt: new Date(),
      periodStart: dateRange.startDate,
      periodEnd: dateRange.endDate,
      summary: {
        totalTransactions,
        completedTransactions,
        failedTransactions,
        successRate,
        averageProcessingTime: 0,
      },
      byClient,
      exceptions: [],
    };
  }

  private exportAsJson(report: any, reportType: ReportType): { data: string; filename: string; mimeType: string } {
    const data = JSON.stringify(report, null, 2);
    const filename = `${reportType}-${new Date().toISOString()}.json`;
    return {
      data,
      filename,
      mimeType: 'application/json',
    };
  }

  private exportAsCsv(report: any, reportType: ReportType): { data: string; filename: string; mimeType: string } {
    let csv = '';

    if (report.userMetrics) {
      csv = 'User Name,Role,Assigned,Completed,In Progress,Overdue,Utilization %\n';
      report.userMetrics.forEach((m: any) => {
        csv += `${m.userName},${m.role},${m.assignedSteps},${m.completedSteps},${m.inProgressSteps},${m.overdueSteps},${m.utilizationPercent.toFixed(2)}\n`;
      });
    } else if (report.clientMetrics) {
      csv = 'Client Name,Active,Completed,Completion %,Overdue\n';
      report.clientMetrics.forEach((m: any) => {
        csv += `${m.clientName},${m.activeWorkflows},${m.completedWorkflows},${m.completionRate.toFixed(2)},${m.overdueWorkflows}\n`;
      });
    } else {
      csv = JSON.stringify(report);
    }

    const filename = `${reportType}-${new Date().toISOString()}.csv`;
    return {
      data: csv,
      filename,
      mimeType: 'text/csv',
    };
  }

  private exportAsPdf(report: any, reportType: ReportType): { data: string; filename: string; mimeType: string } {
    const filename = `${reportType}-${new Date().toISOString()}.pdf`;
    return {
      data: JSON.stringify(report),
      filename,
      mimeType: 'application/pdf',
    };
  }

  private getDateRange(dateRange?: any): { startDate: Date; endDate: Date } {
    if (dateRange) {
      return {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate),
      };
    }
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate };
  }

  private getNextRunDate(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek;
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'quarterly':
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        return nextQuarter;
      default:
        return now;
    }
  }
}
