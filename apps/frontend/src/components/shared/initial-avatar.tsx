import { initialsOf } from '@/lib/initials';
import { cn } from '@/lib/utils';

export function InitialAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-primary/10 font-medium text-primary select-none',
        className,
      )}
      aria-hidden
    >
      {initialsOf(name) || '?'}
    </span>
  );
}
