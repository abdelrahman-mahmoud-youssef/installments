'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { NumberInput } from '@/components/shared/number-input';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { CALCULATION_METHODS, RECURRENCE_TYPES } from '@/lib/enums';
import { routes } from '@/lib/routes';
import { ContractInput, contractSchema } from '@/lib/schemas/contract';

export default function NewContractPage() {
  const t = useTranslations('contracts.new');
  const tCalculationMethod = useTranslations('calculationMethod');
  const tRecurrenceType = useTranslations('recurrenceType');
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

  const calculationMethod = form.watch('calculationMethod');
  const recurrenceType = form.watch('recurrenceType');

  async function onSubmit(values: ContractInput) {
    try {
      const contract = await createContract.mutateAsync(values);
      toast.success(t('created'));
      router.push(routes.contract(contract.id));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('createError'));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('title')} description={t('description')} />

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <FormField
                control={form.control}
                name="calculationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calculationMethod')}</FormLabel>
                    <FormControl>
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="grid-cols-1 sm:grid-cols-3">
                        {CALCULATION_METHODS.map((method) => (
                          <label
                            key={method}
                            className="flex items-center gap-2 rounded-md border p-3 text-sm has-[[data-checked]]:border-primary"
                          >
                            <RadioGroupItem value={method} />
                            {tCalculationMethod(method)}
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <Button type="submit" disabled={form.formState.isSubmitting} className="self-start">
                {form.formState.isSubmitting ? t('submitting') : t('submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
