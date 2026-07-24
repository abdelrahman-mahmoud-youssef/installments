'use client';

import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Money } from '@/components/shared/money';
import { PaymentMethodIcon } from '@/components/shared/payment-method-icon';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useDeletePaymentMethod, useUpdatePaymentMethod } from '@/hooks/use-payment-methods';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { PaymentMethod } from '@/lib/api/payment-methods';
import { routes } from '@/lib/routes';
import { PaymentMethodFormDialog } from './payment-method-form-dialog';

export function PaymentMethodCard({ method }: { method: PaymentMethod }) {
  const t = useTranslations('paymentMethods');
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  async function handleToggleActive(next: boolean) {
    try {
      await updatePaymentMethod.mutateAsync({ id: method.id, input: { isActive: next } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleDelete() {
    try {
      await deletePaymentMethod.mutateAsync(method.id);
      toast.success(t('paymentMethodDeleted'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  const usageRatio = method.monthlyLimit ? Math.min(1, method.monthToDateUsage / method.monthlyLimit) : 0;

  return (
    <Card className={!method.isActive ? 'opacity-60' : undefined}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <PaymentMethodIcon presetKey={method.presetKey} className="size-10" />
          <div className="min-w-0">
            <CardTitle className="truncate">{method.label}</CardTitle>
            <CardDescription dir="ltr" className="truncate text-left">
              {method.details}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <Switch
            checked={method.isActive}
            onCheckedChange={handleToggleActive}
            disabled={updatePaymentMethod.isPending}
            aria-label={t('paymentMethodActive')}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {method.monthlyLimit != null ? (
          <div className="space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={usageRatio >= 0.8 ? 'h-full rounded-full bg-danger' : 'h-full rounded-full bg-primary'}
                style={{ width: `${usageRatio * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              <Money minorUnits={method.monthToDateUsage} /> / <Money minorUnits={method.monthlyLimit} />{' '}
              {t('thisMonth')}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('noLimitSet')}</p>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <Button size="sm" variant="ghost" render={<Link href={routes.paymentMethod(method.id)} />}>
          {t('viewDetails')}
          <ChevronRight className="size-3.5 rtl:rotate-180" />
        </Button>
        <div className="flex items-center gap-1">
          <PaymentMethodFormDialog
            method={method}
            defaultLabel={method.label}
            trigger={
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t('editPaymentMethod')}>
                <Pencil className="size-4" />
              </Button>
            }
          />
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="icon-sm">
                <Trash2 className="size-4" />
              </Button>
            }
            title={t('deletePaymentMethodTitle')}
            description={t('deletePaymentMethodDescription', { label: method.label })}
            confirmLabel={t('delete')}
            destructive
            onConfirm={handleDelete}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
