import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowTemplatesService } from './workflow-templates.service';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';
import { TemplateStep, WorkflowStepType } from '../database/entities/template-step.entity';
import { CreateWorkflowTemplateDto } from './dto/create-workflow-template.dto';

const makeTemplatesRepo = (overrides: Partial<Record<string, jest.Mock>> = {}) => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  ...overrides,
});

const makeStepsRepo = (overrides: Partial<Record<string, jest.Mock>> = {}) => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  ...overrides,
});

const makeStep = (partial: Partial<TemplateStep> = {}): TemplateStep =>
  ({
    id: 'step-1',
    templateId: 'template-1',
    type: WorkflowStepType.TASK,
    name: 'Lohnabrechnung erstellen',
    order: 1,
    description: undefined,
    checklist: [],
    tips: undefined,
    errors: [],
    deadlineRule: undefined,
    assignedRole: undefined,
    estimationAllowed: false,
    blocksNext: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  }) as TemplateStep;

const makeTemplate = (partial: Partial<WorkflowTemplate> = {}): WorkflowTemplate =>
  ({
    id: 'template-1',
    tenantId: 'tenant-1',
    name: 'Lohnabrechnung Monatlich',
    industry: 'Steuerberatung',
    description: 'Monatlicher Lohnabrechnungsprozess',
    isActive: true,
    steps: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...partial,
  }) as WorkflowTemplate;

describe('WorkflowTemplatesService', () => {
  let service: WorkflowTemplatesService;
  let templatesRepo: ReturnType<typeof makeTemplatesRepo>;
  let stepsRepo: ReturnType<typeof makeStepsRepo>;

  beforeEach(() => {
    templatesRepo = makeTemplatesRepo();
    stepsRepo = makeStepsRepo();
    service = new WorkflowTemplatesService(templatesRepo as any, stepsRepo as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateWorkflowTemplateDto = {
      name: 'Neues Template',
      industry: 'Logistik',
      description: 'Ein neues Workflow-Template',
      steps: [],
    };

    it('should create and return a template without steps', async () => {
      templatesRepo.findOne.mockResolvedValue(null);
      const created = makeTemplate({ name: 'Neues Template' });
      templatesRepo.create.mockReturnValue(created);
      templatesRepo.save.mockResolvedValue(created);

      const result = await service.create(createDto, 'tenant-1');

      expect(templatesRepo.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name, tenantId: 'tenant-1' },
      });
      expect(result.name).toBe('Neues Template');
      expect(result.steps).toHaveLength(0);
    });

    it('should throw ConflictException when template with same name exists', async () => {
      templatesRepo.findOne.mockResolvedValue(makeTemplate());

      await expect(service.create(createDto, 'tenant-1')).rejects.toThrow(ConflictException);
    });

    it('should create steps when provided', async () => {
      const dtoWithSteps: CreateWorkflowTemplateDto = {
        ...createDto,
        steps: [
          { name: 'Schritt 1', type: WorkflowStepType.TASK },
          { name: 'Schritt 2', type: WorkflowStepType.APPROVAL },
        ],
      };

      templatesRepo.findOne.mockResolvedValue(null);
      const savedTemplate = makeTemplate({ id: 'template-new' });
      templatesRepo.create.mockReturnValue(savedTemplate);
      templatesRepo.save.mockResolvedValue(savedTemplate);

      const step1 = makeStep({ id: 'step-a', name: 'Schritt 1', order: 1 });
      const step2 = makeStep({ id: 'step-b', name: 'Schritt 2', order: 2, type: WorkflowStepType.APPROVAL });
      stepsRepo.create.mockReturnValueOnce(step1).mockReturnValueOnce(step2);
      stepsRepo.save.mockResolvedValue([step1, step2]);

      const result = await service.create(dtoWithSteps, 'tenant-1');

      expect(stepsRepo.create).toHaveBeenCalledTimes(2);
      expect(stepsRepo.save).toHaveBeenCalled();
      expect(result.steps).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it('should return all templates for a tenant', async () => {
      const templates = [makeTemplate({ id: '1' }), makeTemplate({ id: '2', name: 'Zweites Template' })];
      templatesRepo.find.mockResolvedValue(templates);

      const result = await service.findAll('tenant-1');

      expect(templatesRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        relations: ['steps'],
        order: expect.any(Object),
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no templates exist', async () => {
      templatesRepo.find.mockResolvedValue([]);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single template with sorted steps', async () => {
      const step2 = makeStep({ id: 'step-2', order: 2, name: 'Zweiter Schritt' });
      const step1 = makeStep({ id: 'step-1', order: 1, name: 'Erster Schritt' });
      const template = makeTemplate({ steps: [step2, step1] });
      templatesRepo.findOne.mockResolvedValue(template);

      const result = await service.findOne('template-1', 'tenant-1');

      expect(result.id).toBe('template-1');
      expect(result.steps[0].order).toBe(1);
      expect(result.steps[1].order).toBe(2);
    });

    it('should throw NotFoundException when template does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('no-such-id', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the template', async () => {
      const template = makeTemplate();
      templatesRepo.findOne.mockResolvedValue(template);
      templatesRepo.save.mockResolvedValue({ ...template, name: 'Umbenanntes Template' });

      const result = await service.update('template-1', { name: 'Umbenanntes Template' }, 'tenant-1');

      expect(templatesRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Umbenanntes Template');
    });

    it('should throw NotFoundException when template does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(null);

      await expect(service.update('no-such-id', { name: 'X' }, 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should remove an existing template', async () => {
      const template = makeTemplate();
      templatesRepo.findOne.mockResolvedValue(template);
      templatesRepo.remove.mockResolvedValue(template);

      await expect(service.delete('template-1', 'tenant-1')).resolves.toBeUndefined();
      expect(templatesRepo.remove).toHaveBeenCalledWith(template);
    });

    it('should throw NotFoundException when template does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('no-such-id', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addStep', () => {
    it('should add a step to an existing template', async () => {
      const template = makeTemplate({ steps: [makeStep()] });
      templatesRepo.findOne.mockResolvedValue(template);
      const newStep = makeStep({ id: 'step-new', order: 2, name: 'Neuer Schritt' });
      stepsRepo.create.mockReturnValue(newStep);
      stepsRepo.save.mockResolvedValue(newStep);

      const result = await service.addStep(
        'template-1',
        { name: 'Neuer Schritt', type: WorkflowStepType.TASK },
        'tenant-1',
      );

      expect(stepsRepo.create).toHaveBeenCalledWith(expect.objectContaining({ order: 2 }));
      expect(result.name).toBe('Neuer Schritt');
    });

    it('should set order to 1 when template has no steps', async () => {
      const template = makeTemplate({ steps: [] });
      templatesRepo.findOne.mockResolvedValue(template);
      const newStep = makeStep({ id: 'step-first', order: 1 });
      stepsRepo.create.mockReturnValue(newStep);
      stepsRepo.save.mockResolvedValue(newStep);

      await service.addStep('template-1', { name: 'Erster Schritt', type: WorkflowStepType.TASK }, 'tenant-1');

      expect(stepsRepo.create).toHaveBeenCalledWith(expect.objectContaining({ order: 1 }));
    });

    it('should throw NotFoundException when template does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addStep('no-such-id', { name: 'Step', type: WorkflowStepType.TASK }, 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStep', () => {
    it('should update a step in an existing template', async () => {
      templatesRepo.findOne.mockResolvedValue(makeTemplate());
      const step = makeStep();
      stepsRepo.findOne.mockResolvedValue(step);
      stepsRepo.save.mockResolvedValue({ ...step, name: 'Aktualisierter Schritt' });

      const result = await service.updateStep('template-1', 'step-1', { name: 'Aktualisierter Schritt' }, 'tenant-1');

      expect(result.name).toBe('Aktualisierter Schritt');
    });

    it('should throw NotFoundException when template does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(null);

      await expect(service.updateStep('no-such-id', 'step-1', { name: 'X' }, 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when step does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(makeTemplate());
      stepsRepo.findOne.mockResolvedValue(null);

      await expect(service.updateStep('template-1', 'no-such-step', { name: 'X' }, 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteStep', () => {
    it('should delete a step and reorder remaining steps', async () => {
      templatesRepo.findOne.mockResolvedValue(makeTemplate());
      const step = makeStep();
      stepsRepo.findOne.mockResolvedValue(step);
      stepsRepo.remove.mockResolvedValue(step);

      const remaining = [makeStep({ id: 'step-2', order: 2 }), makeStep({ id: 'step-3', order: 3 })];
      stepsRepo.find.mockResolvedValue(remaining);
      stepsRepo.save.mockResolvedValue(remaining);

      await expect(service.deleteStep('template-1', 'step-1', 'tenant-1')).resolves.toBeUndefined();

      expect(stepsRepo.remove).toHaveBeenCalledWith(step);
      // Verify reordering: steps should be saved with updated order values
      const saveArg = stepsRepo.save.mock.calls[0][0];
      expect(saveArg[0].order).toBe(1);
      expect(saveArg[1].order).toBe(2);
    });

    it('should throw NotFoundException when template does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteStep('no-such-id', 'step-1', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when step does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(makeTemplate());
      stepsRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteStep('template-1', 'no-such-step', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderSteps', () => {
    it('should reorder steps according to provided ids', async () => {
      templatesRepo.findOne.mockResolvedValue(makeTemplate());
      const step1 = makeStep({ id: 'step-a', order: 1 });
      const step2 = makeStep({ id: 'step-b', order: 2 });
      stepsRepo.find.mockResolvedValue([step1, step2]);
      stepsRepo.save.mockResolvedValue([step2, step1]);

      const result = await service.reorderSteps('template-1', ['step-b', 'step-a'], 'tenant-1');

      expect(stepsRepo.save).toHaveBeenCalled();
      // step-b should now have order 1, step-a order 2
      expect(step2.order).toBe(1);
      expect(step1.order).toBe(2);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when template does not exist', async () => {
      templatesRepo.findOne.mockResolvedValue(null);

      await expect(service.reorderSteps('no-such-id', ['step-a'], 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when step id not found', async () => {
      templatesRepo.findOne.mockResolvedValue(makeTemplate());
      stepsRepo.find.mockResolvedValue([makeStep({ id: 'step-a' })]);

      await expect(service.reorderSteps('template-1', ['step-nonexistent'], 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when step count does not match', async () => {
      templatesRepo.findOne.mockResolvedValue(makeTemplate());
      const step1 = makeStep({ id: 'step-a' });
      const step2 = makeStep({ id: 'step-b' });
      stepsRepo.find.mockResolvedValue([step1, step2]);

      // Only provide one of the two step ids
      await expect(service.reorderSteps('template-1', ['step-a'], 'tenant-1')).rejects.toThrow(BadRequestException);
    });
  });
});
