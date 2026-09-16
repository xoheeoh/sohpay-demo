import { ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { WEB_MAX_WIDTH } from '@utils/dimensions';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Typography from './Typography';
import { theme } from '@styles';

// 핸들·헤더를 잡고 끌어내려서 시트를 닫는 기준값
const CLOSE_DRAG_DISTANCE = 120; // 이 거리(px) 이상 끌어내리면 닫힘
const CLOSE_DRAG_VELOCITY = 0.5; // 거리가 짧아도 이 속도(px/ms) 이상으로 빠르게 내리면 닫힘
const DRAG_START_DISTANCE = 5; // 이 거리(px)보다 적게 움직이면 탭으로 보고 드래그를 시작하지 않음

/**
 * 시트(또는 시트의 일부 영역)에 붙여서 아래로 끌어내리면 닫히게 하는 제스처 핸들러를 만든다.
 * - 끌고 있는 동안: 손가락을 따라 시트가 내려간다 (위로는 올라가지 않음)
 * - 손을 뗄 때: 충분히 내렸거나 빠르게 내렸으면 닫고, 아니면 제자리로 돌아온다
 */
function useDragToClose(panY: Animated.Value, snapBack: Animated.CompositeAnimation, close: () => void) {
  // snapBack/close는 매 렌더마다 새로 만들어지므로, 항상 최신 것을 쓰도록 ref에 담아둔다
  const latest = useRef({ snapBack, close });
  latest.current = { snapBack, close };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // 탭은 그대로 두고(닫기 버튼이 눌리도록), 세로로 어느 정도 움직였을 때만 드래그로 인식
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > DRAG_START_DISTANCE && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        // 웹: 마우스로 끌다가 글자가 선택되면 브라우저가 "드래그 그만하라"고 요청하는데, 이를 거절해서 계속 끌 수 있게 함
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) => {
          panY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          const draggedFarEnough = gesture.dy > CLOSE_DRAG_DISTANCE;
          const flickedDownFast = gesture.dy > 0 && gesture.vy > CLOSE_DRAG_VELOCITY;
          if (draggedFarEnough || flickedDownFast) {
            latest.current.close();
          } else {
            latest.current.snapBack.start();
          }
        },
        // 다른 요소가 제스처를 가로채 드래그가 중단되면 제자리로
        onPanResponderTerminate: () => {
          latest.current.snapBack.start();
        },
      }),
    [panY],
  );

  return panResponder.panHandlers;
}

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

  const dragToCloseHandlers = useDragToClose(panY, resetBottomSheet, closeModal);

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.background} />
        </TouchableWithoutFeedback>

        {/* 스크롤이 없는 시트라서 시트 전체(핸들·헤더·콘텐츠)를 잡고 끌어내려도 닫힘 */}
        <Animated.View
          {...dragToCloseHandlers}
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

  const dragToCloseHandlers = useDragToClose(panY, resetBottomSheet, closeModal);

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
          {/* 고정 헤더 영역 - 이 영역을 잡고 끌어내리면 닫힘 (스크롤 영역과 겹치지 않음) */}
          <View {...dragToCloseHandlers}>
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
    // 웹: 마우스로 시트를 끌 때 글자가 선택되지 않게 함 (글자가 선택되면 브라우저가 드래그를 끊어버림)
    ...(Platform.OS === 'web'
      ? { maxWidth: WEB_MAX_WIDTH, alignSelf: 'center' as const, userSelect: 'none' as const }
      : null),
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
