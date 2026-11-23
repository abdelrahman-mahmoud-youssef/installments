'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Minus, Plus, Shuffle, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { JameyaTurnOrderRow } from '@/components/jameyas/jameya-turn-order-row';
import { BackLink } from '@/components/shared/back-link';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateText } from '@/components/shared/date-text';
import { DatePickerField } from '@/components/shared/date-picker-field';
import { Money } from '@/components/shared/money';
import { NumberInput } from '@/components/shared/number-input';
import { PageHeader } from '@/components/shared/page-header';
import { Section } from '@/components/shared/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCustomer, useCustomers } from '@/hooks/use-customers';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useJameyaValidationMessages } from '@/hooks/use-jameya-validation-messages';
import { useCreateJameya, useJameyaPreview, usePreviewJameya } from '@/hooks/use-jameyas';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { CreateJameyaPayload, JameyaPreview } from '@/lib/api/jameyas';
import { JAMEYA_RECURRENCE_TYPES } from '@/lib/enums';
import { toMinorUnits, todayIso } from '@/lib/format';
import {
  groupMemberTurns,
  toTurnsPayload,
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
import { routes } from '@/lib/routes';
import {
  createJameyaDetailsSchema,
  JAMEYA_MAX_HOLDERS_PER_TURN,
  JAMEYA_MAX_TURNS,
  JAMEYA_MIN_MEMBERS,
  JAMEYA_MIN_TURNS,
  JameyaDetailsInput,
} from '@/lib/schemas/jameya';
import { cn } from '@/lib/utils';

const STEPS = ['details', 'members', 'order', 'review'] as const;
type Step = (typeof STEPS)[number];

const PREVIEW_DEBOUNCE_MS = 400;

type PreviewCycle = JameyaPreview['cycles'][number];

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function moved<T>(items: T[], from: number, to: number): T[] {
  const result = [...items];
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}

function StepIndicator({ current }: { current: Step }) {
  const t = useTranslations('jameyas.new.steps');
  const currentIndex = STEPS.indexOf(current);
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step, index) => (
        <li
          key={step}
          className={cn(
            'flex items-center gap-2 rounded-full border px-3 py-1 text-sm',
            index === currentIndex
              ? 'border-primary bg-primary/10 font-medium text-primary'
              : index < currentIndex
                ? 'border-border text-foreground'
                : 'border-border text-muted-foreground',
          )}
        >
          <span className="tabular-nums">{index + 1}</span>
          {t(step)}
        </li>
      ))}
    </ol>
  );
}

export default function NewJameyaPage() {
  const t = useTranslations('jameyas.new');
  const tNav = useTranslations('nav');
  const tCustomers = useTranslations('customers');
  const tRecurrence = useTranslations('recurrenceType');
  const router = useRouter();
  const messages = useJameyaValidationMessages();
  const [schema] = useState(() => createJameyaDetailsSchema(messages));
  const [step, setStep] = useState<Step>('details');
  const [turns, setTurns] = useState<WizardTurn[]>([]);
  const [preview, setPreview] = useState<JameyaPreview | null>(null);
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers({ status: 'ACTIVE', limit: 100 });
  const createCustomer = useCreateCustomer();
  const previewJameya = usePreviewJameya();
  const createJameya = useCreateJameya();

  const form = useForm<JameyaDetailsInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      shareAmount: undefined,
      recurrenceType: 'MONTHLY',
      firstDueDate: todayIso(),
      graceDays: 0,
      notes: '',
    },
  });

  const enteredShareAmount = useWatch({ control: form.control, name: 'shareAmount' });
  const shareAmount = typeof enteredShareAmount === 'number' ? enteredShareAmount : 0;
  const availableCustomers = customers?.data ?? [];
  const customerChoices: WizardMember[] = availableCustomers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
  }));
  const customerItems = Object.fromEntries(availableCustomers.map((customer) => [customer.id, customer.name]));
  const recurrenceItems = Object.fromEntries(JAMEYA_RECURRENCE_TYPES.map((type) => [type, tRecurrence(type)]));
  const memberTurns = groupMemberTurns(turns);
  const hasEnoughMembers = memberTurns.length >= JAMEYA_MIN_MEMBERS;
  const turnCountIsValid = hasEnoughMembers && turns.length >= JAMEYA_MIN_TURNS && turns.length <= JAMEYA_MAX_TURNS;
  const everyTurnAddsUp = turns.every((turn) => turnAddsUp(turn, shareAmount));
  const nameOf = (customerId: string) =>
    memberTurns.find((group) => group.member.id === customerId)?.member.name ?? '';
  const turnCountOf = (customerId: string) =>
    memberTurns.find((group) => group.member.id === customerId)?.count ?? 0;
  const livePreviewRequest = useDebouncedValue(
    step === 'order' && everyTurnAddsUp && shareAmount > 0 ? JSON.stringify(buildPayload()) : null,
    PREVIEW_DEBOUNCE_MS,
  );
  const livePreview = useJameyaPreview(
    livePreviewRequest === null ? null : (JSON.parse(livePreviewRequest) as CreateJameyaPayload),
  );

  function previewContributionOf(turnIndex: number, customerId: string): number | undefined {
    return livePreview.data?.cycles[turnIndex]?.holders.find((holder) => holder.customerId === customerId)
      ?.contribution;
  }

  function addTurn(member: WizardMember) {
    setTurns((current) => withSoloTurn(current, member, crypto.randomUUID()));
  }

  function removeTurn(customerId: string) {
    setTurns((current) => withoutLastTurnOf(current, customerId));
  }

  function buildPayload(): CreateJameyaPayload {
    const values = form.getValues();
    return {
      name: values.name.trim(),
      shareAmount: toMinorUnits(values.shareAmount),
      recurrenceType: values.recurrenceType,
      firstDueDate: values.firstDueDate,
      graceDays: values.graceDays,
      notes: values.notes || undefined,
      turns: toTurnsPayload(turns),
    };
  }

  function showError(error: unknown, fallback: string) {
    toast.error(error instanceof ApiError ? error.message : fallback);
  }

  async function goToReview() {
    try {
      setPreview(await previewJameya.mutateAsync(buildPayload()));
      setStep('review');
    } catch (error) {
      showError(error, t('previewError'));
    }
  }

  async function handleCreate() {
    try {
      const jameya = await createJameya.mutateAsync(buildPayload());
      toast.success(t('created'));
      router.push(routes.jameya(jameya.id));
    } catch (error) {
      showError(error, t('createError'));
    }
  }

  async function handleNext() {
    if (step === 'details' && (await form.trigger())) {
      setStep('members');
    } else if (step === 'members' && turnCountIsValid) {
      setStep('order');
    } else if (step === 'order' && everyTurnAddsUp) {
      await goToReview();
    }
  }

  const reviewColumns: Column<PreviewCycle>[] = [
    {
      id: 'turn',
      header: t('review.turn'),
      className: 'w-16',
      cell: (cycle) => <span className="tabular-nums text-muted-foreground">{cycle.sequence}</span>,
    },
    {
      id: 'holder',
      header: t('review.holder'),
      role: 'primary',
      cell: (cycle) => (
        <ul className="space-y-0.5">
          {cycle.holders.map((holder) => (
            <li key={holder.customerId} className="flex flex-wrap items-center gap-x-2">
              <span className="font-medium">{nameOf(holder.customerId)}</span>
              {cycle.holders.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  <Money minorUnits={holder.contribution} hideWholeDecimals /> →{' '}
                  <Money minorUnits={holder.entitlementAmount} hideWholeDecimals />
                </span>
              )}
            </li>
          ))}
        </ul>
      ),
    },
    { id: 'due', header: t('review.dueDate'), cell: (cycle) => <DateText value={cycle.dueDate} /> },
    {
      id: 'late',
      header: t('review.lateAfter'),
      cell: (cycle) => <DateText value={cycle.lateAfter} className="text-muted-foreground" />,
    },
    {
      id: 'receives',
      header: t('review.receives'),
      role: 'trailing',
      align: 'end',
      cell: (cycle) => (
        <Money
          minorUnits={cycle.holders.reduce((total, holder) => total + holder.entitlementAmount, 0)}
          hideWholeDecimals
          className="font-medium"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <BackLink href={routes.jameyas} label={tNav('jameyas')} />
      <PageHeader title={t('title')} description={t('description')} />
      <StepIndicator current={step} />

      {step === 'details' && (
        <Form {...form}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleNext();
            }}
          >
            <Section title={t('steps.details')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t('name')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('namePlaceholder')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shareAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shareAmount')}</FormLabel>
                      <FormControl>
                        <NumberInput step="1" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recurrenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('recurrence')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} items={recurrenceItems}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JAMEYA_RECURRENCE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {tRecurrence(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('firstDueDate')}</FormLabel>
                      <FormControl>
                        <DatePickerField value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="graceDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('graceDays')}</FormLabel>
                      <FormControl>
                        <NumberInput step="1" min="0" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{t('graceDaysHint')}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t('notes')}</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Section>
          </form>
        </Form>
      )}

      {step === 'members' && (
        <Section
          title={t('steps.members')}
          description={t('membersHint', { min: JAMEYA_MIN_TURNS, max: JAMEYA_MAX_TURNS })}
          action={
            <CustomerFormDialog
              trigger={
                <Button type="button" variant="ghost" size="sm" className="text-primary">
                  <UserPlus className="size-3.5" />
                  {tCustomers('newCustomer')}
                </Button>
              }
              onSubmit={async (input) => {
                const customer = await createCustomer.mutateAsync(input);
                addTurn({ id: customer.id, name: customer.name, phone: customer.phone });
              }}
            />
          }
        >
          <div className="space-y-4">
            <Select
              value=""
              onValueChange={(value) => {
                const customer = availableCustomers.find((item) => item.id === value);
                if (customer) {
                  addTurn({ id: customer.id, name: customer.name, phone: customer.phone });
                }
              }}
              items={customerItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingCustomers ? t('loadingCustomers') : t('addMember')} />
              </SelectTrigger>
              <SelectContent>
                {availableCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {memberTurns.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noMembers')}</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {memberTurns.map(({ member, count }) => (
                  <li key={member.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <span className="truncate font-medium">{member.name}</span>
                      <span dir="ltr" className="shrink-0 text-muted-foreground tabular-nums">
                        {member.phone}
                      </span>
                      {count > 1 && <Badge variant="secondary">{t('turnsBadge', { count })}</Badge>}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('addTurn', { name: member.name })}
                        title={t('addTurn', { name: member.name })}
                        disabled={turns.length >= JAMEYA_MAX_TURNS}
                        onClick={() => addTurn(member)}
                      >
                        <Plus className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('removeTurn', { name: member.name })}
                        title={t('removeTurn', { name: member.name })}
                        onClick={() => removeTurn(member.id)}
                      >
                        <Minus className="size-4" />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              {t('memberCount', { count: memberTurns.length })} · {t('turnCount', { count: turns.length })}
            </p>
            {turns.length > 0 && !hasEnoughMembers && <p className="text-sm text-danger">{t('minMembers')}</p>}
          </div>
        </Section>
      )}

      {step === 'order' && (
        <Section
          title={t('steps.order')}
          description={t('orderHint', { max: JAMEYA_MAX_HOLDERS_PER_TURN })}
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => setTurns(shuffled(turns))}>
              <Shuffle className="size-4" />
              {t('randomOrder')}
            </Button>
          }
        >
          <ol className="divide-y divide-border rounded-lg border border-border">
            {turns.map((turn, index) => (
              <JameyaTurnOrderRow
                key={turn.turnId}
                turn={turn}
                index={index}
                turnCount={turns.length}
                shareAmount={shareAmount}
                customers={customerChoices}
                previewContributionOf={(customerId) => previewContributionOf(index, customerId)}
                onMove={(to) => setTurns(moved(turns, index, to))}
                onAddPartner={(member) => setTurns(withPartner(turns, index, member))}
                onRemovePartner={(customerId) => setTurns(withoutPartner(turns, index, customerId))}
                onSplit={(split) => setTurns(withSplit(turns, index, split))}
                onAmount={(customerId, amount) => setTurns(withHolderAmount(turns, index, customerId, amount))}
              />
            ))}
          </ol>
        </Section>
      )}

      {step === 'review' && preview && (
        <div className="space-y-4">
          <Section title={t('steps.review')}>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">{t('review.pot')}</dt>
                <dd className="font-heading text-lg font-semibold">
                  <Money minorUnits={preview.potAmount} hideWholeDecimals />
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">{t('review.perMember')}</dt>
                <dd className="space-y-1 text-sm">
                  {preview.dueAmounts.map((due) => (
                    <div key={due.customerId} className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{nameOf(due.customerId)}</span>
                        {turnCountOf(due.customerId) > 1 && (
                          <Badge variant="secondary">{t('turnsBadge', { count: turnCountOf(due.customerId) })}</Badge>
                        )}
                      </span>
                      <Money minorUnits={due.amount} hideWholeDecimals className="shrink-0 font-semibold" />
                    </div>
                  ))}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">{t('review.cycles')}</dt>
                <dd className="font-heading text-lg font-semibold tabular-nums">{preview.cycles.length}</dd>
              </div>
            </dl>
          </Section>
          <DataTable columns={reviewColumns} rows={preview.cycles} keyOf={(cycle) => String(cycle.sequence)} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={step === 'details'}
          onClick={() => setStep(STEPS[Math.max(STEPS.indexOf(step) - 1, 0)])}
        >
          {t('back')}
        </Button>
        {step === 'review' ? (
          <Button type="button" onClick={handleCreate} disabled={createJameya.isPending}>
            {createJameya.isPending && <Loader2 className="size-4 animate-spin" />}
            {t('create')}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void handleNext()}
            disabled={
              (step === 'members' && !turnCountIsValid) || (step === 'order' && !everyTurnAddsUp) || previewJameya.isPending
            }
          >
            {previewJameya.isPending && <Loader2 className="size-4 animate-spin" />}
            {step === 'order' ? t('toReview') : t('next')}
          </Button>
        )}
      </div>
    </div>
  );
}
