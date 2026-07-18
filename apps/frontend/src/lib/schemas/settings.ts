import { z } from 'zod';

export const notificationSettingsSchema = z.object({
  telegramBotToken: z.string().max(200),
});

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
