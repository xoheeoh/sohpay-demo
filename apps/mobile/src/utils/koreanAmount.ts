/**
 * 금액을 한글로 읽어 준다. 예) 12345 → '일만 이천삼백사십오', 1500000 → '백오십만', 0 → ''
 * 큰 금액 아래에 작게 붙여 자릿수 실수를 막는 용도.
 */
const DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const SMALL_UNITS = ['', '십', '백', '천'];
const BIG_UNITS = ['', '만', '억', '조'];

/** 0~9999 를 한글로. 십·백·천 앞의 1 은 읽지 않는다 (일십 → 십) */
const readChunk = (chunk: number): string => {
  let out = '';
  for (let pos = 3; pos >= 0; pos--) {
    const d = Math.floor(chunk / 10 ** pos) % 10;
    if (d === 0) continue;
    out += (d === 1 && pos > 0 ? '' : DIGITS[d]) + SMALL_UNITS[pos];
  }
  return out;
};

export function toKoreanAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';

  const parts: string[] = [];
  let rest = Math.floor(value);
  let unitIdx = 0;
  while (rest > 0 && unitIdx < BIG_UNITS.length) {
    const chunk = rest % 10000;
    if (chunk > 0) {
      // 만 단위 앞의 1 은 읽는다 (일만). 억·조 앞도 같다.
      const read = chunk === 1 && unitIdx > 0 ? '일' : readChunk(chunk);
      parts.unshift(read + BIG_UNITS[unitIdx]);
    }
    rest = Math.floor(rest / 10000);
    unitIdx++;
  }
  return parts.join(' ');
}
