import { useEffect, useRef } from 'react';
import { Animated, DimensionValue, View } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { Card } from './card';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  round?: boolean;
}

export function Skeleton({ width = '100%', height = 16, round = false }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width,
        height,
        opacity,
        backgroundColor: colors.skeleton,
        borderRadius: round ? radius.full : radius.sm,
      }}
    />
  );
}

export function SkeletonCardList({ count = 3, rows = 2 }: { count?: number; rows?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index}>
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Skeleton width={44} height={44} round />
              <View style={{ flex: 1, gap: spacing.sm }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
            {Array.from({ length: rows - 1 }, (_, rowIndex) => (
              <Skeleton key={rowIndex} height={12} />
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}
