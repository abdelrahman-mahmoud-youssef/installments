const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function formatMoney(minorUnits: number): string {
  return moneyFormatter.format(minorUnits / 100);
}

export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * 100);
}

export function toMajorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: string | Date): string {
  return dateFormatter.format(new Date(date));
}
