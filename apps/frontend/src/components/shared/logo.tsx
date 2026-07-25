import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/qistak-192.png" alt="" className={cn('rounded-[0.6rem] object-cover', className)} />
  );
}

const LOGO_SIZE_CLASSES = {
  default: { mark: 'size-8', text: 'text-[0.95rem]' },
  lg: { mark: 'size-11', text: 'text-lg' },
} as const;

export function Logo({ label, size = 'default' }: { label: string; size?: keyof typeof LOGO_SIZE_CLASSES }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className={LOGO_SIZE_CLASSES[size].mark} />
      <span className={cn('font-semibold tracking-tight', LOGO_SIZE_CLASSES[size].text)}>{label}</span>
    </div>
  );
}

export function BrandLogo({
  logoUrl,
  label,
  size = 'default',
}: {
  logoUrl: string | null;
  label: string;
  size?: keyof typeof LOGO_SIZE_CLASSES;
}) {
  if (!logoUrl) {
    return <Logo label={label} size={size} />;
  }

  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt=""
        className={cn('rounded-[0.6rem] object-cover', LOGO_SIZE_CLASSES[size].mark)}
      />
      <span className={cn('font-semibold tracking-tight', LOGO_SIZE_CLASSES[size].text)}>{label}</span>
    </div>
  );
}
