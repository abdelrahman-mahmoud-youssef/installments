import { z } from 'zod';
import { JAMEYA_RECURRENCE_TYPES } from '@/lib/enums';
import { toMinorUnits } from '@/lib/format';

export const JAMEYA_MIN_MEMBERS = 2;
export const JAMEYA_MIN_TURNS = 2;
export const JAMEYA_MAX_TURNS = 60;
const JAMEYA_NAME_MAX_LENGTH = 60;
const JAMEYA_NOTE_MAX_LENGTH = 500;
const JAMEYA_MAX_GRACE_DAYS = 60;

export interface JameyaValidationMessages {
  nameRequired: string;
  nameTooLong: string;
  shareAmountPositive: string;
  firstDueDateRequired: string;
  graceDaysRange: string;
  noteTooLong: string;
  memberRequired: string;
  amountPositive: string;
  amountAboveLimit: string;
  dateRequired: string;
}

const nameSchema = (messages: JameyaValidationMessages) =>
  z.string().trim().min(1, messages.nameRequired).max(JAMEYA_NAME_MAX_LENGTH, messages.nameTooLong);

const noteSchema = (messages: JameyaValidationMessages) =>
  z.string().max(JAMEYA_NOTE_MAX_LENGTH, messages.noteTooLong).optional();

export function createJameyaDetailsSchema(messages: JameyaValidationMessages) {
  return z.object({
    name: nameSchema(messages),
    shareAmount: z.number({ error: messages.shareAmountPositive }).positive(messages.shareAmountPositive),
    recurrenceType: z.enum(JAMEYA_RECURRENCE_TYPES),
    firstDueDate: z.string().min(1, messages.firstDueDateRequired),
    graceDays: z
      .number({ error: messages.graceDaysRange })
      .int(messages.graceDaysRange)
      .min(0, messages.graceDaysRange)
      .max(JAMEYA_MAX_GRACE_DAYS, messages.graceDaysRange),
    notes: noteSchema(messages),
  });
}

export type JameyaDetailsInput = z.infer<ReturnType<typeof createJameyaDetailsSchema>>;

export function createJameyaEditSchema(messages: JameyaValidationMessages) {
  return z.object({ name: nameSchema(messages), notes: noteSchema(messages) });
}

export type JameyaEditInput = z.infer<ReturnType<typeof createJameyaEditSchema>>;

export function createJameyaMoneyEntrySchema(
  messages: JameyaValidationMessages,
  limitFor: (customerId: string) => number,
) {
  return z
    .object({
      customerId: z.string().min(1, messages.memberRequired),
      amount: z.number({ error: messages.amountPositive }).positive(messages.amountPositive),
      paidAt: z.string().min(1, messages.dateRequired),
      note: noteSchema(messages),
    })
    .superRefine((value, context) => {
      if (value.customerId && toMinorUnits(value.amount) > limitFor(value.customerId)) {
        context.addIssue({ code: 'custom', path: ['amount'], message: messages.amountAboveLimit });
      }
    });
}

export type JameyaMoneyEntryInput = z.infer<ReturnType<typeof createJameyaMoneyEntrySchema>>;
