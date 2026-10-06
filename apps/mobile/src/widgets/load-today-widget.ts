import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { Widget } from 'expo-widgets';
import type { TodayWidgetProps } from './today-widget-props';

let todayWidget: Widget<TodayWidgetProps> | null | undefined;

function supportsWidgets(): boolean {
  return Platform.OS === 'ios' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

export function loadTodayWidget(): Widget<TodayWidgetProps> | null {
  if (todayWidget === undefined) {
    todayWidget = supportsWidgets()
      ? (require('./today-widget') as { default: Widget<TodayWidgetProps> }).default
      : null;
  }
  return todayWidget;
}
