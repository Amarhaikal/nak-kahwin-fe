import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme, CustomThemeProvider } from '@/hooks/use-color-scheme';
import { WeddingDetailsProvider } from '@/hooks/use-wedding-details';

export const unstable_settings = {
  anchor: '(tabs)',
};

const CustomDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#E2E8F0', // Darker background for light theme to contrast with white cards
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212', // Softer dark grey background
    card: '#121212',       // Softer dark grey card/header background
  },
};

function InnerLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <WeddingDetailsProvider>
        <InnerLayout />
      </WeddingDetailsProvider>
    </CustomThemeProvider>
  );
}
