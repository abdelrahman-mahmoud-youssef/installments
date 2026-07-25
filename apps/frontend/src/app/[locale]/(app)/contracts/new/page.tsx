'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, ListOrdered, Loader2, Percent, Upload, UserPlus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { BackLink } from '@/components/shared/back-link';
import { NumberInput } from '@/components/shared/number-input';
import { PageHeader } from '@/components/shared/page-header';
import { Section } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from '@/i18n/navigation';
import { useCreateContract } from '@/hooks/use-contracts';
import { useCreateCustomer, useCustomers } from '@/hooks/use-customers';
import { ApiError } from '@/lib/api/client';
import { CALCULATION_METHODS, type CalculationMethod, RECURRENCE_TYPES } from '@/lib/enums';
import { formatMoney, toIsoDate, todayIso } from '@/lib/format';
import { routes } from '@/lib/routes';
import { ContractInput, contractSchema } from '@/lib/schemas/contract';

const METHOD_ICON: Record<CalculationMethod, typeof ListOrdered> = {
  FIXED_COUNT: ListOrdered,
  FIXED_AMOUNT: CalendarClock,
  MARKUP_PERCENT: Percent,
};

function SummaryRow({
  label,
  children,
  emphasis,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-sm tabular-nums ${emphasis ? 'font-semibold text-primary' : 'font-medium'}`}>
        {children}
      </dd>
    </div>
  );
}

interface InstallmentPreview {
  count: number;
  regular: number;
  final: number;
}

function buildInstallmentPreview(
  method: CalculationMethod,
  remainingMinor: number,
  values: ContractInput,
): InstallmentPreview | null {
  if (remainingMinor <= 0) {
    return null;
  }
  if (method === 'FIXED_AMOUNT') {
    const fixed = Math.round((Number(values.fixedInstallmentAmount) || 0) * 100);
    if (fixed <= 0) {
      return null;
    }
    const full = Math.floor(remainingMinor / fixed);
    const last = remainingMinor - fixed * full;
    const count = full + (last > 0 ? 1 : 0);
    if (count <= 0) {
      return null;
    }
    return { count, regular: fixed, final: last > 0 ? last : fixed };
  }
  const count = Math.floor(Number(values.installmentCount) || 0);
  if (count <= 0) {
    return null;
  }
  const base = Math.floor(remainingMinor / count);
  const final = base + (remainingMinor - base * count);
  return { count, regular: base, final };
}

function oneMonthLaterIso(): string {
  const now = new Date();
  const targetMonth = now.getMonth() + 1;
  const daysInTargetMonth = new Date(now.getFullYear(), targetMonth + 1, 0).getDate();
  const day = Math.min(now.getDate(), daysInTargetMonth);
  return toIsoDate(new Date(now.getFullYear(), targetMonth, day));
}

export default function NewContractPage() {
  const t = useTranslations('contracts.new');
  const tCustomers = useTranslations('customers');
  const tCalculationMethod = useTranslations('calculationMethod');
  const tRecurrenceType = useTranslations('recurrenceType');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId') ?? '';

  const { data: customers, isLoading: isLoadingCustomers } = useCustomers({ limit: 100 });
  const createContract = useCreateContract();
  const createCustomer = useCreateCustomer();
  const [imageName, setImageName] = useState<string | null>(null);

  const form = useForm<ContractInput>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      customerId: preselectedCustomerId,
      productName: '',
      productPrice: undefined,
      costPrice: undefined,
      downPayment: undefined,
      calculationMethod: 'FIXED_COUNT',
      installmentCount: 12,
      recurrenceType: 'MONTHLY',
      startDate: '',
      firstPaymentDate: '',
    },
  });

  useEffect(() => {
    if (!form.getValues('startDate')) {
      form.setValue('startDate', todayIso());
    }
    if (!form.getValues('firstPaymentDate')) {
      form.setValue('firstPaymentDate', oneMonthLaterIso());
    }
  }, [form]);

  const values = form.watch();
  const calculationMethod = values.calculationMethod;
  const recurrenceType = values.recurrenceType;

  const recurrenceItems = Object.fromEntries(
    RECURRENCE_TYPES.map((type) => [type, tRecurrenceType(type)]),
  );
  const customerItems = Object.fromEntries((customers?.data ?? []).map((c) => [c.id, c.name]));

  const priceMinor = Math.round((Number(values.productPrice) || 0) * 100);
  const downMinor = Math.round((Number(values.downPayment) || 0) * 100);
  let totalMinor: number;
  let remainingMinor: number;
  if (calculationMethod === 'MARKUP_PERCENT') {
    const markup = Number(values.markupPercent) || 0;
    const markedUpBalance = Math.round(Math.max(priceMinor - downMinor, 0) * (1 + markup / 100));
    totalMinor = downMinor + markedUpBalance;
    remainingMinor = markedUpBalance;
  } else {
    totalMinor = priceMinor;
    remainingMinor = priceMinor - downMinor;
  }
  const plan = buildInstallmentPreview(calculationMethod, remainingMinor, values);

  async function onSubmit(input: ContractInput) {
    try {
      const contract = await createContract.mutateAsync(input);
      toast.success(t('created'));
      router.push(routes.contract(contract.id));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('createError'));
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href={routes.contracts} label={tNav('contracts')} />
      <PageHeader title={t('title')} description={t('description')} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Section title={t('sectionProduct')}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between gap-2">
                          <FormLabel>{t('customer')}</FormLabel>
                          <CustomerFormDialog
                            trigger={
                              <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-primary">
                                <UserPlus className="size-3.5" />
                                {tCustomers('newCustomer')}
                              </Button>
                            }
                            onSubmit={async (input) => {
                              const customer = await createCustomer.mutateAsync(input);
                              field.onChange(customer.id);
                            }}
                          />
                        </div>
                        <Select value={field.value} onValueChange={field.onChange} items={customerItems}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={isLoadingCustomers ? t('loadingCustomers') : t('selectCustomer')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers?.data.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} — {customer.phone}
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
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('productName')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="productPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('productPrice')}</FormLabel>
                          <FormControl>
                            <NumberInput step="1" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="downPayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('downPayment')}</FormLabel>
                          <FormControl>
                            <NumberInput step="1" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('costPrice')}</FormLabel>
                          <FormControl>
                            <NumberInput step="1" min="0" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">{t('costPriceHint')}</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>{t('image')}</FormLabel>
                        <FormControl>
                          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border p-3.5 text-sm text-muted-foreground transition-colors hover:bg-accent">
                            <Upload className="size-4 shrink-0" />
                            <span className="truncate">{t('uploadImage')}</span>
                            <input
                              {...field}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              value={undefined}
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                onChange(file ?? undefined);
                                setImageName(file?.name ?? null);
                              }}
                            />
                          </label>
                        </FormControl>
                        {imageName && <p className="truncate text-xs text-muted-foreground">{imageName}</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section title={t('sectionPlan')}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="calculationMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('calculationMethod')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="gap-2.5"
                          >
                            {CALCULATION_METHODS.map((method) => {
                              const Icon = METHOD_ICON[method];
                              return (
                                <label
                                  key={method}
                                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3.5 transition-all has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:ring-1 has-[[data-checked]]:ring-primary/25"
                                >
                                  <RadioGroupItem value={method} />
                                  <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                                    <Icon className="size-4.5" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-sm font-medium">
                                      {tCalculationMethod(method)}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                      {t(`hints.${method}`)}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    {calculationMethod === 'MARKUP_PERCENT' && (
                      <FormField
                        control={form.control}
                        name="markupPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('markupPercent')}</FormLabel>
                            <FormControl>
                              <NumberInput step="1" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {(calculationMethod === 'FIXED_COUNT' || calculationMethod === 'MARKUP_PERCENT') && (
                      <FormField
                        control={form.control}
                        name="installmentCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('installmentCount')}</FormLabel>
                            <FormControl>
                              <NumberInput step="1" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {calculationMethod === 'FIXED_AMOUNT' && (
                      <FormField
                        control={form.control}
                        name="fixedInstallmentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('fixedInstallmentAmount')}</FormLabel>
                            <FormControl>
                              <NumberInput step="1" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </Section>

              <Section title={t('sectionSchedule')}>
                <div className="grid gap-4 sm:grid-cols-2">
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
                            {RECURRENCE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {tRecurrenceType(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {recurrenceType === 'EVERY_X_DAYS' && (
                    <FormField
                      control={form.control}
                      name="intervalDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('intervalDays')}</FormLabel>
                          <FormControl>
                            <NumberInput step="1" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('startDate')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstPaymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('firstPaymentDate')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>
            </div>

            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-20">
                <Section title={t('summary')} description={t('summaryHint')}>
                  <dl className="divide-y divide-border">
                    <SummaryRow label={t('contractTotal')}>{formatMoney(totalMinor, locale)}</SummaryRow>
                    {downMinor > 0 && (
                      <SummaryRow label={t('downPayment')}>{formatMoney(downMinor, locale)}</SummaryRow>
                    )}
                    <SummaryRow label={t('financed')} emphasis>
                      {formatMoney(Math.max(remainingMinor, 0), locale)}
                    </SummaryRow>
                    {plan && (
                      <>
                        <SummaryRow label={t('summaryInstallments')}>{plan.count}</SummaryRow>
                        <SummaryRow label={t('summaryPerInstallment')}>
                          {formatMoney(plan.regular, locale)}
                        </SummaryRow>
                        {plan.final !== plan.regular && (
                          <SummaryRow label={t('summaryFinalInstallment')}>
                            {formatMoney(plan.final, locale)}
                          </SummaryRow>
                        )}
                      </>
                    )}
                    <SummaryRow label={t('recurrence')}>{tRecurrenceType(recurrenceType)}</SummaryRow>
                  </dl>
                  <Button
                    type="submit"
                    size="lg"
                    className="mt-5 w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    {form.formState.isSubmitting ? t('submitting') : t('submit')}
                  </Button>
                </Section>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
