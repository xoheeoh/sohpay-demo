import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

interface DateSelectBoxProps {
  label: string; // 칸 위에 작게 표시되는 이름 (시작일 / 종료일)
  value: string; // 선택된 날짜 (YYYY-MM-DD). 비어 있으면 안내 문구 표시
  active: boolean; // 이 칸의 달력이 열려 있는 상태인지
  onPress: () => void;
}

/**
 * 누르면 달력이 열리는 날짜 선택 칸.
 * 실제 입력창(TextInput)이 아니라 버튼이라서, 웹에서 클릭해도 입력창 포커스 테두리(outline)가 생기지 않는다.
 * 모양은 화면 위쪽의 Dropdown 선택 상자와 같은 규칙(회색 배경, 열리면 파란 테두리)을 따른다.
 */
const DateSelectBox: React.FC<DateSelectBoxProps> = ({ label, value, active, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label} 선택`}
    accessibilityValue={{ text: value || '선택 안 됨' }}
    style={({ pressed }) => [styles.dateBox, active && styles.dateBoxActive, pressed && styles.dateBoxPressed]}
    onPress={onPress}>
    <View style={styles.dateTextBox}>
      <Typography mode="caption1" color="gray500">
        {label}
      </Typography>
      <Typography mode="subtitle3" color={value ? 'gray900' : 'gray300'} numberOfLines={1}>
        {value || '날짜 선택'}
      </Typography>
    </View>
    <Icon
      source={'calendar-blank-outline'}
      size={20}
      color={active ? theme.colors.primary : theme.colors.gray500}
    />
  </Pressable>
);

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
    { id: '3months', label: '3개월', value: '3months' },
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
    } else if (selectedPeriod === '3months') {
      setStartDate(getDateMonthsAgo(3));
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

  // 선택 완료 시 부모로 전달 (직접입력은 3개월(92일) 초과 시 여기서만 안내)
  const handleSelectPeriodWithValues = () => {
    if (selectedPeriod === 'specific' && startDate && endDate) {
      const diffInMs = new Date(endDate).getTime() - new Date(startDate).getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays > 92) {
        Alert.alert('', '조회 가능한 최대 기간은 3개월(92일)입니다.', [
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
              <DateSelectBox
                label="시작일"
                value={startDate}
                active={isDatePickerVisible && isSelectingStartDate}
                onPress={() => openDatePicker(true)}
              />

              <Typography mode="body2" color="gray400">
                ~
              </Typography>

              {/* 종료일 선택 */}
              <DateSelectBox
                label="종료일"
                value={endDate}
                active={isDatePickerVisible && !isSelectingStartDate}
                onPress={() => openDatePicker(false)}
              />
            </View>

            <Typography mode="caption1" color="gray500" style={styles.hint}>
              최대 3개월까지 조회할 수 있어요
            </Typography>

            {/* DatePicker 모달 - 바깥 어두운 영역을 누르면 닫히고, 달력 영역을 누르면 닫히지 않음 */}
            <Modal visible={isDatePickerVisible} animationType="fade" transparent onRequestClose={closeDatePicker}>
              <Pressable style={styles.modalOverlay} onPress={closeDatePicker}>
                <Pressable style={styles.datePickerContainer}>
                  <DatePicker onDateChange={handleDateChange} />
                </Pressable>
              </Pressable>
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
          size={'lg'}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  specificBox: { ...layout.rowBetween, gap: 12, marginTop: 8 },
  // Dropdown 선택 상자와 같은 규칙: 회색 배경 + 연한 테두리(line), 열리면 흰 배경 + 파란 테두리
  dateBox: {
    flex: 1,
    height: 60,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.gray50,
    ...layout.rowBetween,
  },
  dateBoxActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.white },
  dateBoxPressed: { backgroundColor: theme.colors.gray100 },
  dateTextBox: { flex: 1, gap: 2 },
  hint: { marginTop: 10, marginLeft: 2 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: theme.colors.overlay,
  },
  datePickerContainer: { width: '100%', maxWidth: 400 },
  buttonBox: { paddingVertical: 24 },
});

export default PeriodModal;
export { PeriodModal };
