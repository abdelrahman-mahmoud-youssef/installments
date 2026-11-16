import { CircleAlert } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';

export function FormServerError({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="rounded-xl border-danger/25 bg-danger-soft px-3.5 py-3 text-danger">
      <CircleAlert />
      <AlertTitle className="leading-snug">{message}</AlertTitle>
    </Alert>
  );
}
