/**
 * 영문 대소문자 및 숫자만 허용하는 입력 필터
 * @param input 사용자가 입력한 문자열
 * @returns 필터링된 문자열
 */
export const filterAlphanumeric = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * 영문 대소문자, 숫자, 특수문자만 허용하는 입력 필터
 * @param input 사용자가 입력한 문자열
 * @returns 필터링된 문자열
 */
export const filterAlphanumericWithSpecial = (input: string): string => {
  // 영문, 숫자, 기본 특수문자
  return input.replace(/[^\x20-\x7E]/g, '');
};

/**
 * 아이디용 영문, 숫자, 특수문자 허용하는 입력 필터
 * @param input 사용자가 입력한 문자열
 * @returns 필터링된 문자열
 */
export const filterUserId = (input: string): string => {
  // 서버 아이디 규칙과 같게: 영문 소문자, 숫자, _ 만 허용. 대문자는 소문자로 바꾼다
  return input.toLowerCase().replace(/[^a-z0-9_]/g, '');
};

/**
 * 금액 or 번호용 숫자만 허용하는 입력 필터
 * @param input 사용자가 입력한 문자열
 * @returns 필터링된 문자열
 */
export const filterOnlyNumber = (input: string): string => {
  // 숫자만 허용
  return input.replace(/[^0-9]/g, '');
};
