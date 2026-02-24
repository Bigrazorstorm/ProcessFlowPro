import { WorkflowStepType } from '../../database/entities/template-step.entity';

export class TemplateStepResponseDto {
  id!: string;
  order!: number;
  type!: WorkflowStepType;
  name!: string;
  description?: string;
  checklist!: any[];
  tips?: string;
  errors!: string[];
  deadlineRule?: any;
  assignedRole?: string;
  estimationAllowed!: boolean;
  blocksNext!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class WorkflowTemplateResponseDto {
  id!: string;
  name!: string;
  industry?: string;
  description?: string;
  isActive!: boolean;
  steps!: TemplateStepResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
