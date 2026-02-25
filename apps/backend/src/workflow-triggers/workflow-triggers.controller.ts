import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { WorkflowTriggersService } from './workflow-triggers.service';
import { CreateWorkflowTriggerDto, UpdateWorkflowTriggerDto } from './dto/workflow-trigger.dto';

@ApiTags('Workflow Triggers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('workflow-triggers')
export class WorkflowTriggersController {
  constructor(private readonly triggersService: WorkflowTriggersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow trigger rule' })
  @ApiResponse({ status: 201, description: 'Trigger rule created successfully' })
  create(@Request() req: any, @Body() dto: CreateWorkflowTriggerDto) {
    return this.triggersService.create(req.user.tenantId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all workflow trigger rules for the current tenant' })
  findAll(@Request() req: any) {
    return this.triggersService.findAll(req.user.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific workflow trigger rule' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.triggersService.findOne(req.user.tenantId!, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workflow trigger rule' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateWorkflowTriggerDto) {
    return this.triggersService.update(req.user.tenantId!, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workflow trigger rule' })
  remove(@Request() req: any, @Param('id') id: string) {
    this.triggersService.remove(req.user.tenantId!, id);
  }
}
