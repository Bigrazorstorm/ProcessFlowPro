export class ClientResponseDto {
  id!: string;
  name!: string;
  address?: string;
  taxNumber?: string;
  companyNumber?: string;
  industry?: string;
  employeeCount!: number;
  reliabilityFactor!: number;
  primaryUserId?: string;
  secondaryUserId?: string;
  specialties!: string[];
  contacts!: any[];
  taxAdvisorContact?: any;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
