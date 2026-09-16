import { useMemo } from 'react';
import RadioGroup, { RadioButtonProps } from 'react-native-radio-buttons-group';
import { theme } from '@styles';
import { StyleSheet } from 'react-native';

interface RadioButtonData extends Omit<RadioButtonProps, 'color' | 'borderColor' | 'borderSize'> {
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
  const radioBtnStyle = (id: string) => ({
    borderColor: id === selectedId ? theme.colors.primary : theme.colors.gray300,
    borderSize: id === selectedId ? 2 : 1.5,
    size: 22,
    color: theme.colors.primary,
    containerStyle: { height: 48, alignSelf: 'baseline' as 'baseline', marginHorizontal: 0, marginVertical: 0 },
  });

  // 전달받은 radioButtons에 스타일 추가
  const styledRadioButtons: RadioButtonProps[] = useMemo(
    () =>
      radioButtons.map((button) => ({
        ...button,
        ...radioBtnStyle(button.id), // 스타일 병합
      })),
    [radioButtons, selectedId],
  );

  return (
    <RadioGroup
      labelStyle={styles.label}
      radioButtons={styledRadioButtons}
      onPress={setSelectedId}
      selectedId={selectedId}
    />
  );
};

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: theme.colors.gray900,
  },
});

export default Radio;
export { Radio };
