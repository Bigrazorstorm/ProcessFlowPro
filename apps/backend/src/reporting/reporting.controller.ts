import { Controller, Get, Post, Delete, Body, Param, Query, HttpCode, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import {
  GenerateReportDto,
  ExportReportDto,
  ScheduleReportDto,
} from './dto/report.dto';

@ApiTags('Reporting')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @Post('generate')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async generateReport(
    @Body() dto: GenerateReportDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reportingService.generateReport(dto, req.user.tenantId!);
  }

  @Post('export')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async exportReport(
    @Body() dto: ExportReportDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reportingService.exportReport(dto, req.user.tenantId!);
  }

  @Get('types')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  getAvailableReportTypes() {
    return {
      types: [
        'WORKFLOW_SUMMARY',
        'CLIENT_PERFORMANCE',
        'USER_WORKLOAD',
        'TEMPLATE_ANALYTICS',
        'DEADLINE_COMPLIANCE',
        'FINANCIAL_SUMMARY',
      ],
    };
  }

  @Post('schedule')
  @Roles(UserRole.OWNER)
  @HttpCode(201)
  async scheduleReport(
    @Body() dto: ScheduleReportDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reportingService.scheduleReport(dto, req.user.tenantId!, req.user.userId);
  }

  @Get('schedules')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async getScheduledReports(
    @Request() req: { user: JwtPayload },
  ) {
    return this.reportingService.getScheduledReports(req.user.tenantId!);
  }

  @Delete('schedules/:scheduleId')
  @Roles(UserRole.OWNER)
  @HttpCode(204)
  async deleteScheduledReport(
    @Param('scheduleId') scheduleId: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reportingService.deleteScheduledReport(scheduleId, req.user.tenantId!);
  }

  @Get('history')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async getReportHistory(
    @Query('limit') limit: string = '50',
    @Request() req: { user: JwtPayload },
  ) {
    return {
      message: 'Report history endpoint - would query audit log in production',
      limit: parseInt(limit, 10),
      tenantId: req.user.tenantId,
    };
  }
}
