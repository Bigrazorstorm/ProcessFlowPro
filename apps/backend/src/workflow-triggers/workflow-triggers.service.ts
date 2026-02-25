import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateWorkflowTriggerDto,
  UpdateWorkflowTriggerDto,
  WorkflowTriggerRule,
  TriggerEvent,
  TriggerAction,
  TriggerFireContext,
} from './dto/workflow-trigger.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/dto/notification.dto';

@Injectable()
export class WorkflowTriggersService {
  private readonly logger = new Logger(WorkflowTriggersService.name);

  /** In-memory store: tenantId → trigger rules */
  private triggers: Map<string, WorkflowTriggerRule[]> = new Map();

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Create a new trigger rule for the tenant.
   */
  create(tenantId: string, dto: CreateWorkflowTriggerDto): WorkflowTriggerRule {
    const now = new Date();
    const rule: WorkflowTriggerRule = {
      id: uuidv4(),
      tenantId,
      name: dto.name,
      event: dto.event,
      action: dto.action,
      notificationTitle: dto.notificationTitle,
      notificationMessage: dto.notificationMessage,
      isActive: dto.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.triggers.has(tenantId)) {
      this.triggers.set(tenantId, []);
    }
    this.triggers.get(tenantId)!.push(rule);

    this.logger.log(`Created trigger "${rule.name}" (${rule.event} → ${rule.action}) for tenant ${tenantId}`);
    return rule;
  }

  /**
   * Return all trigger rules for the tenant.
   */
  findAll(tenantId: string): WorkflowTriggerRule[] {
    return this.triggers.get(tenantId) || [];
  }

  /**
   * Return a single trigger rule by id.
   */
  findOne(tenantId: string, id: string): WorkflowTriggerRule {
    const rule = (this.triggers.get(tenantId) || []).find((r) => r.id === id);
    if (!rule) {
      throw new NotFoundException(`Trigger rule ${id} not found`);
    }
    return rule;
  }

  /**
   * Update an existing trigger rule.
   */
  update(tenantId: string, id: string, dto: UpdateWorkflowTriggerDto): WorkflowTriggerRule {
    const rule = this.findOne(tenantId, id);

    if (dto.name !== undefined) rule.name = dto.name;
    if (dto.event !== undefined) rule.event = dto.event;
    if (dto.action !== undefined) rule.action = dto.action;
    if (dto.notificationTitle !== undefined) rule.notificationTitle = dto.notificationTitle;
    if (dto.notificationMessage !== undefined) rule.notificationMessage = dto.notificationMessage;
    if (dto.isActive !== undefined) rule.isActive = dto.isActive;
    rule.updatedAt = new Date();

    return rule;
  }

  /**
   * Delete a trigger rule.
   */
  remove(tenantId: string, id: string): void {
    const rules = this.triggers.get(tenantId) || [];
    const index = rules.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new NotFoundException(`Trigger rule ${id} not found`);
    }
    rules.splice(index, 1);
  }

  /**
   * Fire all active trigger rules matching the given event.
   * Called by WorkflowExecutionService whenever a step/workflow status changes.
   */
  async fire(event: TriggerEvent, ctx: TriggerFireContext): Promise<void> {
    const rules = (this.triggers.get(ctx.tenantId) || []).filter((r) => r.isActive && r.event === event);

    if (rules.length === 0) return;

    this.logger.log(`Firing ${rules.length} trigger(s) for event "${event}" in tenant ${ctx.tenantId}`);

    for (const rule of rules) {
      try {
        await this.executeAction(rule, ctx);
      } catch (err) {
        this.logger.error(`Error executing trigger "${rule.name}": ${String(err)}`);
      }
    }
  }

  /**
   * Execute the action defined in the trigger rule.
   */
  private async executeAction(rule: WorkflowTriggerRule, ctx: TriggerFireContext): Promise<void> {
    if (rule.action === TriggerAction.SEND_NOTIFICATION && ctx.userId) {
      const title = this.interpolate(rule.notificationTitle || rule.name, ctx);
      const message = this.interpolate(rule.notificationMessage || `Trigger "${rule.name}" was fired.`, ctx);

      await this.notificationsService.createNotification({
        userId: ctx.userId,
        type: NotificationType.WORKFLOW_STARTED,
        title,
        message,
        relatedItemId: ctx.stepId || ctx.instanceId,
      });

      this.logger.log(`Sent notification to user ${ctx.userId}: "${title}"`);
    } else if (rule.action === TriggerAction.SEND_EMAIL) {
      // Email action – logged for now; extend with EmailService if needed
      this.logger.log(
        `[Email trigger] "${rule.name}" fired for event "${rule.event}" (no email address available without userId context)`,
      );
    }
  }

  /**
   * Simple template interpolation: replace {{stepName}}, {{clientName}}, {{workflowName}}.
   */
  private interpolate(template: string, ctx: TriggerFireContext): string {
    return template
      .replace(/\{\{stepName\}\}/g, ctx.stepName || '')
      .replace(/\{\{clientName\}\}/g, ctx.clientName || '')
      .replace(/\{\{workflowName\}\}/g, ctx.workflowName || '');
  }
}
