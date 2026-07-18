'use client';

import { Copy, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
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
import { useCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { formatDate } from '@/lib/format';
import { routes } from '@/lib/routes';

export default function CustomerDetailPage() {
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
    return <EmptyState title="Customer not found" />;
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
                toast.success('Public link copied.');
              }}
            >
              <Copy className="size-4" />
              Copy public link
            </Button>
            <CustomerFormDialog
              trigger={
                <Button variant="outline">
                  <Pencil className="size-4" />
                  Edit
                </Button>
              }
              customer={customer}
              onSubmit={(input) => updateCustomer.mutateAsync(input)}
            />
            <Button render={<Link href={`${routes.newContract}?customerId=${customer.id}`} />}>
              <Plus className="size-4" />
              New contract
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{customer.address || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{customer.notes || '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Contracts</h2>
        {customer.contracts.length === 0 ? (
          <EmptyState title="No contracts yet" description="Create a contract for this customer to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
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
