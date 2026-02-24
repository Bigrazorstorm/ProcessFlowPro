import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get complete tenant dashboard
   */
  @Get()
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async getTenantDashboard(
    @Req() req: Request,
  ) {
    const tenantId = (req as any).user.tenantId;
    return this.dashboardService.getTenantDashboard(tenantId);
  }

  /**
   * Get high-level metrics only
   */
  @Get('metrics')
  async getMetrics(
    @Req() req: Request,
  ) {
    const tenantId = (req as any).user.tenantId;
    return this.dashboardService.getMetrics(tenantId);
  }

  /**
   * Get user workload breakdown
   */
  @Get('workload')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async getUserWorkload(
    @Req() req: Request,
  ) {
    const tenantId = (req as any).user.tenantId;
    return this.dashboardService.getUserWorkload(tenantId);
  }

  /**
   * Get client progress
   */
  @Get('clients')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async getClientProgress(
    @Req() req: Request,
  ) {
    const tenantId = (req as any).user.tenantId;
    return this.dashboardService.getClientProgress(tenantId);
  }

  /**
   * Get workflow template metrics
   */
  @Get('workflows')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async getWorkflowMetrics(
    @Req() req: Request,
  ) {
    const tenantId = (req as any).user.tenantId;
    return this.dashboardService.getWorkflowMetrics(tenantId);
  }

  /**
   * Get recent activity
   */
  @Get('activity')
  async getRecentActivity(
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const tenantId = (req as any).user.tenantId;
    return this.dashboardService.getRecentActivity(tenantId, limit);
  }
}
