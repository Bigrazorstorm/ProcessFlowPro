import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowInstance } from '../database/entities/workflow-instance.entity';
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
import { subDays, isAfter } from 'date-fns';

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
}
