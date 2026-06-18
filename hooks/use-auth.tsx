import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as SecureStore from "expo-secure-store";
import { registerUser, loginUser, logoutUser, refreshUser, AuthResponse, RegisterPayload, LoginPayload } from "@/services/auth-service";

const TOKEN_KEY = "nak_kahwin_token";
const USER_KEY = "nak_kahwin_user";

interface AuthContextType {
  user: AuthResponse | null;
  isLoading: boolean;
  register: (payload: RegisterPayload) => Promise<string | null>;
  login: (payload: LoginPayload) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true while we check stored token

  // On app start — restore session from secure storage
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (storedUser) {
          const parsedUser: AuthResponse = JSON.parse(storedUser);
          if (parsedUser.refreshToken) {
            const { data, error } = await refreshUser(parsedUser.refreshToken);
            if (data && !error) {
              await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
              await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data));
              setUser(data);
              return;
            } else if (error && (error.includes("expired") || error.includes("invalid"))) {
              // Refresh token has expired or is invalid -> log out
              await SecureStore.deleteItemAsync(TOKEN_KEY);
              await SecureStore.deleteItemAsync(USER_KEY);
              setUser(null);
              return;
            }
          }
          setUser(parsedUser);
        }
      } catch {
        // Session corrupted — ignore, user will need to log in again
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const register = async (payload: RegisterPayload): Promise<string | null> => {
    const { data, error } = await registerUser(payload);
    if (error || !data) return error ?? "Registration failed.";

    await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data));
    setUser(data);
    return null; // null = success
  };

  const login = async (payload: LoginPayload): Promise<string | null> => {
    const { data, error } = await loginUser(payload);
    if (error || !data) return error ?? "Login failed.";

    await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data));
    setUser(data);
    return null; // null = success
  };

  const logout = async () => {
    if (user?.refreshToken) {
      try {
        await logoutUser(user.refreshToken, user.accessToken);
      } catch (e) {
        // Best-effort logout: ignore network or auth errors
      }
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setUser(null);
  };

  const refresh = async (): Promise<string | null> => {
    if (!user?.refreshToken) return "No refresh token available.";
    const { data, error } = await refreshUser(user.refreshToken);
    if (error || !data) {
      if (error && (error.includes("expired") || error.includes("invalid"))) {
        await logout();
      }
      return error ?? "Refresh failed.";
    }

    await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data));
    setUser(data);
    return null; // success
  };

  // Refresh token when the app resumes focus (moves to foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && user?.refreshToken) {
        try {
          await refresh();
        } catch {
          // Ignore app focus refresh errors (e.g. offline)
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user?.refreshToken]);

  return (
    <AuthContext.Provider value={{ user, isLoading, register, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

// Helper — get raw JWT token for authenticated API calls
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
