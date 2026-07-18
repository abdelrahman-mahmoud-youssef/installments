'use client';

import { Copy, Pencil, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@/i18n/navigation';
import { useCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { formatDate } from '@/lib/format';
import { routes } from '@/lib/routes';

export default function CustomerDetailPage() {
  const t = useTranslations('customers.detail');
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, isError } = useCustomer(id);
  const updateCustomer = useUpdateCustomer(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !customer) {
    return <EmptyState title={t('notFound')} />;
  }

  const publicUrl = `${window.location.origin}${routes.publicCustomer(customer.publicId)}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={customer.name}
        description={customer.phone}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success(t('linkCopied'));
              }}
            >
              <Copy className="size-4" />
              {t('copyLink')}
            </Button>
            <CustomerFormDialog
              trigger={
                <Button variant="outline">
                  <Pencil className="size-4" />
                  {t('edit')}
                </Button>
              }
              customer={customer}
              onSubmit={(input) => updateCustomer.mutateAsync(input)}
            />
            <Button render={<Link href={`${routes.newContract}?customerId=${customer.id}`} />}>
              <Plus className="size-4" />
              {t('newContract')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('address')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{customer.address || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{customer.notes || '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">{t('contracts')}</h2>
        {customer.contracts.length === 0 ? (
          <EmptyState title={t('noContracts')} description={t('createContractPrompt')} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('product')}</TableHead>
                <TableHead>{t('total')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('created')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <Link href={routes.contract(contract.id)} className="font-medium hover:underline">
                      {contract.productName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Money minorUnits={contract.totalAmount} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={contract.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(contract.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
