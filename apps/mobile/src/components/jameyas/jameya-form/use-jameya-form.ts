import { useState } from 'react';
import { CreateJameyaInput, JameyaRecurrenceType } from '@/api/jameyas';
import {
  parseAmountInput,
  parseNonNegativeAmountInput,
  parseWholeAmountInput,
  todayIsoDate,
  toMinorUnits,
} from '@/lib/format';
import {
  groupMemberTurns,
  JameyaTurnSplit,
  toTurnsInput,
  turnAddsUp,
  WizardMember,
  WizardTurn,
  withHolderAmount,
  withoutLastTurnOf,
  withoutPartner,
  withPartner,
  withSoloTurn,
  withSplit,
} from '@/lib/jameya-wizard';
import { createLocalId } from '@/lib/local-id';
import { JAMEYA_MAX_GRACE_DAYS, JAMEYA_MAX_TURNS, JAMEYA_MIN_MEMBERS, JAMEYA_MIN_TURNS } from '../jameya-limits';

export interface JameyaFormValues {
  name: string;
  shareAmount: string;
  recurrenceType: JameyaRecurrenceType;
  firstDueDate: string;
  graceDays: string;
  notes: string;
}

export type JameyaFormField = 'name' | 'shareAmount' | 'graceDays';

export type JameyaFormErrorCode = 'nameRequired' | 'shareAmountPositive' | 'wholePounds' | 'graceDaysRange';

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
  } else if (parseWholeAmountInput(values.shareAmount) === null) {
    errors.shareAmount = 'wholePounds';
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
  const [turns, setTurns] = useState<WizardTurn[]>([]);
  const [errorCodes, setErrorCodes] = useState<Partial<Record<JameyaFormField, JameyaFormErrorCode>>>({});
  const memberTurns = groupMemberTurns(turns);
  const hasEnoughMembers = memberTurns.length >= JAMEYA_MIN_MEMBERS;
  const shareAmount = toMinorUnits(parseWholeAmountInput(values.shareAmount) ?? 0);
  const everyTurnAddsUp = turns.every((turn) => turnAddsUp(turn, shareAmount));

  const setField = <K extends keyof JameyaFormValues>(field: K, value: JameyaFormValues[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const confirmDetails = (): boolean => {
    const errors = detailsErrors(values);
    setErrorCodes(errors);
    return Object.keys(errors).length === 0;
  };

  const addTurn = (member: WizardMember) =>
    setTurns((current) => (current.length >= JAMEYA_MAX_TURNS ? current : withSoloTurn(current, member, createLocalId())));

  const removeTurn = (customerId: string) => setTurns((current) => withoutLastTurnOf(current, customerId));

  const addPartner = (turnIndex: number, member: WizardMember) =>
    setTurns((current) => withPartner(current, turnIndex, member));

  const removePartner = (turnIndex: number, customerId: string) =>
    setTurns((current) => withoutPartner(current, turnIndex, customerId));

  const setSplit = (turnIndex: number, split: JameyaTurnSplit) =>
    setTurns((current) => withSplit(current, turnIndex, split));

  const setHolderAmount = (turnIndex: number, customerId: string, amountText: string) =>
    setTurns((current) => withHolderAmount(current, turnIndex, customerId, amountText));

  const moveTurn = (from: number, to: number) => setTurns((current) => swapped(current, from, to));

  const shuffleTurns = () => setTurns((current) => shuffled(current));

  const payload = (): CreateJameyaInput => ({
    name: values.name.trim(),
    shareAmount,
    recurrenceType: values.recurrenceType,
    firstDueDate: values.firstDueDate,
    graceDays: parseGraceDays(values.graceDays) ?? 0,
    notes: values.notes.trim() || undefined,
    turns: toTurnsInput(turns),
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
    shareAmount,
    everyTurnAddsUp,
    addTurn,
    removeTurn,
    addPartner,
    removePartner,
    setSplit,
    setHolderAmount,
    moveTurn,
    shuffleTurns,
    payload,
  };
}
