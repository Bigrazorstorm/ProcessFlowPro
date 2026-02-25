import { IsEnum, IsOptional, IsString, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { WorkflowStepStatus } from '../../database/entities/workflow-step.entity';

export class UpdateStepStatusDto {
  @IsEnum(WorkflowStepStatus)
  status!: WorkflowStepStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignStepDto {
  @IsUUID()
  userId!: string;
}

export class LogTimeDto {
  @IsNumber()
  hours!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddStepCommentDto {
  @IsString()
  content!: string;
}

export class EstimationDto {
  @IsNumber()
  estimationValue!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveStepDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectStepDto {
  @IsString()
  reason!: string;
}

export class ShiftStepDateDto {
  @IsDateString()
  newDueDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
