import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Portal } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import Typography from './Typography';
import { theme } from '@styles';

interface DropdownProps {
  placeholder: string;
  options: string[];
  onSelect?: (selectedOption: string) => void; // 선택한 옵션을 부모로 전달
  size?: 'default' | 'small';
  onOpen?: 'options' | 'modal';
  openEvent?: () => void;
  dismissKeyboardOnOpen?: boolean;
}

interface DropDownHandle {
  close: () => void;
}

const Dropdown = forwardRef<DropDownHandle, DropdownProps>(
  (
    { placeholder, options, onSelect, size = 'default', onOpen = 'options', openEvent, dismissKeyboardOnOpen = true },
    ref,
  ) => {
    // 드롭다운 셀렉트 박스 열림 상태
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedOption, setSelectedOption] = useState<string>(placeholder); // 선택된 옵션
    const [activeOption, setActiveOption] = useState<string | null>(null); // 현재 active 상태인 옵션
    const [dropdownLayout, setDropdownLayout] = useState<{ left: number; width: number; top: number; height: number }>({
      left: 0,
      width: 0,
      top: 0,
      height: 0,
    }); // 옵션 목록의 화면상 위치와 크기

    // 내부 ref 생성
    const localRef = useRef<View | null>(null);

    // 부모에서 전달된 ref를 내부 ref와 연결
    useImperativeHandle(ref, () => ({
      close: () => setIsOpen(false),
    }));

    // 화면 이동(해당 화면이 blur 되거나 unmount 될 때) 시 드롭다운을 닫기
    useFocusEffect(
      useCallback(() => {
        // 화면이 focus 될 때는 별도 동작 없음
        return () => {
          // 화면이 blur 되거나 unmount 될 때 열린 드롭다운을 닫기
          setIsOpen(false);
        };
      }, []),
    );

    const handlePress = () => {
      if (dismissKeyboardOnOpen) Keyboard.dismiss();
      if (!isOpen) {
        measureDropdown(); // 열 때마다 다시 잰다 (스크롤로 위치가 바뀌었을 수 있음)
      }
      setIsOpen((prev) => !prev);
    };

    const handleModalOpen = () => {
      if (dismissKeyboardOnOpen) Keyboard.dismiss();
      openEvent?.();
    };

    // 셀렉트 박스의 화면상 위치를 재서 옵션 목록을 그 바로 아래에 띄운다.
    // 주의: findNodeHandle + UIManager.measure 는 웹(react-native-web)에서 에러를 던진다.
    // View ref 의 measureInWindow 는 앱·웹 모두에서 동작하고, Portal 도 창(window) 기준으로 그리므로 좌표가 그대로 맞는다.
    const measureDropdown = () => {
      localRef.current?.measureInWindow((x, y, width, height) => {
        // 옵션 개수에 따른 높이 계산
        const optionHeight = 48; // 각 옵션의 높이 (optionItem의 padding 포함)
        const verticalPadding = 16; // optionBox의 paddingVertical (8 + 8)
        const verticalBorder = OPTION_BOX_BORDER_WIDTH * 2; // optionBox 테두리 위아래 (높이에 포함되므로 더해줘야 옵션이 잘리지 않음)
        const maxHeight = 200; // 최대 높이
        const calculatedHeight = Math.min(options.length * optionHeight + verticalPadding + verticalBorder, maxHeight);

        setDropdownLayout({
          left: x,
          width,
          top: y + height + 8, // 셀렉트 박스 아래 + 간격
          height: calculatedHeight,
        });
      });
    };

    const handleSelectOption = (option: string) => {
      setSelectedOption(option); // 선택된 옵션 설정
      setIsOpen(false); // 드롭다운 닫기
      onSelect?.(option); // 부모로 선택한 옵션 전달
    };

    return (
      <View ref={localRef} style={{ position: 'relative' }}>
        <Pressable
          style={[
            styles.select,
            {
              borderColor: isOpen ? theme.colors.primary : theme.colors.line, // 평소에도 연한 테두리 (입력칸과 동일)
              backgroundColor: isOpen ? theme.colors.white : theme.colors.gray50,
              height: size === 'default' ? 52 : 44, // default 는 SearchBox(52) 와 나란히 놓였을 때 높이가 같아야 한다
            },
          ]}
          onPress={onOpen === 'options' ? handlePress : handleModalOpen}>
          {/* 다른 입력칸(TextInput)과 같은 body2. 옵션 목록 글자와도 동일 */}
          <Typography mode="body2" color="gray900" numberOfLines={1} style={{ flexShrink: 1 }}>
            {selectedOption}
          </Typography>

          <Icon source={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.gray500} />
        </Pressable>

        {/* 옵션 리스트 */}
        {isOpen && (
          <Portal>
            <View
              style={[
                styles.optionBox,
                {
                  left: dropdownLayout.left,
                  width: dropdownLayout.width,
                  top: dropdownLayout.top,
                  height: dropdownLayout.height,
                },
              ]}>
              <FlatList
                nestedScrollEnabled={true}
                data={options}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.optionItem, activeOption === item && styles.active]}
                    onPress={() => handleSelectOption(item)}
                    onPressIn={() => setActiveOption(item)}
                    onPressOut={() => setActiveOption(null)}>
                    <Typography mode="body2" color="gray900">
                      {item}
                    </Typography>
                  </Pressable>
                )}
              />
            </View>
          </Portal>
        )}
      </View>
    );
  },
);

// 옵션 리스트 상자의 테두리 두께 (높이 계산에도 쓰이므로 상수로 분리)
const OPTION_BOX_BORDER_WIDTH = 1;

const styles = StyleSheet.create({
  select: {
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionBox: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    borderWidth: OPTION_BOX_BORDER_WIDTH,
    borderColor: theme.colors.line, // 셀렉트 박스의 평소 테두리와 같은 색
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: 'hidden',
    boxShadow: theme.shadow.float,
  },
  optionItem: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: theme.radius.sm },
  active: { backgroundColor: theme.colors.gray100 },
});

export default Dropdown;
export { Dropdown };
