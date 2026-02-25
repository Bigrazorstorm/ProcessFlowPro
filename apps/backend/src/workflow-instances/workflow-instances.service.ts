import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { WorkflowInstance, WorkflowInstanceStatus } from '../database/entities/workflow-instance.entity';
import { WorkflowStep, WorkflowStepStatus } from '../database/entities/workflow-step.entity';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';
import { Client } from '../database/entities/client.entity';
import { DeadlineCalculatorService } from '../deadline-calculator/deadline-calculator.service';
import { CreateWorkflowInstanceDto } from './dto/create-workflow-instance.dto';
import { WorkflowInstanceResponseDto, WorkflowStepResponseDto } from './dto/workflow-instance-response.dto';
import { endOfMonth } from 'date-fns';

@Injectable()
export class WorkflowInstancesService {
  constructor(
    @InjectRepository(WorkflowInstance)
    private readonly instancesRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private readonly stepsRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowTemplate)
    private readonly templatesRepository: Repository<WorkflowTemplate>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectQueue('workflow-instances')
    private readonly instanceQueue: Queue,
    private readonly deadlineCalculator: DeadlineCalculatorService,
  ) {}

  /**
   * Create a workflow instance from a template for a specific client
   */
  async createInstanceFromTemplate(
    dto: CreateWorkflowInstanceDto,
    tenantId: string,
  ): Promise<WorkflowInstanceResponseDto> {
    // Verify template exists in tenant
    const template = await this.templatesRepository.findOne({
      where: { id: dto.templateId, tenantId },
      relations: ['steps'],
    });

    if (!template) {
      throw new NotFoundException('Workflow template not found');
    }

    // Verify client exists in tenant
    const client = await this.clientsRepository.findOne({
      where: { id: dto.clientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Get current period (year and month)
    const now = new Date();
    const periodYear = now.getFullYear();
    const periodMonth = now.getMonth() + 1;

    // Create instance
    const instance = this.instancesRepository.create();
    instance.tenantId = tenantId as any;
    instance.clientId = dto.clientId as any;
    instance.templateId = dto.templateId as any;
    instance.status = (dto.status || WorkflowInstanceStatus.ACTIVE) as any;
    instance.periodYear = periodYear;
    instance.periodMonth = periodMonth;

    const savedInstance = await this.instancesRepository.save(instance);

    // Create workflow steps from template steps
    const steps = template.steps
      .sort((a, b) => a.order - b.order)
      .map((templateStep, index) => {
        const step = this.stepsRepository.create();
        step.instanceId = savedInstance.id as any;
        step.templateStepId = templateStep.id as any;
        step.status = WorkflowStepStatus.OPEN as any;
        return step;
      });

    await this.stepsRepository.save(steps);

    // Reload with steps for response
    const fullInstance = await this.instancesRepository.findOne({
      where: { id: savedInstance.id },
      relations: ['steps'],
    });

    return this.toResponseDto(fullInstance!);
  }

  /**
   * Get all workflow instances for a client (with pagination support)
   */
  async findAllByClient(
    clientId: string,
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<WorkflowInstanceResponseDto[]> {
    const instances = await this.instancesRepository.find({
      where: { clientId, tenantId },
      relations: ['steps'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return instances.map((instance) => this.toResponseDto(instance));
  }

  /**
   * Get all workflow instances in tenant (for admin/dashboard view)
   */
  async findAllByTenant(tenantId: string, page = 1, limit = 20): Promise<WorkflowInstanceResponseDto[]> {
    const instances = await this.instancesRepository.find({
      where: { tenantId },
      relations: ['steps'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return instances.map((instance) => this.toResponseDto(instance));
  }

  /**
   * Get single instance
   */
  async findOne(id: string, tenantId: string): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.instancesRepository.findOne({
      where: { id, tenantId },
      relations: ['steps'],
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    return this.toResponseDto(instance);
  }

  /**
   * Schedule monthly instance creation for all active templates and clients
   * This is typically called by a Cron job or Bull queue scheduler
   */
  async scheduleMonthlyInstances(tenantId?: string): Promise<number> {
    // Get all active clients
    const whereClause = tenantId ? { tenantId, isActive: true } : { isActive: true };
    const clients = await this.clientsRepository.find({
      where: whereClause,
    });

    let createdCount = 0;

    for (const client of clients) {
      // Get active templates for this tenant/client
      const templates = await this.templatesRepository.find({
        where: {
          tenantId: client.tenantId,
          isActive: true,
        },
        relations: ['steps'],
      });

      for (const template of templates) {
        try {
          // Check if instance already exists for this month
          const currentMonth = new Date();
          const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
          const monthEnd = endOfMonth(currentMonth);

          const existingInstance = await this.instancesRepository.findOne({
            where: {
              clientId: client.id,
              templateId: template.id,
              createdAt: undefined, // Will check manually below
            },
          });

          // For now, always create (production would check for monthly duplicates)
          await this.createInstanceFromTemplate(
            {
              templateId: template.id,
              clientId: client.id,
            },
            client.tenantId,
          );

          createdCount++;
        } catch (error) {
          // Log error but continue with other templates
          console.error(`Failed to create instance for template ${template.id}, client ${client.id}:`, error);
        }
      }
    }

    return createdCount;
  }

  /**
   * Update workflow step status
   */
  async updateStepStatus(
    stepId: string,
    status: WorkflowStepStatus,
    tenantId: string,
    assignedUserId?: string,
    estimationValue?: number,
  ): Promise<WorkflowStepResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
    });

    if (!step) {
      throw new NotFoundException('Workflow step not found');
    }

    step.status = status as any;
    if (assignedUserId) step.assignedUserId = assignedUserId as any;
    if (estimationValue !== undefined) step.estimationValue = estimationValue;

    const updated = await this.stepsRepository.save(step);
    return this.stepToResponseDto(updated);
  }

  /**
   * Start a workflow step (mark as IN_PROGRESS)
   */
  async startStep(stepId: string, tenantId: string, userId: string): Promise<WorkflowStepResponseDto> {
    return this.updateStepStatus(stepId, WorkflowStepStatus.IN_PROGRESS, tenantId, userId);
  }

  /**
   * Complete a workflow step (mark as DONE)
   */
  async completeStep(stepId: string, tenantId: string, estimationValue?: number): Promise<WorkflowStepResponseDto> {
    return this.updateStepStatus(stepId, WorkflowStepStatus.DONE, tenantId, undefined, estimationValue);
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(instance: WorkflowInstance): WorkflowInstanceResponseDto {
    return {
      id: instance.id,
      clientId: instance.clientId,
      templateId: instance.templateId,
      status: instance.status,
      periodYear: instance.periodYear,
      periodMonth: instance.periodMonth,
      steps: (instance.steps || [])
        .sort((a, b) => (a.id > b.id ? 1 : -1)) // Sort by ID for consistency
        .map((step) => this.stepToResponseDto(step)),
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
    };
  }

  /**
   * Convert step entity to response DTO
   */
  private stepToResponseDto(step: WorkflowStep): WorkflowStepResponseDto {
    return {
      id: step.id,
      templateStepId: step.templateStepId,
      status: step.status,
      assignedUserId: step.assignedUserId,
      estimationValue: step.estimationValue,
      dueDate: step.dueDate,
      completedAt: step.completedAt,
      checklistProgress: step.checklistProgress,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
    };
  }
}
