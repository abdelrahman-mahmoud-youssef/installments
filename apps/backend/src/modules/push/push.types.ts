import { NotificationLanguage } from '@prisma/client';

export interface PushContent {
  title: string;
  body: string;
}

export type PushContentResolver = (language: NotificationLanguage) => PushContent;

export const PushRoute = {
  SUPPORT: 'support',
  DASHBOARD: 'dashboard',
} as const;

export type PushRoute = (typeof PushRoute)[keyof typeof PushRoute];
