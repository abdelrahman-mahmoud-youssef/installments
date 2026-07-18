'use client';

import { cn } from '@/lib/utils';

export type NotificationLanguage = 'AR' | 'EN';

const LANGUAGE_LABEL: Record<NotificationLanguage, string> = {
  AR: 'العربية',
  EN: 'English',
};

export function NotificationLanguageToggle({
  value,
  onChange,
  disabled,
}: {
  value: NotificationLanguage;
  onChange: (language: NotificationLanguage) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
      {(['AR', 'EN'] as const).map((language) => (
        <button
          key={language}
          type="button"
          disabled={disabled}
          onClick={() => onChange(language)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50',
            value === language
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {LANGUAGE_LABEL[language]}
        </button>
      ))}
    </div>
  );
}
