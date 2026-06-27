import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { View, ActivityIndicator } from 'react-native';

import { useColorScheme, CustomThemeProvider } from '@/hooks/use-color-scheme';
import { WeddingDetailsProvider, useWeddingDetails } from '@/hooks/use-wedding-details';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

const CustomDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#E2E8F0',
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    card: '#121212',
  },
};

// Redirects unauthenticated users to login
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { hasPlan, isLoadingPlan } = useWeddingDetails();
  const segments = useSegments();

  if (isLoadingAuth || (user && isLoadingPlan)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  const inAuthGroup = (segments[0] as string) === 'login' || (segments[0] as string) === 'register';
  const isCreatingPlan = (segments[0] as string) === 'create-plan';

  if (!user) {
    if (!inAuthGroup) {
      return (
        <>
          {children}
          <Redirect href="/login" />
        </>
      );
    }
  } else {
    // User is logged in
    if (hasPlan === false) {
      if (!isCreatingPlan) {
        return (
          <>
            {children}
            <Redirect href="/create-plan" />
          </>
        );
      }
    } else if (hasPlan === true) {
      if (inAuthGroup || isCreatingPlan) {
        return (
          <>
            {children}
            <Redirect href="/(tabs)" />
          </>
        );
      }
    }
  }

  return <>{children}</>;
}

function InnerLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
      <AuthGate>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="create-plan" options={{ headerShown: false }} />
          <Stack.Screen name="all-savings" options={{ headerTitle: "Savings History", headerBackTitle: "Back" }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </AuthGate>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <WeddingDetailsProvider>
          <InnerLayout />
        </WeddingDetailsProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}
