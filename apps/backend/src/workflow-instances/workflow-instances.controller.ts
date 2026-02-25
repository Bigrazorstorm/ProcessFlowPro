import { Controller, Get, Post, Param, Body, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { WorkflowInstancesService } from './workflow-instances.service';
import { CreateWorkflowInstanceDto, TriggerMonthlyInstancesDto } from './dto/create-workflow-instance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { WorkflowStepStatus } from '../database/entities/workflow-step.entity';

@ApiTags('Workflow Instances')
@ApiBearerAuth('JWT-auth')
@Controller('workflow-instances')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class WorkflowInstancesController {
  constructor(private readonly workflowInstancesService: WorkflowInstancesService) {}

  /**
   * Create a new workflow instance from template
   */
  @Post()
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async create(@Body() createDto: CreateWorkflowInstanceDto, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    return this.workflowInstancesService.createInstanceFromTemplate(createDto, tenantId);
  }

  /**
   * Get all workflow instances in tenant
   */
  @Get()
  async findAll(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
    const tenantId = (req as any).user.tenantId;
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;

    return this.workflowInstancesService.findAllByTenant(tenantId, pageNum, limitNum);
  }

  /**
   * Get workflow instance by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    return this.workflowInstancesService.findOne(id, tenantId);
  }

  /**
   * Manually trigger monthly instance creation (for testing/admin)
   */
  @Post('trigger/monthly')
  @Roles(UserRole.OWNER)
  async triggerMonthlyCreation(@Body() triggerDto: TriggerMonthlyInstancesDto, @Req() req: Request) {
    const tenantId = triggerDto.tenantId || (req as any).user.tenantId;
    const count = await this.workflowInstancesService.scheduleMonthlyInstances(tenantId);
    return { message: 'Monthly instances created', count };
  }

  /**
   * Start a workflow step
   */
  @Patch(':instanceId/steps/:stepId/start')
  async startStep(@Param('instanceId') instanceId: string, @Param('stepId') stepId: string, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.userId;

    return this.workflowInstancesService.startStep(stepId, tenantId, userId);
  }

  /**
   * Complete a workflow step
   */
  @Patch(':instanceId/steps/:stepId/complete')
  async completeStep(
    @Param('instanceId') instanceId: string,
    @Param('stepId') stepId: string,
    @Req() req: Request,
    @Body() body?: { estimationValue?: number },
  ) {
    const tenantId = (req as any).user.tenantId;

    return this.workflowInstancesService.completeStep(stepId, tenantId, body?.estimationValue);
  }
}
