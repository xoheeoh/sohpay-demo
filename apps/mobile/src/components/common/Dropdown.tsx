import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Portal } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import Typography from './Typography';
import { controlSize, theme } from '@styles';

interface DropdownProps {
  placeholder: string;
  options: string[];
  onSelect?: (selectedOption: string) => void;
  /** 크기 단계. lg 는 입력칸·검색창과 나란히 놓이는 기본, md 는 목록 위 필터처럼 작은 자리용 */
  size?: 'lg' | 'md';
  onOpen?: 'options' | 'modal';
  openEvent?: () => void;
  dismissKeyboardOnOpen?: boolean;
}

interface DropDownHandle {
  close: () => void;
}

const Dropdown = forwardRef<DropDownHandle, DropdownProps>(
  (
    { placeholder, options, onSelect, size = 'lg', onOpen = 'options', openEvent, dismissKeyboardOnOpen = true },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedOption, setSelectedOption] = useState<string>(placeholder);
    const [activeOption, setActiveOption] = useState<string | null>(null);
    const [dropdownLayout, setDropdownLayout] = useState<{ left: number; width: number; top: number; height: number }>({
      left: 0,
      width: 0,
      top: 0,
      height: 0,
    }); // 옵션 목록의 화면상 위치와 크기

    const localRef = useRef<View | null>(null);

    useImperativeHandle(ref, () => ({
      close: () => setIsOpen(false),
    }));

    // 화면을 벗어날 때 열린 드롭다운을 닫는다
    useFocusEffect(
      useCallback(() => {
        return () => {
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

    // 셀렉트 박스 위치를 재서 옵션 목록을 바로 아래에 띄운다.
    // findNodeHandle + UIManager.measure 는 웹에서 에러가 나므로 measureInWindow 를 쓴다. Portal 도 창 기준으로 그려 좌표가 그대로 맞는다.
    const measureDropdown = () => {
      localRef.current?.measureInWindow((x, y, width, height) => {
        const optionHeight = 48; // optionItem 높이 (padding 포함)
        const verticalPadding = 16; // optionBox paddingVertical (8 + 8)
        const verticalBorder = OPTION_BOX_BORDER_WIDTH * 2; // 테두리도 높이에 포함되므로 더해야 옵션이 잘리지 않는다
        const maxHeight = 200;
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
      setSelectedOption(option);
      setIsOpen(false);
      onSelect?.(option);
    };

    return (
      <View ref={localRef} style={{ position: 'relative' }}>
        <Pressable
          style={[
            styles.select,
            {
              borderColor: isOpen ? theme.colors.primary : theme.colors.line, // 입력칸과 같은 테두리 규칙
              backgroundColor: isOpen ? theme.colors.white : theme.colors.gray50,
              height: controlSize[size].height,
              borderRadius: controlSize[size].radius,
            },
          ]}
          onPress={onOpen === 'options' ? handlePress : handleModalOpen}>
          {/* 입력칸·옵션 목록과 같은 body2 */}
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
