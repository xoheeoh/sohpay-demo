import type { RootStackParamList } from '@typ/navigation';
import React from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';

// Navigation 참조를 전역에서 사용하기 위한 변수
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

// Provider 설정
export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <NavigationContainer ref={navigationRef}>{children}</NavigationContainer>;
};
