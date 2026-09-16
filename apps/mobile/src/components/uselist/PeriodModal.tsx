import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Icon } from 'react-native-paper';

import { getDateMonthsAgo, getOneWeekAgoDate, getDateWithHypen } from '@utils/formatter';
import { DatePicker, PrimaryButton, Radio, Typography } from '@components/common';
import { layout, theme } from '@styles';

interface PeriodModalProps {
  radioValue: string;
  frDt: string;
  toDt: string;
  handleSelectPeriod: () => void;
  onPeriodChange: (frDt: string, toDt: string, radio: string) => void; // 조회 시작일, 종료일, radio value를 부모로 전달하는 콜백
}

const PeriodModal: React.FC<PeriodModalProps> = ({ radioValue, frDt, toDt, handleSelectPeriod, onPeriodChange }) => {
  /**
   * 라디오 버튼 선택 값에 따라 조회 frDt, toDt 설정
   * 기간 직접입력의 경우 클릭하면 DatePicker 등장
   */
  const [selectedPeriod, setSelectedPeriod] = useState<string>(radioValue); // 선택된 radio value값
  const [startDate, setStartDate] = useState<string>(frDt); // 모달 내부 표시용
  const [endDate, setEndDate] = useState<string>(toDt);

  const periodRadioButtons = [
    { id: '1week', label: '1주일', value: '1week' },
    { id: '1month', label: '1개월', value: '1month' },
    { id: 'specific', label: '직접입력', value: 'specific' },
  ];

  // 라디오 선택이 바뀌면 날짜 자동 설정 (직접입력 제외)
  useEffect(() => {
    if (selectedPeriod === 'specific') return; // 직접입력 시 값 유지

    if (selectedPeriod === '1week') {
      setStartDate(getOneWeekAgoDate());
      setEndDate(getDateWithHypen(new Date()));
    } else if (selectedPeriod === '1month') {
      setStartDate(getDateMonthsAgo(1));
      setEndDate(getDateWithHypen(new Date()));
    }
  }, [selectedPeriod]);

  /**
   * DatePicker 열고 닫기
   * DatePicker 표시 여부 상태관리 및 시작일/종료일 선택 구분
   * 유효하지 않은 날짜 선택 시, 오류 Alert 노출
   */
  const [isDatePickerVisible, setDatePickerVisible] = useState<boolean>(false);
  const [isSelectingStartDate, setSelectingStartDate] = useState(true);

  const openDatePicker = (isStartDate: boolean) => {
    setSelectingStartDate(isStartDate);
    setDatePickerVisible(true);
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
  };

  // 날짜 선택 후 처리
  const handleDateChange = (selectedDate: string) => {
    if (isSelectingStartDate) {
      // 시작일 선택
      if (endDate && new Date(selectedDate) > new Date(endDate)) {
        // 선택한 시작일이 종료일보다 뒤인 경우 경고
        Alert.alert('', '시작일은 종료일보다 늦을 수 없습니다.', [
          {
            text: '확인',
            style: 'cancel',
          },
        ]);
      } else {
        setStartDate(selectedDate);
      }
    } else {
      // 종료일 선택
      if (startDate && new Date(selectedDate) < new Date(startDate)) {
        // 선택한 종료일이 시작일보다 앞인 경우 경고
        Alert.alert('', '종료일은 시작일보다 이를 수 없습니다.', [
          {
            text: '확인',
            style: 'cancel',
          },
        ]);
      } else {
        setEndDate(selectedDate);
      }
    }
    closeDatePicker(); // DatePicker 닫기
  };

  // 조회 옵션 모달 선택 버튼 활성화 상태 계산
  const isButtonDisabled = !(frDt !== '' && toDt !== '');

  // 선택 완료 시 부모로 전달 (직접입력은 1개월(31일) 초과 시 여기서만 안내)
  const handleSelectPeriodWithValues = () => {
    if (selectedPeriod === 'specific' && startDate && endDate) {
      const diffInMs = new Date(endDate).getTime() - new Date(startDate).getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays > 31) {
        Alert.alert('', '조회 가능한 최대 기간은 1개월(31일)입니다.', [
          {
            text: '확인',
            style: 'cancel',
          },
        ]);
        return;
      }
    }

    onPeriodChange(startDate, endDate, selectedPeriod);
    handleSelectPeriod();
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Radio selectedId={selectedPeriod} setSelectedId={setSelectedPeriod} radioButtons={periodRadioButtons} />

        {/* 직접입력 선택 시에서만 보이는 부분 */}
        {selectedPeriod === 'specific' && (
          <>
            <View style={styles.specificBox}>
              {/* 시작일 선택 */}
              <Pressable style={styles.date} onPress={() => openDatePicker(true)}>
                <Icon source={'calendar-blank-outline'} size={24} color={theme.colors.gray600} />
                <TextInput
                  placeholder="시작일 선택"
                  value={startDate}
                  placeholderTextColor={theme.colors.gray900}
                  style={styles.dateInput}
                  editable={false}
                />
              </Pressable>

              <Typography mode="body2" color="gray900">
                ~
              </Typography>

              {/* 종료일 선택 */}
              <Pressable style={styles.date} onPress={() => openDatePicker(false)}>
                <Icon source={'calendar-blank-outline'} size={24} color={theme.colors.gray600} />
                <TextInput
                  placeholder="종료일 선택"
                  value={endDate}
                  placeholderTextColor={theme.colors.gray900}
                  style={styles.dateInput}
                  editable={false}
                />
              </Pressable>
            </View>

            {/* DatePicker 모달 */}
            <Modal visible={isDatePickerVisible} animationType="fade" transparent onRequestClose={closeDatePicker}>
              <TouchableWithoutFeedback style={styles.modalOverlay} onPress={closeDatePicker}>
                <View style={styles.datePickerContainer}>
                  <DatePicker onDateChange={handleDateChange} />
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </>
        )}
      </ScrollView>
      <View style={styles.buttonBox}>
        <PrimaryButton
          key={isButtonDisabled.toString()}
          disabled={isButtonDisabled}
          label={'선택'}
          onPress={handleSelectPeriodWithValues}
          size={'large'}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  specificBox: { ...layout.rowBetween, gap: 12 },
  date: {
    gap: 8,
    paddingHorizontal: 16,
    height: 52,
    flex: 1,
    ...layout.rowCenter,
  },
  dateInput: { fontFamily: 'Pretendard-Regular', fontSize: 14, lineHeight: 21, letterSpacing: -0.28 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  buttonBox: { paddingVertical: 24 },
});

export default PeriodModal;
export { PeriodModal };
