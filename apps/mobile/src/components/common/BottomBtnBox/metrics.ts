import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { controlSize } from '@styles';

/** 하단 버튼 상자의 위 안쪽 여백 (BottomBtnBox.ios / .android 의 paddingTop 과 같은 값) */
export const BOTTOM_BTN_BOX_PADDING_TOP = 16;

// 아래 안쪽 여백의 기본값. iOS 만 전용 파일(24)을 쓰고 안드로이드·웹은 같은 파일(12)을 쓰므로 그 분기와 똑같이 나눈다
const BOTTOM_BTN_BOX_PADDING_BOTTOM = Platform.select({ ios: 24, default: 12 }) as number;

/**
 * 하단 버튼 상자의 아래 안쪽 여백. 안전 영역 위에 더해진다.
 * iOS 홈 인디케이터 기종은 안전 영역(약 34)만으로 충분해 더하지 않는다 (useScreenBottomPadding 과 같은 규칙).
 */
export const useBottomBtnBoxPaddingBottom = () => {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' && insets.bottom > 0 ? 0 : BOTTOM_BTN_BOX_PADDING_BOTTOM;
};

/** 하단 버튼 상자의 전체 높이 (안전 영역 제외). 화면 내용을 버튼 위 영역에 맞춰 배치할 때 쓴다 */
export const useBottomBtnBoxHeight = () => BOTTOM_BTN_BOX_PADDING_TOP + controlSize.lg.height + useBottomBtnBoxPaddingBottom();

/** 하단 버튼(lg) 높이. 키보드 위에 올라온 BottomBtnBox 만큼 ScreenWrapper keyboardBottomInset 과 스크롤 여백에 맞춤 */
export const BOTTOM_BTN_BOX_KEYBOARD_INSET = controlSize.lg.height;
