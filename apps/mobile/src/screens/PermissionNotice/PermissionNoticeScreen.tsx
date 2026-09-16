import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '@typ/navigation';
import { storeData } from '@storages/asyncStorage';
import { PrimaryButton, ScreenWrapper, Typography, Wordmark } from '@components/common';
import { theme } from '@styles';

const PERMISSION_NOTICE_SEEN_KEY = 'permissionNoticeSeen';

type PermissionNoticeScreenProps = NativeStackScreenProps<RootStackParamList, 'PermissionNotice'>;

const PermissionNoticeScreen: React.FC<PermissionNoticeScreenProps> = ({ navigation }) => {
  const handleConfirm = async () => {
    await storeData(PERMISSION_NOTICE_SEEN_KEY, true);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );
  };

  return (
    <ScreenWrapper backgroundColor="white" topComponent={false} hasHeader={false}>
      <View style={styles.container}>
        <View style={{ gap: 60, paddingTop: 100 }}>
          <Wordmark height={26} />

          <View style={{ gap: 70 }}>
            <View style={{ gap: 32 }}>
              <Typography mode="heading2" color="gray900">
                원활한 앱 사용을 위한 권한 안내
              </Typography>

              <View style={styles.permissionBox}>
                <View style={styles.iconBox}>
                  <Icon source={'camera-outline'} size={24} color={theme.colors.primary} />
                </View>

                <View style={{ gap: 12, flexShrink: 1 }}>
                  <Typography mode="subtitle2" color="gray900">
                    카메라{' '}
                    <Typography mode="subtitle2" color="gray600">
                      (필수)
                    </Typography>
                  </Typography>

                  <Typography mode="body2" color="gray600">
                    사진 촬영 및 이미지 스캔 기능을 위해{'\n'}카메라 접근 권한이 필요합니다.
                  </Typography>
                </View>
              </View>

              <View style={styles.permissionBox}>
                <View style={styles.iconBox}>
                  <Icon source={'folder-open-outline'} size={24} color={theme.colors.primary} />
                </View>

                <View style={{ gap: 12, flexShrink: 1 }}>
                  <Typography mode="subtitle2" color="gray900">
                    저장공간{' '}
                    <Typography mode="subtitle2" color="gray600">
                      (선택)
                    </Typography>
                  </Typography>

                  <Typography mode="body2" color="gray600">
                    결제 내역에 대한 영수증 이미지 저장을 위해{'\n'}
                    저장공간 접근 권한이 필요합니다.
                  </Typography>
                </View>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Icon source={'information'} size={24} color={theme.colors.gray600} />

              <Typography mode="caption1" color="gray600">
                권한은 ‘휴대폰 설정 {'>'} SohPay 설정’에서{'\n'}
                언제든지 변경할 수 있으며,{'\n'}
                서비스 이용 목적 이외에는 사용되지 않습니다.
              </Typography>
            </View>
          </View>
        </View>

        <View style={{ paddingBottom: 24 }}>
          <PrimaryButton label="네, 확인했어요." size="large" onPress={handleConfirm} />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  iconBox: {
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.gray50,
  },
});

export default PermissionNoticeScreen;
export { PermissionNoticeScreen, PERMISSION_NOTICE_SEEN_KEY };
