import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentFileType {
  PDF = 'pdf',
  EXCEL = 'excel',
  WORD = 'word',
  CSV = 'csv',
  IMAGE = 'image',
  OTHER = 'other',
}

export enum LinkedEntityType {
  CLIENT = 'client',
  WORKFLOW = 'workflow',
  WORKFLOW_STEP = 'workflow_step',
}

export class CreateDocumentDto {
  @ApiProperty({ description: 'Display name of the document' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: DocumentFileType, description: 'Type of document' })
  @IsEnum(DocumentFileType)
  fileType!: DocumentFileType;

  @ApiPropertyOptional({ description: 'External URL or file path' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ enum: LinkedEntityType, description: 'Entity type this document is linked to' })
  @IsEnum(LinkedEntityType)
  @IsOptional()
  linkedEntityType?: LinkedEntityType;

  @ApiPropertyOptional({ description: 'ID of the linked entity' })
  @IsString()
  @IsOptional()
  linkedEntityId?: string;

  @ApiPropertyOptional({ description: 'Display name of the linked entity' })
  @IsString()
  @IsOptional()
  linkedEntityName?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: DocumentFileType })
  @IsEnum(DocumentFileType)
  @IsOptional()
  fileType?: DocumentFileType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ enum: LinkedEntityType })
  @IsEnum(LinkedEntityType)
  @IsOptional()
  linkedEntityType?: LinkedEntityType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  linkedEntityId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  linkedEntityName?: string;
}

export interface DocumentRecord {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  fileType: DocumentFileType;
  url?: string;
  linkedEntityType?: LinkedEntityType;
  linkedEntityId?: string;
  linkedEntityName?: string;
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}
