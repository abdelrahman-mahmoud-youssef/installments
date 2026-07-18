import { cn } from '@/lib/utils';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase() || '?';
}

export function InitialAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-primary/10 font-medium text-primary select-none',
        className,
      )}
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  );
}
