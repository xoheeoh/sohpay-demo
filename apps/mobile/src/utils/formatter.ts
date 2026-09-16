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
 * 날짜 변환: 오늘 기준 일주일 전의 날짜 구하기
 * @returns 'YYYYMMDD' 형식의 날짜 문자열
 */
export function getDateOneWeekAgo() {
  const today = new Date(); // 현재 날짜
  const oneWeekAgo = new Date(today.setDate(today.getDate() - 7)); // 7일 전 날짜 계산

  // YYYYMMDD 형식으로 변환
  const year = oneWeekAgo.getFullYear();
  const month = String(oneWeekAgo.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = String(oneWeekAgo.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

/**
 * 날짜 변환: 오늘 날짜 구하기
 * @returns 'YYYYMMDD' 형식의 날짜 문자열
 */
export function getTodayDate() {
  const today = new Date(); // 현재 날짜

  // YYYYMMDD 형식으로 변환
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

/**
 * - 포함하도록 날짜 변환
 * @param {string | Date} date 'YYYYMMDD' 문자열 또는 Date 객체
 * @returns 'YYYY-MM-DD' 형식의 날짜 문자열
 */
export function getDateWithHypen(date: Date | string): string {
  let year: string, month: string, day: string;

  if (typeof date === 'string') {
    // 문자열 형태 'YYYYMMDD'를 처리
    year = date.slice(0, 4);
    month = date.slice(4, 6);
    day = date.slice(6, 8);
  } else if (date instanceof Date) {
    // Date 객체 처리
    year = String(date.getFullYear());
    month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
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
  const now = new Date(); // 현재 날짜와 시각

  // YYYYMMDDHHmmss 형식으로 변환
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
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
  // 입력값을 연도, 월, 일, 시간, 분, 초로 나누기
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(8, 10);
  const minute = value.slice(10, 12);
  const second = value.slice(12, 14);

  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}

/**
 * 날짜 변환: 날짜 문자열을 'YYYY년 MM월 DD일 hh시 mm분 ss초' 형식으로 변환
 * @param value 'YYYYMMDDhhmmss' 형식의 날짜 문자열
 * @returns 'YYYY년 MM월 DD일 hh시 mm분 ss초' 형식의 날짜 문자열
 */
export function formatDateTimeKr(value: string) {
  // 입력값을 연도, 월, 일, 시간, 분, 초로 나누기
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(8, 10);
  const minute = value.slice(10, 12);
  const second = value.slice(12, 14);

  return `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분 ${second}초`;
}

/**
 * 마스킹 처리: 사용자 아이디 마스킹
 * @param mbUid 처리할 문자열
 * @returns 가운데 5자리가 '*'로 대체된 문자열
 */
export function maskUid(mbUid: string): string {
  // if (mbUid.length < 5) {
  //   throw new Error('최소 5글자 이상을 입력해야함.');
  // }

  const start = Math.floor((mbUid.length - 5) / 2); // 중앙에서 5자리를 시작하는 인덱스
  const end = start + 5; // 5자리 뒤의 인덱스

  // 음영 처리
  return (
    mbUid.slice(0, start) + // 앞부분
    '*'.repeat(5) + // 5개의 별
    mbUid.slice(end) // 뒷부분
  );
}

/**
 * 마스킹 처리: 사용자 이름 마스킹
 * @param name 처리할 문자열
 * @returns 첫 글자, 마지막 글자 제외 나머지 부분이 '*'로 대체된 문자열
 */
export function maskName(name: string) {
  // 이름이 2글자 이하일 경우 첫 글자만 남기고 나머지 '*'
  if (name.length <= 2) {
    return name[0] + '*'.repeat(name.length - 1);
  }

  const firstChar = name[0]; // 첫 글자
  const lastChar = name[name.length - 1]; // 마지막 글자
  const maskedMiddle = '*'.repeat(name.length - 2); // 가운데를 마스킹

  return `${firstChar}${maskedMiddle}${lastChar}`;
}

/**
 * 오늘로부터 일주일 전 날짜 구하기
 * @returns 'YYYY-MM-DD' 형식의 문자열
 */
export function getOneWeekAgoDate() {
  const today = new Date(); // 오늘 날짜
  const oneWeekAgo = new Date(today.setDate(today.getDate() - 7)); // 7일 전 날짜 계산
  const year = oneWeekAgo.getFullYear();
  const month = String(oneWeekAgo.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
  const day = String(oneWeekAgo.getDate()).padStart(2, '0'); // 날짜 형식 맞추기

  return `${year}-${month}-${day}`;
}

/**
 * 오늘로부터 n달 전 날짜 구하기
 * @param monthsAgo 구하고 싶은 n달의 숫자
 * @returns 'YYYY-MM-DD' 형식의 문자열
 */
export function getDateMonthsAgo(monthsAgo: number) {
  const today = new Date(); // 오늘 날짜
  const dateMonthsAgo = new Date(today.setMonth(today.getMonth() - monthsAgo)); // monthsAgo 만큼 이전으로 이동
  const year = dateMonthsAgo.getFullYear();
  const month = String(dateMonthsAgo.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
  const day = String(dateMonthsAgo.getDate()).padStart(2, '0'); // 날짜 형식 맞추기

  return `${year}-${month}-${day}`;
}

/**
 * - 하이픈 제외한 8자리 날짜 구하기
 * @param dateString 'YYYY-MM-DD' 형식의 문자열
 * @returns 'YYYYMMDD'형식의 문자열
 */
export function convertDateWithoutHypen(dateString: string) {
  // dateString이 null이거나 undefined이면 빈 문자열 반환
  if (!dateString) return '';

  // 하이픈(-)을 제거하고 결합
  const formattedDate = dateString.replace(/-/g, '');

  return formattedDate;
}

export function setDeadline(dateTime: string) {
  // 요청일시 값 파싱
  const year = dateTime.substring(0, 4);
  const month = dateTime.substring(4, 6); // 월 (01부터 시작)
  const day = dateTime.substring(6, 8);

  // 마감 시간 설정
  const deadline = `${year}${month}${day}235959`;

  return deadline;
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

  // 형식에 맞지 않는 경우 원본 문자열 반환
  return str;
}

/* 사업자 등록번호 형식 변경 (-) */
export function formatBusinessNumber(str: string) {
  return str.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
}

/**
 * 계좌번호 마스킹 함수
 *  - 최소 10자리 이상
 *  - 4번째부터 9번째 숫자까지 * 로 마스킹
 * @param accountNumber 계좌번호 문자열
 * @returns 마스킹된 계좌번호 문자열
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!/^\d{10,}$/.test(accountNumber)) {
    throw new Error('계좌번호는 숫자로만 구성된 10자리 이상이어야 합니다.');
  }

  const start = accountNumber.slice(0, 3); // 앞 3자리
  const masked = '*'.repeat(6); // 4~9번째는 마스킹
  const end = accountNumber.slice(9); // 10번째 이후

  return `${start}${masked}${end}`;
}
