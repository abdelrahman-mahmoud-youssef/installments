import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASS: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-muted text-muted-foreground',
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  hint,
  emphasis = false,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  hint?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn('grid size-9 place-items-center rounded-lg', TONE_CLASS[tone])}>
          <Icon className="size-[1.15rem]" strokeWidth={2} />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <p
          className={cn(
            'font-heading font-semibold tracking-tight tabular-nums',
            emphasis ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl lg:text-[1.75rem]',
            tone === 'danger' && emphasis && 'text-danger',
          )}
        >
          {value}
        </p>
        {hint && <p className="pb-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
