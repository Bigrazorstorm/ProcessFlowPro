import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowTemplate } from '../database/entities/workflow-template.entity';
import { TemplateStep } from '../database/entities/template-step.entity';
import { CreateWorkflowTemplateDto } from './dto/create-workflow-template.dto';
import { UpdateWorkflowTemplateDto } from './dto/update-workflow-template.dto';
import { CreateTemplateStepDto } from './dto/create-workflow-template.dto';
import { UpdateTemplateStepDto } from './dto/update-workflow-template.dto';
import { WorkflowTemplateResponseDto, TemplateStepResponseDto } from './dto/workflow-template-response.dto';

@Injectable()
export class WorkflowTemplatesService {
  constructor(
    @InjectRepository(WorkflowTemplate)
    private readonly templatesRepository: Repository<WorkflowTemplate>,
    @InjectRepository(TemplateStep)
    private readonly stepsRepository: Repository<TemplateStep>,
  ) {}

  async create(
    createTemplateDto: CreateWorkflowTemplateDto,
    tenantId: string,
  ): Promise<WorkflowTemplateResponseDto> {
    // Check if template with same name exists in this tenant
    const existing = await this.templatesRepository.findOne({
      where: { name: createTemplateDto.name, tenantId },
    });

    if (existing) {
      throw new ConflictException(`Template "${createTemplateDto.name}" already exists in this tenant`);
    }

    // Create template
    const template = this.templatesRepository.create({
      name: createTemplateDto.name,
      industry: createTemplateDto.industry,
      description: createTemplateDto.description,
      tenantId,
    });

    const savedTemplate = await this.templatesRepository.save(template);

    // Create steps if provided
    if (createTemplateDto.steps && createTemplateDto.steps.length > 0) {
      const steps: TemplateStep[] = [];
      for (let i = 0; i < createTemplateDto.steps.length; i++) {
        const stepDto = createTemplateDto.steps[i];
        const step = this.stepsRepository.create({
          ...stepDto,
          templateId: savedTemplate.id,
          order: i + 1,
        });
        steps.push(step);
      }
      await this.stepsRepository.save(steps);
      savedTemplate.steps = steps;
    } else {
      savedTemplate.steps = [];
    }

    return this.toResponseDto(savedTemplate);
  }

  async findAll(tenantId: string): Promise<WorkflowTemplateResponseDto[]> {
    const templates = await this.templatesRepository.find({
      where: { tenantId },
      relations: ['steps'],
      order: {
        createdAt: 'DESC',
        steps: { order: 'ASC' },
      },
    });

    return templates.map((t) => this.toResponseDto(t));
  }

  async findOne(id: string, tenantId: string): Promise<WorkflowTemplateResponseDto> {
    const template = await this.templatesRepository.findOne({
      where: { id, tenantId },
      relations: ['steps'],
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    // Sort steps by order
    template.steps.sort((a, b) => a.order - b.order);

    return this.toResponseDto(template);
  }

  async update(
    id: string,
    updateTemplateDto: UpdateWorkflowTemplateDto,
    tenantId: string,
  ): Promise<WorkflowTemplateResponseDto> {
    const template = await this.templatesRepository.findOne({
      where: { id, tenantId },
      relations: ['steps'],
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    // Update fields
    Object.assign(template, updateTemplateDto);

    await this.templatesRepository.save(template);

    return this.toResponseDto(template);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const template = await this.templatesRepository.findOne({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    await this.templatesRepository.remove(template);
  }

  // Step management methods
  async addStep(
    templateId: string,
    stepDto: CreateTemplateStepDto,
    tenantId: string,
  ): Promise<TemplateStepResponseDto> {
    const template = await this.templatesRepository.findOne({
      where: { id: templateId, tenantId },
      relations: ['steps'],
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // Get next order number
    const maxOrder =
      template.steps.length > 0 ? Math.max(...template.steps.map((s) => s.order)) : 0;

    const step = this.stepsRepository.create({
      ...stepDto,
      templateId,
      order: maxOrder + 1,
    });

    await this.stepsRepository.save(step);

    return this.stepToResponseDto(step);
  }

  async updateStep(
    templateId: string,
    stepId: string,
    updateStepDto: UpdateTemplateStepDto,
    tenantId: string,
  ): Promise<TemplateStepResponseDto> {
    const template = await this.templatesRepository.findOne({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    const step = await this.stepsRepository.findOne({
      where: { id: stepId, templateId },
    });

    if (!step) {
      throw new NotFoundException(`Step ${stepId} not found`);
    }

    // Update fields
    Object.assign(step, updateStepDto);

    await this.stepsRepository.save(step);

    return this.stepToResponseDto(step);
  }

  async deleteStep(
    templateId: string,
    stepId: string,
    tenantId: string,
  ): Promise<void> {
    const template = await this.templatesRepository.findOne({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    const step = await this.stepsRepository.findOne({
      where: { id: stepId, templateId },
    });

    if (!step) {
      throw new NotFoundException(`Step ${stepId} not found`);
    }

    await this.stepsRepository.remove(step);

    // Reorder remaining steps
    const remainingSteps = await this.stepsRepository.find({
      where: { templateId },
      order: { order: 'ASC' },
    });

    for (let i = 0; i < remainingSteps.length; i++) {
      remainingSteps[i].order = i + 1;
    }

    await this.stepsRepository.save(remainingSteps);
  }

  async reorderSteps(
    templateId: string,
    stepIds: string[],
    tenantId: string,
  ): Promise<TemplateStepResponseDto[]> {
    const template = await this.templatesRepository.findOne({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // Fetch all steps for this template
    const allSteps = await this.stepsRepository.find({
      where: { templateId },
    });

    // Validate all provided step IDs exist
    for (const id of stepIds) {
      if (!allSteps.find((s) => s.id === id)) {
        throw new BadRequestException(`Step ${id} not found in template`);
      }
    }

    if (stepIds.length !== allSteps.length) {
      throw new BadRequestException('All steps must be provided for reordering');
    }

    // Update order
    for (let i = 0; i < stepIds.length; i++) {
      const step = allSteps.find((s) => s.id === stepIds[i]);
      if (step) {
        step.order = i + 1;
      }
    }

    await this.stepsRepository.save(allSteps);

    // Return reordered steps
    const reordered = allSteps.sort((a, b) => a.order - b.order);
    return reordered.map((s) => this.stepToResponseDto(s));
  }

  private toResponseDto(template: WorkflowTemplate): WorkflowTemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      industry: template.industry,
      description: template.description,
      isActive: template.isActive,
      steps: (template.steps || []).sort((a, b) => a.order - b.order).map((s) => this.stepToResponseDto(s)),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private stepToResponseDto(step: TemplateStep): TemplateStepResponseDto {
    return {
      id: step.id,
      order: step.order,
      type: step.type,
      name: step.name,
      description: step.description,
      checklist: step.checklist || [],
      tips: step.tips,
      errors: step.errors || [],
      deadlineRule: step.deadlineRule,
      assignedRole: step.assignedRole,
      estimationAllowed: step.estimationAllowed,
      blocksNext: step.blocksNext,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
    };
  }
}
