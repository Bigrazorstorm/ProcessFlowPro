import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { WorkflowInstancesService } from './workflow-instances.service';

@Processor('workflow-instances')
export class WorkflowInstancesProcessor {
  constructor(private readonly workflowInstancesService: WorkflowInstancesService) {}

  /**
   * Monthly cron job to create workflow instances
   * Runs on the 1st of every month at 00:00 (UTC)
   */
  @Process('create-monthly-instances')
  async createMonthlyInstances(job: Job<{ tenantId?: string }>) {
    console.log('Processing monthly workflow instance creation job');

    const tenantId = job.data?.tenantId;
    const count = await this.workflowInstancesService.scheduleMonthlyInstances(tenantId);

    console.log(`Created ${count} workflow instances`);
    return { count, completedAt: new Date() };
  }

  /**
   * Process workflow step completion (for future use)
   */
  @Process('complete-step')
  async completeStep(job: Job<{ stepId: string; tenantId: string; actualHours?: number }>) {
    const { stepId, tenantId, actualHours } = job.data;

    const result = await this.workflowInstancesService.completeStep(
      stepId,
      tenantId,
      actualHours,
    );

    return { stepId, result };
  }

  /**
   * Retry failed instance creation
   */
  @Process('retry-failed-instances')
  async retryFailedInstances(job: Job<{ tenantId: string }>) {
    console.log('Retrying failed workflow instance creation');

    const count = await this.workflowInstancesService.scheduleMonthlyInstances(job.data.tenantId);

    return { retriedCount: count };
  }
}
