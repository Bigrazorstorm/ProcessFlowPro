import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { WorkflowStep, WorkflowStepStatus } from '../database/entities/workflow-step.entity';
import { WorkflowInstance } from '../database/entities/workflow-instance.entity';
import { User } from '../database/entities/user.entity';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/dto/notification.dto';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(WorkflowStep)
    private readonly stepsRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowInstance)
    private readonly instancesRepository: Repository<WorkflowInstance>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Daily reminder job: runs every day at 07:00 UTC.
   * Sends email + in-app notifications for steps due within the next 3 days.
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async sendDeadlineReminders(): Promise<void> {
    this.logger.log('Running daily deadline reminder job…');

    const now = new Date();
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);

    // Find open/in-progress steps with due dates in the next 3 days
    const steps = await this.stepsRepository.find({
      where: {
        status: In([WorkflowStepStatus.OPEN, WorkflowStepStatus.IN_PROGRESS]),
        dueDate: LessThanOrEqual(in3Days),
      },
      relations: ['instance', 'assignedUser', 'templateStep'],
    });

    let remindersSent = 0;

    for (const step of steps) {
      if (!step.dueDate || !step.assignedUser || !step.assignedUserId) continue;

      // Skip already passed dates (those are handled by escalation)
      if (step.dueDate < now) continue;

      const daysLeft = Math.ceil(
        (step.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const user = step.assignedUser;
      const stepName = step.templateStep?.name ?? 'Aufgabe';
      const clientName = step.instance?.clientId ?? 'Mandant';

      // In-app notification
      await this.notificationsService.sendNotificationIfEnabled(
        user.id,
        NotificationType.DEADLINE_APPROACHING,
        `Frist in ${daysLeft} Tag(en): ${stepName}`,
        `Die Aufgabe "${stepName}" für Mandant ${clientName} ist in ${daysLeft} Tag(en) fällig.`,
        step.id,
      );

      // Email notification
      await this.emailService.sendDeadlineReminderMail(
        user.email,
        user.name,
        stepName,
        clientName,
        step.dueDate,
        daysLeft,
      );

      remindersSent++;
    }

    this.logger.log(`Deadline reminders sent: ${remindersSent}`);
  }

  /**
   * Escalation job: runs every day at 08:00 UTC.
   * Sends escalation emails for steps that are overdue.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendEscalations(): Promise<void> {
    this.logger.log('Running daily escalation job…');

    const now = new Date();

    // Find open/in-progress steps whose due date has passed
    const overdueSteps = await this.stepsRepository.find({
      where: {
        status: In([WorkflowStepStatus.OPEN, WorkflowStepStatus.IN_PROGRESS]),
        dueDate: LessThanOrEqual(now),
      },
      relations: ['instance', 'assignedUser', 'templateStep'],
    });

    let escalationsSent = 0;

    for (const step of overdueSteps) {
      if (!step.dueDate || !step.assignedUser) continue;

      const overdueDays = Math.ceil(
        (now.getTime() - step.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      const user = step.assignedUser;
      const stepName = step.templateStep?.name ?? 'Aufgabe';
      const clientName = step.instance?.clientId ?? 'Mandant';

      // In-app notification
      await this.notificationsService.sendNotificationIfEnabled(
        user.id,
        NotificationType.DEADLINE_OVERDUE,
        `Überfällig (${overdueDays} Tag(e)): ${stepName}`,
        `Die Aufgabe "${stepName}" für Mandant ${clientName} ist ${overdueDays} Tag(e) überfällig!`,
        step.id,
      );

      // Escalation email
      await this.emailService.sendEscalationMail(
        user.email,
        user.name,
        stepName,
        clientName,
        step.dueDate,
        overdueDays,
      );

      escalationsSent++;
    }

    this.logger.log(`Escalation emails sent: ${escalationsSent}`);
  }

  /**
   * Manually trigger deadline reminders (for testing/admin use).
   */
  async triggerDeadlineReminders(): Promise<{ remindersSent: number }> {
    await this.sendDeadlineReminders();
    return { remindersSent: 0 };
  }

  /**
   * Manually trigger escalations (for testing/admin use).
   */
  async triggerEscalations(): Promise<{ escalationsSent: number }> {
    await this.sendEscalations();
    return { escalationsSent: 0 };
  }
}
