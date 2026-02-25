import { DashboardService } from './dashboard.service';
import { WorkflowInstance, WorkflowInstanceStatus } from '../database/entities/workflow-instance.entity';
import { WorkflowStep, WorkflowStepStatus } from '../database/entities/workflow-step.entity';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';

// Factory helpers
const makeUser = (partial: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    tenantId: 'tenant-1',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.ACCOUNTANT,
    isActive: true,
    capacityPointsLimit: 100,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  } as User);

const makeClient = (partial: Partial<Client> = {}): Client =>
  ({
    id: 'client-1',
    tenantId: 'tenant-1',
    name: 'Mustermann GmbH',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  } as Client);

const makeTemplate = (partial: Partial<WorkflowTemplate> = {}): WorkflowTemplate =>
  ({
    id: 'template-1',
    tenantId: 'tenant-1',
    name: 'Test Template',
    isActive: true,
    steps: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  } as WorkflowTemplate);

const makeInstance = (partial: Partial<WorkflowInstance> = {}): WorkflowInstance =>
  ({
    id: 'instance-1',
    tenantId: 'tenant-1',
    clientId: 'client-1',
    templateId: 'template-1',
    periodYear: 2026,
    periodMonth: 2,
    status: WorkflowInstanceStatus.ACTIVE,
    steps: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  } as WorkflowInstance);

const makeStep = (partial: Partial<WorkflowStep> = {}): WorkflowStep =>
  ({
    id: 'step-1',
    instanceId: 'instance-1',
    templateStepId: 'ts-1',
    status: WorkflowStepStatus.OPEN,
    isEstimation: false,
    checklistProgress: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  } as WorkflowStep);

const makeQueryBuilder = (overrides: Record<string, jest.Mock> = {}) => {
  const qb: any = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getMany: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  return qb;
};

const makeRepo = (extra: Partial<Record<string, jest.Mock>> = {}) => ({
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  createQueryBuilder: jest.fn().mockReturnValue(makeQueryBuilder()),
  ...extra,
});

describe('DashboardService', () => {
  let service: DashboardService;
  let instancesRepo: ReturnType<typeof makeRepo>;
  let stepsRepo: ReturnType<typeof makeRepo>;
  let templatesRepo: ReturnType<typeof makeRepo>;
  let usersRepo: ReturnType<typeof makeRepo>;
  let clientsRepo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    instancesRepo = makeRepo();
    stepsRepo = makeRepo();
    templatesRepo = makeRepo();
    usersRepo = makeRepo();
    clientsRepo = makeRepo();

    service = new DashboardService(
      instancesRepo as any,
      stepsRepo as any,
      templatesRepo as any,
      usersRepo as any,
      clientsRepo as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics with zeros when no data', async () => {
      clientsRepo.count.mockResolvedValue(0);
      instancesRepo.count.mockResolvedValue(0);
      usersRepo.count.mockResolvedValue(0);
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder());

      const result = await service.getMetrics('tenant-1');

      expect(result.totalClients).toBe(0);
      expect(result.activeWorkflows).toBe(0);
      expect(result.completedToday).toBe(0);
      expect(result.overdueSteps).toBe(0);
      expect(result.pendingApprovals).toBe(0);
      expect(result.teamUtilization).toBe(0);
    });

    it('should return correct client and workflow counts', async () => {
      clientsRepo.count.mockResolvedValue(5);
      instancesRepo.count.mockResolvedValue(10);
      usersRepo.count.mockResolvedValue(3);
      stepsRepo.count.mockResolvedValue(2);
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({
        getCount: jest.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(2).mockResolvedValueOnce(9),
      }));

      const result = await service.getMetrics('tenant-1');

      expect(result.totalClients).toBe(5);
      expect(result.activeWorkflows).toBe(10);
    });

    it('should compute team utilization as 0 when no active users', async () => {
      clientsRepo.count.mockResolvedValue(0);
      instancesRepo.count.mockResolvedValue(0);
      usersRepo.count.mockResolvedValue(0);
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({
        getCount: jest.fn().mockResolvedValue(0),
      }));

      const result = await service.getMetrics('tenant-1');
      expect(result.teamUtilization).toBe(0);
    });
  });

  describe('getUserWorkload', () => {
    it('should return empty array when no users', async () => {
      usersRepo.find.mockResolvedValue([]);

      const result = await service.getUserWorkload('tenant-1');
      expect(result).toEqual([]);
    });

    it('should return workload for each user sorted by assigned steps', async () => {
      const users = [makeUser({ id: 'u1', name: 'Alice' }), makeUser({ id: 'u2', name: 'Bob' })];
      usersRepo.find.mockResolvedValue(users);

      // Alice has 5 assigned steps, Bob has 2
      let callCount = 0;
      stepsRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        const counts: Record<number, number> = { 1: 5, 2: 3, 3: 2, 4: 1, 5: 2, 6: 0, 7: 0, 8: 0 };
        return makeQueryBuilder({ getCount: jest.fn().mockResolvedValue(counts[callCount] || 0) });
      });

      const result = await service.getUserWorkload('tenant-1');
      expect(result).toHaveLength(2);
      // Should be sorted by assignedSteps descending
      expect(result[0].assignedSteps).toBeGreaterThanOrEqual(result[1].assignedSteps);
    });
  });

  describe('getClientProgress', () => {
    it('should return empty array when no clients', async () => {
      clientsRepo.find.mockResolvedValue([]);

      const result = await service.getClientProgress('tenant-1');
      expect(result).toEqual([]);
    });

    it('should calculate progress for clients with instances', async () => {
      const clients = [makeClient()];
      clientsRepo.find.mockResolvedValue(clients);

      const step1 = makeStep({ status: WorkflowStepStatus.DONE });
      const step2 = makeStep({ id: 'step-2', status: WorkflowStepStatus.OPEN });
      const instances = [
        makeInstance({ status: WorkflowInstanceStatus.COMPLETED, steps: [step1] }),
        makeInstance({ id: 'i2', status: WorkflowInstanceStatus.ACTIVE, steps: [step2] }),
      ];
      instancesRepo.find.mockResolvedValue(instances);

      const result = await service.getClientProgress('tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0].totalInstances).toBe(2);
      expect(result[0].completedInstances).toBe(1);
      expect(result[0].activeInstances).toBe(1);
    });

    it('should return 0 average percent when client has no instances', async () => {
      const clients = [makeClient()];
      clientsRepo.find.mockResolvedValue(clients);
      instancesRepo.find.mockResolvedValue([]);

      const result = await service.getClientProgress('tenant-1');
      expect(result[0].averageCompletePercent).toBe(0);
    });
  });

  describe('getWorkflowMetrics', () => {
    it('should return empty array when no templates', async () => {
      templatesRepo.find.mockResolvedValue([]);

      const result = await service.getWorkflowMetrics('tenant-1');
      expect(result).toEqual([]);
    });

    it('should compute success rate for templates', async () => {
      templatesRepo.find.mockResolvedValue([makeTemplate()]);
      const instances = [
        makeInstance({ status: WorkflowInstanceStatus.COMPLETED, steps: [makeStep({ status: WorkflowStepStatus.DONE })] }),
        makeInstance({ id: 'i2', status: WorkflowInstanceStatus.ACTIVE, steps: [makeStep({ id: 's2', status: WorkflowStepStatus.OPEN })] }),
      ];
      instancesRepo.find.mockResolvedValue(instances);

      const result = await service.getWorkflowMetrics('tenant-1');
      expect(result[0].successRate).toBe(50);
      expect(result[0].totalInstancesCreated).toBe(2);
      expect(result[0].averageStepsCompleted).toBe(1); // (1 done + 0 done) / 2 = 0.5 → rounded to 1
    });
  });

  describe('getStats', () => {
    it('should return aggregated stats with all categories', async () => {
      instancesRepo.count.mockResolvedValue(5);
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({
        getCount: jest.fn().mockResolvedValue(10),
      }));
      clientsRepo.count.mockResolvedValue(8);
      usersRepo.count.mockResolvedValue(4);

      const result = await service.getStats('tenant-1');

      expect(result.workflows).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(result.clients).toBeDefined();
      expect(result.users).toBeDefined();
      expect(result.clients.total).toBe(8);
      expect(result.users.total).toBe(4);
    });

    it('should include workflow status breakdown', async () => {
      instancesRepo.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5)  // active
        .mockResolvedValueOnce(2)  // delayed
        .mockResolvedValueOnce(1)  // critical
        .mockResolvedValueOnce(2)  // completed
        .mockResolvedValue(0);     // clients, users

      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder());

      const result = await service.getStats('tenant-1');
      expect(result.workflows.total).toBe(10);
      expect(result.workflows.active).toBe(5);
      expect(result.workflows.delayed).toBe(2);
      expect(result.workflows.critical).toBe(1);
      expect(result.workflows.completed).toBe(2);
    });
  });

  describe('getUpcomingDeadlines', () => {
    it('should return upcoming deadlines within specified days', async () => {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      const step = makeStep({
        dueDate,
        status: WorkflowStepStatus.OPEN,
        instance: makeInstance() as any,
      });
      step.instance = makeInstance() as any;
      (step as any).instance.template = makeTemplate();
      (step as any).instance.client = makeClient();

      const qb = makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([step]) });
      stepsRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getUpcomingDeadlines('tenant-1', 7);
      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('medium'); // 2 days away
    });

    it('should return empty array when no deadlines', async () => {
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) }));

      const result = await service.getUpcomingDeadlines('tenant-1');
      expect(result).toEqual([]);
    });

    it('should filter by userId when provided', async () => {
      const qb = makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([]) });
      stepsRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getUpcomingDeadlines('tenant-1', 7, 'user-1');

      // andWhere should have been called with userId filter
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('assignedUserId'),
        expect.objectContaining({ userId: 'user-1' }),
      );
    });

    it('should set high priority for deadlines due within 1 day', async () => {
      const now = new Date();
      const dueDate = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
      const step = makeStep({ dueDate, status: WorkflowStepStatus.OPEN });
      step.instance = makeInstance() as any;
      (step as any).instance.template = makeTemplate();
      (step as any).instance.client = makeClient();

      stepsRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder({ getMany: jest.fn().mockResolvedValue([step]) }),
      );

      const result = await service.getUpcomingDeadlines('tenant-1');
      expect(result[0].priority).toBe('high');
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity from instances', async () => {
      const instances = [
        makeInstance({ id: 'i1' }),
        makeInstance({ id: 'i2' }),
      ];
      instancesRepo.find.mockResolvedValue(instances);

      const result = await service.getRecentActivity('tenant-1', 2);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('workflow_created');
      expect(result[0].id).toBe('i1');
    });

    it('should return empty array when no instances', async () => {
      instancesRepo.find.mockResolvedValue([]);

      const result = await service.getRecentActivity('tenant-1');
      expect(result).toEqual([]);
    });
  });

  describe('getTenantDashboard', () => {
    it('should return combined dashboard data', async () => {
      // Set up minimal mocks for all sub-methods
      clientsRepo.count.mockResolvedValue(3);
      instancesRepo.count.mockResolvedValue(5);
      usersRepo.count.mockResolvedValue(2);
      usersRepo.find.mockResolvedValue([]);
      clientsRepo.find.mockResolvedValue([]);
      templatesRepo.find.mockResolvedValue([]);
      instancesRepo.find.mockResolvedValue([]);
      stepsRepo.count.mockResolvedValue(0);
      stepsRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder());

      const result = await service.getTenantDashboard('tenant-1');

      expect(result.metrics).toBeDefined();
      expect(result.userWorkload).toBeDefined();
      expect(result.clientProgress).toBeDefined();
      expect(result.workflowMetrics).toBeDefined();
      expect(result.recentActivity).toBeDefined();
    });
  });
});
