import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowInstance, WorkflowInstanceStatus } from '../database/entities/workflow-instance.entity';
import { WorkflowStep, WorkflowStepStatus } from '../database/entities/workflow-step.entity';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';
import {
  DashboardMetricsDto,
  UserWorkloadDto,
  ClientProgressDto,
  WorkflowMetricsDto,
  TenantDashboardDto,
} from './dto/dashboard.dto';
import { addDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(WorkflowInstance)
    private readonly instancesRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private readonly stepsRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowTemplate)
    private readonly templatesRepository: Repository<WorkflowTemplate>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  /**
   * Get overall tenant dashboard
   */
  async getTenantDashboard(tenantId: string): Promise<TenantDashboardDto> {
    const metrics = await this.getMetrics(tenantId);
    const userWorkload = await this.getUserWorkload(tenantId);
    const clientProgress = await this.getClientProgress(tenantId);
    const workflowMetrics = await this.getWorkflowMetrics(tenantId);
    const recentActivity = await this.getRecentActivity(tenantId, 20);

    return {
      metrics,
      userWorkload,
      clientProgress,
      workflowMetrics,
      recentActivity,
    };
  }

  /**
   * Get high-level metrics
   */
  async getMetrics(tenantId: string): Promise<DashboardMetricsDto> {
    const clients = await this.clientsRepository.count({
      where: { tenantId, isActive: true },
    });

    const activeWorkflows = await this.instancesRepository.count({
      where: { tenantId },
    });

    // Completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoin('step.instance', 'instance')
      .where('step.completedAt >= :today', { today })
      .andWhere('instance.tenantId = :tenantId', { tenantId })
      .getCount();

    // Overdue steps (due date in past, not completed)
    const now = new Date();
    const overdueSteps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoin('step.instance', 'instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('step.dueDate < :now', { now })
      .andWhere('step.status != :done', { done: WorkflowStepStatus.DONE })
      .getCount();

    // Pending approvals
    const pendingApprovals = await this.stepsRepository.count({
      where: {
        status: WorkflowStepStatus.PENDING_APPROVAL,
      },
    });

    // Team utilization (rough: assigned steps / total active users)
    const activeUsers = await this.usersRepository.count({
      where: { tenantId, isActive: true },
    });

    const assignedSteps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoin('step.instance', 'instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('step.assignedUserId IS NOT NULL')
      .andWhere('step.status != :done', { done: WorkflowStepStatus.DONE })
      .getCount();

    const utilizationPercent = activeUsers > 0 ? Math.round((assignedSteps / activeUsers) * 100) : 0;

    return {
      totalClients: clients,
      activeWorkflows,
      completedToday,
      overdueSteps,
      pendingApprovals,
      teamUtilization: utilizationPercent,
    };
  }

  /**
   * Get per-user workload
   */
  async getUserWorkload(tenantId: string): Promise<UserWorkloadDto[]> {
    const users = await this.usersRepository.find({
      where: { tenantId, isActive: true },
    });

    const workload: UserWorkloadDto[] = [];

    for (const user of users) {
const assigned = await this.stepsRepository
      .createQueryBuilder('step')
      .where('step.assignedUserId = :userId', { userId: user.id })
      .andWhere('step.status != :done', { done: WorkflowStepStatus.DONE })
      .getCount();

      const completed = await this.stepsRepository
        .createQueryBuilder('step')
        .where('step.assignedUserId = :userId', { userId: user.id })
        .andWhere('step.status = :done', { done: WorkflowStepStatus.DONE })
        .getCount();

      const inProgress = await this.stepsRepository
        .createQueryBuilder('step')
        .where('step.assignedUserId = :userId', { userId: user.id })
        .andWhere('step.status = :inProgress', {
          inProgress: WorkflowStepStatus.IN_PROGRESS,
        })
        .getCount();

      const now = new Date();
      const overdue = await this.stepsRepository
        .createQueryBuilder('step')
        .where('step.assignedUserId = :userId', { userId: user.id })
        .andWhere('step.dueDate < :now', { now })
        .andWhere('step.status != :done', { done: WorkflowStepStatus.DONE })
        .getCount();

      const utilization = assigned > 0 ? Math.round((inProgress / assigned) * 100) : 0;

      workload.push({
        userId: user.id,
        userName: user.name,
        assignedSteps: assigned,
        completedSteps: completed,
        inProgressSteps: inProgress,
        overdueSteps: overdue,
        utilizationPercent: utilization,
      });
    }

    return workload.sort((a, b) => b.assignedSteps - a.assignedSteps);
  }

  /**
   * Get client progress metrics
   */
  async getClientProgress(tenantId: string): Promise<ClientProgressDto[]> {
    const clients = await this.clientsRepository.find({
      where: { tenantId, isActive: true },
    });

    const progress: ClientProgressDto[] = [];

    for (const client of clients) {
      const instances = await this.instancesRepository.find({
        where: { clientId: client.id },
        relations: ['steps'],
      });

      const total = instances.length;
      const active = instances.filter((i) => i.status !== 'completed').length;

      let totalCompletePercent = 0;
      if (instances.length > 0) {
        const percentages = instances.map((instance) => {
          const steps = instance.steps || [];
          const completed = steps.filter((s) => s.status === WorkflowStepStatus.DONE).length;
          return steps.length > 0 ? (completed / steps.length) * 100 : 0;
        });
        totalCompletePercent = Math.round(
          percentages.reduce((a, b) => a + b, 0) / percentages.length,
        );
      }

      const completed = instances.filter((i) => i.status === 'completed').length;

      progress.push({
        clientId: client.id,
        clientName: client.name,
        totalInstances: total,
        activeInstances: active,
        completedInstances: completed,
        averageCompletePercent: totalCompletePercent,
      });
    }

    return progress.sort((a, b) => b.activeInstances - a.activeInstances);
  }

  /**
   * Get workflow template metrics
   */
  async getWorkflowMetrics(tenantId: string): Promise<WorkflowMetricsDto[]> {
    const templates = await this.templatesRepository.find({
      where: { tenantId, isActive: true },
      relations: ['steps'],
    });

    const metrics: WorkflowMetricsDto[] = [];

    for (const template of templates) {
      const instances = await this.instancesRepository.find({
        where: { templateId: template.id },
        relations: ['steps'],
      });

      const total = instances.length;
      const completed = instances.filter((i) => i.status === 'completed').length;
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      let averageCompletionTime = 0;
      const completedInstances = instances.filter((i) => i.status === 'completed');
      if (completedInstances.length > 0) {
        const times = completedInstances.map((i) => {
          // Rough calculation: difference between created and now (would need update field in real scenario)
          const days = Math.round((Date.now() - i.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return days;
        });
        averageCompletionTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }

      let averageStepsCompleted = 0;
      if (instances.length > 0) {
        const stepCounts = instances.map((i) => {
          const steps = i.steps || [];
          return steps.filter((s) => s.status === WorkflowStepStatus.DONE).length;
        });
        averageStepsCompleted = Math.round(stepCounts.reduce((a, b) => a + b, 0) / stepCounts.length);
      }

      metrics.push({
        templateId: template.id,
        templateName: template.name,
        totalInstancesCreated: total,
        averageCompletionTime,
        successRate,
        averageStepsCompleted,
      });
    }

    return metrics.sort((a, b) => b.totalInstancesCreated - a.totalInstancesCreated);
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(tenantId: string, limit: number = 20) {
    // For now, return minimal recent activity
    // In a real system, this would query an activity log table
    const instances = await this.instancesRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return instances.map((instance) => ({
      id: instance.id,
      type: 'workflow_created' as const,
      description: `Workflow instance created for period ${instance.periodMonth}/${instance.periodYear}`,
      relatedItemId: instance.id,
      createdAt: instance.createdAt,
    }));
  }

  /**
   * Get stats in the format expected by the frontend dashboard
   */
  async getStats(tenantId: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Workflow counts
    const totalWorkflows = await this.instancesRepository.count({ where: { tenantId } });
    const activeWorkflows = await this.instancesRepository.count({ where: { tenantId, status: WorkflowInstanceStatus.ACTIVE } });
    const delayedWorkflows = await this.instancesRepository.count({ where: { tenantId, status: WorkflowInstanceStatus.DELAYED } });
    const criticalWorkflows = await this.instancesRepository.count({ where: { tenantId, status: WorkflowInstanceStatus.CRITICAL } });
    const completedWorkflows = await this.instancesRepository.count({ where: { tenantId, status: WorkflowInstanceStatus.COMPLETED } });

    // Task (step) counts
    const totalSteps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoin('step.instance', 'instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .getCount();

    const openSteps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoin('step.instance', 'instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('step.status = :status', { status: WorkflowStepStatus.OPEN })
      .getCount();

    const inProgressSteps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoin('step.instance', 'instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('step.status = :status', { status: WorkflowStepStatus.IN_PROGRESS })
      .getCount();

    const dueTodaySteps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoin('step.instance', 'instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('step.dueDate BETWEEN :start AND :end', { start: todayStart, end: todayEnd })
      .andWhere('step.status != :done', { done: WorkflowStepStatus.DONE })
      .getCount();

    const overdueSteps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoin('step.instance', 'instance')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('step.dueDate < :now', { now: todayStart })
      .andWhere('step.status NOT IN (:...statuses)', { statuses: [WorkflowStepStatus.DONE, WorkflowStepStatus.SKIPPED] })
      .getCount();

    // Client counts
    const totalClients = await this.clientsRepository.count({ where: { tenantId } });
    const activeClients = await this.clientsRepository.count({ where: { tenantId, isActive: true } });

    // User counts
    const totalUsers = await this.usersRepository.count({ where: { tenantId } });
    const activeUsers = await this.usersRepository.count({ where: { tenantId, isActive: true } });

    return {
      workflows: {
        total: totalWorkflows,
        active: activeWorkflows,
        delayed: delayedWorkflows,
        critical: criticalWorkflows,
        completed: completedWorkflows,
      },
      tasks: {
        total: totalSteps,
        open: openSteps,
        inProgress: inProgressSteps,
        dueToday: dueTodaySteps,
        overdue: overdueSteps,
      },
      clients: {
        total: totalClients,
        active: activeClients,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
    };
  }

  /**
   * Get upcoming deadlines (steps with dueDate in the next N days)
   */
  async getUpcomingDeadlines(tenantId: string, days: number = 7) {
    const now = new Date();
    const futureDate = addDays(now, days);

    const steps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoinAndSelect('step.instance', 'instance')
      .innerJoinAndSelect('instance.client', 'client')
      .innerJoinAndSelect('instance.template', 'template')
      .innerJoinAndSelect('step.templateStep', 'templateStep')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('step.dueDate BETWEEN :now AND :future', { now, future: futureDate })
      .andWhere('step.status NOT IN (:...statuses)', {
        statuses: [WorkflowStepStatus.DONE, WorkflowStepStatus.SKIPPED],
      })
      .orderBy('step.dueDate', 'ASC')
      .getMany();

    return steps.map((step) => {
      const daysUntilDue = Math.ceil((step.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const priority = daysUntilDue <= 1 ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low';
      return {
        id: step.id,
        workflowName: step.instance?.template?.name ?? 'Unbekannt',
        clientName: step.instance?.client?.name ?? 'Unbekannt',
        stepName: step.templateStep?.name ?? 'Unbekannt',
        dueDate: step.dueDate,
        status: step.status,
        priority,
      };
    });
  }

  /**
   * Get deadlines for a calendar month view
   */
  async getCalendarDeadlines(tenantId: string, year: number, month: number) {
    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(new Date(year, month - 1, 1));

    const steps = await this.stepsRepository
      .createQueryBuilder('step')
      .innerJoinAndSelect('step.instance', 'instance')
      .innerJoinAndSelect('instance.client', 'client')
      .innerJoinAndSelect('instance.template', 'template')
      .innerJoinAndSelect('step.templateStep', 'templateStep')
      .where('instance.tenantId = :tenantId', { tenantId })
      .andWhere('step.dueDate BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
      .orderBy('step.dueDate', 'ASC')
      .getMany();

    return steps.map((step) => ({
      id: step.id,
      stepName: step.templateStep?.name ?? 'Unbekannt',
      workflowName: step.instance?.template?.name ?? 'Unbekannt',
      clientName: step.instance?.client?.name ?? 'Unbekannt',
      dueDate: step.dueDate,
      status: step.status,
      instanceId: step.instanceId,
    }));
  }
}
