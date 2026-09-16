import { Dispatch, ReactNode, SetStateAction } from 'react';
import { ViewStyle } from 'react-native';
import { Icon } from 'react-native-paper';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { theme } from '@styles';

interface CheckBoxProps {
  isChecked: boolean;
  setIsChecked: Dispatch<SetStateAction<boolean>>;
  labelComponent: ReactNode;
  style?: ViewStyle;
}

const CheckBox: React.FC<CheckBoxProps> = ({ isChecked, setIsChecked, labelComponent, style }) => {
  return (
    <BouncyCheckbox
      fillColor={isChecked ? theme.colors.primary : theme.colors.gray300}
      isChecked={isChecked}
      style={[{ gap: 8, flexShrink: 1, alignSelf: 'flex-start' }, style]}
      innerIconStyle={{ borderRadius: 7, borderWidth: isChecked ? 0 : 1.5 }}
      onPress={() => setIsChecked(!isChecked)}
      textComponent={labelComponent}
      size={22}
      iconStyle={{ borderRadius: 7 }}
      iconComponent={<Icon source="check" size={16} color={isChecked ? 'white' : 'transparent'} />}
    />
  );
};

export default CheckBox;
export { CheckBox };
