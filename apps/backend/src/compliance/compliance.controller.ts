import { Controller, Get, Post, Param, Query, UseGuards, Request, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@/auth/guards/tenant.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { JwtPayload } from '@/auth/types/jwt-payload.type';
import { ComplianceService } from './compliance.service';
import { GoBDReportDto, RetentionReportDto, UserDataExportDto } from './dto/gobd-report.dto';

@ApiTags('Compliance')
@ApiBearerAuth('JWT-auth')
@Controller('compliance')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('export-data/:userId')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  @ApiOperation({ summary: 'Export all data for a user (DSGVO Art. 20 - Datenportabilität)' })
  @ApiResponse({ status: 200, description: 'User data export', type: UserDataExportDto })
  async exportUserData(
    @Param('userId') userId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<UserDataExportDto> {
    return this.complianceService.exportUserData(userId, req.user.tenantId!);
  }

  @Post('anonymize/:userId')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Anonymize user data (DSGVO Art. 17 - Recht auf Löschung)' })
  @ApiResponse({ status: 200, description: 'User anonymization result' })
  async anonymizeUser(
    @Param('userId') userId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<{ success: boolean; message: string }> {
    return this.complianceService.anonymizeUser(userId, req.user.tenantId!);
  }

  @Get('retention-report')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Get data retention status report' })
  @ApiResponse({ status: 200, description: 'Data retention report', type: RetentionReportDto })
  async getRetentionReport(@Request() req: { user: JwtPayload }): Promise<RetentionReportDto> {
    return this.complianceService.getRetentionReport(req.user.tenantId!);
  }

  @Get('gobd-report')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  @ApiOperation({ summary: 'Get GoBD compliance report with audit trail data' })
  @ApiResponse({ status: 200, description: 'GoBD compliance report', type: GoBDReportDto })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2024 })
  async getGoBDReport(
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
    @Request() req: { user: JwtPayload },
  ): Promise<GoBDReportDto> {
    return this.complianceService.getGoBDReport(req.user.tenantId!, year);
  }
}
