import { Platform } from "react-native";
import Constants from "expo-constants";

// Extract the host IP address dynamically from the Metro development server URI.
// This allows the app to connect to the backend on the host Mac whether it's running
// on a physical device (via Wi-Fi or Hotspot), simulator, or emulator, without hardcoding IPs.
const getDevHostIp = () => {
  const hostUri = Constants.expoConfig?.hostUri; // e.g., "192.168.1.33:8081" or "172.20.10.2:8081"
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return ip;
  }
  return null;
};

const devHostIp = getDevHostIp();

export const API_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:5114"
    : devHostIp
      ? `http://${devHostIp}:5114`
      : "http://localhost:5114"; // Fallback to localhost if no dev server is active

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
