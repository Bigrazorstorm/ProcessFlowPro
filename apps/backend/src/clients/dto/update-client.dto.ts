import { IsOptional, IsString, IsNumber, Min, IsUUID, IsBoolean, IsArray } from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  companyNumber?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  employeeCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  reliabilityFactor?: number;

  @IsOptional()
  @IsUUID()
  primaryUserId?: string | null;

  @IsOptional()
  @IsUUID()
  secondaryUserId?: string | null;

  @IsOptional()
  @IsArray()
  specialties?: string[];

  @IsOptional()
  @IsArray()
  contacts?: any[];

  @IsOptional()
  taxAdvisorContact?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
