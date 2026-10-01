import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@styles';

/**
 * 하단 고정 버튼이 없는 화면에서 스크롤 내용 아래에 둘 여백 스타일.
 * iOS 는 홈 인디케이터 안전 영역(약 34)이 있으면 그 빈 띠만으로 충분해 0 을 쓴다.
 * 홈 버튼 기종은 안전 영역이 0 이라 내용이 화면 끝에 붙으므로, 안드로이드·웹과 같이 theme.screen.bottom 을 더한다.
 * 안드로이드는 제스처 막대 영역이 좁아 안전 영역만으로는 붙어 보인다.
 */
export const useScreenBottomPadding = () => {
  const insets = useSafeAreaInsets();
  const paddingBottom = Platform.OS === 'ios' && insets.bottom > 0 ? 0 : theme.screen.bottom;
  return useMemo(() => ({ paddingBottom }), [paddingBottom]);
};

export default useScreenBottomPadding;
