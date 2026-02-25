import { Controller, Get, Patch, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { WorkflowExecutionService } from './workflow-execution.service';
import {
  UpdateStepStatusDto,
  AssignStepDto,
  LogTimeDto,
  AddStepCommentDto,
  EstimationDto,
  ApproveStepDto,
  RejectStepDto,
  ShiftStepDateDto,
} from './dto/step-execution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Workflow Execution')
@ApiBearerAuth('JWT-auth')
@Controller('workflow-execution')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class WorkflowExecutionController {
  constructor(private readonly executionService: WorkflowExecutionService) {}

  /**
   * Get step detail with all comments
   */
  @Get('steps/:stepId')
  async getStep(@Param('stepId') stepId: string, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    return this.executionService.getStepDetail(stepId, tenantId);
  }

  /**
   * Update step status
   */
  @Patch('steps/:stepId/status')
  async updateStepStatus(@Param('stepId') stepId: string, @Body() dto: UpdateStepStatusDto, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.userId;

    return this.executionService.updateStepStatus(stepId, tenantId, dto, userId);
  }

  /**
   * Start a step (move to IN_PROGRESS)
   */
  @Post('steps/:stepId/start')
  async startStep(@Param('stepId') stepId: string, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.userId;

    return this.executionService.startStep(stepId, tenantId, userId);
  }

  /**
   * Assign step to user
   */
  @Patch('steps/:stepId/assign')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async assignStep(@Param('stepId') stepId: string, @Body() dto: AssignStepDto, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    return this.executionService.assignStep(stepId, tenantId, dto);
  }

  /**
   * Log time on a step
   */
  @Post('steps/:stepId/log-time')
  async logTime(@Param('stepId') stepId: string, @Body() dto: LogTimeDto, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.userId;

    return this.executionService.logTime(stepId, tenantId, dto, userId);
  }

  /**
   * Set estimation for a step
   */
  @Post('steps/:stepId/estimation')
  async setEstimation(@Param('stepId') stepId: string, @Body() dto: EstimationDto, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.userId;

    return this.executionService.setEstimation(stepId, tenantId, dto, userId);
  }

  /**
   * Approve a step
   */
  @Post('steps/:stepId/approve')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async approveStep(@Param('stepId') stepId: string, @Body() dto: ApproveStepDto, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.userId;

    return this.executionService.approveStep(stepId, tenantId, dto, userId);
  }

  /**
   * Reject a step
   */
  @Post('steps/:stepId/reject')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async rejectStep(@Param('stepId') stepId: string, @Body() dto: RejectStepDto, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.userId;

    return this.executionService.rejectStep(stepId, tenantId, dto, userId);
  }

  /**
   * Shift the due date of a step (used for calendar drag & drop)
   */
  @Patch('steps/:stepId/shift-date')
  async shiftStepDate(@Param('stepId') stepId: string, @Body() dto: ShiftStepDateDto, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    return this.executionService.shiftStepDate(stepId, tenantId, dto);
  }

  /**
   * Add comment to step
   */
  @Post('steps/:stepId/comments')
  async addComment(@Param('stepId') stepId: string, @Body() dto: AddStepCommentDto, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.userId;

    return this.executionService.addComment(stepId, tenantId, dto, userId);
  }

  /**
   * Get all comments for a step
   */
  @Get('steps/:stepId/comments')
  async getComments(@Param('stepId') stepId: string, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    return this.executionService.getStepComments(stepId, tenantId);
  }

  /**
   * Get workflow instance progress
   */
  @Get('instances/:instanceId/progress')
  async getProgress(@Param('instanceId') instanceId: string, @Req() req: Request) {
    const tenantId = (req as any).user.tenantId;
    return this.executionService.getWorkflowProgress(instanceId, tenantId);
  }
}
