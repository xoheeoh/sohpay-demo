export {};

declare module '*.png';
declare module '*.jpg';
declare module '*.json';
declare module '*.otf';
declare module '*.woff2';

import 'react-native-calendars';

declare module 'react-native-calendars' {
  import { TextStyle, ViewStyle } from 'react-native';

  interface Theme {
    'stylesheet.day.basic'?: {
      base?: ViewStyle;
      today?: ViewStyle;
      todayText?: TextStyle;
      [key: string]: ViewStyle | TextStyle | undefined;
    };
  }
}
