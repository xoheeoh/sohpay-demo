import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, ScrollViewProps, TextInput, findNodeHandle, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AutoScrollStrategy = 'focused-input';

export interface KeyboardAwareScrollViewProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  /**
   * 화면 하단에 absolute로 떠 있는 UI(BottomBtnBox/BottomAmtBtn 등) 높이 합.
   * 키보드가 올라왔을 때 입력칸이 이 영역에 가리지 않도록 스크롤 오프셋에 반영함.
   */
  keyboardAccessoryHeight?: number;
  /**
   * iOS에서 키보드가 올라왔을 때 기본으로 확보할 하단 여백. (기본값 60)
   */
  iosBaseBottomPadding?: number;
  /**
   * Android에서 기본으로 확보할 하단 여백. (기본값 24)
   */
  androidBaseBottomPadding?: number;
  /** 추가로 더할 하단 padding */
  extraBottomPadding?: number;
  /**
   * 키보드 등장 시 현재 포커스된 입력칸을 자동으로 보이게 스크롤.
   * 기본은 켜짐.
   */
  autoScrollStrategy?: AutoScrollStrategy | 'none';
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * 목적: 화면별로 keyboardHeight/scrollToInput/paddingBottom 튜닝을 반복하지 않기 위한 공통 ScrollView.
 * - 키보드 등장 시 "현재 포커스된 입력"을 자동으로 키보드 위로 올림
 * - BottomBtnBox/BottomAmtBtn 같이 absolute 하단 UI가 키보드 위에 뜨는 케이스를 keyboardAccessoryHeight로 반영
 */
const KeyboardAwareScrollView = React.forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  (
    {
      keyboardAccessoryHeight = 0,
      iosBaseBottomPadding = 60,
      androidBaseBottomPadding = 24,
      extraBottomPadding = 0,
      autoScrollStrategy = 'focused-input',
      keyboardShouldPersistTaps = 'handled',
      contentContainerStyle,
      onScrollBeginDrag,
      ...rest
    },
    forwardedRef,
  ) => {
    const insets = useSafeAreaInsets();
    const innerRef = useRef<ScrollView>(null);
    // 내부 로직은 항상 innerRef를 사용하고, 외부 ref(object/function)는 동기화만 해줌.
    const setRefs = (node: ScrollView | null) => {
      innerRef.current = node;
      if (!forwardedRef) return;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else {
        (forwardedRef as React.MutableRefObject<ScrollView | null>).current = node;
      }
    };

    const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
    const scrollYRef = useRef(0);

    const baseBottomPadding = Platform.OS === 'ios' ? iosBaseBottomPadding : androidBaseBottomPadding;
    const computedBottomPadding = useMemo(() => {
      const keyboardPadding = Platform.OS === 'android' ? androidKeyboardHeight : 0;
      return baseBottomPadding + keyboardAccessoryHeight + extraBottomPadding + keyboardPadding;
    }, [androidKeyboardHeight, baseBottomPadding, extraBottomPadding, keyboardAccessoryHeight]);

    const scrollToFocusedInput = (delayMs: number) => {
      const sv = innerRef.current;
      if (!sv) return;

      const maybeFocusedInput = (TextInput as any).State?.currentlyFocusedInput?.();
      const node = findNodeHandle(maybeFocusedInput ?? null);

      if (!node) return;

      const responder = (sv as any).getScrollResponder?.() ?? (sv as any);
      // 키보드 위에서 "추가로 띄울" 공간.
      // - accessory(BottomBtnBox 등) 높이
      // - 화면에서 확보하는 기본/추가 bottom padding (ScrollView content inset 역할)
      // - 멀티라인 입력(Textarea)에서 커서가 더 아래로 내려가는 케이스를 위한 여유
      const basePadding = baseBottomPadding + extraBottomPadding;
      const safetyMargin = Platform.OS === 'android' ? 48 : 60;
      const extraOffset = insets.bottom + keyboardAccessoryHeight + basePadding + safetyMargin;

      setTimeout(() => {
        responder.scrollResponderScrollNativeHandleToKeyboard?.(node, extraOffset, true);
      }, delayMs);
    };

    const scrollToFocusedInputByMeasurementIOS = (keyboardScreenY: number, delayMs: number) => {
      if (Platform.OS !== 'ios') return;
      const sv = innerRef.current;
      if (!sv) return;

      const maybeFocusedInput = (TextInput as any).State?.currentlyFocusedInput?.();
      const node = findNodeHandle(maybeFocusedInput ?? null);
      if (!node) return;

      // "키보드 상단" 위로 확보해야 하는 영역:
      // - BottomBtnBox 같은 accessory 높이
      // - 약간의 여유(기기/폰트/인풋 높이 편차)
      // iOS에서 endCoordinates.screenY는 "키보드 top" 좌표라 safe-area bottom을 별도로 빼면 과보정 되는 케이스가 있음.
      const margin = 12;
      const visibleBottomY = keyboardScreenY - keyboardAccessoryHeight - margin;

      setTimeout(() => {
        UIManager.measureInWindow(node, (_x: number, y: number, _w: number, h: number) => {
          const inputBottomY = y + h;
          const overlap = inputBottomY - visibleBottomY;
          if (overlap <= 0) return;

          const nextY = scrollYRef.current + overlap;
          // scrollTo가 없거나 ref가 ScrollResponder 형태인 경우를 대비
          (sv as any).scrollTo?.({ y: nextY, animated: true });
        });
      }, delayMs);
    };

    useEffect(() => {
      if (Platform.OS !== 'android') return;

      const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
        setAndroidKeyboardHeight(e.endCoordinates?.height ?? 0);
      });
      const hideSub = Keyboard.addListener('keyboardDidHide', () => {
        setAndroidKeyboardHeight(0);
      });
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

    useEffect(() => {
      if (autoScrollStrategy === 'none') return;

      // Android는 keyboardDidShow에서 안정적으로 스크롤.
      // iOS는 willShow/didShow 타이밍이 기기별로 달라서 둘 다 2회씩 보정함.
      const subs =
        Platform.OS === 'ios'
          ? [
              Keyboard.addListener('keyboardWillShow', () => {
                scrollToFocusedInput(0);
                scrollToFocusedInput(80);
              }),
              Keyboard.addListener('keyboardDidShow', () => {
                scrollToFocusedInput(0);
                scrollToFocusedInput(80);
              }),
            ]
          : [
              Keyboard.addListener('keyboardDidShow', () => {
                scrollToFocusedInput(50);
                scrollToFocusedInput(250);
              }),
            ];

      return () => {
        subs.forEach((s) => s.remove());
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoScrollStrategy, keyboardAccessoryHeight, insets.bottom]);

    useEffect(() => {
      if (autoScrollStrategy === 'none') return;
      if (Platform.OS !== 'ios') return;

      // iOS: scrollResponderScrollNativeHandleToKeyboard가 덜 올라오는 케이스가 있어,
      // measureInWindow로 실제 겹침을 계산해서 "필요한 만큼만" 추가 scrollTo로 보정함.
      const subs = [
        Keyboard.addListener('keyboardWillShow', (e) => {
          scrollToFocusedInputByMeasurementIOS(e.endCoordinates?.screenY ?? 0, 0);
          scrollToFocusedInputByMeasurementIOS(e.endCoordinates?.screenY ?? 0, 80);
        }),
        Keyboard.addListener('keyboardDidShow', (e) => {
          scrollToFocusedInputByMeasurementIOS(e.endCoordinates?.screenY ?? 0, 0);
          scrollToFocusedInputByMeasurementIOS(e.endCoordinates?.screenY ?? 0, 80);
        }),
      ];
      return () => subs.forEach((s) => s.remove());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoScrollStrategy, keyboardAccessoryHeight, insets.bottom]);

    const handleScrollBeginDrag = (e: any) => {
      // 스크롤 시작 시 드롭다운 같은 오버레이가 있다면, 기존 화면 로직에서 닫는 용도로 사용 가능
      onScrollBeginDrag?.(e);
    };

    // NOTE: TextInput focus 이벤트는 bubble/capture로 안정적으로 잡기 어렵기 때문에,
    // 키보드 show 이벤트 기반 자동 스크롤을 기본 전략으로 둠.

    return (
      <ScrollView
        ref={setRefs}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
          (rest as any).onScroll?.(e);
        }}
        scrollEventThrottle={16}
        contentContainerStyle={[contentContainerStyle, { paddingBottom: computedBottomPadding }]}
        {...rest}
      />
    );
  },
);

KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

export default KeyboardAwareScrollView;
export { KeyboardAwareScrollView };
