import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { formatDate, formatMoney } from '@/lib/format';
import { getPublicCustomer } from '@/lib/api/public';

export default async function PublicCustomerPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const [customer, t] = await Promise.all([getPublicCustomer(uuid), getTranslations('publicCustomer')]);

  if (!customer) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-4 sm:p-8">
      <div>
        <p className="text-sm text-muted-foreground">{t('welcome')}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
      </div>

      {customer.contracts.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t('noContracts')}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {customer.contracts.map((contract, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-lg border p-4">
              <h2 className="font-medium">{contract.productName}</h2>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('total')}</p>
                  <p className="font-medium">{formatMoney(contract.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('paid')}</p>
                  <p className="font-medium">{formatMoney(contract.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('remaining')}</p>
                  <p className="font-medium">{formatMoney(contract.remainingAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('paidInstallments')}</p>
                  <p className="font-medium">{contract.paidInstallmentsCount}</p>
                </div>
              </div>

              {contract.upcomingInstallments.length > 0 && (
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">{t('upcoming')}</p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {contract.upcomingInstallments.map((installment, installmentIndex) => (
                      <li key={installmentIndex} className="flex justify-between">
                        <span>{formatDate(installment.dueDate)}</span>
                        <span className="font-medium">{formatMoney(installment.remainingAmount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
