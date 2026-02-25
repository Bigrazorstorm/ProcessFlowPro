import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoBDReportQueryDto {
  @ApiProperty({ description: 'Year for the GoBD report', example: 2024 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year!: number;
}

export class GoBDReportDto {
  @ApiProperty()
  year!: number;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty({ description: 'Total number of audit log entries for the year' })
  totalAuditEntries!: number;

  @ApiProperty({ description: 'Audit entries by action type' })
  entriesByAction!: Record<string, number>;

  @ApiProperty({ description: 'Audit entries by entity type' })
  entriesByEntityType!: Record<string, number>;

  @ApiProperty({ description: 'Workflow instances completed in the year' })
  completedWorkflows!: number;

  @ApiProperty({ description: 'Compliance status summary' })
  complianceStatus!: {
    auditTrailIntact: boolean;
    noUnauthorizedModifications: boolean;
    retentionPolicyCompliant: boolean;
  };
}

export class RetentionReportDto {
  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty()
  retentionPolicies!: {
    entity: string;
    retentionYears: number;
    recordCount: number;
    oldestRecord?: Date;
    itemsDueForDeletion: number;
  }[];
}

export class UserDataExportDto {
  @ApiProperty()
  exportedAt!: Date;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  user!: Record<string, unknown>;

  @ApiProperty()
  auditLogs!: Record<string, unknown>[];

  @ApiProperty()
  workflowSteps!: Record<string, unknown>[];

  @ApiProperty()
  stepComments!: Record<string, unknown>[];
}
