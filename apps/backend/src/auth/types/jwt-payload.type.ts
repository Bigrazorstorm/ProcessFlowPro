import { UserRole } from '../../database/entities/user.entity';

export interface JwtPayload {
  userId: string;
  tenantId?: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}
