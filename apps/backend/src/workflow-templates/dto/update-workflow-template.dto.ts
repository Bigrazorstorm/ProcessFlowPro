import { IsOptional, IsString, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { WorkflowStepType } from '../../database/entities/template-step.entity';
import { UserRole } from '../../database/entities/user.entity';

export class UpdateTemplateStepDto {
  @IsOptional()
  @IsEnum(WorkflowStepType)
  type?: WorkflowStepType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  checklist?: any[];

  @IsOptional()
  @IsString()
  tips?: string;

  @IsOptional()
  @IsArray()
  errors?: string[];

  @IsOptional()
  deadlineRule?: any;

  @IsOptional()
  @IsEnum(UserRole)
  assignedRole?: UserRole | null;

  @IsOptional()
  @IsBoolean()
  estimationAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  blocksNext?: boolean;
}

export class UpdateWorkflowTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
