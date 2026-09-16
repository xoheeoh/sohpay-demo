import { Platform } from 'react-native';
import type { BottomBtnBoxProps } from './BottomBtnBox.ios';
import type { FC } from 'react';

/** PrimaryButton `large` 높이. 키보드 위에 올라온 BottomBtnBox만큼 ScreenWrapper keyboardBottomInset에 맞춤 */
export const BOTTOM_BTN_BOX_KEYBOARD_INSET = 48;

let BottomBtnBox: FC<BottomBtnBoxProps>;

if (Platform.OS === 'ios') {
  BottomBtnBox = require('./BottomBtnBox.ios').default;
} else {
  BottomBtnBox = require('./BottomBtnBox.android').default;
}

export { BottomBtnBox };
export type { BottomBtnBoxProps };
