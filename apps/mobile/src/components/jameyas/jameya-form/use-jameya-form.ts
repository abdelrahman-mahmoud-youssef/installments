import { useState } from 'react';
import { CreateJameyaInput, JameyaRecurrenceType } from '@/api/jameyas';
import { parseAmountInput, parseNonNegativeAmountInput, todayIsoDate, toMinorUnits } from '@/lib/format';
import { JAMEYA_MAX_GRACE_DAYS, JAMEYA_MAX_MEMBERS, JAMEYA_MIN_MEMBERS } from '../jameya-limits';

export interface JameyaFormMember {
  id: string;
  name: string;
  phone: string;
}

export interface JameyaFormValues {
  name: string;
  shareAmount: string;
  recurrenceType: JameyaRecurrenceType;
  firstDueDate: string;
  graceDays: string;
  notes: string;
}

export type JameyaFormField = 'name' | 'shareAmount' | 'graceDays';

export type JameyaFormErrorCode = 'nameRequired' | 'shareAmountPositive' | 'graceDaysRange';

function initialValues(): JameyaFormValues {
  return {
    name: '',
    shareAmount: '',
    recurrenceType: 'MONTHLY',
    firstDueDate: todayIsoDate(),
    graceDays: '0',
    notes: '',
  };
}

function parseGraceDays(text: string): number | null {
  const value = parseNonNegativeAmountInput(text);
  return value !== null && Number.isInteger(value) && value <= JAMEYA_MAX_GRACE_DAYS ? value : null;
}

function detailsErrors(values: JameyaFormValues): Partial<Record<JameyaFormField, JameyaFormErrorCode>> {
  const errors: Partial<Record<JameyaFormField, JameyaFormErrorCode>> = {};
  if (!values.name.trim()) {
    errors.name = 'nameRequired';
  }
  if (parseAmountInput(values.shareAmount) === null) {
    errors.shareAmount = 'shareAmountPositive';
  }
  if (parseGraceDays(values.graceDays) === null) {
    errors.graceDays = 'graceDaysRange';
  }
  return errors;
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function swapped<T>(items: T[], from: number, to: number): T[] {
  const result = [...items];
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}

export function useJameyaForm() {
  const [values, setValues] = useState<JameyaFormValues>(initialValues);
  const [members, setMembers] = useState<JameyaFormMember[]>([]);
  const [errorCodes, setErrorCodes] = useState<Partial<Record<JameyaFormField, JameyaFormErrorCode>>>({});

  const setField = <K extends keyof JameyaFormValues>(field: K, value: JameyaFormValues[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const confirmDetails = (): boolean => {
    const errors = detailsErrors(values);
    setErrorCodes(errors);
    return Object.keys(errors).length === 0;
  };

  const toggleMember = (member: JameyaFormMember) =>
    setMembers((current) =>
      current.some((item) => item.id === member.id)
        ? current.filter((item) => item.id !== member.id)
        : [...current, member],
    );

  const addMember = (member: JameyaFormMember) =>
    setMembers((current) => (current.some((item) => item.id === member.id) ? current : [...current, member]));

  const removeMember = (memberId: string) => setMembers((current) => current.filter((item) => item.id !== memberId));

  const moveMember = (from: number, to: number) => setMembers((current) => swapped(current, from, to));

  const shuffleMembers = () => setMembers((current) => shuffled(current));

  const payload = (): CreateJameyaInput => ({
    name: values.name.trim(),
    shareAmount: toMinorUnits(parseAmountInput(values.shareAmount) ?? 0),
    recurrenceType: values.recurrenceType,
    firstDueDate: values.firstDueDate,
    graceDays: parseGraceDays(values.graceDays) ?? 0,
    notes: values.notes.trim() || undefined,
    customerIds: members.map((member) => member.id),
  });

  return {
    values,
    setField,
    errorCodes,
    confirmDetails,
    members,
    hasValidMemberCount: members.length >= JAMEYA_MIN_MEMBERS && members.length <= JAMEYA_MAX_MEMBERS,
    toggleMember,
    addMember,
    removeMember,
    moveMember,
    shuffleMembers,
    payload,
  };
}
