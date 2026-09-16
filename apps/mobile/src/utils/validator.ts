/* 이메일 유효성 검사 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 이메일 형식 정규 표현식
  return emailRegex.test(email);
}

/* 마스킹된 이메일인지 확인 */
export function isMaskedEmail(email: string): boolean {
  if (!email.includes('*')) {
    return false;
  }

  // 마스킹 문자를 일반 문자로 치환 후 이메일 형식 검사
  const normalized = email.replace(/\*/g, 'a');
  return validateEmail(normalized);
}
