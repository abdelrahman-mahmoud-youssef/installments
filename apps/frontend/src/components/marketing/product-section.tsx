import { useTranslations } from 'next-intl';
import { CustomerPagePreview } from '@/components/marketing/customer-page-preview';
import { ProductFrame } from '@/components/marketing/product-frame';

export function ProductSection() {
  const t = useTranslations('landing.product');

  return (
    <section className="bg-muted/40">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-28">
        <div className="max-w-xl space-y-5 lg:order-last">
          <h2 className="font-heading text-headline font-semibold tracking-tight text-balance rtl:leading-[1.3] rtl:tracking-normal">
            {t('title')}
          </h2>
          <p className="text-lead text-pretty text-muted-foreground">{t('description')}</p>
          <p className="leading-relaxed text-pretty text-muted-foreground">{t('proofNote')}</p>
        </div>
        <ProductFrame label={t('frameLabel')}>
          <CustomerPagePreview />
        </ProductFrame>
      </div>
    </section>
  );
}
