import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { JwtPayload } from '../../auth/types/jwt-payload.type';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private tenantId?: string;
  private userId?: string;
  private roles: string[] = [];

  constructor(@Inject(REQUEST) private request: Request) {
    this.extractTenantContext();
  }

  private extractTenantContext() {
    const user = (this.request as any).user as JwtPayload | undefined;
    if (user) {
      this.tenantId = user.tenantId;
      this.userId = user.userId;
      this.roles = user.roles ?? [];
    }
  }

  getTenantId(): string {
    if (!this.tenantId) {
      throw new Error('No tenant context available');
    }
    return this.tenantId;
  }

  getUserId(): string {
    if (!this.userId) {
      throw new Error('No user context available');
    }
    return this.userId;
  }

  getRoles(): string[] {
    return this.roles;
  }

  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  isAvailable(): boolean {
    return !!this.tenantId && !!this.userId;
  }
}
