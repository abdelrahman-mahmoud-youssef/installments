import { JameyaTurnPayload } from '@/lib/api/jameyas';
import { toMinorUnits } from '@/lib/format';
import { JAMEYA_MAX_HOLDERS_PER_TURN } from '@/lib/schemas/jameya';

export type JameyaTurnSplit = 'equal' | 'custom';

export interface WizardMember {
  id: string;
  name: string;
  phone: string;
}

export interface WizardHolder extends WizardMember {
  amount?: number;
}

export interface WizardTurn {
  turnId: string;
  split: JameyaTurnSplit;
  holders: WizardHolder[];
}

export interface WizardMemberTurns {
  member: WizardMember;
  count: number;
}

export function groupMemberTurns(turns: WizardTurn[]): WizardMemberTurns[] {
  const groups = new Map<string, WizardMemberTurns>();
  for (const holder of turns.flatMap((turn) => turn.holders)) {
    const group = groups.get(holder.id);
    if (group) {
      group.count += 1;
    } else {
      groups.set(holder.id, { member: { id: holder.id, name: holder.name, phone: holder.phone }, count: 1 });
    }
  }
  return [...groups.values()];
}

export function withSoloTurn(turns: WizardTurn[], member: WizardMember, turnId: string): WizardTurn[] {
  return [...turns, { turnId, split: 'equal', holders: [{ ...member }] }];
}

function withoutHolder(turn: WizardTurn, customerId: string): WizardTurn {
  const holders = turn.holders.filter((holder) => holder.id !== customerId);
  return { ...turn, holders, split: holders.length > 1 ? turn.split : 'equal' };
}

export function withoutLastTurnOf(turns: WizardTurn[], customerId: string): WizardTurn[] {
  const lastIndex = turns.findLastIndex((turn) => turn.holders.some((holder) => holder.id === customerId));
  if (lastIndex === -1) {
    return turns;
  }
  return withoutPartner(turns, lastIndex, customerId);
}

export function withPartner(turns: WizardTurn[], turnIndex: number, member: WizardMember): WizardTurn[] {
  return turns.map((turn, index) =>
    index === turnIndex && canAddPartner(turn, member.id)
      ? { ...turn, holders: [...turn.holders, { ...member }] }
      : turn,
  );
}

export function withoutPartner(turns: WizardTurn[], turnIndex: number, customerId: string): WizardTurn[] {
  return turns
    .map((turn, index) => (index === turnIndex ? withoutHolder(turn, customerId) : turn))
    .filter((turn) => turn.holders.length > 0);
}

export function withSplit(turns: WizardTurn[], turnIndex: number, split: JameyaTurnSplit): WizardTurn[] {
  return turns.map((turn, index) =>
    index === turnIndex
      ? { ...turn, split, holders: turn.holders.map((holder) => ({ ...holder, amount: undefined })) }
      : turn,
  );
}

export function withHolderAmount(
  turns: WizardTurn[],
  turnIndex: number,
  customerId: string,
  amount: number | undefined,
): WizardTurn[] {
  return turns.map((turn, index) =>
    index === turnIndex
      ? {
          ...turn,
          holders: turn.holders.map((holder) => (holder.id === customerId ? { ...holder, amount } : holder)),
        }
      : turn,
  );
}

export function canAddPartner(turn: WizardTurn, customerId: string): boolean {
  return turn.holders.length < JAMEYA_MAX_HOLDERS_PER_TURN && turn.holders.every((holder) => holder.id !== customerId);
}

export function isCustomSplit(turn: WizardTurn): boolean {
  return turn.split === 'custom' && turn.holders.length > 1;
}

export function amountLeftToSplit(turn: WizardTurn, shareAmount: number): number {
  return shareAmount - turn.holders.reduce((total, holder) => total + (holder.amount ?? 0), 0);
}

function isWholePositive(amount: number | undefined): boolean {
  return amount !== undefined && Number.isInteger(amount) && amount > 0;
}

export function turnAddsUp(turn: WizardTurn, shareAmount: number): boolean {
  if (!isCustomSplit(turn)) {
    return true;
  }
  return turn.holders.every((holder) => isWholePositive(holder.amount)) && amountLeftToSplit(turn, shareAmount) === 0;
}

export function toTurnsPayload(turns: WizardTurn[]): JameyaTurnPayload[] {
  return turns.map((turn) => ({
    holders: turn.holders.map((holder) => ({
      customerId: holder.id,
      contribution: isCustomSplit(turn) && holder.amount !== undefined ? toMinorUnits(holder.amount) : undefined,
    })),
  }));
}
