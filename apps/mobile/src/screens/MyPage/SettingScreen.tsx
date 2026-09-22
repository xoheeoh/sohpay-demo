import { useEffect, useState } from 'react';
import { ScrollView, View, Alert, Platform, StyleSheet, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Application from 'expo-application';

import type { RootStackParamList } from '@typ/navigation';
import { useDialog } from '@contexts/DialogContext';
import { ScreenWrapper, Typography, SecondaryButton } from '@components/common';
import { layout, theme } from '@styles';

type SettingScreenProps = NativeStackScreenProps<RootStackParamList, 'Setting'>;

const SettingScreen: React.FC<SettingScreenProps> = () => {
  // Dialog
  const { confirm } = useDialog();

  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [storeVersion, setStoreVersion] = useState<string>('');
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    checkAppVersion();
  }, []);

  // 스토어에 배포되지 않은 데모 앱이라 최신 버전 조회는 하지 않는다. 현재 버전만 표시한다.
  const checkAppVersion = async () => {
    try {
      setIsLoading(true);
      const version = Application.nativeApplicationVersion ?? '0.1.0';
      setCurrentVersion(version);
      setStoreVersion(version);
      setIsUpdateAvailable(false);
    } catch (error) {
      console.log('버전 체크 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePress = () => {
    confirm({
      title: '앱 업데이트',
      message1: '스토어에서 최신 버전을 다운로드하시겠습니까?',
      confirmText: '업데이트',
      cancelText: '취소',
    }).then((ok) => {
      if (ok) {
        openStore();
      }
    });
  };

  const openStore = async () => {
    Alert.alert('안내', '데모 앱은 스토어에 배포되어 있지 않습니다.');
  };

  return (
    <ScreenWrapper backgroundColor="white">
      <ScrollView contentContainerStyle={styles.wrap}>
        {/* 버전 정보 */}
        <Typography mode="body2" color="gray900" style={{ paddingBottom: 12 }}>
          버전정보
        </Typography>

        <View style={styles.divider} />

        <View style={{ paddingVertical: 16 }}>
          <View style={layout.rowBetween}>
            <Typography mode="subtitle3" color="gray900">
              ver {currentVersion}
            </Typography>

            {/* 업데이트 가능 여부에 따라 다른 UI 표시 */}
            {isLoading ? (
              <Typography mode="caption1" color="gray500">
                확인 중...
              </Typography>
            ) : isUpdateAvailable ? (
              <SecondaryButton label="업데이트" onPress={handleUpdatePress} size="md" />
            ) : (
              <Typography mode="caption1" color="blue500">
                최신버전 사용중
              </Typography>
            )}
          </View>

          {/* 스토어 버전 정보 표시 */}
          {storeVersion && !isLoading && (
            <Typography mode="caption2" color="gray600" style={{ marginTop: 4 }}>
              스토어 최신 버전: {storeVersion}
            </Typography>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 16, paddingVertical: 24 },
  divider: { height: 1, backgroundColor: theme.colors.gray150 },
});

export default SettingScreen;
export { SettingScreen };
