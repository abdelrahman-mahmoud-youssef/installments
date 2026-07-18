import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StatCard({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'destructive' }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={tone === 'destructive' ? 'text-2xl font-semibold text-destructive' : 'text-2xl font-semibold'}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
