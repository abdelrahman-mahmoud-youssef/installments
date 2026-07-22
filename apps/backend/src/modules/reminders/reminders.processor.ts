import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EVENING_SUMMARY_JOB_NAME, RemindersService } from './reminders.service';

@Processor('reminders')
export class RemindersProcessor extends WorkerHost {
  constructor(private readonly remindersService: RemindersService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === EVENING_SUMMARY_JOB_NAME) {
      await this.remindersService.sendEveningSummaryForAllTenants();
      return;
    }

    await this.remindersService.sendRemindersForAllTenants();
    await this.remindersService.sendCustomerReminders();
  }
}
