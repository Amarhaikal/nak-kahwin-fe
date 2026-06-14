import { Platform } from "react-native";

// • Web / iOS Simulator → localhost works fine
// • Physical iPhone → uses Mac's LAN IP (must be on same WiFi)
export const API_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:5114"
    : "http://192.168.1.33:5114";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const json = await response.json();

    if (!response.ok) {
      return { data: null, error: json.message ?? "Something went wrong." };
    }

    return { data: json as T, error: null };
  } catch (err) {
    return { data: null, error: "Cannot connect to server. Check your network." };
  }
}
