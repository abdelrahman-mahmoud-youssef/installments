import { formatDate } from '@/lib/format';

export function DateText({ value, className }: { value: string | Date; className?: string }) {
  return <span className={className}>{formatDate(value)}</span>;
}
