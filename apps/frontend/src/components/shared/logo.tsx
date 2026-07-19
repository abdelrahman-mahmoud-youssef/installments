import { CalendarCheck2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid place-items-center rounded-[0.6rem] bg-primary text-primary-foreground shadow-sm ring-1 ring-inset ring-white/15',
        className,
      )}
    >
      <CalendarCheck2 className="size-[58%]" strokeWidth={2.4} />
    </span>
  );
}

export function Logo({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className="size-8" />
      <span className="text-[0.95rem] font-semibold tracking-tight">{label}</span>
    </div>
  );
}

export function BrandLogo({ logoUrl, label }: { logoUrl: string | null; label: string }) {
  if (!logoUrl) {
    return <Logo label={label} />;
  }

  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt="" className="size-8 rounded-[0.6rem] object-cover" />
      <span className="text-[0.95rem] font-semibold tracking-tight">{label}</span>
    </div>
  );
}
