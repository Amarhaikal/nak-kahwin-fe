import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { registerUser, loginUser, AuthResponse, RegisterPayload, LoginPayload } from "@/services/auth-service";

const TOKEN_KEY = "nak_kahwin_token";
const USER_KEY = "nak_kahwin_user";

interface AuthContextType {
  user: AuthResponse | null;
  isLoading: boolean;
  register: (payload: RegisterPayload) => Promise<string | null>;
  login: (payload: LoginPayload) => Promise<string | null>;
  logout: () => Promise<void>;
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
          setUser(JSON.parse(storedUser));
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
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, register, login, logout }}>
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
