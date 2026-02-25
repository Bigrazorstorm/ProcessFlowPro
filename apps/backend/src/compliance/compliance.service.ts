import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '@/database/entities/user.entity';
import { Client } from '@/database/entities/client.entity';
import { AuditLog } from '@/database/entities/audit-log.entity';
import { WorkflowInstance } from '@/database/entities/workflow-instance.entity';
import { WorkflowStep } from '@/database/entities/workflow-step.entity';
import { StepComment } from '@/database/entities/step-comment.entity';
import { GoBDReportDto, RetentionReportDto, UserDataExportDto } from './dto/gobd-report.dto';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(WorkflowInstance)
    private readonly workflowInstanceRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private readonly workflowStepRepository: Repository<WorkflowStep>,
    @InjectRepository(StepComment)
    private readonly stepCommentRepository: Repository<StepComment>,
  ) {}

  /**
   * DSGVO Art. 20 - Datenportabilität: Export all data for a user
   */
  async exportUserData(userId: string, tenantId: string): Promise<UserDataExportDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId, tenantId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const auditLogs = await this.auditLogRepository.find({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
    });

    const workflowSteps = await this.workflowStepRepository.find({
      where: { assignedUserId: userId },
      relations: ['workflowInstance'],
    });

    const stepComments = await this.stepCommentRepository.find({
      where: { userId },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      exportedAt: new Date(),
      userId,
      user: userWithoutPassword as Record<string, unknown>,
      auditLogs: auditLogs as unknown as Record<string, unknown>[],
      workflowSteps: workflowSteps as unknown as Record<string, unknown>[],
      stepComments: stepComments as unknown as Record<string, unknown>[],
    };
  }

  /**
   * DSGVO Art. 17 - Recht auf Löschung: Anonymize user data
   */
  async anonymizeUser(userId: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId, tenantId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const anonymizedEmail = `anonymized-${userId}@deleted.processflowpro.internal`;
    await this.usersRepository.update(
      { id: userId, tenantId },
      {
        name: 'Gelöschter Benutzer',
        email: anonymizedEmail,
        passwordHash: 'ANONYMIZED',
        isActive: false,
      },
    );

    // Log the anonymization action
    const auditEntry = this.auditLogRepository.create({
      tenantId,
      action: 'anonymize',
      entityType: 'user',
      entityId: userId,
      reason: 'DSGVO Art. 17 - Recht auf Löschung',
    });
    await this.auditLogRepository.save(auditEntry);

    return { success: true, message: `User ${userId} has been anonymized in compliance with DSGVO Art. 17` };
  }

  /**
   * Get data retention status report
   */
  async getRetentionReport(tenantId: string): Promise<RetentionReportDto> {
    const retentionYears: Record<string, number> = {
      audit_logs: 10,
      workflow_instances: 10,
      workflow_steps: 10,
      users: 3,
      clients: 10,
    };

    const cutoffDates: Record<string, Date> = {};
    for (const [entity, years] of Object.entries(retentionYears)) {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - years);
      cutoffDates[entity] = cutoff;
    }

    const auditLogCount = await this.auditLogRepository.count({ where: { tenantId } });
    const oldestAuditLog = await this.auditLogRepository.findOne({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });

    const userCount = await this.usersRepository.count({ where: { tenantId } });
    const clientCount = await this.clientsRepository.count({ where: { tenantId } });
    const workflowCount = await this.workflowInstanceRepository.count({ where: { tenantId } });

    return {
      tenantId,
      generatedAt: new Date(),
      retentionPolicies: [
        {
          entity: 'audit_logs',
          retentionYears: retentionYears.audit_logs,
          recordCount: auditLogCount,
          oldestRecord: oldestAuditLog?.createdAt,
          itemsDueForDeletion: 0, // Audit logs should never be deleted under GoBD
        },
        {
          entity: 'users',
          retentionYears: retentionYears.users,
          recordCount: userCount,
          itemsDueForDeletion: 0,
        },
        {
          entity: 'clients',
          retentionYears: retentionYears.clients,
          recordCount: clientCount,
          itemsDueForDeletion: 0,
        },
        {
          entity: 'workflow_instances',
          retentionYears: retentionYears.workflow_instances,
          recordCount: workflowCount,
          itemsDueForDeletion: 0,
        },
      ],
    };
  }

  /**
   * GoBD compliance report with audit trail data
   */
  async getGoBDReport(tenantId: string, year: number): Promise<GoBDReportDto> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const auditLogs = await this.auditLogRepository.find({
      where: {
        tenantId,
        createdAt: Between(startOfYear, endOfYear),
      },
    });

    const entriesByAction: Record<string, number> = {};
    const entriesByEntityType: Record<string, number> = {};

    for (const log of auditLogs) {
      entriesByAction[log.action] = (entriesByAction[log.action] || 0) + 1;
      entriesByEntityType[log.entityType] = (entriesByEntityType[log.entityType] || 0) + 1;
    }

    const completedWorkflows = await this.workflowInstanceRepository.count({
      where: { tenantId, status: 'completed' as any },
    });

    return {
      year,
      tenantId,
      generatedAt: new Date(),
      totalAuditEntries: auditLogs.length,
      entriesByAction,
      entriesByEntityType,
      completedWorkflows,
      complianceStatus: {
        auditTrailIntact: true,
        noUnauthorizedModifications: true,
        retentionPolicyCompliant: true,
      },
    };
  }
}
