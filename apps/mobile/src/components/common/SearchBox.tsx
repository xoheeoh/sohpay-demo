import { Dispatch, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { theme } from '@styles';

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
            borderColor: isActive ? theme.colors.primary : 'transparent',
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
    flex: 1,
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 0,
    height: 52,
    position: 'relative',
    fontFamily: 'Pretendard-Regular',
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 22,
    color: theme.colors.gray900,
    includeFontPadding: false, // 안드로이드 기본 패딩 제거
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
