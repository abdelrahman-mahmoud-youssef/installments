import { LayoutChangeEvent } from 'react-native';
import { AppText } from './app-text';

interface LargeTitleProps {
  title: string;
  onLayout?: (event: LayoutChangeEvent) => void;
}

export function LargeTitle({ title, onLayout }: LargeTitleProps) {
  return (
    <AppText variant="largeTitle" accessibilityRole="header" onLayout={onLayout}>
      {title}
    </AppText>
  );
}
