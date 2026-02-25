import { BadRequestException } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { ReportType, ExportFormat, ReportFrequency } from './dto/report.dto';
import { WorkflowInstance, WorkflowInstanceStatus } from '../database/entities/workflow-instance.entity';
import { WorkflowStep, WorkflowStepStatus } from '../database/entities/workflow-step.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';

const makeDateRange = () => ({
  startDate: '2026-01-01',
  endDate: '2026-12-31',
});

const makeInstance = (partial: Partial<WorkflowInstance> = {}): WorkflowInstance =>
  ({
    id: 'instance-1',
    tenantId: 'tenant-1',
    clientId: 'client-1',
    templateId: 'template-1',
    status: WorkflowInstanceStatus.ACTIVE,
    periodYear: 2026,
    periodMonth: 1,
    steps: [],
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-15'),
    ...partial,
  }) as WorkflowInstance;

const makeStep = (partial: Partial<WorkflowStep> = {}): WorkflowStep =>
  ({
    id: 'step-1',
    instanceId: 'instance-1',
    templateStepId: 'ts-1',
    status: WorkflowStepStatus.OPEN,
    isEstimation: false,
    checklistProgress: [],
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-15'),
    ...partial,
  }) as WorkflowStep;

const makeUser = (partial: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    tenantId: 'tenant-1',
    name: 'Test User',
    email: 'user@example.com',
    role: UserRole.ACCOUNTANT,
    isActive: true,
    capacityPointsLimit: 100,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  }) as User;

const makeClient = (partial: Partial<Client> = {}): Client =>
  ({
    id: 'client-1',
    tenantId: 'tenant-1',
    name: 'Mustermann GmbH',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  }) as Client;

const makeTemplate = (partial: Partial<WorkflowTemplate> = {}): WorkflowTemplate =>
  ({
    id: 'template-1',
    tenantId: 'tenant-1',
    name: 'Lohnabrechnung',
    isActive: true,
    steps: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  }) as WorkflowTemplate;

const makeQueryBuilder = (overrides: Record<string, jest.Mock> = {}) => {
  const qb: any = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getMany: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  return qb;
};

const makeRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  createQueryBuilder: jest.fn().mockReturnValue(makeQueryBuilder()),
});

describe('ReportingService', () => {
  let service: ReportingService;
  let instancesRepo: ReturnType<typeof makeRepo>;
  let stepsRepo: ReturnType<typeof makeRepo>;
  let usersRepo: ReturnType<typeof makeRepo>;
  let clientsRepo: ReturnType<typeof makeRepo>;
  let templatesRepo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    instancesRepo = makeRepo();
    stepsRepo = makeRepo();
    usersRepo = makeRepo();
    clientsRepo = makeRepo();
    templatesRepo = makeRepo();

    service = new ReportingService(
      instancesRepo as any,
      stepsRepo as any,
      usersRepo as any,
      clientsRepo as any,
      templatesRepo as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('should generate a WORKFLOW_SUMMARY report', async () => {
      const instances = [makeInstance({ status: WorkflowInstanceStatus.COMPLETED })];
      instancesRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder({ getMany: jest.fn().mockResolvedValue(instances) }),
      );
      stepsRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([makeStep({ status: WorkflowStepStatus.DONE })]) }),
      );
      templatesRepo.find.mockResolvedValue([makeTemplate()]);

      const result = await service.generateReport(
        { type: ReportType.WORKFLOW_SUMMARY, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.totalInstances).toBe(1);
      expect(result.metrics.completedInstances).toBe(1);
    });

    it('should generate a CLIENT_PERFORMANCE report', async () => {
      clientsRepo.find.mockResolvedValue([makeClient()]);
      instancesRepo.find.mockResolvedValue([makeInstance({ status: WorkflowInstanceStatus.COMPLETED })]);

      const result = await service.generateReport(
        { type: ReportType.CLIENT_PERFORMANCE, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.clientMetrics).toBeDefined();
      expect(result.clientMetrics).toHaveLength(1);
      expect(result.topPerformers).toBeDefined();
    });

    it('should generate a USER_WORKLOAD report', async () => {
      usersRepo.find.mockResolvedValue([makeUser()]);
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));

      const result = await service.generateReport(
        { type: ReportType.USER_WORKLOAD, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.userMetrics).toBeDefined();
      expect(result.teamMetrics).toBeDefined();
      expect(result.teamMetrics.totalUsers).toBe(1);
    });

    it('should generate a TEMPLATE_ANALYTICS report', async () => {
      templatesRepo.find.mockResolvedValue([makeTemplate()]);
      instancesRepo.find.mockResolvedValue([makeInstance()]);

      const result = await service.generateReport(
        { type: ReportType.TEMPLATE_ANALYTICS, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.templates).toBeDefined();
      expect(result.trends).toBeDefined();
    });

    it('should generate a DEADLINE_COMPLIANCE report', async () => {
      instancesRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));

      const result = await service.generateReport(
        { type: ReportType.DEADLINE_COMPLIANCE, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.complianceMetrics).toBeDefined();
      expect(result.complianceMetrics.totalDeadlines).toBe(0);
    });

    it('should generate a FINANCIAL_SUMMARY report', async () => {
      instancesRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([makeInstance()]) }),
      );
      clientsRepo.find.mockResolvedValue([makeClient()]);

      const result = await service.generateReport(
        { type: ReportType.FINANCIAL_SUMMARY, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.summary).toBeDefined();
      expect(result.byClient).toBeDefined();
    });

    it('should throw BadRequestException for unknown report type', async () => {
      await expect(service.generateReport({ type: 'UNKNOWN_TYPE' as any }, 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use default date range when not provided', async () => {
      instancesRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));
      templatesRepo.find.mockResolvedValue([]);

      const result = await service.generateReport({ type: ReportType.WORKFLOW_SUMMARY }, 'tenant-1');

      expect(result.periodStart).toBeDefined();
      expect(result.periodEnd).toBeDefined();
    });
  });

  describe('exportReport', () => {
    it('should export report as JSON', async () => {
      instancesRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));
      templatesRepo.find.mockResolvedValue([]);

      const result = await service.exportReport(
        { type: ReportType.WORKFLOW_SUMMARY, format: ExportFormat.JSON, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toContain('.json');
      expect(() => JSON.parse(result.data)).not.toThrow();
    });

    it('should export report as CSV', async () => {
      usersRepo.find.mockResolvedValue([makeUser()]);
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));

      const result = await service.exportReport(
        { type: ReportType.USER_WORKLOAD, format: ExportFormat.CSV, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toContain('.csv');
      expect(result.data).toContain('User Name');
    });

    it('should export report as PDF', async () => {
      clientsRepo.find.mockResolvedValue([makeClient()]);
      instancesRepo.find.mockResolvedValue([]);

      const result = await service.exportReport(
        { type: ReportType.CLIENT_PERFORMANCE, format: ExportFormat.PDF, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename).toContain('.pdf');
    });

    it('should throw BadRequestException for unknown format', async () => {
      instancesRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));
      templatesRepo.find.mockResolvedValue([]);

      await expect(
        service.exportReport(
          { type: ReportType.WORKFLOW_SUMMARY, format: 'xml' as any, dateRange: makeDateRange() },
          'tenant-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('scheduleReport', () => {
    it('should schedule a daily report', async () => {
      const result = await service.scheduleReport(
        {
          type: ReportType.WORKFLOW_SUMMARY,
          format: ExportFormat.JSON,
          frequency: ReportFrequency.DAILY,
          recipientEmail: 'admin@example.com',
        },
        'tenant-1',
        'user-1',
      );

      expect(result.scheduleId).toBeDefined();
      expect(result.nextRun).toBeInstanceOf(Date);
      // Next run should be ~1 day from now
      const diffMs = result.nextRun.getTime() - Date.now();
      expect(diffMs).toBeGreaterThan(0);
    });

    it('should schedule a weekly report', async () => {
      const result = await service.scheduleReport(
        {
          type: ReportType.WORKFLOW_SUMMARY,
          format: ExportFormat.CSV,
          frequency: ReportFrequency.WEEKLY,
          recipientEmail: 'admin@example.com',
        },
        'tenant-1',
        'user-1',
      );

      const diffDays = (result.nextRun.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(7, 0);
    });

    it('should schedule a monthly report', async () => {
      const result = await service.scheduleReport(
        {
          type: ReportType.WORKFLOW_SUMMARY,
          format: ExportFormat.JSON,
          frequency: ReportFrequency.MONTHLY,
          recipientEmail: 'admin@example.com',
        },
        'tenant-1',
        'user-1',
      );

      expect(result.nextRun).toBeInstanceOf(Date);
    });
  });

  describe('getScheduledReports', () => {
    it('should return empty array when no reports scheduled', async () => {
      const result = await service.getScheduledReports('tenant-1');
      expect(result).toEqual([]);
    });

    it('should return only reports for the specified tenant', async () => {
      await service.scheduleReport(
        {
          type: ReportType.WORKFLOW_SUMMARY,
          format: ExportFormat.JSON,
          frequency: ReportFrequency.DAILY,
          recipientEmail: 'a@b.com',
        },
        'tenant-1',
        'user-1',
      );
      await service.scheduleReport(
        {
          type: ReportType.WORKFLOW_SUMMARY,
          format: ExportFormat.JSON,
          frequency: ReportFrequency.DAILY,
          recipientEmail: 'x@y.com',
        },
        'tenant-2',
        'user-2',
      );

      const tenant1Reports = await service.getScheduledReports('tenant-1');
      expect(tenant1Reports).toHaveLength(1);
      expect(tenant1Reports[0].tenantId).toBe('tenant-1');
    });
  });

  describe('deleteScheduledReport', () => {
    it('should delete a scheduled report', async () => {
      const { scheduleId } = await service.scheduleReport(
        {
          type: ReportType.WORKFLOW_SUMMARY,
          format: ExportFormat.JSON,
          frequency: ReportFrequency.DAILY,
          recipientEmail: 'a@b.com',
        },
        'tenant-1',
        'user-1',
      );

      await expect(service.deleteScheduledReport(scheduleId, 'tenant-1')).resolves.toBeUndefined();

      const reports = await service.getScheduledReports('tenant-1');
      expect(reports).toHaveLength(0);
    });

    it('should throw BadRequestException when report not found', async () => {
      await expect(service.deleteScheduledReport('no-such-id', 'tenant-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when report belongs to different tenant', async () => {
      const { scheduleId } = await service.scheduleReport(
        {
          type: ReportType.WORKFLOW_SUMMARY,
          format: ExportFormat.JSON,
          frequency: ReportFrequency.DAILY,
          recipientEmail: 'a@b.com',
        },
        'tenant-1',
        'user-1',
      );

      await expect(service.deleteScheduledReport(scheduleId, 'different-tenant')).rejects.toThrow(BadRequestException);
    });
  });

  describe('workflow summary success rate', () => {
    it('should calculate 100% success rate when all instances are completed', async () => {
      const completedInstances = [
        makeInstance({ status: WorkflowInstanceStatus.COMPLETED }),
        makeInstance({ id: 'i2', status: WorkflowInstanceStatus.COMPLETED }),
      ];
      instancesRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder({ getMany: jest.fn().mockResolvedValue(completedInstances) }),
      );
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));
      templatesRepo.find.mockResolvedValue([]);

      const result = await service.generateReport(
        { type: ReportType.WORKFLOW_SUMMARY, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.metrics.successRate).toBe(100);
    });

    it('should calculate 0% success rate when no instances are completed', async () => {
      const activeInstances = [makeInstance({ status: WorkflowInstanceStatus.ACTIVE })];
      instancesRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder({ getMany: jest.fn().mockResolvedValue(activeInstances) }),
      );
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));
      templatesRepo.find.mockResolvedValue([]);

      const result = await service.generateReport(
        { type: ReportType.WORKFLOW_SUMMARY, dateRange: makeDateRange() },
        'tenant-1',
      );

      expect(result.metrics.successRate).toBe(0);
    });
  });
});
