import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const { height } = Dimensions.get("window");

// TARGET WEDDING DATE: August 8, 2027
const TARGET_DATE = new Date("2027-08-08T11:00:00");

export default function MainScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentColor = isDark ? "#A78BFA" : "#7C3AED"; // Theme-based purple accent

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Reanimated scroll value
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = TARGET_DATE.getTime() - new Date().getTime();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, "0");
  };

  const formatDateString = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const imageHeight = height * 0.7;

  // Background Image Animated Styles
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, height * 0.45],
      [1, 0],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      scrollY.value,
      [-100, 0, height * 0.45],
      [1.1, 1, 0.95],
      Extrapolation.CLAMP,
    );

    const translateY = interpolate(
      scrollY.value,
      [0, height * 0.45],
      [0, -40],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#F1F5F9" },
      ]}
    >
      {/* 70% Height Animated Image Header with Gradient Fade */}
      <Animated.View
        style={[
          styles.imageContainer,
          { height: imageHeight },
          animatedBackgroundStyle,
        ]}
      >
        <Image
          source={require("@/assets/images/background-2.jpg")}
          style={styles.heroImage}
          contentFit="cover"
        />
        {/* Fade to background color at the bottom */}
        <LinearGradient
          colors={
            isDark
              ? ["transparent", "rgba(0,0,0,0.5)", "#000000"]
              : ["transparent", "rgba(241,245,249,0.6)", "#F1F5F9"]
          }
          style={styles.gradient}
        />
      </Animated.View>

      {/* Background Glowing Waves/Blobs (Blue & Pink) - only visible in dark mode for aesthetic glow */}
      {isDark && (
        <View style={styles.glowContainer} pointerEvents="none">
          {/* Blue Glow Blob */}
          <LinearGradient
            colors={["rgba(59, 130, 246, 0.18)", "rgba(59, 130, 246, 0)"]}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={[styles.glowBlob, styles.blueBlob]}
          />
          {/* Pink Glow Blob */}
          <LinearGradient
            colors={["rgba(236, 72, 153, 0.18)", "rgba(236, 72, 153, 0)"]}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={[styles.glowBlob, styles.pinkBlob]}
          />
        </View>
      )}

      {/* Scrollable Content overlaying background */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Spacer to push everything below the fold except the countdown card */}
        <View style={{ height: height - 355 }} />

        {/* Glassmorphic Countdown Card */}
        <View style={styles.cardWrapper}>
          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={Platform.OS === "ios" ? 65 : 85}
            style={[
              styles.countdownCard,
              {
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.12)"
                  : "rgba(0, 0, 0, 0.08)",
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.45)"
                  : "rgba(255, 255, 255, 0.65)",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.countdownHeader,
                { color: isDark ? "#ffffff" : "#1E1B4B" },
              ]}
            >
              Save the Date
            </ThemedText>
            <ThemedText
              style={[
                styles.coupleNames,
                { color: isDark ? "#ffffff" : "#1E1B4B" },
              ]}
            >
              Amar & Syamimie
            </ThemedText>
            <ThemedText style={[styles.dateText, { color: accentColor }]}>
              {formatDateString(TARGET_DATE)}
            </ThemedText>

            <View style={styles.timerContainer}>
              {/* Days */}
              <View style={styles.timeBlock}>
                <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                  {formatNumber(timeLeft.days)}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.timeLabel,
                    {
                      color: isDark
                        ? "rgba(255, 255, 255, 0.5)"
                        : "rgba(0, 0, 0, 0.5)",
                    },
                  ]}
                >
                  Days
                </ThemedText>
              </View>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(0, 0, 0, 0.1)",
                  },
                ]}
              />

              {/* Hours */}
              <View style={styles.timeBlock}>
                <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                  {formatNumber(timeLeft.hours)}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.timeLabel,
                    {
                      color: isDark
                        ? "rgba(255, 255, 255, 0.5)"
                        : "rgba(0, 0, 0, 0.5)",
                    },
                  ]}
                >
                  Hours
                </ThemedText>
              </View>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(0, 0, 0, 0.1)",
                  },
                ]}
              />

              {/* Minutes */}
              <View style={styles.timeBlock}>
                <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                  {formatNumber(timeLeft.minutes)}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.timeLabel,
                    {
                      color: isDark
                        ? "rgba(255, 255, 255, 0.5)"
                        : "rgba(0, 0, 0, 0.5)",
                    },
                  ]}
                >
                  Mins
                </ThemedText>
              </View>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(0, 0, 0, 0.1)",
                  },
                ]}
              />

              {/* Seconds */}
              <View style={styles.timeBlock}>
                <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                  {formatNumber(timeLeft.seconds)}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.timeLabel,
                    {
                      color: isDark
                        ? "rgba(255, 255, 255, 0.5)"
                        : "rgba(0, 0, 0, 0.5)",
                    },
                  ]}
                >
                  Secs
                </ThemedText>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Extra Premium Content Cards (allows scrolling to test fade out) */}
        <View style={styles.extraContentContainer}>
          <View
            style={[
              styles.infoCard,
              {
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.infoTitle,
                {
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)",
                },
              ]}
            >
              Wedding Event
            </ThemedText>
            <ThemedText
              style={[
                styles.infoText,
                { color: isDark ? "#ffffff" : "#1E293B" },
              ]}
            >
              De&apos;Emerald Garden, Banting
            </ThemedText>
            <ThemedText
              style={[
                styles.infoSubText,
                { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)" },
              ]}
            >
              Sunday, 8 August 2027 at 11:00 AM
            </ThemedText>
          </View>

          <View
            style={[
              styles.infoCard,
              {
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.infoTitle,
                {
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)",
                },
              ]}
            >
              Checklist Status
            </ThemedText>
            <ThemedText
              style={[
                styles.infoText,
                { color: isDark ? "#ffffff" : "#1E293B" },
              ]}
            >
              18 out of 32 tasks completed
            </ThemedText>
            <View
              style={[
                styles.progressBarBg,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.08)",
                },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  { width: "56%", backgroundColor: accentColor },
                ]}
              />
            </View>
          </View>

          <View
            style={[
              styles.infoCard,
              {
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.infoTitle,
                {
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)",
                },
              ]}
            >
              RSVP Status Summary
            </ThemedText>
            <ThemedText
              style={[
                styles.infoText,
                { color: isDark ? "#ffffff" : "#1E293B" },
              ]}
            >
              142 Guests Confirmed Attending
            </ThemedText>
            <ThemedText
              style={[
                styles.infoSubText,
                { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)" },
              ]}
            >
              300 Total Invited Guest List
            </ThemedText>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  imageContainer: {
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  scrollContainer: {
    paddingBottom: 140, // sit nicely above floating navigation bar
  },
  cardWrapper: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  countdownCard: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    alignItems: "center",
    overflow: "hidden",
  },
  countdownHeader: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: 6,
    color: "#ffffff",
  },
  coupleNames: {
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginVertical: 10,
    textAlign: "center",
  },
  dateText: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 24,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  timeBlock: {
    flex: 1,
    alignItems: "center",
  },
  timeNumber: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 40, // Fix top/bottom clipping on iOS/Android
    fontVariant: ["tabular-nums"],
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
    color: "rgba(255, 255, 255, 0.5)",
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  extraContentContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 16,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  infoSubText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  glowBlob: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  blueBlob: {
    top: height * 0.45,
    left: -100,
  },
  pinkBlob: {
    top: height * 0.62,
    right: -100,
  },
});
