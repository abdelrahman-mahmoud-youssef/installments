import { Injectable } from '@nestjs/common';
import { PushService } from './push.service';
import { PushRoute } from './push.types';
import { buildStaffActivityPushContent } from './staff-activity-push-message';

@Injectable()
export class StaffActivityPushService {
  constructor(private readonly pushService: PushService) {}

  async notifyAdmins(tenantId: string, staffName: string, action: string): Promise<void> {
    await this.pushService.sendToTenantAdmins(
      tenantId,
      (language) => buildStaffActivityPushContent(staffName, action, language),
      PushRoute.ACTIVITY,
    );
  }
}
