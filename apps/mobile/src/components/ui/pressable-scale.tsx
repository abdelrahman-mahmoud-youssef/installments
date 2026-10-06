import { ReactNode, useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

function splitOuterLayoutStyle(style: StyleProp<ViewStyle>) {
  const { flex, flexGrow, flexShrink, flexBasis, alignSelf, ...innerStyle } = StyleSheet.flatten(style) ?? {};
  const outerStyle: ViewStyle = { flex, flexGrow, flexShrink, flexBasis, alignSelf };
  const fillsOuter = flex !== undefined || flexGrow !== undefined || flexBasis !== undefined;
  return { outerStyle, innerStyle: fillsOuter ? { ...innerStyle, flexGrow: 1 } : innerStyle };
}

export function PressableScale({ children, style, ...rest }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const { outerStyle, innerStyle } = splitOuterLayoutStyle(style);

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };

  return (
    <Pressable style={outerStyle} onPressIn={() => animateTo(0.97)} onPressOut={() => animateTo(1)} {...rest}>
      <Animated.View style={[innerStyle, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
