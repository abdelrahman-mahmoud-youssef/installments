import { useEffect } from 'react';
import { useAuth } from '@/auth/auth-context';
import { useDashboard } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { loadTodayWidget } from './load-today-widget';
import { buildTodayWidgetProps } from './today-widget-props';

export function TodayWidgetSync() {
  const { isAuthenticated } = useAuth();
  const { t, locale, isRTL } = useI18n();
  const { brandColor } = useTheme();
  const widget = loadTodayWidget();
  const dashboard = useDashboard(widget !== null && isAuthenticated);

  useEffect(() => {
    if (!widget) {
      return;
    }
    const data = isAuthenticated ? dashboard.data : null;
    if (isAuthenticated && !data) {
      return;
    }
    try {
      widget.updateSnapshot(buildTodayWidgetProps(data ?? null, { t, locale, isRTL, brandColor }));
    } catch (error) {
      console.warn('Failed to update the Today widget', error);
    }
  }, [widget, isAuthenticated, dashboard.data, t, locale, isRTL, brandColor]);

  return null;
}
