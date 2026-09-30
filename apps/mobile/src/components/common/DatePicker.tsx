import { SetStateAction, useCallback, useMemo, useState } from 'react';
import { Calendar, CalendarUtils, LocaleConfig } from 'react-native-calendars';
import { getDateWithHypen } from '@utils/formatter';
import { layout, theme } from '@styles';
import { StyleSheet } from 'react-native';

interface DatePickerProps {
  onDateChange: (selectedDate: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ onDateChange }) => {
  // 기준이 되는 오늘 날짜 (YYYY-MM-DD)
  const INITIAL_DATE = getDateWithHypen(new Date());

  const [selected, setSelected] = useState(INITIAL_DATE);

  const getDate = (count: number) => {
    const date = new Date(INITIAL_DATE);
    const newDate = date.setDate(date.getDate() + count);
    return CalendarUtils.getCalendarDateString(newDate);
  };

  const onDayPress = useCallback(
    (day: { dateString: SetStateAction<string> }) => {
      setSelected(day.dateString);

      onDateChange(day.dateString as string);
    },
    [onDateChange],
  );

  const marked = useMemo(() => {
    return {
      [getDate(0)]: {
        marked: true,
      },
      [selected]: {
        selected: true,
        selectedTextColor: theme.colors.white,
      },
    };
  }, [selected]);

  LocaleConfig.locales['kr'] = {
    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
    today: '오늘',
  };

  LocaleConfig.defaultLocale = 'kr';

  return (
    <Calendar
      style={styles.container}
      current={INITIAL_DATE}
      markedDates={marked}
      theme={{
        stylesheet: {
          day: {
            basic: {
              base: {
                width: 30,
                height: 30,
                alignItems: 'center',
              },
            },
          },
          calendar: {
            header: {
              dayTextAtIndex0: {
                color: theme.colors.red500,
              },
              dayTextAtIndex6: {
                color: theme.colors.blue500,
              },
              header: styles.header,
              monthText: styles.monthText,
              arrow: styles.arrow,
            },
          },
        },
        arrowColor: theme.colors.gray600,
        textDayFontSize: 14,
      }}
      onDayPress={onDayPress}
      monthFormat={'yyyy년 MM월'}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    boxShadow: '0 2px 20px 0 rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    borderColor: theme.colors.gray150,
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 12,
    paddingTop: 12,
  },
  header: {
    ...layout.rowBetween,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 12,
  },
  monthText: {
    margin: 0,
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },
  arrow: {
    padding: 0,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DatePicker;
export { DatePicker };
