'use client';

import { Plus, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn, Stagger, StaggerItem } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { Section } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentMethodCard } from '@/components/payment-methods/payment-method-card';
import { PaymentMethodFormDialog } from '@/components/payment-methods/payment-method-form-dialog';
import { PaymentMethodPresetPicker } from '@/components/payment-methods/payment-method-preset-picker';
import { usePaymentMethods } from '@/hooks/use-payment-methods';

export default function PaymentMethodsPage() {
  const t = useTranslations('paymentMethods');
  const { data: paymentMethods, isLoading } = usePaymentMethods();

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title={t('title')}
          description={t('subtitle')}
          actions={
            <PaymentMethodFormDialog
              defaultLabel=""
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="size-4" />
                  {t('addCustomPaymentMethod')}
                </Button>
              }
            />
          }
        />
      </FadeIn>

      <FadeIn delay={0.05}>
        <PaymentMethodPresetPicker />
      </FadeIn>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      ) : !paymentMethods || paymentMethods.length === 0 ? (
        <Section>
          <EmptyState icon={Wallet} title={t('noPaymentMethods')} compact />
        </Section>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paymentMethods.map((method) => (
            <StaggerItem key={method.id}>
              <PaymentMethodCard method={method} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
