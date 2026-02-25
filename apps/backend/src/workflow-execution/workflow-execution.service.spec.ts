import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowStep, WorkflowStepStatus } from '../database/entities/workflow-step.entity';
import { WorkflowInstance } from '../database/entities/workflow-instance.entity';
import { StepComment } from '../database/entities/step-comment.entity';

const makeTenantId = () => 'tenant-1';

const makeInstance = (partial: Partial<WorkflowInstance> = {}): WorkflowInstance =>
  ({
    id: 'instance-1',
    tenantId: 'tenant-1',
    clientId: 'client-1',
    templateId: 'template-1',
    periodYear: 2026,
    periodMonth: 2,
    status: 'active' as any,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    steps: [],
    ...partial,
  } as WorkflowInstance);

const makeStep = (partial: Partial<WorkflowStep> = {}): WorkflowStep =>
  ({
    id: 'step-1',
    instanceId: 'instance-1',
    templateStepId: 'template-step-1',
    status: WorkflowStepStatus.OPEN,
    assignedUserId: undefined,
    dueDate: undefined,
    completedAt: undefined,
    isEstimation: false,
    estimationValue: undefined,
    estimationReason: undefined,
    checklistProgress: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    instance: makeInstance(),
    comments: [],
    ...partial,
  } as WorkflowStep);

const makeComment = (partial: Partial<StepComment> = {}): StepComment =>
  ({
    id: 'comment-1',
    stepId: 'step-1',
    userId: 'user-1',
    content: 'Test comment',
    createdAt: new Date('2026-01-01'),
    ...partial,
  } as StepComment);

const makeStepsRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

const makeCommentsRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

const makeInstancesRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
});

const makeUsersRepo = () => ({
  findOne: jest.fn(),
});

describe('WorkflowExecutionService', () => {
  let service: WorkflowExecutionService;
  let stepsRepo: ReturnType<typeof makeStepsRepo>;
  let commentsRepo: ReturnType<typeof makeCommentsRepo>;
  let instancesRepo: ReturnType<typeof makeInstancesRepo>;
  let usersRepo: ReturnType<typeof makeUsersRepo>;

  beforeEach(() => {
    stepsRepo = makeStepsRepo();
    commentsRepo = makeCommentsRepo();
    instancesRepo = makeInstancesRepo();
    usersRepo = makeUsersRepo();
    service = new WorkflowExecutionService(
      stepsRepo as any,
      commentsRepo as any,
      instancesRepo as any,
      usersRepo as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStepDetail', () => {
    it('should return step detail when found', async () => {
      const step = makeStep({ comments: [] });
      stepsRepo.findOne.mockResolvedValue(step);

      const result = await service.getStepDetail('step-1', 'tenant-1');
      expect(result.id).toBe('step-1');
    });

    it('should throw NotFoundException when step not found', async () => {
      stepsRepo.findOne.mockResolvedValue(null);
      await expect(service.getStepDetail('no-step', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when step belongs to different tenant', async () => {
      const step = makeStep({ instance: makeInstance({ tenantId: 'other-tenant' }) });
      stepsRepo.findOne.mockResolvedValue(step);
      await expect(service.getStepDetail('step-1', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStepStatus', () => {
    it('should update status from OPEN to IN_PROGRESS', async () => {
      const step = makeStep({ status: WorkflowStepStatus.OPEN, comments: [] });
      stepsRepo.findOne
        .mockResolvedValueOnce(step) // first call with instance relation
        .mockResolvedValueOnce({ ...step, status: WorkflowStepStatus.IN_PROGRESS, comments: [] }); // reload
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.IN_PROGRESS });

      const result = await service.updateStepStatus('step-1', 'tenant-1', { status: WorkflowStepStatus.IN_PROGRESS }, 'user-1');
      expect(result.status).toBe(WorkflowStepStatus.IN_PROGRESS);
    });

    it('should throw BadRequestException on invalid status transition', async () => {
      const step = makeStep({ status: WorkflowStepStatus.OPEN });
      stepsRepo.findOne.mockResolvedValue(step);

      await expect(
        service.updateStepStatus('step-1', 'tenant-1', { status: WorkflowStepStatus.DONE }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set completedAt when transitioning to DONE', async () => {
      const step = makeStep({ status: WorkflowStepStatus.IN_PROGRESS, comments: [] });
      stepsRepo.findOne
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce({ ...step, status: WorkflowStepStatus.DONE, completedAt: new Date(), comments: [] });
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.DONE, completedAt: new Date() });

      const result = await service.updateStepStatus('step-1', 'tenant-1', { status: WorkflowStepStatus.DONE }, 'user-1');
      expect(result.status).toBe(WorkflowStepStatus.DONE);
    });

    it('should create a comment when reason is provided', async () => {
      const step = makeStep({ status: WorkflowStepStatus.OPEN, comments: [] });
      stepsRepo.findOne
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce({ ...step, status: WorkflowStepStatus.IN_PROGRESS, comments: [] });
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.IN_PROGRESS });
      commentsRepo.create.mockReturnValue(makeComment());
      commentsRepo.save.mockResolvedValue(makeComment());

      await service.updateStepStatus('step-1', 'tenant-1', { status: WorkflowStepStatus.IN_PROGRESS, reason: 'Starting now' }, 'user-1');
      expect(commentsRepo.create).toHaveBeenCalled();
      expect(commentsRepo.save).toHaveBeenCalled();
    });
  });

  describe('startStep', () => {
    it('should move step from OPEN to IN_PROGRESS', async () => {
      const step = makeStep({ status: WorkflowStepStatus.OPEN, comments: [] });
      stepsRepo.findOne
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce({ ...step, status: WorkflowStepStatus.IN_PROGRESS, comments: [] });
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.IN_PROGRESS });

      const result = await service.startStep('step-1', 'tenant-1', 'user-1');
      expect(result.status).toBe(WorkflowStepStatus.IN_PROGRESS);
    });

    it('should move step from SHIFTED to IN_PROGRESS', async () => {
      const step = makeStep({ status: WorkflowStepStatus.SHIFTED, comments: [] });
      stepsRepo.findOne
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce({ ...step, status: WorkflowStepStatus.IN_PROGRESS, comments: [] });
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.IN_PROGRESS });

      const result = await service.startStep('step-1', 'tenant-1', 'user-1');
      expect(result.status).toBe(WorkflowStepStatus.IN_PROGRESS);
    });

    it('should throw BadRequestException when step is already DONE', async () => {
      const step = makeStep({ status: WorkflowStepStatus.DONE });
      stepsRepo.findOne.mockResolvedValue(step);

      await expect(service.startStep('step-1', 'tenant-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when step not found', async () => {
      stepsRepo.findOne.mockResolvedValue(null);
      await expect(service.startStep('no-step', 'tenant-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignStep', () => {
    it('should assign step to user', async () => {
      const step = makeStep({ comments: [] });
      stepsRepo.findOne
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce({ ...step, assignedUserId: 'user-2', comments: [] });
      stepsRepo.save.mockResolvedValue({ ...step, assignedUserId: 'user-2' });
      usersRepo.findOne.mockResolvedValue({ id: 'user-2', tenantId: 'tenant-1' });

      const result = await service.assignStep('step-1', 'tenant-1', { userId: 'user-2' });
      expect(result.assignedUserId).toBe('user-2');
    });

    it('should throw NotFoundException when user not found in tenant', async () => {
      const step = makeStep();
      stepsRepo.findOne.mockResolvedValue(step);
      usersRepo.findOne.mockResolvedValue(null);

      await expect(service.assignStep('step-1', 'tenant-1', { userId: 'ghost-user' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('addComment', () => {
    it('should add a comment to a step', async () => {
      const step = makeStep();
      const comment = makeComment({ content: 'Great work!' });
      stepsRepo.findOne.mockResolvedValue(step);
      commentsRepo.create.mockReturnValue(comment);
      commentsRepo.save.mockResolvedValue(comment);

      const result = await service.addComment('step-1', 'tenant-1', { content: 'Great work!' }, 'user-1');
      expect(result.content).toBe('Great work!');
    });

    it('should throw NotFoundException when step not found', async () => {
      stepsRepo.findOne.mockResolvedValue(null);
      await expect(service.addComment('no-step', 'tenant-1', { content: 'test' }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveStep', () => {
    it('should approve step from PENDING_APPROVAL to DONE', async () => {
      const step = makeStep({ status: WorkflowStepStatus.PENDING_APPROVAL, comments: [] });
      stepsRepo.findOne
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce({ ...step, status: WorkflowStepStatus.DONE, completedAt: new Date(), comments: [] });
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.DONE });
      commentsRepo.create.mockReturnValue(makeComment());
      commentsRepo.save.mockResolvedValue(makeComment());

      const result = await service.approveStep('step-1', 'tenant-1', {}, 'user-1');
      expect(result.status).toBe(WorkflowStepStatus.DONE);
    });

    it('should throw BadRequestException when step is not in PENDING_APPROVAL', async () => {
      const step = makeStep({ status: WorkflowStepStatus.OPEN });
      stepsRepo.findOne.mockResolvedValue(step);

      await expect(service.approveStep('step-1', 'tenant-1', {}, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectStep', () => {
    it('should reject step back to IN_PROGRESS', async () => {
      const step = makeStep({ status: WorkflowStepStatus.PENDING_APPROVAL, isEstimation: true, comments: [] });
      stepsRepo.findOne
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce({ ...step, status: WorkflowStepStatus.IN_PROGRESS, isEstimation: false, comments: [] });
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.IN_PROGRESS });
      commentsRepo.create.mockReturnValue(makeComment());
      commentsRepo.save.mockResolvedValue(makeComment());

      const result = await service.rejectStep('step-1', 'tenant-1', { reason: 'Wrong data' }, 'user-1');
      expect(result.status).toBe(WorkflowStepStatus.IN_PROGRESS);
    });

    it('should throw BadRequestException when step is not in PENDING_APPROVAL', async () => {
      const step = makeStep({ status: WorkflowStepStatus.OPEN });
      stepsRepo.findOne.mockResolvedValue(step);

      await expect(service.rejectStep('step-1', 'tenant-1', { reason: 'x' }, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('shiftStepDate', () => {
    it('should shift step due date and set status to SHIFTED', async () => {
      const newDueDate = '2026-03-15';
      const step = makeStep({ status: WorkflowStepStatus.IN_PROGRESS });
      stepsRepo.findOne
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce({ ...step, status: WorkflowStepStatus.SHIFTED, dueDate: new Date(newDueDate), comments: [] });
      stepsRepo.save.mockResolvedValue({ ...step, status: WorkflowStepStatus.SHIFTED });

      const result = await service.shiftStepDate('step-1', 'tenant-1', { newDueDate });
      expect(result.status).toBe(WorkflowStepStatus.SHIFTED);
    });

    it('should throw BadRequestException when step is DONE', async () => {
      const step = makeStep({ status: WorkflowStepStatus.DONE });
      stepsRepo.findOne.mockResolvedValue(step);

      await expect(service.shiftStepDate('step-1', 'tenant-1', { newDueDate: '2026-03-15' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when step is SKIPPED', async () => {
      const step = makeStep({ status: WorkflowStepStatus.SKIPPED });
      stepsRepo.findOne.mockResolvedValue(step);

      await expect(service.shiftStepDate('step-1', 'tenant-1', { newDueDate: '2026-03-15' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStepComments', () => {
    it('should return comments for a step', async () => {
      const step = makeStep();
      const comments = [makeComment({ id: 'c1' }), makeComment({ id: 'c2' })];
      stepsRepo.findOne.mockResolvedValue(step);
      commentsRepo.find.mockResolvedValue(comments);

      const result = await service.getStepComments('step-1', 'tenant-1');
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when step not found', async () => {
      stepsRepo.findOne.mockResolvedValue(null);
      await expect(service.getStepComments('no-step', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWorkflowProgress', () => {
    it('should return workflow progress with correct percentages', async () => {
      const steps = [
        makeStep({ id: 's1', status: WorkflowStepStatus.DONE }),
        makeStep({ id: 's2', status: WorkflowStepStatus.IN_PROGRESS }),
        makeStep({ id: 's3', status: WorkflowStepStatus.OPEN }),
        makeStep({ id: 's4', status: WorkflowStepStatus.SHIFTED }),
      ];
      const instance = makeInstance({ steps });
      instancesRepo.findOne.mockResolvedValue(instance);
      // Mock the detailed step reloads
      stepsRepo.findOne
        .mockResolvedValueOnce({ ...steps[0], comments: [] })
        .mockResolvedValueOnce({ ...steps[1], comments: [] })
        .mockResolvedValueOnce({ ...steps[2], comments: [] })
        .mockResolvedValueOnce({ ...steps[3], comments: [] });

      const result = await service.getWorkflowProgress('instance-1', 'tenant-1');
      expect(result.totalSteps).toBe(4);
      expect(result.completedSteps).toBe(1);
      expect(result.inProgressSteps).toBe(1);
      expect(result.blockedSteps).toBe(1);
      expect(result.percentComplete).toBe(25);
    });

    it('should return 0% when no steps', async () => {
      const instance = makeInstance({ steps: [] });
      instancesRepo.findOne.mockResolvedValue(instance);

      const result = await service.getWorkflowProgress('instance-1', 'tenant-1');
      expect(result.percentComplete).toBe(0);
      expect(result.totalSteps).toBe(0);
    });

    it('should throw NotFoundException when instance not found', async () => {
      instancesRepo.findOne.mockResolvedValue(null);
      await expect(service.getWorkflowProgress('no-instance', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setEstimation', () => {
    it('should set estimation and move step to PENDING_APPROVAL', async () => {
      const step = makeStep({ status: WorkflowStepStatus.IN_PROGRESS, comments: [] });
      stepsRepo.findOne
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce({ ...step, status: WorkflowStepStatus.PENDING_APPROVAL, isEstimation: true, estimationValue: 5, comments: [] });
      stepsRepo.save.mockResolvedValue(step);
      commentsRepo.create.mockReturnValue(makeComment());
      commentsRepo.save.mockResolvedValue(makeComment());

      const result = await service.setEstimation('step-1', 'tenant-1', { estimationValue: 5, reason: 'Complex task' }, 'user-1');
      expect(result.status).toBe(WorkflowStepStatus.PENDING_APPROVAL);
    });
  });

  describe('logTime', () => {
    it('should log time on a step', async () => {
      const step = makeStep({ status: WorkflowStepStatus.IN_PROGRESS, comments: [] });
      stepsRepo.findOne
        .mockResolvedValueOnce(step)
        .mockResolvedValueOnce({ ...step, estimationValue: 3, comments: [makeComment()] });
      stepsRepo.save.mockResolvedValue({ ...step, estimationValue: 3 });
      commentsRepo.create.mockReturnValue(makeComment());
      commentsRepo.save.mockResolvedValue(makeComment());

      const result = await service.logTime('step-1', 'tenant-1', { hours: 3 }, 'user-1');
      expect(result.estimationValue).toBe(3);
    });

    it('should throw NotFoundException when step not found', async () => {
      stepsRepo.findOne.mockResolvedValue(null);
      await expect(service.logTime('no-step', 'tenant-1', { hours: 2 }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
