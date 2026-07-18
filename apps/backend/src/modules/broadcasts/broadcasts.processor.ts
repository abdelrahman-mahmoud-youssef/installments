import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BroadcastsService, SendBroadcastJob } from './broadcasts.service';

@Processor('broadcasts')
export class BroadcastsProcessor extends WorkerHost {
  constructor(private readonly broadcastsService: BroadcastsService) {
    super();
  }

  async process(job: Job<SendBroadcastJob>): Promise<void> {
    await this.broadcastsService.processBroadcast(job.data.broadcastId, job.data.image);
  }
}
