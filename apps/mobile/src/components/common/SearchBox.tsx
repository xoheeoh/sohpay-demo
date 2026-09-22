import { Dispatch, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { controlSize, theme } from '@styles';

import { typographyStyles } from './Typography';

interface SearchBoxProps {
  searchQuery: string;
  setSearchQuery: Dispatch<React.SetStateAction<string>>;
  onPress: () => void;
  disabled: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({ searchQuery, setSearchQuery, onPress, disabled }) => {
  // 검색창 활성화 상태
  const [isActive, setIsActive] = useState<boolean>(false);

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <View style={styles.magnifyIcon}>
        <Icon source={'magnify'} size={22} color={theme.colors.gray400} />
      </View>

      <TextInput
        placeholder="검색어를 입력해주세요."
        placeholderTextColor={theme.colors.gray400}
        inputMode="text"
        editable={!disabled}
        style={[
          styles.container,
          {
            borderColor: isActive ? theme.colors.primary : theme.colors.line, // 평소에도 연한 테두리 (다른 입력칸과 동일)
            backgroundColor: isActive ? 'white' : theme.colors.gray50,
          },
        ]}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        value={searchQuery}
        onChangeText={(query: string) => setSearchQuery(query)}
        onSubmitEditing={onPress} // 엔터 눌렀을 때 실행
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // 주의: 여기에 flex: 1 을 주면 웹에서 브라우저가 height 대신 글자 한 줄 높이로 줄여 버려 모양이 깨진다.
    // 가로 폭은 바깥 View(flex: 1)가 잡아 주므로 입력창 자체는 높이만 고정한다.
    borderWidth: 1.5,
    borderRadius: controlSize.lg.radius,
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 0,
    height: controlSize.lg.height, // 드롭다운·입력칸과 나란히 놓여도 높이가 같다 (lg)
    position: 'relative',
    ...typographyStyles.body2, // 입력 글자는 타입 스케일의 body2 (다른 입력칸과 동일)
    color: theme.colors.gray900,
    includeFontPadding: false, // 안드로이드 기본 패딩 제거
    // 웹 브라우저가 포커스 시 그리는 기본 파란 테두리를 끈다 (우리 테두리 색으로 대신 표시)
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  magnifyIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    width: 24,
    height: 24,
    zIndex: 99,
  },
});

export default SearchBox;
export { SearchBox };
