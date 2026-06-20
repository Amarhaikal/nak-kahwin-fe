import { DatePicker } from "@/components/date-picker";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWeddingDetails } from "@/hooks/use-wedding-details";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CreatePlanScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { user } = useAuth();
  const { createNewPlan } = useWeddingDetails();

  // Navigation step state (1 to 4)
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields State
  const [title, setTitle] = useState(user ? `${user.name}'s Wedding Plan` : "");

  // Date States (YYYY-MM-DD format)
  const [weddingDate, setWeddingDate] = useState("");

  // Engagement Toggle & Date State
  const [isEngagementEnabled, setIsEngagementEnabled] = useState(false);
  const [engagementDate, setEngagementDate] = useState("");

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim()) {
        Alert.alert("Required Field", "Please give your wedding plan a title.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const payload = {
      title: title.trim(),
      weddingDate: weddingDate || null,
      isEngagementEnabled,
      engagementDate:
        isEngagementEnabled && engagementDate ? engagementDate : null,
    };

    const error = await createNewPlan(payload);
    setIsLoading(false);

    if (error) {
      Alert.alert("Plan Creation Failed", error);
      return;
    }

    // Success! The AuthGate in _layout.tsx will automatically pick up that
    // hasPlan is true and redirect us to /(tabs)
  };

  // Date string display helper for summary page
  const displayDateStr = (dateStr: string) => {
    if (!dateStr) return "Not set yet (can set later)";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return "Not set yet (can set later)";

    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  return (
    <LinearGradient
      colors={isDark ? ["#1a0533", "#121212"] : ["#7C3AED", "#ECE9FC"]}
      style={styles.gradientContainer as any}
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
            <View style={styles.logoContainer}>
              <View style={[styles.ring, styles.ringLeft]} />
              <View style={[styles.ring, styles.ringRight]} />
            </View>
            <Text style={styles.title}>Create Wedding Plan</Text>
            <Text style={styles.subtitle}>
              Let's set up your shared dashboard
            </Text>
          </View>

          {/* Stepper Progress Indicator */}
          <View style={styles.stepperProgressRow}>
            {[1, 2, 3, 4].map((i) => (
              <React.Fragment key={i}>
                <View
                  style={
                    [
                      styles.stepCircle,
                      step === i && styles.stepCircleActive,
                      step > i && styles.stepCircleCompleted,
                      { backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF" },
                    ] as any
                  }
                >
                  {step > i ? (
                    <IconSymbol name="checkmark" size={14} color="#FFF" />
                  ) : (
                    <Text
                      style={
                        [
                          styles.stepCircleText,
                          step === i && styles.stepCircleTextActive,
                          step > i && { color: "#FFF" },
                        ] as any
                      }
                    >
                      {i}
                    </Text>
                  )}
                </View>
                {i < 4 && (
                  <View
                    style={
                      [
                        styles.stepLine,
                        step > i
                          ? styles.stepLineCompleted
                          : { backgroundColor: isDark ? "#333" : "#D1D5DB" },
                      ] as any
                    }
                  />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Stepper Content Card */}
          <View
            style={
              [
                styles.card,
                { backgroundColor: isDark ? "#1E1E1E" : "#ffffff" },
              ] as any
            }
          >
            {/* STEP 1: TITLE */}
            {step === 1 && (
              <View>
                <ThemedText style={styles.cardTitle}>
                  💍 Name your wedding plan
                </ThemedText>
                <ThemedText style={styles.cardSub}>
                  Give your workspace a title. You can change this later.
                </ThemedText>

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.label}>
                    Plan Workspace Title
                  </ThemedText>
                  <TextInput
                    style={
                      [
                        styles.input,
                        {
                          backgroundColor: isDark ? "#2A2A2A" : "#F8FAFC",
                          color: isDark ? "#fff" : "#1E1B4B",
                          borderColor: isDark ? "#3A3A3A" : "#E2E8F0",
                        },
                      ] as any
                    }
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Amar & Mimie"
                    placeholderTextColor={isDark ? "#555" : "#94A3B8"}
                    autoCapitalize="words"
                    maxLength={100}
                  />
                </View>
              </View>
            )}

            {/* STEP 2: WEDDING DATE */}
            {step === 2 && (
              <View>
                <ThemedText style={styles.cardTitle}>
                  📅 Wedding (Nikah) Date
                </ThemedText>
                <ThemedText style={styles.cardSub}>
                  When is the big day? You can leave this blank if not finalized
                  yet.
                </ThemedText>

                <View style={styles.fieldGroup}>
                  <DatePicker
                    value={weddingDate}
                    onChange={setWeddingDate}
                    placeholder="Select wedding date"
                    label="Date of Wedding"
                  />
                </View>
              </View>
            )}

            {/* STEP 3: ENGAGEMENT DETAILS */}
            {step === 3 && (
              <View>
                <ThemedText style={styles.cardTitle}>
                  🌸 Engagement (Tunang)
                </ThemedText>
                <ThemedText style={styles.cardSub}>
                  Are you also planning an engagement ceremony beforehand?
                </ThemedText>

                <View style={styles.toggleRow}>
                  <ThemedText style={styles.toggleText}>
                    Plan for Engagement
                  </ThemedText>
                  <Switch
                    value={isEngagementEnabled}
                    onValueChange={setIsEngagementEnabled}
                    trackColor={{ false: "#D1D5DB", true: "#C084FC" }}
                    thumbColor={isEngagementEnabled ? "#7C3AED" : "#F4F3F5"}
                  />
                </View>

                {isEngagementEnabled && (
                  <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                    <DatePicker
                      value={engagementDate}
                      onChange={setEngagementDate}
                      placeholder="Select engagement date"
                      label="Date of Engagement"
                    />
                  </View>
                )}
              </View>
            )}

            {/* STEP 4: SUMMARY & SUBMIT */}
            {step === 4 && (
              <View>
                <ThemedText style={styles.cardTitle}>
                  🎉 Review details
                </ThemedText>
                <ThemedText style={styles.cardSub}>
                  Make sure everything is correct. You can edit these details
                  any time.
                </ThemedText>

                <View
                  style={
                    [
                      styles.summaryContainer,
                      { backgroundColor: isDark ? "#262626" : "#F8FAFC" },
                    ] as any
                  }
                >
                  <View style={styles.summaryItem}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: isDark ? "#888" : "#64748B" },
                      ]}
                    >
                      Workspace Name
                    </Text>
                    <ThemedText style={styles.summaryValue}>{title}</ThemedText>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryItem}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: isDark ? "#888" : "#64748B" },
                      ]}
                    >
                      Wedding (Nikah) Date
                    </Text>
                    <ThemedText style={styles.summaryValue}>
                      {displayDateStr(weddingDate)}
                    </ThemedText>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryItem}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: isDark ? "#888" : "#64748B" },
                      ]}
                    >
                      Engagement (Tunang)
                    </Text>
                    <ThemedText style={styles.summaryValue}>
                      {isEngagementEnabled ? "Enabled" : "Disabled"}
                    </ThemedText>
                  </View>

                  {isEngagementEnabled && (
                    <>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Text
                          style={[
                            styles.summaryLabel,
                            { color: isDark ? "#888" : "#64748B" },
                          ]}
                        >
                          Engagement Date
                        </Text>
                        <ThemedText style={styles.summaryValue}>
                          {displayDateStr(engagementDate)}
                        </ThemedText>
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Navigation Button Row */}
            <View style={styles.buttonRow}>
              {step > 1 && (
                <Pressable
                  onPress={handleBack}
                  disabled={isLoading}
                  style={
                    [
                      styles.secondaryButton,
                      { borderColor: isDark ? "#3A3A3A" : "#DDD6FE" },
                    ] as any
                  }
                >
                  <ThemedText
                    style={
                      [
                        styles.secondaryButtonText,
                        { color: isDark ? "#A78BFA" : "#7C3AED" },
                      ] as any
                    }
                  >
                    Back
                  </ThemedText>
                </Pressable>
              )}

              <Pressable
                onPress={step === 4 ? handleSubmit : handleNext}
                disabled={isLoading}
                style={styles.primaryButton}
              >
                <LinearGradient
                  colors={["#7C3AED", "#9F67FA"]}
                  style={styles.buttonGradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {step === 4 ? "Create Plan" : "Next"}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
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
    marginBottom: 24,
    position: "relative",
  },
  logoutButton: {
    position: "absolute",
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 6,
  },
  stepperProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#A78BFA",
  },
  stepCircleActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  stepCircleCompleted: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  stepCircleText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#71717A",
  },
  stepCircleTextActive: {
    color: "#FFFFFF",
  },
  stepLine: {
    flex: 1,
    height: 3,
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: "#7C3AED",
  },
  card: {
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    opacity: 0.5,
    marginBottom: 20,
    lineHeight: 18,
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
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  datePartColumn: {
    flex: 1,
    alignItems: "center",
  },
  datePartInput: {
    width: "100%",
    textAlign: "center",
  },
  dateLabelHelp: {
    fontSize: 11,
    color: "#71717A",
    marginTop: 4,
  },
  dateDivider: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#71717A",
    paddingBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 12,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  summaryContainer: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  summaryItem: {
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.15)",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
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
  secondaryButton: {
    flex: 1,
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
