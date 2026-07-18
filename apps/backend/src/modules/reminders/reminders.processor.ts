import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RemindersService } from './reminders.service';

@Processor('reminders')
export class RemindersProcessor extends WorkerHost {
  constructor(private readonly remindersService: RemindersService) {
    super();
  }

  async process(_job: Job): Promise<void> {
    await this.remindersService.sendRemindersForAllTenants();
    await this.remindersService.sendCustomerReminders();
  }
}
