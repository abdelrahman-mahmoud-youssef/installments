'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, ListOrdered, Loader2, Percent } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { useCustomers } from '@/hooks/use-customers';
import { ApiError } from '@/lib/api/client';
import { CALCULATION_METHODS, type CalculationMethod, RECURRENCE_TYPES } from '@/lib/enums';
import { formatMoney } from '@/lib/format';
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

export default function NewContractPage() {
  const t = useTranslations('contracts.new');
  const tCalculationMethod = useTranslations('calculationMethod');
  const tRecurrenceType = useTranslations('recurrenceType');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId') ?? '';

  const { data: customers, isLoading: isLoadingCustomers } = useCustomers({ limit: 100 });
  const createContract = useCreateContract();

  const form = useForm<ContractInput>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      customerId: preselectedCustomerId,
      productName: '',
      productPrice: 0,
      downPayment: 0,
      calculationMethod: 'FIXED_COUNT',
      recurrenceType: 'MONTHLY',
      startDate: '',
      firstPaymentDate: '',
    },
  });

  const values = form.watch();
  const calculationMethod = values.calculationMethod;
  const recurrenceType = values.recurrenceType;

  const price = Number(values.productPrice) || 0;
  const markup = calculationMethod === 'MARKUP_PERCENT' ? Number(values.markupPercent) || 0 : 0;
  const total = Math.round(price * (1 + markup / 100));
  const down = Number(values.downPayment) || 0;
  const financed = Math.max(total - down, 0);

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
                        <FormLabel>{t('customer')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
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
                            <NumberInput step="0.01" min="0" {...field} />
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
                            <NumberInput step="0.01" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                              <NumberInput step="0.01" min="0" {...field} />
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
                              <NumberInput step="0.01" min="0" {...field} />
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
                        <Select value={field.value} onValueChange={field.onChange}>
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
                    <SummaryRow label={t('contractTotal')}>{formatMoney(total * 100, locale)}</SummaryRow>
                    <SummaryRow label={t('downPayment')}>{formatMoney(down * 100, locale)}</SummaryRow>
                    <SummaryRow label={t('financed')} emphasis>
                      {formatMoney(financed * 100, locale)}
                    </SummaryRow>
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
