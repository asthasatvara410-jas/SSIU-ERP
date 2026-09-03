import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ScheduleJobParams {
  agentKey: string;
  jobType: string;
  payload: Record<string, any>;
  runAt?: Date;
  cronExpression?: string;
  institutionId?: string;
}

@Injectable()
export class AgentSchedulerService {
  private readonly logger = new Logger('AgentSchedulerService');
  private readonly activeJobs = new Map<string, { timer?: any; cron?: string; status: 'SCHEDULED' | 'PAUSED' | 'CANCELLED' }>();

  constructor(private readonly prisma: PrismaService) {}

  async schedule(params: ScheduleJobParams): Promise<{ jobId: string; status: string; scheduledAt: Date }> {
    const scheduledAt = params.runAt || new Date(Date.now() + 60000);
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    this.activeJobs.set(jobId, {
      status: 'SCHEDULED',
      cron: params.cronExpression,
    });

    this.logger.log(
      `[SCHEDULER] Scheduled job '${jobId}' for agent '${params.agentKey}' (Run at: ${scheduledAt.toISOString()})`,
    );

    return {
      jobId,
      status: 'SCHEDULED',
      scheduledAt,
    };
  }

  async cancel(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    job.status = 'CANCELLED';
    if (job.timer) clearTimeout(job.timer);
    this.logger.log(`[SCHEDULER] Cancelled job '${jobId}'`);
    return true;
  }

  async pause(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    job.status = 'PAUSED';
    this.logger.log(`[SCHEDULER] Paused job '${jobId}'`);
    return true;
  }

  async resume(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    job.status = 'SCHEDULED';
    this.logger.log(`[SCHEDULER] Resumed job '${jobId}'`);
    return true;
  }
}
