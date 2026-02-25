import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TriggerEvent {
  STEP_COMPLETED = 'step.completed',
  STEP_STARTED = 'step.started',
  STEP_OVERDUE = 'step.overdue',
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_STARTED = 'workflow.started',
}

export enum TriggerAction {
  SEND_NOTIFICATION = 'send_notification',
  SEND_EMAIL = 'send_email',
}

export class CreateWorkflowTriggerDto {
  @ApiProperty({ description: 'Name of the trigger rule' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: TriggerEvent, description: 'Event that fires the trigger' })
  @IsEnum(TriggerEvent)
  event!: TriggerEvent;

  @ApiProperty({ enum: TriggerAction, description: 'Action to execute' })
  @IsEnum(TriggerAction)
  action!: TriggerAction;

  @ApiPropertyOptional({ description: 'Title of the notification to send' })
  @IsString()
  @IsOptional()
  notificationTitle?: string;

  @ApiPropertyOptional({ description: 'Message body of the notification' })
  @IsString()
  @IsOptional()
  notificationMessage?: string;

  @ApiPropertyOptional({ description: 'Whether the trigger is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateWorkflowTriggerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: TriggerEvent })
  @IsEnum(TriggerEvent)
  @IsOptional()
  event?: TriggerEvent;

  @ApiPropertyOptional({ enum: TriggerAction })
  @IsEnum(TriggerAction)
  @IsOptional()
  action?: TriggerAction;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notificationTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notificationMessage?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export interface WorkflowTriggerRule {
  id: string;
  tenantId: string;
  name: string;
  event: TriggerEvent;
  action: TriggerAction;
  notificationTitle?: string;
  notificationMessage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriggerFireContext {
  tenantId: string;
  userId?: string;
  stepId?: string;
  instanceId?: string;
  stepName?: string;
  clientName?: string;
  workflowName?: string;
}
