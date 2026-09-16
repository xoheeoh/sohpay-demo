import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useAppWidth } from '@utils/dimensions';

import { bankMapping, getBankImage } from '@dt/bankCd';
import { Typography } from '@components/common';
import { theme } from '@styles';

type SelectBankProps = {
  onSelectBank: (bankCd: string) => void; // 선택 시 호출할 함수
  setVisible: (visible: boolean) => void;
};

const SelectBank = ({ onSelectBank, setVisible }: SelectBankProps) => {
  // 웹에서는 앱이 700px 프레임 안에 있으므로 창 폭이 아니라 프레임 폭 기준으로 3열을 맞춘다.
  const windowWidth = useAppWidth();

  const bankList = Object.entries(bankMapping).map(([code, name]) => ({
    code,
    name,
  }));

  // BottomSheet content는 좌우 padding 20을 갖고 있고, 내부는 3열 + gap 12 기준으로 맞춤
  const columns = 3;
  const horizontalPadding = 20 * 2;
  const gap = 12;
  const available = windowWidth - horizontalPadding - gap * (columns - 1);
  const itemWidth = Math.floor(available / columns);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 24, gap }}>
      {bankList.map((item) => (
        <Pressable
          key={item.code}
          style={({ pressed }) => [
            styles.card,
            { width: itemWidth },
            pressed && { backgroundColor: theme.colors.gray100 },
          ]}
          onPress={() => {
            onSelectBank(item.code); // 콜백 호출
            setVisible(false);
          }}>
          <Image source={getBankImage(item.code)} resizeMode="contain" style={{ width: 36, height: 36 }} />
          <Typography mode="subtitle3" color="gray900">
            {item.name}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#333',
  },
});

export default SelectBank;
export { SelectBank };
