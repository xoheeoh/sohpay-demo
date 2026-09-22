import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@styles';

import { typographyStyles } from './Typography';

// 라디오 원의 크기. 모든 값이 정수 px가 되도록 잡아서 어느 화면에서도 점이 정중앙에 온다.
// 바깥 원 22 - 테두리(2 x 2) = 안쪽 공간 18, 점 10 → 위아래·좌우 여백이 정확히 4px씩.
const OUTER_SIZE = 22;
const DOT_SIZE = 10;
const BORDER_SELECTED = 2;
const BORDER_UNSELECTED = 1.5;

interface RadioButtonData {
  id: string;
  label: string;
  value: string;
}

interface RadioProps {
  selectedId: string;
  setSelectedId: (id: string) => void;
  radioButtons: RadioButtonData[]; // 부모로부터 전달받는 radioButtons 데이터
}

const Radio: React.FC<RadioProps> = ({ selectedId, setSelectedId, radioButtons }) => {
  return (
    <View accessibilityRole="radiogroup" style={styles.group}>
      {radioButtons.map((button) => {
        const selected = button.id === selectedId;
        return (
          <Pressable
            key={button.id}
            accessibilityRole="radio"
            accessibilityLabel={button.label}
            accessibilityState={{ checked: selected }}
            style={styles.row}
            onPress={() => {
              if (!selected) setSelectedId(button.id);
            }}>
            <View style={[styles.outerCircle, selected ? styles.outerCircleSelected : styles.outerCircleUnselected]}>
              {selected && <View style={styles.dot} />}
            </View>
            <Text style={styles.label}>{button.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  group: { alignItems: 'flex-start' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  outerCircle: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircleSelected: { borderWidth: BORDER_SELECTED, borderColor: theme.colors.primary },
  outerCircleUnselected: { borderWidth: BORDER_UNSELECTED, borderColor: theme.colors.gray300 },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: theme.colors.primary,
  },
  label: {
    marginLeft: 10,
    ...typographyStyles.body2, // 크기·줄높이·자간은 타입 스케일의 body2
    fontFamily: 'Pretendard-Medium', // 굵기만 선택지 라벨답게 Medium 으로 유지
    color: theme.colors.gray900,
  },
});

export default Radio;
export { Radio };
