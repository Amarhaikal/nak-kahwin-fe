import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  colorScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const rnColorScheme = useRNColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (themePreference === 'system') {
      setColorScheme(rnColorScheme ?? 'light');
    } else {
      setColorScheme(themePreference);
    }
  }, [themePreference, rnColorScheme]);

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, colorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColorScheme(): 'light' | 'dark' {
  const context = useContext(ThemeContext);
  if (!context) {
    const rnColorScheme = useRNColorScheme();
    return rnColorScheme ?? 'light';
  }
  return context.colorScheme;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // If not in provider, return dummy values to prevent crash
    return {
      themePreference: 'system' as ThemePreference,
      setThemePreference: () => {},
      colorScheme: 'light' as 'light' | 'dark',
    };
  }
  return context;
}
