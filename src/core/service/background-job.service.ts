/* eslint-disable @typescript-eslint/no-explicit-any */

import { logger } from "../utils/loggers";

type Job = () => Promise<void>;

interface BackgroundJobOptions {
  concurrency?: number;
}

class BackgroundJobService {
  private queue: Array<{ name: string; job: Job }> = [];
  private activeJobs = 0;
  private readonly concurrency: number;

  constructor(options?: BackgroundJobOptions) {
    this.concurrency = Math.max(1, options?.concurrency ?? 2);
  }

  enqueue(name: string, job: Job): void {
    this.queue.push({ name, job });
    this.processQueue();
  }

  private processQueue(): void {
    if (this.activeJobs >= this.concurrency) {
      return;
    }

    const nextJob = this.queue.shift();
    if (!nextJob) {
      return;
    }

    this.activeJobs += 1;

    setImmediate(async () => {
      try {
        logger.debug(`Starting background job: ${nextJob.name}`);
        await nextJob.job();
        logger.debug(`Background job completed: ${nextJob.name}`);
      } catch (error: any) {
        logger.error(`Background job failed: ${nextJob.name}`, {
          error: error.message,
          stack: error.stack,
        });
      } finally {
        this.activeJobs -= 1;
        this.processQueue();
      }
    });
  }
}

export const backgroundJobService = new BackgroundJobService({
  concurrency: Number(process.env.BACKGROUND_JOB_CONCURRENCY ?? 2),
});
