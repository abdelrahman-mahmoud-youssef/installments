import { useState } from 'react';
import { CreateJameyaInput, JameyaRecurrenceType } from '@/api/jameyas';
import { parseAmountInput, parseNonNegativeAmountInput, todayIsoDate, toMinorUnits } from '@/lib/format';
import { createLocalId } from '@/lib/local-id';
import { JAMEYA_MAX_GRACE_DAYS, JAMEYA_MAX_TURNS, JAMEYA_MIN_MEMBERS, JAMEYA_MIN_TURNS } from '../jameya-limits';

export interface JameyaFormMember {
  id: string;
  name: string;
  phone: string;
}

export interface JameyaFormTurn extends JameyaFormMember {
  turnId: string;
}

export interface JameyaMemberTurns {
  member: JameyaFormMember;
  count: number;
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

function groupTurns(turns: JameyaFormTurn[]): JameyaMemberTurns[] {
  const groups = new Map<string, JameyaMemberTurns>();
  for (const turn of turns) {
    const group = groups.get(turn.id);
    if (group) {
      group.count += 1;
    } else {
      groups.set(turn.id, { member: { id: turn.id, name: turn.name, phone: turn.phone }, count: 1 });
    }
  }
  return [...groups.values()];
}

export function useJameyaForm() {
  const [values, setValues] = useState<JameyaFormValues>(initialValues);
  const [turns, setTurns] = useState<JameyaFormTurn[]>([]);
  const [errorCodes, setErrorCodes] = useState<Partial<Record<JameyaFormField, JameyaFormErrorCode>>>({});
  const memberTurns = groupTurns(turns);
  const hasEnoughMembers = memberTurns.length >= JAMEYA_MIN_MEMBERS;

  const setField = <K extends keyof JameyaFormValues>(field: K, value: JameyaFormValues[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const confirmDetails = (): boolean => {
    const errors = detailsErrors(values);
    setErrorCodes(errors);
    return Object.keys(errors).length === 0;
  };

  const addTurn = (member: JameyaFormMember) =>
    setTurns((current) =>
      current.length >= JAMEYA_MAX_TURNS ? current : [...current, { ...member, turnId: createLocalId() }],
    );

  const removeTurn = (customerId: string) =>
    setTurns((current) => {
      const lastIndex = current.map((turn) => turn.id).lastIndexOf(customerId);
      return current.filter((_, index) => index !== lastIndex);
    });

  const moveTurn = (from: number, to: number) => setTurns((current) => swapped(current, from, to));

  const shuffleTurns = () => setTurns((current) => shuffled(current));

  const payload = (): CreateJameyaInput => ({
    name: values.name.trim(),
    shareAmount: toMinorUnits(parseAmountInput(values.shareAmount) ?? 0),
    recurrenceType: values.recurrenceType,
    firstDueDate: values.firstDueDate,
    graceDays: parseGraceDays(values.graceDays) ?? 0,
    notes: values.notes.trim() || undefined,
    customerIds: turns.map((turn) => turn.id),
  });

  return {
    values,
    setField,
    errorCodes,
    confirmDetails,
    turns,
    memberTurns,
    hasEnoughMembers,
    hasValidTurns: hasEnoughMembers && turns.length >= JAMEYA_MIN_TURNS && turns.length <= JAMEYA_MAX_TURNS,
    addTurn,
    removeTurn,
    moveTurn,
    shuffleTurns,
    payload,
  };
}
