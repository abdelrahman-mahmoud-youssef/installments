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
  const Icon = preset.icon;
  return (
    <span
      className={cn('grid size-8 shrink-0 place-items-center rounded-full text-white', className)}
      style={{ backgroundColor: preset.color }}
    >
      <Icon className="size-4" />
    </span>
  );
}
