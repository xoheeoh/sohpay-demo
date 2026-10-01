import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Divider, Icon } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { formatPhoneNumber } from '@utils/formatter';
import { useDialog } from '@contexts/DialogContext';
import { ScreenWrapper, SecondaryButton, Typography, useScreenBottomPadding } from '@components/common';
import { layout, theme } from '@styles';

type ServiceScreenProps = NativeStackScreenProps<RootStackParamList, 'Service'>;

/** 데모용 상담 채널. 실제로 운영하는 번호·주소가 아니라 화면 아래에 그 사실을 함께 적는다 */
const CS_TEL_NO = '15880000';
const CS_EMAIL = 'cs@demo.sohpay.app';

/** 상담 안내 카드 안의 "라벨 : 값" 한 줄 */
const InfoLine = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoLine}>
    <Typography mode="body2" color="gray500" style={styles.infoLabel}>
      {label}
    </Typography>
    <Typography mode="body2" color="gray900" style={{ flex: 1 }}>
      {value}
    </Typography>
  </View>
);

/** 위쪽 바로가기 타일 (공지사항 / FAQ / 1:1 상담) */
const QuickMenuTile = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
  <Pressable style={({ pressed }) => [styles.tile, pressed && styles.pressed]} onPress={onPress}>
    <View style={styles.iconCircle}>
      <Icon source={icon} size={22} color={theme.colors.primary} />
    </View>
    <Typography mode="subtitle3" color="gray900">
      {label}
    </Typography>
  </Pressable>
);

const ServiceScreen: React.FC<ServiceScreenProps> = ({ navigation }) => {
  const screenBottom = useScreenBottomPadding();
  const { confirm } = useDialog();

  const handleCall = () => {
    confirm({
      title: '통화연결',
      message1: `${formatPhoneNumber(CS_TEL_NO)} 통화 연결하시겠습니까?`,
      confirmText: '확인',
      cancelText: '아니오',
    }).then((ok) => {
      if (!ok) return;
      Linking.openURL(`tel:${CS_TEL_NO.replace(/-/g, '')}`).catch((error) => {
        console.error('전화 연결 실패', error);
      });
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${CS_EMAIL}`).catch((error) => {
      console.error('메일 앱 열기 실패', error);
    });
  };

  return (
    <ScreenWrapper backgroundColor={theme.colors.bg} topComponent={false}>
      <ScrollView contentContainerStyle={[styles.wrap, screenBottom]}>
        {/* 바로가기 타일 */}
        <View style={styles.tileRow}>
          <QuickMenuTile
            icon="bullhorn-variant-outline"
            label="공지사항"
            onPress={() => navigation.navigate('Notice')}
          />
          <QuickMenuTile icon="message-question-outline" label="FAQ" onPress={() => navigation.navigate('FAQ')} />
          <QuickMenuTile icon="email-edit-outline" label="1:1 상담" onPress={() => navigation.navigate('Inquiry')} />
        </View>

        {/* 상담 안내 */}
        <View style={styles.section}>
          <Typography mode="subtitle3" color="gray500" style={styles.sectionTitle}>
            상담 안내
          </Typography>

          <View style={styles.card}>
            {/* 전화 상담 */}
            <View style={styles.cardRow}>
              <View style={styles.cardRowHeader}>
                <View style={[layout.rowCenter, { gap: 10 }]}>
                  <View style={styles.iconCircleSmall}>
                    <Icon source="phone-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <Typography mode="subtitle2" color="gray900">
                    전화 상담
                  </Typography>
                </View>
                <SecondaryButton label="전화하기" onPress={handleCall} size="sm" />
              </View>

              <View style={styles.infoLines}>
                <InfoLine label="평일" value="09:00 ~ 12:00, 13:00 ~ 18:00" />
                <InfoLine label="주말·공휴일" value="휴무" />
                <InfoLine label="상담번호" value={formatPhoneNumber(CS_TEL_NO)} />
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* 이메일 상담 */}
            <View style={styles.cardRow}>
              <View style={styles.cardRowHeader}>
                <View style={[layout.rowCenter, { gap: 10 }]}>
                  <View style={styles.iconCircleSmall}>
                    <Icon source="email-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <Typography mode="subtitle2" color="gray900">
                    이메일 상담
                  </Typography>
                </View>
                <SecondaryButton label="메일 보내기" onPress={handleEmail} size="sm" />
              </View>

              <View style={styles.infoLines}>
                <InfoLine label="답변 시간" value="접수 후 48시간 이내" />
                <InfoLine label="이메일" value={CS_EMAIL} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: theme.screen.topCard, gap: 24 },
  section: { gap: 8 },
  sectionTitle: { paddingHorizontal: 4 },

  // 바로가기 타일
  tileRow: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
  },
  pressed: { backgroundColor: theme.colors.gray50 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 상담 안내 카드
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    overflow: 'hidden',
  },
  cardRow: { paddingHorizontal: 18, paddingVertical: 18, gap: 14 },
  cardRowHeader: { ...layout.rowBetween, gap: 12 },
  iconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { backgroundColor: theme.colors.gray100, marginHorizontal: 18 },

  // 라벨 : 값 줄
  infoLines: { gap: 6 },
  infoLine: { flexDirection: 'row', gap: 12 },
  infoLabel: { width: 76 },
});

export default ServiceScreen;
export { ServiceScreen };
