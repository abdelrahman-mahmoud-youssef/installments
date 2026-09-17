import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function StepIndicator({ current, total }: { current: number; total: number }) {
  const t = useTranslations('auth.register');

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">{t('stepLabel', { current, total })}</p>
      <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn('h-1.5 flex-1 rounded-full transition-colors', index < current ? 'bg-primary' : 'bg-muted')}
          />
        ))}
      </div>
    </div>
  );
}
