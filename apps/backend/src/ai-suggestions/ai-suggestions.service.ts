import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowInstance, WorkflowInstanceStatus } from '../database/entities/workflow-instance.entity';
import { WorkflowStep, WorkflowStepStatus } from '../database/entities/workflow-step.entity';
import { User } from '../database/entities/user.entity';
import { Client } from '../database/entities/client.entity';

export interface AiSuggestion {
  id: string;
  type: 'warning' | 'info' | 'success' | 'recommendation';
  category: 'capacity' | 'deadline' | 'workflow' | 'anomaly';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  relatedEntityId?: string;
  relatedEntityName?: string;
  actionLabel?: string;
  actionPath?: string;
  createdAt: Date;
}

export interface CapacityForecast {
  userId: string;
  userName: string;
  currentLoad: number;
  forecastedLoad: number;
  status: 'overloaded' | 'optimal' | 'underutilized';
  openTasks: number;
  overdueTasks: number;
}

export interface AiInsightsDto {
  suggestions: AiSuggestion[];
  capacityForecasts: CapacityForecast[];
  riskScore: number;
  generatedAt: Date;
}

@Injectable()
export class AiSuggestionsService {
  private readonly logger = new Logger(AiSuggestionsService.name);

  constructor(
    @InjectRepository(WorkflowInstance)
    private readonly instancesRepo: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private readonly stepsRepo: Repository<WorkflowStep>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
  ) {}

  async getInsights(tenantId: string): Promise<AiInsightsDto> {
    const suggestions: AiSuggestion[] = [];
    const now = new Date();

    try {
      const [instances, users, clients] = await Promise.all([
        this.instancesRepo.find({ where: { tenantId } }),
        this.usersRepo.find({ where: { tenantId } }),
        this.clientsRepo.find({ where: { tenantId } }),
      ]);

      // Fetch steps via instances (steps don't have tenantId column directly)
      const instanceIds = instances.map((i) => i.id);
      const steps = instanceIds.length > 0
        ? await this.stepsRepo
            .createQueryBuilder('step')
            .where('step.instanceId IN (:...ids)', { ids: instanceIds })
            .getMany()
        : [];

      // ─── Deadline risk: critical/delayed workflows ────────────────────────
      const overdueInstances = instances.filter(
        (i) =>
          i.status === WorkflowInstanceStatus.CRITICAL ||
          i.status === WorkflowInstanceStatus.DELAYED,
      );

      if (overdueInstances.length > 0) {
        suggestions.push({
          id: 'critical-workflows',
          type: 'warning',
          category: 'deadline',
          title: `${overdueInstances.length} kritische/verzögerte Workflow${overdueInstances.length !== 1 ? 's' : ''}`,
          description: `Es gibt ${overdueInstances.length} Workflows mit dem Status „Kritisch" oder „Verzögert". Sofortige Maßnahmen empfohlen.`,
          priority: 'high',
          actionLabel: 'Workflows anzeigen',
          actionPath: '/workflows',
          createdAt: now,
        });
      }

      // ─── Steps with overdue dates ─────────────────────────────────────────
      const overdueSteps = steps.filter(
        (s) =>
          s.status !== WorkflowStepStatus.DONE &&
          s.status !== WorkflowStepStatus.SKIPPED &&
          s.dueDate &&
          new Date(s.dueDate) < now,
      );

      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const upcomingSteps = steps.filter(
        (s) =>
          s.status !== WorkflowStepStatus.DONE &&
          s.status !== WorkflowStepStatus.SKIPPED &&
          s.dueDate &&
          new Date(s.dueDate) >= now &&
          new Date(s.dueDate) <= threeDaysFromNow,
      );

      if (overdueSteps.length > 0) {
        suggestions.push({
          id: 'overdue-steps',
          type: 'warning',
          category: 'deadline',
          title: `${overdueSteps.length} überfällige Aufgabe${overdueSteps.length !== 1 ? 'n' : ''}`,
          description: `${overdueSteps.length} Aufgaben sind bereits überfällig. Prüfen Sie die betroffenen Workflows umgehend.`,
          priority: 'high',
          actionLabel: 'Kalender öffnen',
          actionPath: '/calendar',
          createdAt: now,
        });
      }

      if (upcomingSteps.length > 0) {
        suggestions.push({
          id: 'upcoming-steps',
          type: 'warning',
          category: 'deadline',
          title: `${upcomingSteps.length} Aufgabe${upcomingSteps.length !== 1 ? 'n' : ''} in Kürze fällig`,
          description: `${upcomingSteps.length} Aufgaben läuft in den nächsten 3 Tagen ab. Bitte priorisieren.`,
          priority: 'medium',
          actionLabel: 'Kalender öffnen',
          actionPath: '/calendar',
          createdAt: now,
        });
      }

      // ─── Capacity analysis ───────────────────────────────────────────────
      const capacityForecasts: CapacityForecast[] = [];

      const userTaskCounts = new Map<string, { open: number; overdue: number; name: string; limit: number }>();
      for (const user of users) {
        userTaskCounts.set(user.id, {
          open: 0,
          overdue: 0,
          name: user.name,
          limit: user.capacityPointsLimit || 10,
        });
      }

      const openSteps = steps.filter(
        (s) =>
          s.status !== WorkflowStepStatus.DONE &&
          s.status !== WorkflowStepStatus.SKIPPED,
      );

      for (const step of openSteps) {
        if (step.assignedUserId && userTaskCounts.has(step.assignedUserId)) {
          const entry = userTaskCounts.get(step.assignedUserId)!;
          entry.open++;
          if (step.dueDate && new Date(step.dueDate) < now) {
            entry.overdue++;
          }
        }
      }

      for (const [userId, data] of userTaskCounts.entries()) {
        const loadRatio = data.open / data.limit;

        let status: CapacityForecast['status'] = 'optimal';
        if (loadRatio > 1.2) status = 'overloaded';
        else if (loadRatio < 0.3 && instances.length > 0) status = 'underutilized';

        capacityForecasts.push({
          userId,
          userName: data.name,
          currentLoad: data.open,
          forecastedLoad: Math.round(data.open * 1.1),
          status,
          openTasks: data.open,
          overdueTasks: data.overdue,
        });
      }

      const overloaded = capacityForecasts.filter((f) => f.status === 'overloaded');
      if (overloaded.length > 0) {
        suggestions.push({
          id: 'overloaded-users',
          type: 'warning',
          category: 'capacity',
          title: `${overloaded.length} überlastete${overloaded.length !== 1 ? '' : 'r'} Mitarbeiter`,
          description: `${overloaded.map((f) => f.userName).join(', ')} ${overloaded.length !== 1 ? 'sind' : 'ist'} überlastet. Eine Umverteilung der Aufgaben wird empfohlen.`,
          priority: 'high',
          actionLabel: 'Teamkalender anzeigen',
          actionPath: '/team-calendar',
          createdAt: now,
        });
      }

      const underutilized = capacityForecasts.filter((f) => f.status === 'underutilized');
      if (underutilized.length > 0) {
        suggestions.push({
          id: 'underutilized-users',
          type: 'info',
          category: 'capacity',
          title: `${underutilized.length} Mitarbeiter mit freier Kapazität`,
          description: `${underutilized.map((f) => f.userName).join(', ')} ${underutilized.length !== 1 ? 'haben' : 'hat'} aktuell freie Kapazität und kann${underutilized.length !== 1 ? 'n' : ''} zusätzliche Aufgaben übernehmen.`,
          priority: 'low',
          actionLabel: 'Teamkalender anzeigen',
          actionPath: '/team-calendar',
          createdAt: now,
        });
      }

      // ─── Workflow completion health ───────────────────────────────────────
      const completionRate =
        instances.length > 0
          ? instances.filter((i) => i.status === WorkflowInstanceStatus.COMPLETED).length / instances.length
          : 0;

      if (instances.length >= 5 && completionRate < 0.5) {
        suggestions.push({
          id: 'low-completion-rate',
          type: 'recommendation',
          category: 'workflow',
          title: 'Geringe Workflow-Abschlussrate',
          description: `Nur ${Math.round(completionRate * 100)}% der Workflows sind abgeschlossen. Prüfen Sie, ob Ressourcen oder Prozesse optimiert werden können.`,
          priority: 'medium',
          actionLabel: 'Berichte anzeigen',
          actionPath: '/reports',
          createdAt: now,
        });
      }

      if (completionRate >= 0.8 && instances.length >= 5) {
        suggestions.push({
          id: 'high-completion-rate',
          type: 'success',
          category: 'workflow',
          title: 'Hohe Workflow-Effizienz',
          description: `Exzellent! ${Math.round(completionRate * 100)}% der Workflows sind abgeschlossen. Das Team arbeitet sehr effizient.`,
          priority: 'low',
          createdAt: now,
        });
      }

      // ─── Client anomaly: low reliability ─────────────────────────────────
      const lowReliabilityClients = clients.filter(
        (c) => typeof c.reliabilityFactor === 'number' && c.reliabilityFactor < 0.5,
      );
      if (lowReliabilityClients.length > 0) {
        suggestions.push({
          id: 'low-reliability-clients',
          type: 'info',
          category: 'anomaly',
          title: `${lowReliabilityClients.length} Mandant${lowReliabilityClients.length !== 1 ? 'en' : ''} mit niedrigem Zuverlässigkeitsfaktor`,
          description: `Mandanten mit niedrigem Zuverlässigkeitsfaktor benötigen möglicherweise mehr Vorlaufzeit. Frühzeitige Erinnerungen empfohlen.`,
          priority: 'low',
          actionLabel: 'Mandanten anzeigen',
          actionPath: '/clients',
          createdAt: now,
        });
      }

      // ─── Overall risk score (0–100) ───────────────────────────────────────
      const riskScore = Math.min(
        100,
        Math.round(
          (overdueInstances.length / Math.max(instances.length, 1)) * 40 +
            (overloaded.length / Math.max(users.length, 1)) * 30 +
            (1 - completionRate) * 30,
        ),
      );

      this.logger.log(
        `Generated ${suggestions.length} AI suggestions for tenant ${tenantId} (risk: ${riskScore})`,
      );

      return {
        suggestions: suggestions.sort((a, b) => {
          const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return order[a.priority] - order[b.priority];
        }),
        capacityForecasts,
        riskScore,
        generatedAt: now,
      };
    } catch (err) {
      this.logger.error(`Error generating AI insights: ${String(err)}`);
      return { suggestions: [], capacityForecasts: [], riskScore: 0, generatedAt: now };
    }
  }
}
