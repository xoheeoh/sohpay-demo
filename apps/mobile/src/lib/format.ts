export const won = (n: number | string | null | undefined) =>
  `${Math.trunc(Number(n ?? 0)).toLocaleString('ko-KR')}원`;

export const wonSigned = (n: number, direction: 'in' | 'out') =>
  `${direction === 'in' ? '+' : '-'}${Math.trunc(n).toLocaleString('ko-KR')}원`;

export function dateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameYear = d.getFullYear() === today.getFullYear();
  const md = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return sameYear ? md : `${d.getFullYear()}년 ${md}`;
}

export function timeLabel(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function dateTimeLabel(iso: string) {
  return `${dateLabel(iso)} ${timeLabel(iso)}`;
}

export function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const maskName = (name: string) => (name.length <= 1 ? name : name[0] + '*'.repeat(name.length - 2) + (name.length > 2 ? name.at(-1) : ''));

export const newIdempotencyKey = () =>
  // crypto.randomUUID 는 RN 0.74+ / 웹 모두 지원
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
