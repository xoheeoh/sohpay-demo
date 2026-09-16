import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { WEB_MAX_WIDTH } from '@utils/dimensions';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Typography from './Typography';
import { theme } from '@styles';

interface SimpleBottomSheetProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  title: string;
  content: ReactNode;
}

// 간단한 BottomSheet - 떨림 방지용 (짧은 내용)
const SimpleBottomSheet: React.FC<SimpleBottomSheetProps> = ({ visible, setVisible, title, content }) => {
  const screenHeight = Dimensions.get('screen').height;
  const panY = useRef(new Animated.Value(screenHeight)).current;
  const insets = useSafeAreaInsets();
  const translateY = panY.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0, 0, 1],
  });

  const resetBottomSheet = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeBottomSheet = Animated.timing(panY, {
    toValue: screenHeight,
    duration: 300,
    useNativeDriver: true,
  });

  useEffect(() => {
    if (visible) {
      resetBottomSheet.start();
    } else {
      closeBottomSheet.start();
    }
  }, [visible]);

  const closeModal = () => {
    closeBottomSheet.start(() => {
      setVisible(false);
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.background} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={{
            ...styles.container,
            transform: [{ translateY: translateY }],
          }}>
          {/* 고정 헤더 영역 */}
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Typography mode="subtitle1" color="gray900" style={styles.title}>
              {title}
            </Typography>
            <IconButton
              icon={'close'}
              size={20}
              onPress={closeModal}
              style={styles.closeBtn}
              iconColor={theme.colors.gray700}
            />
          </View>

          {/* 콘텐츠 영역 - 간단한 View만 사용 */}
          <View style={[styles.content, { paddingBottom: insets.bottom }]}>{content}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// 스크롤 가능한 BottomSheet - 긴 내용용
interface ScrollableBottomSheetProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  title: string;
  content: ReactNode;
}

const ScrollableBottomSheet: React.FC<ScrollableBottomSheetProps> = ({ visible, setVisible, title, content }) => {
  const screenHeight = Dimensions.get('screen').height;
  const maxHeight = screenHeight * 0.85;
  const panY = useRef(new Animated.Value(screenHeight)).current;
  const insets = useSafeAreaInsets();
  const translateY = panY.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0, 0, 1],
  });

  const resetBottomSheet = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeBottomSheet = Animated.timing(panY, {
    toValue: screenHeight,
    duration: 300,
    useNativeDriver: true,
  });

  useEffect(() => {
    if (visible) {
      resetBottomSheet.start();
    } else {
      closeBottomSheet.start();
    }
  }, [visible]);

  const closeModal = () => {
    closeBottomSheet.start(() => {
      setVisible(false);
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.background} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={{
            ...styles.container,
            height: maxHeight,
            transform: [{ translateY: translateY }],
          }}>
          {/* 고정 헤더 영역 */}
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Typography mode="subtitle1" color="gray900" style={styles.title}>
              {title}
            </Typography>
            <IconButton
              icon={'close'}
              size={20}
              onPress={closeModal}
              style={styles.closeBtn}
              iconColor={theme.colors.gray700}
            />
          </View>

          {/* 스크롤 가능한 콘텐츠 영역 */}
          <Animated.ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <View style={[styles.content, { paddingBottom: insets.bottom }]}>{content}</View>
          </Animated.ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  background: { flex: 1 },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    width: '100%',
    // height는 동적으로 설정됨
    // 웹: 전체 창을 덮는 Modal 안에서 시트만 700px 프레임 폭에 맞춰 중앙 정렬
    ...(Platform.OS === 'web' ? { maxWidth: WEB_MAX_WIDTH, alignSelf: 'center' as const } : null),
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    backgroundColor: theme.colors.gray200,
  },
  header: {
    // 고정 헤더 영역 - 타이틀과 닫기 버튼을 한 줄에 배치
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 20,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  title: { flex: 1 },
  closeBtn: { margin: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.gray100 },
  scrollArea: {
    flex: 1, // 스크롤 가능한 영역
    maxHeight: '100%', // 최대 높이 제한
  },
  content: { paddingHorizontal: 20 },
});

// 기본 export는 SimpleBottomSheet (기존 호환성 유지)
export default SimpleBottomSheet;
export { SimpleBottomSheet, ScrollableBottomSheet };

// 기존 호환성을 위한 alias
export const BottomSheet = SimpleBottomSheet;
