import { radius } from './theme';

/**
 * 한 줄에 놓이는 컨트롤(버튼·입력칸·드롭다운·검색창)의 크기 단계.
 *
 * 높이·모서리·좌우 여백·글자 크기를 단계별로 한 번에 정한다. 컴포넌트마다 표를 따로 두면
 * "이름은 더 큰데 모서리는 같다" 같은 어긋남이 생기므로, 크기와 관련된 값은 반드시 여기서 가져온다.
 *
 *  - lg: 입력칸과 나란히 놓이는 기본 크기. 입력칸·드롭다운·검색창·기본 버튼·하단 고정 버튼
 *  - md: 보조 버튼(전액 입력 등), 작은 드롭다운, 텍스트 버튼
 *  - sm: 목록 안의 작은 버튼
 *
 * 입력칸 안 글자의 왼쪽 들여쓰기(16)는 "글자 정렬" 문제라 이 표와 별개로 각 컴포넌트가 정한다.
 */
export const controlSize = {
  lg: { height: 56, radius: radius.md, paddingX: 20, text: 'subtitle2' },
  md: { height: 44, radius: radius.sm, paddingX: 16, text: 'subtitle3' },
  sm: { height: 32, radius: radius.xs, paddingX: 12, text: 'subtitle4' },
} as const;

export type ControlSize = keyof typeof controlSize;
