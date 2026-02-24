import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { WorkflowInstanceStatus } from '../../database/entities/workflow-instance.entity';

export class CreateWorkflowInstanceDto {
  @IsUUID()
  templateId!: string;

  @IsUUID()
  clientId!: string;

  @IsOptional()
  @IsEnum(WorkflowInstanceStatus)
  status?: WorkflowInstanceStatus;
}

export class TriggerMonthlyInstancesDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
