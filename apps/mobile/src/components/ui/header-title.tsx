import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { AppText } from './app-text';

const FADE_DURATION = 160;

interface HeaderTitleProps {
  title: string;
  visible?: boolean;
}

export function HeaderTitle({ title, visible = true }: HeaderTitleProps) {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: FADE_DURATION, useNativeDriver: true }).start();
  }, [opacity, visible]);

  return (
    <Animated.View style={{ opacity }} accessibilityElementsHidden={!visible}>
      <AppText variant="heading" numberOfLines={1} accessibilityRole="header">
        {title}
      </AppText>
    </Animated.View>
  );
}
