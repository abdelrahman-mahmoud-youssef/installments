'use client';

import { Input } from '@/components/ui/input';

export function NumberInput({
  value,
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={(event) => {
        const parsed = event.target.valueAsNumber;
        onChange(Number.isNaN(parsed) ? undefined : parsed);
      }}
      {...props}
    />
  );
}
