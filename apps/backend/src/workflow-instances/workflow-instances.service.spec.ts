import { NotFoundException } from '@nestjs/common';
import { WorkflowInstancesService } from './workflow-instances.service';
import { WorkflowInstance, WorkflowInstanceStatus } from '../database/entities/workflow-instance.entity';
import { WorkflowStep, WorkflowStepStatus } from '../database/entities/workflow-step.entity';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';
import { Client } from '../database/entities/client.entity';
import { DeadlineCalculatorService } from '../deadline-calculator/deadline-calculator.service';

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
  }) as WorkflowTemplate;

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

const makeStep = (partial: Partial<WorkflowStep> = {}): WorkflowStep =>
  ({
    id: 'step-1',
    instanceId: 'instance-1',
    templateStepId: 'template-step-1',
    status: WorkflowStepStatus.OPEN,
    checklistProgress: [],
    isEstimation: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  }) as WorkflowStep;

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
  }) as WorkflowInstance;

const makeInstancesRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
});

const makeStepsRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const makeTemplatesRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
});

const makeClientsRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
});

const makeQueue = () => ({
  add: jest.fn(),
  process: jest.fn(),
});

const makeDeadlineCalculator = () => ({
  calculate: jest.fn(),
});

describe('WorkflowInstancesService', () => {
  let service: WorkflowInstancesService;
  let instancesRepo: ReturnType<typeof makeInstancesRepo>;
  let stepsRepo: ReturnType<typeof makeStepsRepo>;
  let templatesRepo: ReturnType<typeof makeTemplatesRepo>;
  let clientsRepo: ReturnType<typeof makeClientsRepo>;
  let queue: ReturnType<typeof makeQueue>;
  let deadlineCalculator: ReturnType<typeof makeDeadlineCalculator>;

  beforeEach(() => {
    instancesRepo = makeInstancesRepo();
    stepsRepo = makeStepsRepo();
    templatesRepo = makeTemplatesRepo();
    clientsRepo = makeClientsRepo();
    queue = makeQueue();
    deadlineCalculator = makeDeadlineCalculator();
    service = new WorkflowInstancesService(
      instancesRepo as any,
      stepsRepo as any,
      templatesRepo as any,
      clientsRepo as any,
      queue as any,
      deadlineCalculator as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInstanceFromTemplate', () => {
    it('should create a workflow instance with steps from template', async () => {
      const template = makeTemplate({
        steps: [{ id: 'ts-1', order: 1 } as any, { id: 'ts-2', order: 2 } as any],
      });
      const client = makeClient();
      const savedInstance = makeInstance();
      const fullInstance = makeInstance({
        steps: [makeStep({ id: 's1', templateStepId: 'ts-1' }), makeStep({ id: 's2', templateStepId: 'ts-2' })],
      });

      templatesRepo.findOne.mockResolvedValue(template);
      clientsRepo.findOne.mockResolvedValue(client);
      instancesRepo.create.mockReturnValue(savedInstance);
      instancesRepo.save.mockResolvedValue(savedInstance);
      stepsRepo.create.mockReturnValue(makeStep());
      stepsRepo.save.mockResolvedValue([makeStep()]);
      instancesRepo.findOne.mockResolvedValue(fullInstance);

      const result = await service.createInstanceFromTemplate(
        { templateId: 'template-1', clientId: 'client-1' },
        'tenant-1',
      );

      expect(result.id).toBe('instance-1');
      expect(result.steps).toHaveLength(2);
      expect(templatesRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'template-1', tenantId: 'tenant-1' },
        relations: ['steps'],
      });
    });

    it('should throw NotFoundException when template does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createInstanceFromTemplate({ templateId: 'no-template', clientId: 'client-1' }, 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when client does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(makeTemplate());
      clientsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createInstanceFromTemplate({ templateId: 'template-1', clientId: 'no-client' }, 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByClient', () => {
    it('should return instances for a specific client', async () => {
      const instances = [makeInstance({ id: 'i1' }), makeInstance({ id: 'i2' })];
      instancesRepo.find.mockResolvedValue(instances);

      const result = await service.findAllByClient('client-1', 'tenant-1');
      expect(result).toHaveLength(2);
      expect(instancesRepo.find).toHaveBeenCalledWith({
        where: { clientId: 'client-1', tenantId: 'tenant-1' },
        relations: ['steps'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should return empty array when no instances exist', async () => {
      instancesRepo.find.mockResolvedValue([]);
      const result = await service.findAllByClient('client-1', 'tenant-1');
      expect(result).toEqual([]);
    });

    it('should apply pagination correctly', async () => {
      instancesRepo.find.mockResolvedValue([]);
      await service.findAllByClient('client-1', 'tenant-1', 3, 10);

      expect(instancesRepo.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
    });
  });

  describe('findAllByTenant', () => {
    it('should return all instances for a tenant', async () => {
      const instances = [makeInstance(), makeInstance({ id: 'i2', clientId: 'client-2' })];
      instancesRepo.find.mockResolvedValue(instances);

      const result = await service.findAllByTenant('tenant-1');
      expect(result).toHaveLength(2);
    });

    it('should apply default pagination', async () => {
      instancesRepo.find.mockResolvedValue([]);
      await service.findAllByTenant('tenant-1');

      expect(instancesRepo.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
    });
  });

  describe('findOne', () => {
    it('should return a single workflow instance', async () => {
      const instance = makeInstance();
      instancesRepo.findOne.mockResolvedValue(instance);

      const result = await service.findOne('instance-1', 'tenant-1');
      expect(result.id).toBe('instance-1');
      expect(instancesRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'instance-1', tenantId: 'tenant-1' },
        relations: ['steps'],
      });
    });

    it('should throw NotFoundException when instance does not exist', async () => {
      instancesRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('no-instance', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStepStatus', () => {
    it('should update a step status', async () => {
      const step = makeStep({ status: WorkflowStepStatus.OPEN });
      stepsRepo.findOne.mockResolvedValue(step);
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.IN_PROGRESS });

      const result = await service.updateStepStatus('step-1', WorkflowStepStatus.IN_PROGRESS, 'tenant-1');
      expect(result.status).toBe(WorkflowStepStatus.IN_PROGRESS);
    });

    it('should throw NotFoundException when step does not exist', async () => {
      stepsRepo.findOne.mockResolvedValue(null);
      await expect(service.updateStepStatus('no-step', WorkflowStepStatus.DONE, 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update assignedUserId when provided', async () => {
      const step = makeStep();
      stepsRepo.findOne.mockResolvedValue(step);
      stepsRepo.save.mockResolvedValue({ ...step, assignedUserId: 'user-2', status: WorkflowStepStatus.IN_PROGRESS });

      const result = await service.updateStepStatus('step-1', WorkflowStepStatus.IN_PROGRESS, 'tenant-1', 'user-2');
      expect(result.assignedUserId).toBe('user-2');
    });
  });

  describe('startStep', () => {
    it('should start a step and assign to user', async () => {
      const step = makeStep({ status: WorkflowStepStatus.OPEN });
      stepsRepo.findOne.mockResolvedValue(step);
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.IN_PROGRESS, assignedUserId: 'user-1' });

      const result = await service.startStep('step-1', 'tenant-1', 'user-1');
      expect(result.status).toBe(WorkflowStepStatus.IN_PROGRESS);
      expect(result.assignedUserId).toBe('user-1');
    });
  });

  describe('completeStep', () => {
    it('should complete a step', async () => {
      const step = makeStep({ status: WorkflowStepStatus.IN_PROGRESS });
      stepsRepo.findOne.mockResolvedValue(step);
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.DONE });

      const result = await service.completeStep('step-1', 'tenant-1');
      expect(result.status).toBe(WorkflowStepStatus.DONE);
    });

    it('should save estimation value when provided', async () => {
      const step = makeStep({ status: WorkflowStepStatus.IN_PROGRESS });
      stepsRepo.findOne.mockResolvedValue(step);
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.DONE, estimationValue: 8 });

      const result = await service.completeStep('step-1', 'tenant-1', 8);
      expect(result.estimationValue).toBe(8);
    });
  });
});
