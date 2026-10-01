import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  hasHeader?: boolean;
  topComponent?: boolean;
  children: React.ReactNode;
  backgroundColor: string;
  keyboardOffsetOverride?: number; // 헤더 높이가 다른 화면용 오버라이드
  /** BottomBtnBox 등 하단 고정 버튼 높이만큼 iOS KeyboardAvoidingView 보정 (BOTTOM_BTN_BOX_KEYBOARD_INSET) */
  keyboardBottomInset?: number;
  /**
   * 하단 안전 영역을 화면 틀이 비워 둘지. 기본 true.
   * PinPad 처럼 자기 배경을 화면 맨 아래까지 채우고 안전 영역 여백을 직접 넣는 내용물이 있으면 false 로 끈다. 켜 두면 안전 영역이 두 번 더해진다
   */
  bottomEdge?: boolean;
  /**
   * 하단 안전 영역(홈 인디케이터·제스처 막대 뒤)만 다른 색으로 칠할 때. 기본은 backgroundColor 와 같다.
   * 금액 키패드처럼 화면은 흰색인데 맨 아래에 회색 영역이 놓이는 화면에서, 안전 영역이 흰 띠로 끊겨 보이지 않게 한다
   */
  bottomSafeAreaColor?: string;
}

/** 공통 안전 영역 레이아웃 */
const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  hasHeader = true,
  topComponent = true,
  children,
  backgroundColor,
  keyboardOffsetOverride,
  keyboardBottomInset = 0,
  bottomEdge = true,
  bottomSafeAreaColor,
}) => {
  const insets = useSafeAreaInsets();
  // 기본 오프셋 = 안전 영역 상단 + 헤더 높이(56)
  const defaultOffset = insets.top + 56;
  const offset = (keyboardOffsetOverride ?? defaultOffset) + keyboardBottomInset;
  const edges = [
    ...(bottomEdge ? (['bottom'] as const) : []),
    'left',
    'right',
    ...(!hasHeader ? (['top'] as const) : []),
  ] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={edges}>
      {/* 안전 영역은 SafeAreaView 의 안쪽 여백이라 절대 위치로 그 자리만 덮어 색을 바꾼다 */}
      {bottomEdge && bottomSafeAreaColor && insets.bottom > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: insets.bottom,
            backgroundColor: bottomSafeAreaColor,
          }}
        />
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? offset : 0}>
        {/* topComponent 는 호환용 prop. 현재 디자인에서는 그리지 않는다 */}
        {topComponent && <View style={{ height: 0 }} />}

        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ScreenWrapper;
export { ScreenWrapper };
