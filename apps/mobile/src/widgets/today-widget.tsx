import { AccessoryWidgetBackground, HStack, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { ReactNode } from 'react';
import type { TodayWidgetProps } from './today-widget-props';

function TodayWidget(props: TodayWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const appUrl = 'qistak://';
  const mediumRowLimit = 3;
  const largeRowLimit = 7;
  const family = environment.widgetFamily;
  const isDark = environment.colorScheme === 'dark';
  const surface = isDark ? props.surfaceDark : props.surfaceLight;
  const muted = isDark ? props.mutedDark : props.mutedLight;
  const homeBackground = [containerBackground(surface, 'widget'), widgetURL(appUrl)];
  const lockBackground = [containerBackground('clear', 'widget'), widgetURL(appUrl)];
  const isLockScreen = family === 'accessoryCircular' || family === 'accessoryRectangular' || family === 'accessoryInline';

  const startAligned = (content: ReactNode) =>
    props.isRTL ? (
      <HStack>
        <Spacer />
        {content}
      </HStack>
    ) : (
      <HStack>
        {content}
        <Spacer />
      </HStack>
    );

  const spread = (start: ReactNode, end: ReactNode) =>
    props.isRTL ? (
      <HStack spacing={8}>
        {end}
        <Spacer />
        {start}
      </HStack>
    ) : (
      <HStack spacing={8}>
        {start}
        <Spacer />
        {end}
      </HStack>
    );

  if (!props.signedIn) {
    return (
      <Text modifiers={[font({ size: 13, weight: 'medium' }), foregroundStyle(muted), ...(isLockScreen ? lockBackground : homeBackground)]}>
        {props.signedOutLabel}
      </Text>
    );
  }

  if (family === 'accessoryInline') {
    return <Text modifiers={lockBackground}>{props.inlineSummary}</Text>;
  }

  if (family === 'accessoryCircular') {
    return (
      <ZStack modifiers={lockBackground}>
        <AccessoryWidgetBackground />
        <VStack spacing={0}>
          <Text modifiers={[font({ size: 22, weight: 'bold' }), monospacedDigit(), minimumScaleFactor(0.5)]}>
            {props.dueCount}
          </Text>
          <Text modifiers={[font({ size: 9, weight: 'medium' }), lineLimit(1), minimumScaleFactor(0.6)]}>
            {props.title}
          </Text>
        </VStack>
      </ZStack>
    );
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment={props.isRTL ? 'trailing' : 'leading'} spacing={2} modifiers={lockBackground}>
        {spread(<Text modifiers={[font({ size: 14, weight: 'semibold' })]}>{props.title}</Text>, <Text modifiers={[font({ size: 14, weight: 'bold' }), monospacedDigit()]}>{props.dueCount}</Text>)}
        {spread(<Text modifiers={[font({ size: 13 }), lineLimit(1), minimumScaleFactor(0.7)]}>{props.claimsLabel}</Text>, <Text modifiers={[font({ size: 13, weight: 'bold' }), monospacedDigit()]}>{props.claimsCount}</Text>)}
      </VStack>
    );
  }

  const claimsLine = spread(
    <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(0.7)]}>
      {props.claimsLabel}
    </Text>,
    <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(props.accentColor), monospacedDigit()]}>
      {props.claimsCount}
    </Text>,
  );

  if (family === 'systemSmall') {
    return (
      <VStack alignment={props.isRTL ? 'trailing' : 'leading'} spacing={4} modifiers={homeBackground}>
        {startAligned(<Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(muted)]}>{props.title}</Text>)}
        {startAligned(<Text modifiers={[font({ size: 34, weight: 'bold' }), foregroundStyle(props.accentColor), monospacedDigit()]}>{props.dueCount}</Text>)}
        {startAligned(<Text modifiers={[font({ size: 13, weight: 'semibold' }), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.6)]}>{props.dueTotal}</Text>)}
        <Spacer />
        {claimsLine}
      </VStack>
    );
  }

  const rowLimit = family === 'systemMedium' ? mediumRowLimit : largeRowLimit;
  const visibleRows = props.rows.slice(0, rowLimit);
  const hiddenLabel = props.hiddenRowsLabels[visibleRows.length];

  return (
    <VStack alignment={props.isRTL ? 'trailing' : 'leading'} spacing={6} modifiers={homeBackground}>
      {spread(
        <Text modifiers={[font({ size: 15, weight: 'bold' })]}>{props.title}</Text>,
        <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(props.accentColor), monospacedDigit()]}>{props.dueTotal}</Text>,
      )}
      {visibleRows.length === 0
        ? startAligned(<Text modifiers={[font({ size: 13 }), foregroundStyle(muted)]}>{props.emptyLabel}</Text>)
        : visibleRows.map((row) =>
            spread(
              <Text modifiers={[font({ size: 13 }), lineLimit(1), minimumScaleFactor(0.8)]}>{row.name}</Text>,
              <Text modifiers={[font({ size: 13, weight: 'semibold' }), monospacedDigit()]}>{row.amount}</Text>,
            ),
          )}
      {hiddenLabel ? startAligned(<Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>{hiddenLabel}</Text>) : null}
      <Spacer />
      {claimsLine}
    </VStack>
  );
}

export default createWidget('TodayWidget', TodayWidget);
