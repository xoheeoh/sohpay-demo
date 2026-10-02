import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { getDateMonthsAgo, getOneWeekAgoDate, getDateWithHypen } from '@utils/formatter';
import { DatePicker, PrimaryButton, Radio, Typography } from '@components/common';
import { layout, theme } from '@styles';

interface PeriodModalProps {
  radioValue: string;
  frDt: string;
  toDt: string;
  handleSelectPeriod: () => void;
  onPeriodChange: (frDt: string, toDt: string, radio: string) => void;
}

interface DateSelectBoxProps {
  label: string; // 칸 위에 작게 표시되는 이름 (시작일 / 종료일)
  value: string; // 선택된 날짜 (YYYY-MM-DD). 비어 있으면 안내 문구 표시
  active: boolean; // 이 칸의 달력이 열려 있는지
  onPress: () => void;
}

/**
 * 누르면 달력이 열리는 날짜 선택 칸.
 * 입력창이 아니라 버튼이라 웹에서 포커스 outline 이 생기지 않는다. 모양은 Dropdown 선택 상자와 같은 규칙을 따른다.
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
    <Icon source={'calendar-blank-outline'} size={20} color={active ? theme.colors.primary : theme.colors.gray500} />
  </Pressable>
);

const PeriodModal: React.FC<PeriodModalProps> = ({ radioValue, frDt, toDt, handleSelectPeriod, onPeriodChange }) => {
  // 라디오 선택값에 따라 frDt·toDt 를 정한다. 직접입력은 DatePicker 로 고른다
  const [selectedPeriod, setSelectedPeriod] = useState<string>(radioValue);
  // 모달 내부 표시용. 화면은 서버 형식(YYYYMMDD)으로 보관하므로 받은 값을 표시 형식(YYYY-MM-DD)으로 바꿔 둔다.
  // 직접입력일 때는 아래 효과가 값을 다시 계산하지 않아, 변환 없이 쓰면 두 번째 열 때부터 하이픈 없는 값이 그대로 보인다
  const [startDate, setStartDate] = useState<string>(frDt ? getDateWithHypen(frDt) : '');
  const [endDate, setEndDate] = useState<string>(toDt ? getDateWithHypen(toDt) : '');

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

  const [isDatePickerVisible, setDatePickerVisible] = useState<boolean>(false);
  const [isSelectingStartDate, setSelectingStartDate] = useState(true);
  // Alert 는 웹에서 아무것도 띄우지 않으므로 날짜 조건 오류는 날짜 칸 아래 안내로 보여준다
  const [periodError, setPeriodError] = useState<string | null>(null);

  const openDatePicker = (isStartDate: boolean) => {
    setSelectingStartDate(isStartDate);
    setDatePickerVisible(true);
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateChange = (selectedDate: string) => {
    if (isSelectingStartDate) {
      if (endDate && new Date(selectedDate) > new Date(endDate)) {
        setPeriodError('시작일은 종료일보다 늦을 수 없어요.');
      } else {
        setStartDate(selectedDate);
        setPeriodError(null);
      }
    } else {
      if (startDate && new Date(selectedDate) < new Date(startDate)) {
        setPeriodError('종료일은 시작일보다 이를 수 없어요.');
      } else {
        setEndDate(selectedDate);
        setPeriodError(null);
      }
    }
    closeDatePicker();
  };

  const isButtonDisabled = !(frDt !== '' && toDt !== '');

  // 직접입력의 3개월(92일) 초과 검사는 선택 완료 시점에만 한다
  const handleSelectPeriodWithValues = () => {
    if (selectedPeriod === 'specific' && startDate && endDate) {
      const diffInMs = new Date(endDate).getTime() - new Date(startDate).getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays > 92) {
        setPeriodError('조회 가능한 최대 기간은 3개월(92일)이에요.');
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

        {/* 직접입력 선택 시에만 보이는 영역 */}
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

            {periodError ? (
              <Typography mode="caption1" color="red500" style={styles.hint}>
                {periodError}
              </Typography>
            ) : (
              <Typography mode="caption1" color="gray500" style={styles.hint}>
                최대 3개월까지 조회할 수 있어요
              </Typography>
            )}

            {/* 바깥 어두운 영역을 누르면 닫히고, 달력 영역은 닫히지 않는다 */}
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
  // Dropdown 선택 상자와 같은 규칙: 회색 배경 + line 테두리, 열리면 흰 배경 + primary 테두리
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
  buttonBox: { paddingTop: 24 }, // 아래 여백은 BottomSheet 가 준다
});

export default PeriodModal;
export { PeriodModal };
