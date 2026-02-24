import { IsString, MinLength, IsOptional, IsNumber, Min, IsUUID, IsBoolean, IsArray, ValidateNested, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name!: string;

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
  primaryUserId?: string;

  @IsOptional()
  @IsUUID()
  secondaryUserId?: string;

  @IsOptional()
  @IsArray()
  specialties?: string[];

  @IsOptional()
  @IsArray()
  contacts?: any[];

  @IsOptional()
  taxAdvisorContact?: any;
}
