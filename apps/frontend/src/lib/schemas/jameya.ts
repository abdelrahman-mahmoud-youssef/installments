import { z } from 'zod';
import { JAMEYA_RECURRENCE_TYPES } from '@/lib/enums';
import { toMinorUnits } from '@/lib/format';
import { imageFileSchema } from './image-file';

export const JAMEYA_MIN_MEMBERS = 2;
export const JAMEYA_MIN_TURNS = 2;
export const JAMEYA_MAX_TURNS = 60;
export const JAMEYA_MAX_HOLDERS_PER_TURN = 4;
const JAMEYA_NAME_MAX_LENGTH = 60;
const JAMEYA_NOTE_MAX_LENGTH = 500;
const JAMEYA_MAX_GRACE_DAYS = 60;
const JAMEYA_RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

export interface JameyaValidationMessages {
  nameRequired: string;
  nameTooLong: string;
  shareAmountPositive: string;
  firstDueDateRequired: string;
  graceDaysRange: string;
  noteTooLong: string;
  memberRequired: string;
  amountPositive: string;
  wholePounds: string;
  amountAboveLimit: string;
  dateRequired: string;
}

const nameSchema = (messages: JameyaValidationMessages) =>
  z.string().trim().min(1, messages.nameRequired).max(JAMEYA_NAME_MAX_LENGTH, messages.nameTooLong);

const noteSchema = (messages: JameyaValidationMessages) =>
  z.string().max(JAMEYA_NOTE_MAX_LENGTH, messages.noteTooLong).optional();

const wholePoundsSchema = (messages: JameyaValidationMessages, positiveMessage: string) =>
  z.number({ error: positiveMessage }).positive(positiveMessage).int(messages.wholePounds);

export function createJameyaDetailsSchema(messages: JameyaValidationMessages) {
  return z.object({
    name: nameSchema(messages),
    shareAmount: wholePoundsSchema(messages, messages.shareAmountPositive),
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
      amount: wholePoundsSchema(messages, messages.amountPositive),
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

export function createJameyaCollectSchema(
  messages: JameyaValidationMessages,
  limitFor: (customerId: string) => number,
) {
  return createJameyaMoneyEntrySchema(messages, limitFor).and(
    z.object({ image: imageFileSchema(JAMEYA_RECEIPT_MAX_BYTES, 'Screenshot') }),
  );
}

export type JameyaCollectInput = z.infer<ReturnType<typeof createJameyaCollectSchema>>;
