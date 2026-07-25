import { getPaymentMethodPreset } from '@/lib/payment-method-presets';
import { cn } from '@/lib/utils';

export function PaymentMethodIcon({
  presetKey,
  className,
}: {
  presetKey: string | null;
  className?: string;
}) {
  const preset = getPaymentMethodPreset(presetKey);

  if (preset.iconSrc) {
    return (
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-white',
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preset.iconSrc} alt="" className="size-full object-cover" />
      </span>
    );
  }

  const Icon = preset.icon;
  return (
    <span
      className={cn('grid size-8 shrink-0 place-items-center rounded-lg text-white', className)}
      style={{ backgroundColor: preset.color }}
    >
      <Icon className="size-4" />
    </span>
  );
}
