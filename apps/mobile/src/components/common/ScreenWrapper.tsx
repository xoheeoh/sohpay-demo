import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  hasHeader?: boolean;
  topComponent?: boolean;
  children: React.ReactNode;
  backgroundColor: string;
  keyboardOffsetOverride?: number; // per-screen override when headers vary
  /** BottomBtnBox 등 하단 고정 버튼 높이만큼 iOS KeyboardAvoidingView 보정 (PrimaryButton large = 48) */
  keyboardBottomInset?: number;
}

// 공통 safeArea 레이아웃 컴포넌트 정의
const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  hasHeader = true,
  topComponent = true,
  children,
  backgroundColor,
  keyboardOffsetOverride,
  keyboardBottomInset = 0,
}) => {
  // 안전 영역 상단 높이
  const insets = useSafeAreaInsets();
  // Base offset accounts for safe-area top and typical header height
  const defaultOffset = insets.top + 56;
  const offset = (keyboardOffsetOverride ?? defaultOffset) + keyboardBottomInset;
  const edges = ['bottom', 'left', 'right', ...(!hasHeader ? (['top'] as const) : [])] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={edges}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? offset : 0}>
        {/* topComponent: 구버전에서 헤더 아래 회색 띠를 그리던 옵션. 새 디자인에서는 그리지 않는다 (호환용 prop 유지) */}
        {topComponent && <View style={{ height: 0 }} />}

        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ScreenWrapper;
export { ScreenWrapper };
