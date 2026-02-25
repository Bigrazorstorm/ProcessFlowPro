import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter(): void {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP configuration missing – email sending disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.logger.log(`Email service configured (host=${host}, port=${port})`);
  }

  /**
   * Send an email. Returns true on success, false if not configured or on error.
   */
  async sendMail(options: SendMailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.debug(`Email not sent (SMTP not configured): ${options.subject}`);
      return false;
    }

    const from = this.configService.get<string>('SMTP_FROM', 'noreply@processflowpro.de');

    try {
      await this.transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Email sent: "${options.subject}" → ${options.to}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send email: ${err.message}`, err.stack);
      return false;
    }
  }

  /** Deadline-approaching reminder */
  async sendDeadlineReminderMail(
    to: string,
    userName: string,
    stepName: string,
    clientName: string,
    dueDate: Date,
    daysLeft: number,
  ): Promise<boolean> {
    const dueDateStr = dueDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return this.sendMail({
      to,
      subject: `⚠️ Frist in ${daysLeft} Tag(en): ${stepName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f59e0b; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ Frist läuft ab</h1>
          </div>
          <div style="background-color: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
            <p>Hallo ${userName},</p>
            <p>die folgende Aufgabe hat eine bald ablaufende Frist:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; color: #6b7280; width: 40%;">Aufgabe</td><td style="padding: 8px; font-weight: bold;">${stepName}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding: 8px; color: #6b7280;">Mandant</td><td style="padding: 8px;">${clientName}</td></tr>
              <tr><td style="padding: 8px; color: #6b7280;">Fällig am</td><td style="padding: 8px; color: #dc2626; font-weight: bold;">${dueDateStr}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding: 8px; color: #6b7280;">Verbleibend</td><td style="padding: 8px;">${daysLeft} Tag(e)</td></tr>
            </table>
            <p>Bitte bearbeiten Sie diese Aufgabe zeitnah in <strong>ProcessFlow Pro</strong>.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Diese Nachricht wurde automatisch von ProcessFlow Pro gesendet.</p>
          </div>
        </div>
      `,
      text: `Hallo ${userName},\n\nFrist in ${daysLeft} Tag(en): ${stepName} (Mandant: ${clientName})\nFällig am: ${dueDateStr}\n\nBitte bearbeiten Sie diese Aufgabe in ProcessFlow Pro.`,
    });
  }

  /** Overdue task escalation */
  async sendEscalationMail(
    to: string,
    userName: string,
    stepName: string,
    clientName: string,
    dueDate: Date,
    overdueDays: number,
  ): Promise<boolean> {
    const dueDateStr = dueDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return this.sendMail({
      to,
      subject: `🔴 ESKALATION: Überfällige Aufgabe (${overdueDays} Tag(e)): ${stepName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">🔴 Eskalation – Überfällige Aufgabe</h1>
          </div>
          <div style="background-color: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
            <p>Hallo ${userName},</p>
            <p>die folgende Aufgabe ist <strong style="color: #dc2626;">${overdueDays} Tag(e) überfällig</strong> und erfordert sofortige Aufmerksamkeit:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; color: #6b7280; width: 40%;">Aufgabe</td><td style="padding: 8px; font-weight: bold;">${stepName}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding: 8px; color: #6b7280;">Mandant</td><td style="padding: 8px;">${clientName}</td></tr>
              <tr><td style="padding: 8px; color: #6b7280;">Fällig am</td><td style="padding: 8px; color: #dc2626; font-weight: bold;">${dueDateStr}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding: 8px; color: #6b7280;">Überfällig seit</td><td style="padding: 8px; color: #dc2626; font-weight: bold;">${overdueDays} Tag(e)</td></tr>
            </table>
            <p>Bitte bearbeiten Sie diese Aufgabe <strong>umgehend</strong> in <strong>ProcessFlow Pro</strong>.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Diese Nachricht wurde automatisch von ProcessFlow Pro gesendet.</p>
          </div>
        </div>
      `,
      text: `ESKALATION: ${stepName} ist ${overdueDays} Tag(e) überfällig!\nMandant: ${clientName}\nFällig am: ${dueDateStr}\n\nBitte sofort bearbeiten.`,
    });
  }

  /** Step-assigned notification */
  async sendStepAssignedMail(
    to: string,
    userName: string,
    stepName: string,
    clientName: string,
    dueDate: Date | null,
  ): Promise<boolean> {
    const dueDateStr = dueDate
      ? dueDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'keine Frist';

    return this.sendMail({
      to,
      subject: `📋 Neue Aufgabe zugewiesen: ${stepName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">📋 Neue Aufgabe zugewiesen</h1>
          </div>
          <div style="background-color: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px;">
            <p>Hallo ${userName},</p>
            <p>Ihnen wurde eine neue Aufgabe in ProcessFlow Pro zugewiesen:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; color: #6b7280; width: 40%;">Aufgabe</td><td style="padding: 8px; font-weight: bold;">${stepName}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding: 8px; color: #6b7280;">Mandant</td><td style="padding: 8px;">${clientName}</td></tr>
              <tr><td style="padding: 8px; color: #6b7280;">Fällig am</td><td style="padding: 8px;">${dueDateStr}</td></tr>
            </table>
            <p>Melden Sie sich bei <strong>ProcessFlow Pro</strong> an, um die Aufgabe zu bearbeiten.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Diese Nachricht wurde automatisch von ProcessFlow Pro gesendet.</p>
          </div>
        </div>
      `,
      text: `Hallo ${userName},\n\nNeue Aufgabe: ${stepName}\nMandant: ${clientName}\nFällig am: ${dueDateStr}\n\nBitte in ProcessFlow Pro bearbeiten.`,
    });
  }
}
