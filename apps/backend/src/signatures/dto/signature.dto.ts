import { IsString, IsEnum, IsOptional, IsArray, IsDateString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SignatureStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PARTIALLY_SIGNED = 'partially_signed',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum SignerStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  REJECTED = 'rejected',
}

export interface SignerRecord {
  userId: string;
  userName: string;
  email?: string;
  status: SignerStatus;
  signedAt?: Date;
  comment?: string;
}

export interface RevisionEntry {
  action: string;
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  comment?: string;
}

export interface SignatureRequest {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  documentId?: string;
  documentName?: string;
  status: SignatureStatus;
  signers: SignerRecord[];
  requiredSignatureCount: number;
  signedCount: number;
  dueDate?: Date;
  requestedBy: string;
  requestedByName: string;
  revisionHistory: RevisionEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export class CreateSignatureRequestDto {
  @ApiProperty({ description: 'Title of the signature request' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Reference to a document ID' })
  @IsString()
  @IsOptional()
  documentId?: string;

  @ApiPropertyOptional({ description: 'Name of the document to be signed' })
  @IsString()
  @IsOptional()
  documentName?: string;

  @ApiProperty({ description: 'List of user IDs who need to sign', type: [String] })
  @IsArray()
  @IsString({ each: true })
  signerIds!: string[];

  @ApiPropertyOptional({ description: 'Due date for signatures (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class SignDocumentDto {
  @ApiPropertyOptional({ description: 'Optional comment when signing' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class RejectSignatureDto {
  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsString()
  @IsOptional()
  comment?: string;
}
