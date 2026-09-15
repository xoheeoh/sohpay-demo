import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, radius, space, ThemeColors, type } from './tokens';

type Theme = {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const value = useMemo<Theme>(
    () => ({ scheme, colors: scheme === 'dark' ? dark : light, space, radius, type }),
    [scheme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme 는 ThemeProvider 안에서만 쓸 수 있습니다.');
  return ctx;
}
