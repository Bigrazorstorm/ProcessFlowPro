import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { WorkflowTemplatesService } from './workflow-templates.service';
import { CreateWorkflowTemplateDto, CreateTemplateStepDto } from './dto/create-workflow-template.dto';
import { UpdateWorkflowTemplateDto, UpdateTemplateStepDto } from './dto/update-workflow-template.dto';
import { WorkflowTemplateResponseDto, TemplateStepResponseDto } from './dto/workflow-template-response.dto';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Workflow Templates')
@Controller('workflow-templates')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class WorkflowTemplatesController {
  constructor(private readonly workflowTemplatesService: WorkflowTemplatesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async create(
    @Body() createTemplateDto: CreateWorkflowTemplateDto,
    @Request() req: { user: JwtPayload },
  ): Promise<WorkflowTemplateResponseDto> {
    return this.workflowTemplatesService.create(createTemplateDto, req.user.tenantId!);
  }

  @Get()
  async findAll(@Request() req: { user: JwtPayload }): Promise<WorkflowTemplateResponseDto[]> {
    return this.workflowTemplatesService.findAll(req.user.tenantId!);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: { user: JwtPayload }): Promise<WorkflowTemplateResponseDto> {
    return this.workflowTemplatesService.findOne(id, req.user.tenantId!);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateWorkflowTemplateDto,
    @Request() req: { user: JwtPayload },
  ): Promise<WorkflowTemplateResponseDto> {
    return this.workflowTemplatesService.update(id, updateTemplateDto, req.user.tenantId!);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @HttpCode(204)
  async delete(@Param('id') id: string, @Request() req: { user: JwtPayload }): Promise<void> {
    return this.workflowTemplatesService.delete(id, req.user.tenantId!);
  }

  // Step management endpoints
  @Post(':templateId/steps')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async addStep(
    @Param('templateId') templateId: string,
    @Body() createStepDto: CreateTemplateStepDto,
    @Request() req: { user: JwtPayload },
  ): Promise<TemplateStepResponseDto> {
    return this.workflowTemplatesService.addStep(templateId, createStepDto, req.user.tenantId!);
  }

  @Patch(':templateId/steps/:stepId')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async updateStep(
    @Param('templateId') templateId: string,
    @Param('stepId') stepId: string,
    @Body() updateStepDto: UpdateTemplateStepDto,
    @Request() req: { user: JwtPayload },
  ): Promise<TemplateStepResponseDto> {
    return this.workflowTemplatesService.updateStep(templateId, stepId, updateStepDto, req.user.tenantId!);
  }

  @Delete(':templateId/steps/:stepId')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  @HttpCode(204)
  async deleteStep(
    @Param('templateId') templateId: string,
    @Param('stepId') stepId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.workflowTemplatesService.deleteStep(templateId, stepId, req.user.tenantId!);
  }

  @Post(':templateId/steps/reorder')
  @Roles(UserRole.OWNER, UserRole.SENIOR)
  async reorderSteps(
    @Param('templateId') templateId: string,
    @Body('stepIds') stepIds: string[],
    @Request() req: { user: JwtPayload },
  ): Promise<TemplateStepResponseDto[]> {
    return this.workflowTemplatesService.reorderSteps(templateId, stepIds, req.user.tenantId!);
  }
}
