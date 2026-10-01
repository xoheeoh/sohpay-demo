import { Platform } from 'react-native';
import type { BottomBtnBoxProps } from './BottomBtnBox.ios';
import type { FC } from 'react';

// 크기 상수와 훅은 metrics 에 둔다. 플랫폼별 컴포넌트 파일이 같은 값을 쓰면서도 이 파일과 순환 참조가 생기지 않게 한다
export { BOTTOM_BTN_BOX_KEYBOARD_INSET, useBottomBtnBoxHeight, useBottomBtnBoxPaddingBottom } from './metrics';

let BottomBtnBox: FC<BottomBtnBoxProps>;

if (Platform.OS === 'ios') {
  BottomBtnBox = require('./BottomBtnBox.ios').default;
} else {
  BottomBtnBox = require('./BottomBtnBox.android').default;
}

export { BottomBtnBox };
export type { BottomBtnBoxProps };
