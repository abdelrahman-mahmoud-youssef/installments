import { ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-4 rtl:rotate-180" />
      {label}
    </Link>
  );
}
