import { WorkflowStepStatus } from '../../database/entities/workflow-step.entity';

export class StepCommentResponseDto {
  id!: string;
  content!: string;
  userId!: string;
  createdAt!: Date;
}

export class StepExecutionResponseDto {
  id!: string;
  stepNumber!: number;
  templateStepId!: string;
  instanceId!: string;
  status!: WorkflowStepStatus;
  assignedUserId?: string;
  dueDate?: Date;
  completedAt?: Date;
  estimationValue?: number;
  isEstimation!: boolean;
  estimationReason?: string;
  checklistProgress!: any[];
  comments!: StepCommentResponseDto[];
  totalComments!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class WorkflowProgressResponseDto {
  instanceId!: string;
  totalSteps!: number;
  completedSteps!: number;
  blockedSteps!: number;
  inProgressSteps!: number;
  percentComplete!: number;
  steps!: StepExecutionResponseDto[];
}
