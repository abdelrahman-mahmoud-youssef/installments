import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export function TextLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        'rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/45',
        className,
      )}
      {...props}
    />
  );
}
