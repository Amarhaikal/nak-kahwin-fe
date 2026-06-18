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
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 401) {
      return { data: null, error: "Session expired. Please log in again." };
    }

    if (response.status === 403) {
      return { data: null, error: "Access denied." };
    }

    const text = await response.text();
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        // Handle non-JSON error response
      }
    }

    if (!response.ok) {
      if (json) {
        if (json.errors) {
          const firstErrorKey = Object.keys(json.errors)[0];
          const firstErrorMessage = json.errors[firstErrorKey]?.[0];
          if (firstErrorMessage) {
            return { data: null, error: firstErrorMessage };
          }
        }
        return {
          data: null,
          error: json.message ?? json.title ?? json.detail ?? `Error ${response.status}`,
        };
      }
      return { data: null, error: text || `Request failed with status ${response.status}` };
    }

    return { data: json as T, error: null };
  } catch (err) {
    return { data: null, error: "Cannot connect to server. Check your network." };
  }
}
