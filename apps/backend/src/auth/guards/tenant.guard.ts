import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '../../database/entities/user.entity';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      return false;
    }

    if (user.tenantId) {
      return true;
    }

    return user.roles.includes(UserRole.SUPER_ADMIN);
  }
}
