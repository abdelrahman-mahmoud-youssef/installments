import { JameyaTurnInput } from '@/api/jameyas';
import { JAMEYA_MAX_HOLDERS_PER_TURN } from '@/components/jameyas/jameya-limits';
import { parseWholeAmountInput, toMinorUnits } from '@/lib/format';

export type JameyaTurnSplit = 'equal' | 'custom';

export const JAMEYA_TURN_SPLITS: JameyaTurnSplit[] = ['equal', 'custom'];

export interface WizardMember {
  id: string;
  name: string;
  phone: string;
}

export interface WizardHolder extends WizardMember {
  amountText: string;
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

function holderOf(member: WizardMember): WizardHolder {
  return { id: member.id, name: member.name, phone: member.phone, amountText: '' };
}

export function withSoloTurn(turns: WizardTurn[], member: WizardMember, turnId: string): WizardTurn[] {
  return [...turns, { turnId, split: 'equal', holders: [holderOf(member)] }];
}

export function withoutPartner(turns: WizardTurn[], turnIndex: number, customerId: string): WizardTurn[] {
  return turns
    .map((turn, index) => {
      if (index !== turnIndex) {
        return turn;
      }
      const holders = turn.holders.filter((holder) => holder.id !== customerId);
      return { ...turn, holders, split: holders.length > 1 ? turn.split : 'equal' };
    })
    .filter((turn) => turn.holders.length > 0);
}

export function withoutLastTurnOf(turns: WizardTurn[], customerId: string): WizardTurn[] {
  const lastIndex = turns.findLastIndex((turn) => turn.holders.some((holder) => holder.id === customerId));
  return lastIndex === -1 ? turns : withoutPartner(turns, lastIndex, customerId);
}

export function canAddPartner(turn: WizardTurn, customerId: string): boolean {
  return turn.holders.length < JAMEYA_MAX_HOLDERS_PER_TURN && turn.holders.every((holder) => holder.id !== customerId);
}

export function withPartner(turns: WizardTurn[], turnIndex: number, member: WizardMember): WizardTurn[] {
  return turns.map((turn, index) =>
    index === turnIndex && canAddPartner(turn, member.id) ? { ...turn, holders: [...turn.holders, holderOf(member)] } : turn,
  );
}

export function withSplit(turns: WizardTurn[], turnIndex: number, split: JameyaTurnSplit): WizardTurn[] {
  return turns.map((turn, index) =>
    index === turnIndex ? { ...turn, split, holders: turn.holders.map((holder) => ({ ...holder, amountText: '' })) } : turn,
  );
}

export function withHolderAmount(
  turns: WizardTurn[],
  turnIndex: number,
  customerId: string,
  amountText: string,
): WizardTurn[] {
  return turns.map((turn, index) =>
    index === turnIndex
      ? { ...turn, holders: turn.holders.map((holder) => (holder.id === customerId ? { ...holder, amountText } : holder)) }
      : turn,
  );
}

export function isCustomSplit(turn: WizardTurn): boolean {
  return turn.split === 'custom' && turn.holders.length > 1;
}

function holderAmount(holder: WizardHolder): number | null {
  const amount = parseWholeAmountInput(holder.amountText);
  return amount === null ? null : toMinorUnits(amount);
}

export function amountLeftToSplit(turn: WizardTurn, shareAmount: number): number {
  return shareAmount - turn.holders.reduce((total, holder) => total + (holderAmount(holder) ?? 0), 0);
}

export function turnAddsUp(turn: WizardTurn, shareAmount: number): boolean {
  if (!isCustomSplit(turn)) {
    return true;
  }
  return turn.holders.every((holder) => holderAmount(holder) !== null) && amountLeftToSplit(turn, shareAmount) === 0;
}

export function toTurnsInput(turns: WizardTurn[]): JameyaTurnInput[] {
  return turns.map((turn) => ({
    holders: turn.holders.map((holder) => ({
      customerId: holder.id,
      contribution: isCustomSplit(turn) ? (holderAmount(holder) ?? undefined) : undefined,
    })),
  }));
}
