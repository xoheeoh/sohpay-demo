import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, findNodeHandle, FlatList, Pressable, StyleSheet, UIManager, View } from 'react-native';
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
    const [dropdownLayout, setDropdownLayout] = useState<{ width: number; top: number; height: number }>({
      width: 0,
      top: 0,
      height: 0,
    }); // 드롭다운 크기 및 위치

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
      if (!dropdownLayout.width) {
        measureDropdown(); // 드롭다운 위치와 크기 계산
      }
      setIsOpen((prev) => !prev);
    };

    const handleModalOpen = () => {
      if (dismissKeyboardOnOpen) Keyboard.dismiss();
      openEvent?.();
    };

    const measureDropdown = () => {
      if (localRef.current) {
        const handle = findNodeHandle(localRef.current);
        if (handle) {
          UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
            // 옵션 개수에 따른 높이 계산
            const optionHeight = 48; // 각 옵션의 높이 (optionItem의 padding 포함)
            const verticalPadding = 16; // optionBox의 paddingVertical (8 + 8)
            const maxHeight = 200; // 최대 높이
            const calculatedHeight = Math.min(options.length * optionHeight + verticalPadding, maxHeight);

            setDropdownLayout({
              width,
              top: pageY + height + 12, // 드롭다운 y 좌표 + 높이 + 간격
              height: calculatedHeight,
            });
          });
        }
      }
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
              borderColor: isOpen ? theme.colors.primary : 'transparent',
              backgroundColor: isOpen ? theme.colors.white : theme.colors.gray50,
              height: size === 'default' ? 56 : 44,
            },
          ]}
          onPress={onOpen === 'options' ? handlePress : handleModalOpen}>
          <Typography mode="subtitle3" color="gray900" numberOfLines={1} style={{ flexShrink: 1 }}>
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
    left: 16,
    borderRadius: theme.radius.lg,
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
