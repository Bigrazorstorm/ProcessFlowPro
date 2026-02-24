import { IsString, MinLength, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowStepType } from '../../database/entities/template-step.entity';
import { UserRole } from '../../database/entities/user.entity';

export class CreateTemplateStepDto {
  @IsEnum(WorkflowStepType)
  type!: WorkflowStepType;

  @IsString()
  @MinLength(2)
  name!: string;

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
  assignedRole?: UserRole;

  @IsOptional()
  estimationAllowed?: boolean;

  @IsOptional()
  blocksNext?: boolean;
}

export class CreateWorkflowTemplateDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => CreateTemplateStepDto)
  @ValidateNested({ each: true })
  @IsArray()
  steps?: CreateTemplateStepDto[];
}
