import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    const error = await login({ email: email.trim().toLowerCase(), password });
    setIsLoading(false);

    if (error) {
      Alert.alert("Login Failed", error);
      return;
    }

    // Navigate to the main app on success
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={isDark ? ["#1a0533", "#121212"] : ["#7C3AED", "#ECE9FC"]}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            {/* Wedding rings logo */}
            <View style={styles.logoContainer}>
              <View style={[styles.ring, styles.ringLeft]} />
              <View style={[styles.ring, styles.ringRight]} />
            </View>
            <Text style={styles.title}>Nak Kahwin</Text>
            <Text style={styles.subtitle}>Plan your big day together</Text>
          </View>

          {/* Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "#1E1E1E" : "#ffffff" },
            ]}
          >
            <ThemedText style={styles.cardTitle}>Welcome back</ThemedText>
            <ThemedText style={styles.cardSub}>Sign in to your account</ThemedText>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#2A2A2A" : "#F8FAFC",
                    color: isDark ? "#fff" : "#1E1B4B",
                    borderColor: isDark ? "#3A3A3A" : "#E2E8F0",
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={isDark ? "#555" : "#94A3B8"}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#2A2A2A" : "#F8FAFC",
                    color: isDark ? "#fff" : "#1E1B4B",
                    borderColor: isDark ? "#3A3A3A" : "#E2E8F0",
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={isDark ? "#555" : "#94A3B8"}
                secureTextEntry
              />
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.primaryButton,
                { opacity: pressed || isLoading ? 0.75 : 1 },
              ]}
            >
              <LinearGradient
                colors={["#7C3AED", "#9F67FA"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Sign In</ThemedText>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? "#2D3748" : "#E2E8F0" }]} />
              <ThemedText style={styles.dividerText}>or</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? "#2D3748" : "#E2E8F0" }]} />
            </View>

            {/* Register Link */}
            <Pressable
              onPress={() => router.push("/register")}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderColor: isDark ? "#3A3A3A" : "#DDD6FE",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText style={[styles.secondaryButtonText, { color: isDark ? "#A78BFA" : "#7C3AED" }]}>
                Create an account
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoContainer: {
    width: 72,
    height: 44,
    marginBottom: 16,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.9)",
    position: "absolute",
  },
  ringLeft: {
    left: 0,
  },
  ringRight: {
    right: 0,
    borderColor: "rgba(255,255,255,0.55)",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    marginTop: 6,
  },
  card: {
    borderRadius: 28,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    opacity: 0.5,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  primaryButton: {
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
  },
  buttonGradient: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    opacity: 0.4,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
    fontSize: 15,
  },
});
