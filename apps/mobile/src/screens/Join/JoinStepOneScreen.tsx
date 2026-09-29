import React, { useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconButton } from 'react-native-paper';

import type { RootStackParamList } from '@typ/navigation';
import { IUserData } from '@typ/userType';
import { storeData } from '@storages/asyncStorage';
import {
  BottomBtnBox,
  BOTTOM_BTN_BOX_KEYBOARD_INSET,
  CheckBox,
  KeyboardAwareScrollView,
  ScreenWrapper,
  Typography,
} from '@components/common';
import { layout, theme } from '@styles';
import styles from './JoinStepScreen.styles';

type JoinStepOneScreenProps = NativeStackScreenProps<RootStackParamList, 'JoinOne'>;

const JoinStepOneScreen: React.FC<JoinStepOneScreenProps> = ({ navigation }) => {
  /**
   * 약관 동의 체크박스 상태관리
   * 개별 체크박스가 모두 선택되면 전체 동의 활성화
   * 전체 동의 체크박스가 선택되면 모든 체크박스 활성화
   */
  const [allCheckbox, setAllCheckbox] = useState<boolean>(false);

  const [term1Checkbox, setTerm1Checkbox] = useState<boolean>(false); // 서비스 이용약관 (필수)
  const [termEfCheckbox, setTermEfCheckbox] = useState<boolean>(false); // 전자금융거래 이용약관 (필수) - 선불전자지급수단의 핵심 동의
  const [term2Checkbox, setTerm2Checkbox] = useState<boolean>(false); // 개인정보 수집·이용 (필수)
  const [term3Checkbox, setTerm3Checkbox] = useState<boolean>(false); // 광고성 정보 수신 (선택)

  // 전체 동의 체크박스 상태 변경
  const handleAllCheckboxChange = (value: React.SetStateAction<boolean>) => {
    const newValue = typeof value === 'boolean' ? value : value(allCheckbox);
    setAllCheckbox(newValue);
    setTerm1Checkbox(newValue);
    setTermEfCheckbox(newValue);
    setTerm2Checkbox(newValue);
    setTerm3Checkbox(newValue);
  };

  // 개별 체크박스 상태 변경
  const handleTermCheckboxChange = (
    setTerm: React.Dispatch<React.SetStateAction<boolean>>,
    value: React.SetStateAction<boolean>,
  ) => {
    const newValue = typeof value === 'boolean' ? value : value(false);
    setTerm(newValue);

    // 하위 체크박스 모두 선택 여부 확인
    const allTermsChecked =
      (typeof value === 'boolean' ? value : value(term1Checkbox)) &&
      (setTerm === setTerm1Checkbox ? newValue : term1Checkbox) &&
      (setTerm === setTermEfCheckbox ? newValue : termEfCheckbox) &&
      (setTerm === setTerm2Checkbox ? newValue : term2Checkbox) &&
      (setTerm === setTerm3Checkbox ? newValue : term3Checkbox);

    setAllCheckbox(allTermsChecked);
  };

  // 버튼 활성화 상태 계산 (필수 약관 체크 완료 시)
  const isButtonDisabled = !(term1Checkbox && termEfCheckbox && term2Checkbox);

  // 선택 약관(광고 수신) 동의 여부를 가입 정보에 담고 다음 단계로 이동.
  // 새 가입의 첫 단계이므로 이전에 중단된 가입 정보가 남아 있으면 덮어쓴다.
  const handleNext = async () => {
    const firstStepData: Partial<IUserData> = { optionAgree: term3Checkbox };
    await storeData('userData', firstStepData);
    navigation.navigate('JoinTwo');
  };

  // 약관 목록. flg 는 약관 상세 화면(TermContent)이 여는 본문 번호로, 마이페이지 약관 목록 순서(0 서비스, 1 전자금융, 2 개인정보 수집, 3 처리방침, 4 제3자, 5 광고)를 따른다
  const termList = [
    { title: '서비스 이용약관', flg: 0 },
    { title: '전자금융거래 이용약관', flg: 1 },
    { title: '개인(신용)정보 수집 및 이용 동의', flg: 2 },
    { title: '이메일 및 SMS 광고성 정보 수신 동의', flg: 5 },
  ];

  return (
    <ScreenWrapper backgroundColor="white" keyboardBottomInset={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.container]}
        keyboardAccessoryHeight={BOTTOM_BTN_BOX_KEYBOARD_INSET}>
        {/* 회원가입 단계 표시 */}
        <View style={styles.stepBox}>
          <View style={styles.stepBadgeActive}>
            <Typography mode="caption1" color="white">
              1
            </Typography>
          </View>

          <View style={styles.stepLine}></View>

          <View style={styles.stepBadge}>
            <Typography mode="caption1" color="gray900">
              2
            </Typography>
          </View>

          <View style={styles.stepLine}></View>

          <View style={styles.stepBadge}>
            <Typography mode="caption1" color="gray900">
              3
            </Typography>
          </View>
        </View>

        {/* 약관동의 체크박스 */}
        <View style={{ gap: 32 }}>
          <View style={{ gap: 16 }}>
            <Typography mode="heading3" color="gray900">
              약관동의
            </Typography>
            <Typography mode="body2" color="gray600">
              서비스 이용을 위하여 필수 약관 항목에 대한 동의가 필요합니다.
            </Typography>
          </View>

          {/* 약관 동의 체크박스 */}
          <View style={{ gap: 32 }}>
            <CheckBox
              isChecked={allCheckbox}
              setIsChecked={handleAllCheckboxChange}
              style={{ alignItems: 'center' }}
              labelComponent={
                <Typography mode="heading3" color="gray900">
                  전체 동의
                </Typography>
              }
            />

            <View style={{ gap: 24 }}>
              <View style={layout.rowBetween}>
                <CheckBox
                  isChecked={term1Checkbox}
                  setIsChecked={(value) => handleTermCheckboxChange(setTerm1Checkbox, value)}
                  labelComponent={
                    <Typography mode="body2" color="gray900" style={{ flexShrink: 1 }}>
                      서비스 이용약관{' '}
                      <Typography mode="body2" color="red500">
                        (필수)
                      </Typography>
                    </Typography>
                  }
                />

                <IconButton
                  icon="chevron-right"
                  size={24}
                  iconColor={theme.colors.gray600}
                  onPress={() => navigation.navigate('TermContent', { flg: termList[0].flg, title: termList[0].title })}
                  style={styles.iconButton}
                />
              </View>

              <View style={layout.rowBetween}>
                <CheckBox
                  isChecked={termEfCheckbox}
                  setIsChecked={(value) => handleTermCheckboxChange(setTermEfCheckbox, value)}
                  labelComponent={
                    <Typography mode="body2" color="gray900" style={{ flexShrink: 1 }}>
                      전자금융거래 이용약관{' '}
                      <Typography mode="body2" color="red500">
                        (필수)
                      </Typography>
                    </Typography>
                  }
                />

                <IconButton
                  icon="chevron-right"
                  size={24}
                  iconColor={theme.colors.gray600}
                  onPress={() => navigation.navigate('TermContent', { flg: termList[1].flg, title: termList[1].title })}
                  style={styles.iconButton}
                />
              </View>

              <View style={layout.rowBetween}>
                <CheckBox
                  isChecked={term2Checkbox}
                  setIsChecked={(value) => handleTermCheckboxChange(setTerm2Checkbox, value)}
                  labelComponent={
                    <Typography mode="body2" color="gray900" style={{ flexShrink: 1 }}>
                      개인(신용)정보 수집 및 이용 동의{' '}
                      <Typography mode="body2" color="red500">
                        (필수)
                      </Typography>
                    </Typography>
                  }
                />

                <IconButton
                  icon="chevron-right"
                  size={24}
                  iconColor={theme.colors.gray600}
                  onPress={() => navigation.navigate('TermContent', { flg: termList[2].flg, title: termList[2].title })}
                  style={styles.iconButton}
                />
              </View>

              <View style={layout.rowBetween}>
                <CheckBox
                  isChecked={term3Checkbox}
                  setIsChecked={(value) => handleTermCheckboxChange(setTerm3Checkbox, value)}
                  labelComponent={
                    <Typography mode="body2" color="gray900" style={{ flexShrink: 1 }}>
                      이메일 및 SMS 광고성 정보 수신{' '}
                      <Typography mode="body2" color="gray900">
                        (선택)
                      </Typography>
                    </Typography>
                  }
                />

                <IconButton
                  icon="chevron-right"
                  size={24}
                  iconColor={theme.colors.gray600}
                  onPress={() => navigation.navigate('TermContent', { flg: termList[3].flg, title: termList[3].title })}
                  style={styles.iconButton}
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomBtnBox
        buttonKey={isButtonDisabled.toString()}
        disabled={isButtonDisabled}
        label={'다음'}
        onPress={handleNext}
      />
    </ScreenWrapper>
  );
};

export default JoinStepOneScreen;
export { JoinStepOneScreen };
