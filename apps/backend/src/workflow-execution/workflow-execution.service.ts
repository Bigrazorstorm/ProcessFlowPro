import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowStep, WorkflowStepStatus } from '../database/entities/workflow-step.entity';
import { StepComment } from '../database/entities/step-comment.entity';
import { WorkflowInstance } from '../database/entities/workflow-instance.entity';
import { User } from '../database/entities/user.entity';
import {
  UpdateStepStatusDto,
  AssignStepDto,
  LogTimeDto,
  AddStepCommentDto,
  EstimationDto,
  ApproveStepDto,
  RejectStepDto,
  ShiftStepDateDto,
} from './dto/step-execution.dto';
import {
  StepExecutionResponseDto,
  StepCommentResponseDto,
  WorkflowProgressResponseDto,
} from './dto/step-execution-response.dto';
import { WorkflowTriggersService } from '../workflow-triggers/workflow-triggers.service';
import { TriggerEvent } from '../workflow-triggers/dto/workflow-trigger.dto';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    @InjectRepository(WorkflowStep)
    private readonly stepsRepository: Repository<WorkflowStep>,
    @InjectRepository(StepComment)
    private readonly commentsRepository: Repository<StepComment>,
    @InjectRepository(WorkflowInstance)
    private readonly instancesRepository: Repository<WorkflowInstance>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Optional() private readonly triggersService?: WorkflowTriggersService,
  ) {}

  /**
   * Get step with all comments loaded
   */
  async getStepDetail(stepId: string, tenantId: string): Promise<StepExecutionResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance', 'comments'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    return this.toResponseDto(step);
  }

  /**
   * Update step status with validation
   */
  async updateStepStatus(
    stepId: string,
    tenantId: string,
    dto: UpdateStepStatusDto,
    userId: string,
  ): Promise<StepExecutionResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    // Validate status transition
    this.validateStatusTransition(step.status, dto.status);

    // Update status
    step.status = dto.status as any;
    if (dto.status === WorkflowStepStatus.DONE) {
      step.completedAt = new Date();
    }

    const updatedStep = await this.stepsRepository.save(step);

    // Log status change as comment
    if (dto.reason) {
      const comment = this.commentsRepository.create();
      comment.stepId = stepId as any;
      comment.userId = userId as any;
      comment.content = `Status changed to ${dto.status}: ${dto.reason}`;
      await this.commentsRepository.save(comment);
    }

    // Fire workflow triggers based on new status
    if (this.triggersService) {
      const triggerEvent =
        dto.status === WorkflowStepStatus.DONE
          ? TriggerEvent.STEP_COMPLETED
          : dto.status === WorkflowStepStatus.IN_PROGRESS
            ? TriggerEvent.STEP_STARTED
            : undefined;

      if (triggerEvent) {
        void this.triggersService.fire(triggerEvent, {
          tenantId,
          userId,
          stepId,
          instanceId: step.instanceId,
        });
      }
    }

    const fullStep = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['comments'],
    });

    return this.toResponseDto(fullStep!);
  }

  /**
   * Assign step to a user
   */
  async assignStep(stepId: string, tenantId: string, dto: AssignStepDto): Promise<StepExecutionResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    // Verify user exists in tenant
    const user = await this.usersRepository.findOne({
      where: { id: dto.userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found in tenant');
    }

    step.assignedUserId = dto.userId as any;
    const updatedStep = await this.stepsRepository.save(step);

    const fullStep = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['comments'],
    });

    return this.toResponseDto(fullStep!);
  }

  /**
   * Start a step (move to IN_PROGRESS)
   */
  async startStep(stepId: string, tenantId: string, userId: string): Promise<StepExecutionResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    // Can only start from OPEN or SHIFTED status
    if (![WorkflowStepStatus.OPEN, WorkflowStepStatus.SHIFTED].includes(step.status)) {
      throw new BadRequestException(`Cannot start step with status ${step.status}`);
    }

    step.status = WorkflowStepStatus.IN_PROGRESS as any;
    if (!step.assignedUserId) {
      step.assignedUserId = userId as any;
    }

    const updatedStep = await this.stepsRepository.save(step);

    // Fire step.started trigger
    void this.triggersService?.fire(TriggerEvent.STEP_STARTED, {
      tenantId,
      userId,
      stepId,
      instanceId: step.instanceId,
    });

    const fullStep = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['comments'],
    });

    return this.toResponseDto(fullStep!);
  }

  /**
   * Log time spent on a step
   */
  async logTime(stepId: string, tenantId: string, dto: LogTimeDto, userId: string): Promise<StepExecutionResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance', 'comments'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    // Update estimation value if it's an estimation field
    if (step.estimationValue) {
      step.estimationValue = dto.hours;
    } else {
      step.estimationValue = dto.hours;
    }

    await this.stepsRepository.save(step);

    // Add comment for time log
    const timeComment = this.commentsRepository.create();
    timeComment.stepId = stepId as any;
    timeComment.userId = userId as any;
    timeComment.content = `Logged ${dto.hours} hours${dto.notes ? `: ${dto.notes}` : ''}`;
    await this.commentsRepository.save(timeComment);

    const fullStep = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['comments'],
    });

    return this.toResponseDto(fullStep!);
  }

  /**
   * Set estimation for a step
   */
  async setEstimation(
    stepId: string,
    tenantId: string,
    dto: EstimationDto,
    userId: string,
  ): Promise<StepExecutionResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance', 'comments'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    step.isEstimation = true;
    step.estimationValue = dto.estimationValue;
    step.estimationReason = dto.reason;
    step.status = WorkflowStepStatus.PENDING_APPROVAL as any;

    await this.stepsRepository.save(step);

    // Log estimation as comment
    const estimationComment = this.commentsRepository.create();
    estimationComment.stepId = stepId as any;
    estimationComment.userId = userId as any;
    estimationComment.content = `Estimation set: ${dto.estimationValue}${dto.reason ? ` - ${dto.reason}` : ''}`;
    await this.commentsRepository.save(estimationComment);

    const fullStep = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['comments'],
    });

    return this.toResponseDto(fullStep!);
  }

  /**
   * Approve a step (move from PENDING_APPROVAL to DONE)
   */
  async approveStep(
    stepId: string,
    tenantId: string,
    dto: ApproveStepDto,
    userId: string,
  ): Promise<StepExecutionResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance', 'comments'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    if (step.status !== WorkflowStepStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Only steps in ${WorkflowStepStatus.PENDING_APPROVAL} can be approved`);
    }

    step.status = WorkflowStepStatus.DONE as any;
    step.completedAt = new Date();

    await this.stepsRepository.save(step);

    // Log approval as comment
    const approvalComment = this.commentsRepository.create();
    approvalComment.stepId = stepId as any;
    approvalComment.userId = userId as any;
    approvalComment.content = `Step approved${dto.notes ? ` - ${dto.notes}` : ''}`;
    await this.commentsRepository.save(approvalComment);

    // Fire step.completed trigger
    void this.triggersService?.fire(TriggerEvent.STEP_COMPLETED, {
      tenantId,
      userId,
      stepId,
      instanceId: step.instanceId,
    });

    const fullStep = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['comments'],
    });

    return this.toResponseDto(fullStep!);
  }

  /**
   * Reject a step (move back to IN_PROGRESS with reason)
   */
  async rejectStep(
    stepId: string,
    tenantId: string,
    dto: RejectStepDto,
    userId: string,
  ): Promise<StepExecutionResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance', 'comments'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    if (step.status !== WorkflowStepStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Only steps in ${WorkflowStepStatus.PENDING_APPROVAL} can be rejected`);
    }

    step.status = WorkflowStepStatus.IN_PROGRESS as any;
    step.isEstimation = false;

    await this.stepsRepository.save(step);

    // Log rejection as comment
    const rejectionComment = this.commentsRepository.create();
    rejectionComment.stepId = stepId as any;
    rejectionComment.userId = userId as any;
    rejectionComment.content = `Step rejected: ${dto.reason}`;
    await this.commentsRepository.save(rejectionComment);

    const fullStep = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['comments'],
    });

    return this.toResponseDto(fullStep!);
  }

  /**
   * Add a comment to a step
   */
  async addComment(
    stepId: string,
    tenantId: string,
    dto: AddStepCommentDto,
    userId: string,
  ): Promise<StepCommentResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    const comment = this.commentsRepository.create();
    comment.stepId = stepId as any;
    comment.userId = userId as any;
    comment.content = dto.content;

    const saved = await this.commentsRepository.save(comment);
    return this.commentToResponseDto(saved);
  }

  /**
   * Shift the due date of a step (for drag & drop calendar rescheduling)
   */
  async shiftStepDate(stepId: string, tenantId: string, dto: ShiftStepDateDto): Promise<StepExecutionResponseDto> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    if (step.status === WorkflowStepStatus.DONE || step.status === WorkflowStepStatus.SKIPPED) {
      throw new BadRequestException('Cannot shift the date of a completed or skipped step');
    }

    step.dueDate = new Date(dto.newDueDate);
    step.status = WorkflowStepStatus.SHIFTED;
    await this.stepsRepository.save(step);

    const fullStep = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance', 'comments'],
    });

    return this.toResponseDto(fullStep!);
  }

  /**
   * Get all comments for a step
   */
  async getStepComments(stepId: string, tenantId: string): Promise<StepCommentResponseDto[]> {
    const step = await this.stepsRepository.findOne({
      where: { id: stepId },
      relations: ['instance'],
    });

    if (!step || step.instance.tenantId !== tenantId) {
      throw new NotFoundException('Step not found');
    }

    const comments = await this.commentsRepository.find({
      where: { stepId },
      order: { createdAt: 'DESC' },
    });

    return comments.map((c) => this.commentToResponseDto(c));
  }

  /**
   * Get workflow instance progress/status
   */
  async getWorkflowProgress(instanceId: string, tenantId: string): Promise<WorkflowProgressResponseDto> {
    const instance = await this.instancesRepository.findOne({
      where: { id: instanceId, tenantId },
      relations: ['steps'],
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    const steps = instance.steps || [];
    const totalSteps = steps.length;
    const completedSteps = steps.filter((s) => s.status === WorkflowStepStatus.DONE).length;
    const blockedSteps = steps.filter((s) => s.status === WorkflowStepStatus.SHIFTED).length;
    const inProgressSteps = steps.filter((s) => s.status === WorkflowStepStatus.IN_PROGRESS).length;
    const percentComplete = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Load full step details with comments
    const detailedSteps = await Promise.all(
      steps.map((step) =>
        this.stepsRepository.findOne({
          where: { id: step.id },
          relations: ['comments'],
        }),
      ),
    );

    return {
      instanceId,
      totalSteps,
      completedSteps,
      blockedSteps,
      inProgressSteps,
      percentComplete,
      steps: detailedSteps.map((s) => this.toResponseDto(s!)),
    };
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(currentStatus: WorkflowStepStatus, newStatus: WorkflowStepStatus): void {
    const allowedTransitions: Record<WorkflowStepStatus, WorkflowStepStatus[]> = {
      [WorkflowStepStatus.OPEN]: [
        WorkflowStepStatus.IN_PROGRESS,
        WorkflowStepStatus.SKIPPED,
        WorkflowStepStatus.SHIFTED,
      ],
      [WorkflowStepStatus.IN_PROGRESS]: [
        WorkflowStepStatus.PENDING_APPROVAL,
        WorkflowStepStatus.DONE,
        WorkflowStepStatus.REJECTED,
        WorkflowStepStatus.SHIFTED,
      ],
      [WorkflowStepStatus.PENDING_APPROVAL]: [
        WorkflowStepStatus.DONE,
        WorkflowStepStatus.REJECTED,
        WorkflowStepStatus.IN_PROGRESS,
      ],
      [WorkflowStepStatus.DONE]: [WorkflowStepStatus.REJECTED, WorkflowStepStatus.IN_PROGRESS],
      [WorkflowStepStatus.SHIFTED]: [WorkflowStepStatus.OPEN, WorkflowStepStatus.IN_PROGRESS],
      [WorkflowStepStatus.SKIPPED]: [WorkflowStepStatus.OPEN, WorkflowStepStatus.IN_PROGRESS],
      [WorkflowStepStatus.REJECTED]: [WorkflowStepStatus.IN_PROGRESS, WorkflowStepStatus.OPEN],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Convert step to response DTO
   */
  private toResponseDto(step: WorkflowStep): StepExecutionResponseDto {
    return {
      id: step.id,
      stepNumber: 0, // Would need to query TemplateStep for this
      templateStepId: step.templateStepId,
      instanceId: step.instanceId,
      status: step.status,
      assignedUserId: step.assignedUserId,
      dueDate: step.dueDate,
      completedAt: step.completedAt,
      estimationValue: step.estimationValue,
      isEstimation: step.isEstimation,
      estimationReason: step.estimationReason,
      checklistProgress: step.checklistProgress,
      comments: (step.comments || []).map((c) => this.commentToResponseDto(c)),
      totalComments: step.comments?.length || 0,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
    };
  }

  /**
   * Convert comment to response DTO
   */
  private commentToResponseDto(comment: StepComment): StepCommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      createdAt: comment.createdAt,
    };
  }
}
