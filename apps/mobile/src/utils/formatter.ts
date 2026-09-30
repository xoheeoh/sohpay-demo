/**
 * 날짜 변환: 날짜 문자열을 'YYYY/MM/DD' 형식으로 변환
 * @param dateTimeString 'YYYYMMDDhhmmss' 형식의 날짜 문자열
 * @returns 'YYYY/MM/DD' 형식의 날짜 문자열
 */
export function formatYYYYMMDDDate(dateTimeString: string): string {
  if (dateTimeString.length < 8) {
    throw new Error('유효하지 않은 date 형식.');
  }

  const year = dateTimeString.slice(0, 4);
  const month = dateTimeString.slice(4, 6);
  const day = dateTimeString.slice(6, 8);

  return `${year}/${month}/${day}`;
}

/**
 * 날짜 변환: 오늘 날짜 구하기
 * @returns 'YYYYMMDD' 형식의 날짜 문자열
 */
export function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

/**
 * 하이픈 포함 날짜 변환
 * @param {string | Date} date 'YYYYMMDD' 문자열 또는 Date 객체
 * @returns 'YYYY-MM-DD' 형식의 날짜 문자열
 */
export function getDateWithHypen(date: Date | string): string {
  let year: string, month: string, day: string;

  if (typeof date === 'string') {
    year = date.slice(0, 4);
    month = date.slice(4, 6);
    day = date.slice(6, 8);
  } else if (date instanceof Date) {
    year = String(date.getFullYear());
    month = String(date.getMonth() + 1).padStart(2, '0');
    day = String(date.getDate()).padStart(2, '0');
  } else {
    throw new Error('유효하지 않은 형식');
  }

  return `${year}-${month}-${day}`;
}

/**
 * 날짜 변환: 오늘 날짜와 시각 구하기
 * @returns 'YYYYMMDDHHmmss' 형식의 날짜 및 시각 문자열
 */
export function getTodayDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * 날짜 변환: 날짜 문자열을 'YYYY/MM/DD hh:mm:ss' 형식으로 변환
 * @param value 'YYYYMMDDhhmmss' 형식의 날짜 문자열
 * @returns 'YYYY/MM/DD hh:mm:ss' 형식의 날짜 문자열
 */
export function formatDateTime(value: string) {
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(8, 10);
  const minute = value.slice(10, 12);
  const second = value.slice(12, 14);

  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}

/**
 * 오늘로부터 일주일 전 날짜 구하기
 * @returns 'YYYY-MM-DD' 형식의 문자열
 */
export function getOneWeekAgoDate() {
  const today = new Date();
  const oneWeekAgo = new Date(today.setDate(today.getDate() - 7));
  const year = oneWeekAgo.getFullYear();
  const month = String(oneWeekAgo.getMonth() + 1).padStart(2, '0');
  const day = String(oneWeekAgo.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 오늘로부터 n달 전 날짜 구하기
 * @param monthsAgo 구하고 싶은 n달의 숫자
 * @returns 'YYYY-MM-DD' 형식의 문자열
 */
export function getDateMonthsAgo(monthsAgo: number) {
  const today = new Date();
  const dateMonthsAgo = new Date(today.setMonth(today.getMonth() - monthsAgo));
  const year = dateMonthsAgo.getFullYear();
  const month = String(dateMonthsAgo.getMonth() + 1).padStart(2, '0');
  const day = String(dateMonthsAgo.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 하이픈 제외 8자리 날짜 구하기
 * @param dateString 'YYYY-MM-DD' 형식의 문자열
 * @returns 'YYYYMMDD'형식의 문자열
 */
export function convertDateWithoutHypen(dateString: string) {
  if (!dateString) return '';

  const formattedDate = dateString.replace(/-/g, '');

  return formattedDate;
}

/* 전화번호 형식 변경 (-) */
export function formatPhoneNumber(str: string) {
  // 휴대전화 (010 등)
  const mobilePattern = /^(\d{3})(\d{4})(\d{4})$/;

  if (mobilePattern.test(str)) {
    return str.replace(mobilePattern, '$1-$2-$3');
  }

  // 서울 지역번호 (2자리: 02)
  const seoulPattern7 = /^02(\d{3})(\d{4})$/; // 7자리 뒷번호
  const seoulPattern8 = /^02(\d{4})(\d{4})$/; // 8자리 뒷번호

  if (seoulPattern8.test(str)) {
    return str.replace(seoulPattern8, '02-$1-$2');
  } else if (seoulPattern7.test(str)) {
    return str.replace(seoulPattern7, '02-$1-$2');
  }

  // 다른 지역번호 (3자리)
  const areaPattern = /^(0(?!2)\d{2,3})(\d{3,4})(\d{4})$/;

  if (areaPattern.test(str)) {
    return str.replace(areaPattern, '$1-$2-$3');
  }

  // 대표번호, 내선번호 (8자리)
  const eightDigitPattern = /^(\d{4})(\d{4})$/;
  if (eightDigitPattern.test(str)) {
    return str.replace(eightDigitPattern, '$1-$2');
  }

  return str;
}

/* 사업자 등록번호 형식 변경 (-) */
export function formatBusinessNumber(str: string) {
  return str.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
}

/**
 * 계좌번호 마스킹. 숫자만 10자리 이상이면 4~9번째를 * 로 가리고, 이미 마스킹된 값이나 그 외 형식은 그대로 돌려준다.
 * 렌더 중 throw 하면 화면 전체가 비므로 절대 throw 하지 않는다.
 */
export function maskAccountNumber(accountNumber: string | null | undefined): string {
  if (!accountNumber) return '';

  const isRawAccountNumber = /^\d{10,}$/.test(accountNumber);
  if (!isRawAccountNumber) return accountNumber;

  const start = accountNumber.slice(0, 3); // 앞 3자리
  const masked = '*'.repeat(6); // 4~9번째는 마스킹
  const end = accountNumber.slice(9); // 10번째 이후

  return `${start}${masked}${end}`;
}

/**
 * 금액 표기: 숫자 → '4,500원'. 글자로 쓰는 금액은 모두 이 함수로 표기를 통일한다.
 * 큰 숫자 옆에 "원"을 작은 글자로 따로 그리는 화면(잔액 카드)만 예외.
 */
export function formatWon(value: number | string | null | undefined): string {
  return `${Number(value ?? 0).toLocaleString('ko-KR')}원`;
}
