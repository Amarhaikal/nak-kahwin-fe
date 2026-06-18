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

type Role = "groom" | "bride";

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("groom");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    const error = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    });
    setIsLoading(false);

    if (error) {
      Alert.alert("Registration Failed", error);
      return;
    }

    Alert.alert("Success", "Account created successfully. Please sign in.", [
      { text: "OK", onPress: () => router.replace("/login" as any) }
    ]);
  };

  const accentColor = isDark ? "#A78BFA" : "#7C3AED";

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start planning your wedding journey</Text>
          </View>

          {/* Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "#1E1E1E" : "#ffffff" },
            ]}
          >
            <ThemedText style={styles.cardTitle}>Your details</ThemedText>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#2A2A2A" : "#F8FAFC",
                    color: isDark ? "#fff" : "#1E1B4B",
                    borderColor: isDark ? "#3A3A3A" : "#E2E8F0",
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Amar Haikal"
                placeholderTextColor={isDark ? "#555" : "#94A3B8"}
                autoCapitalize="words"
              />
            </View>

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
                placeholder="Min. 6 characters"
                placeholderTextColor={isDark ? "#555" : "#94A3B8"}
                secureTextEntry
              />
            </View>

            {/* Role Picker */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>I am the</ThemedText>
              <View style={styles.roleRow}>
                {(["groom", "bride"] as Role[]).map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor:
                          role === r
                            ? accentColor
                            : isDark
                            ? "#2A2A2A"
                            : "#F1F5F9",
                        borderColor:
                          role === r
                            ? accentColor
                            : isDark
                            ? "#3A3A3A"
                            : "#E2E8F0",
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.roleChipText,
                        { color: role === r ? "#ffffff" : isDark ? "#aaa" : "#64748B" },
                      ]}
                    >
                      {r === "groom" ? "🤵 Groom" : "👰 Bride"}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Register Button */}
            <Pressable
              onPress={handleRegister}
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
                  <ThemedText style={styles.buttonText}>Create Account</ThemedText>
                )}
              </LinearGradient>
            </Pressable>

            {/* Back to login */}
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <ThemedText style={styles.backLink}>
                Already have an account?{" "}
                <ThemedText style={[styles.backLink, { color: accentColor, fontWeight: "bold" }]}>
                  Sign in
                </ThemedText>
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
    marginBottom: 20,
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
  roleRow: {
    flexDirection: "row",
    gap: 10,
  },
  roleChip: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  roleChipText: {
    fontWeight: "600",
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 16,
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
  backLink: {
    textAlign: "center",
    fontSize: 13,
    opacity: 0.6,
  },
});
