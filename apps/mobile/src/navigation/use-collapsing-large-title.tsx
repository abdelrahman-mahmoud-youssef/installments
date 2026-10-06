import { useHeaderHeight } from 'expo-router/react-navigation';
import { ReactNode, useCallback, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform } from 'react-native';
import { HeaderTitle } from '@/components/ui/header-title';
import { LargeTitle } from '@/components/ui/large-title';

const SCROLL_EVENT_THROTTLE = 16;

interface CollapsingLargeTitle {
  headerOptions: { title: string; headerTitle: () => ReactNode };
  largeTitle: ReactNode;
  scrollProps: {
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    scrollEventThrottle: number;
  };
}

export function useCollapsingLargeTitle(title: string): CollapsingLargeTitle {
  const headerHeight = useHeaderHeight();
  const [titleHeight, setTitleHeight] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const automaticTopInset = Platform.OS === 'ios' ? headerHeight : 0;

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrolledDistance = event.nativeEvent.contentOffset.y + automaticTopInset;
      setIsCollapsed(titleHeight > 0 && scrolledDistance > titleHeight);
    },
    [automaticTopInset, titleHeight],
  );

  return {
    headerOptions: { title, headerTitle: () => <HeaderTitle title={title} visible={isCollapsed} /> },
    largeTitle: <LargeTitle title={title} onLayout={(event) => setTitleHeight(event.nativeEvent.layout.height)} />,
    scrollProps: { onScroll, scrollEventThrottle: SCROLL_EVENT_THROTTLE },
  };
}
