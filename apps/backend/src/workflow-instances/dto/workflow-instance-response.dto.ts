import { WorkflowInstanceStatus } from '../../database/entities/workflow-instance.entity';
import { WorkflowStepStatus } from '../../database/entities/workflow-step.entity';

export class WorkflowStepResponseDto {
  id!: string;
  templateStepId!: string;
  status!: WorkflowStepStatus;
  assignedUserId?: string;
  estimationValue?: number;
  dueDate?: Date;
  completedAt?: Date;
  checklistProgress!: any[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class WorkflowInstanceResponseDto {
  id!: string;
  clientId!: string;
  templateId!: string;
  status!: WorkflowInstanceStatus;
  periodYear!: number;
  periodMonth!: number;
  steps!: WorkflowStepResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
