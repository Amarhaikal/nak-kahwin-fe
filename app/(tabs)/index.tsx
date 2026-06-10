import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWeddingDetails } from "@/hooks/use-wedding-details";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState, useRef } from "react";
import { Dimensions, Platform, StyleSheet, View, Pressable, ScrollView } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const { height } = Dimensions.get("window");

export default function MainScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const accentColor = isDark ? "#A78BFA" : "#7C3AED"; // Theme-based purple accent

  const { activeEvent, setActiveEvent, marriage, engagement, coupleNames } = useWeddingDetails();
  const activeDetails = activeEvent === 'marriage' ? marriage : engagement;

  const horizontalScrollRef = useRef<ScrollView>(null);
  const isInternalScroll = useRef(false);

  const [marriageTimeLeft, setMarriageTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [engagementTimeLeft, setEngagementTimeLeft] = useState({
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
    const calculateTimeLeftForDate = (targetDateStr: string) => {
      const tDate = new Date(targetDateStr);
      const difference = tDate.getTime() - new Date().getTime();
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

    const updateAllTimers = () => {
      setMarriageTimeLeft(calculateTimeLeftForDate(marriage.date));
      setEngagementTimeLeft(calculateTimeLeftForDate(engagement.date));
    };

    updateAllTimers();
    const timer = setInterval(updateAllTimers, 1000);

    return () => clearInterval(timer);
  }, [marriage.date, engagement.date]);

  // Sync state when user swipes
  const onScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    if (viewSize <= 0) return;
    const index = Math.round(contentOffset / viewSize);
    isInternalScroll.current = true;
    if (index === 0 && activeEvent !== 'marriage') {
      setActiveEvent('marriage');
    } else if (index === 1 && activeEvent !== 'engagement') {
      setActiveEvent('engagement');
    }
  };

  // Sync scroll position when activeEvent updates from outside
  useEffect(() => {
    if (isInternalScroll.current) {
      isInternalScroll.current = false;
      return;
    }
    if (horizontalScrollRef.current) {
      const page = activeEvent === 'marriage' ? 0 : 1;
      horizontalScrollRef.current.scrollTo({
        x: page * Dimensions.get("window").width,
        animated: true,
      });
    }
  }, [activeEvent]);

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

  const heroImageSource = require("@/assets/images/background-2.jpg");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#F1F5F9" },
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
          source={heroImageSource}
          style={styles.heroImage}
          contentFit="cover"
        />
        {/* Fade to background color at the bottom */}
        <LinearGradient
          colors={
            isDark
              ? ["transparent", "rgba(18,18,18,0.5)", "#121212"]
              : ["transparent", "rgba(241,245,249,0.6)", "#F1F5F9"]
          }
          style={styles.gradient}
        />
      </Animated.View>



      {/* Scrollable Content overlaying background */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Spacer to push everything below the fold except the countdown card */}
        <View style={{ height: height - 370 }} />

        {/* Horizontal Paging ScrollView for Countdown Cards */}
        <View style={styles.horizontalScrollWrapper}>
          <ScrollView
            ref={horizontalScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            scrollEventThrottle={16}
            decelerationRate="fast"
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {/* Page 1: Nikah Countdown */}
            <View style={styles.cardPage}>
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
                <ThemedText style={[styles.countdownHeader, { color: accentColor }]}>
                  Save the Date
                </ThemedText>
                <ThemedText style={[styles.coupleNames, { color: isDark ? "#ffffff" : "#1E1B4B" }]}>
                  {coupleNames}
                </ThemedText>
                <ThemedText style={[styles.dateText, { color: accentColor }]}>
                  {formatDateString(new Date(marriage.date))}
                </ThemedText>

                <View style={styles.timerContainer}>
                  {/* Days */}
                  <View style={styles.timeBlock}>
                    <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                      {formatNumber(marriageTimeLeft.days)}
                    </ThemedText>
                    <ThemedText style={[styles.timeLabel, { color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)" }]}>
                      Days
                    </ThemedText>
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)" }]} />

                  {/* Hours */}
                  <View style={styles.timeBlock}>
                    <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                      {formatNumber(marriageTimeLeft.hours)}
                    </ThemedText>
                    <ThemedText style={[styles.timeLabel, { color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)" }]}>
                      Hours
                    </ThemedText>
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)" }]} />

                  {/* Minutes */}
                  <View style={styles.timeBlock}>
                    <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                      {formatNumber(marriageTimeLeft.minutes)}
                    </ThemedText>
                    <ThemedText style={[styles.timeLabel, { color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)" }]}>
                      Mins
                    </ThemedText>
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)" }]} />

                  {/* Seconds */}
                  <View style={styles.timeBlock}>
                    <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                      {formatNumber(marriageTimeLeft.seconds)}
                    </ThemedText>
                    <ThemedText style={[styles.timeLabel, { color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)" }]}>
                      Secs
                    </ThemedText>
                  </View>
                </View>
              </BlurView>
            </View>

            {/* Page 2: Tunang Countdown */}
            <View style={styles.cardPage}>
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
                <ThemedText style={[styles.countdownHeader, { color: accentColor }]}>
                  Tunang Countdown
                </ThemedText>
                <ThemedText style={[styles.coupleNames, { color: isDark ? "#ffffff" : "#1E1B4B" }]}>
                  {coupleNames}
                </ThemedText>
                <ThemedText style={[styles.dateText, { color: accentColor }]}>
                  {formatDateString(new Date(engagement.date))}
                </ThemedText>

                <View style={styles.timerContainer}>
                  {/* Days */}
                  <View style={styles.timeBlock}>
                    <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                      {formatNumber(engagementTimeLeft.days)}
                    </ThemedText>
                    <ThemedText style={[styles.timeLabel, { color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)" }]}>
                      Days
                    </ThemedText>
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)" }]} />

                  {/* Hours */}
                  <View style={styles.timeBlock}>
                    <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                      {formatNumber(engagementTimeLeft.hours)}
                    </ThemedText>
                    <ThemedText style={[styles.timeLabel, { color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)" }]}>
                      Hours
                    </ThemedText>
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)" }]} />

                  {/* Minutes */}
                  <View style={styles.timeBlock}>
                    <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                      {formatNumber(engagementTimeLeft.minutes)}
                    </ThemedText>
                    <ThemedText style={[styles.timeLabel, { color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)" }]}>
                      Mins
                    </ThemedText>
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)" }]} />

                  {/* Seconds */}
                  <View style={styles.timeBlock}>
                    <ThemedText style={[styles.timeNumber, { color: accentColor }]}>
                      {formatNumber(engagementTimeLeft.seconds)}
                    </ThemedText>
                    <ThemedText style={[styles.timeLabel, { color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)" }]}>
                      Secs
                    </ThemedText>
                  </View>
                </View>
              </BlurView>
            </View>
          </ScrollView>
        </View>

        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: activeEvent === 'marriage' ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.15)'),
                width: activeEvent === 'marriage' ? 16 : 6,
              }
            ]}
          />
          <View
            style={[
              styles.dot,
              {
                backgroundColor: activeEvent === 'engagement' ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.15)'),
                width: activeEvent === 'engagement' ? 16 : 6,
              }
            ]}
          />
        </View>

        {/* Extra Premium Content Cards (allows scrolling to test fade out) */}
        <View style={styles.extraContentContainer}>
          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={Platform.OS === "ios" ? 45 : 75}
            style={[
              styles.infoCard,
              {
                borderColor: isDark ? "rgba(167, 139, 250, 0.15)" : "rgba(124, 58, 237, 0.15)",
                backgroundColor: isDark ? "rgba(42, 27, 61, 0.55)" : "rgba(237, 233, 254, 0.75)",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.infoTitle,
                {
                  color: isDark ? "#C4B5FD" : "#6D28D9",
                },
              ]}
            >
              {activeEvent === 'marriage' ? 'Wedding Event' : 'Engagement Event'}
            </ThemedText>
            <ThemedText
              style={[
                styles.infoText,
                { color: isDark ? "#ffffff" : "#4C1D95" },
              ]}
            >
              {activeDetails.venue}
            </ThemedText>
            <ThemedText
              style={[
                styles.infoSubText,
                { color: isDark ? "#A78BFA" : "#7C3AED" },
              ]}
            >
              {formatDateString(new Date(activeDetails.date))} at {activeDetails.time}
            </ThemedText>
          </BlurView>

          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={Platform.OS === "ios" ? 45 : 75}
            style={[
              styles.infoCard,
              {
                borderColor: isDark ? "rgba(167, 139, 250, 0.15)" : "rgba(124, 58, 237, 0.15)",
                backgroundColor: isDark ? "rgba(42, 27, 61, 0.55)" : "rgba(237, 233, 254, 0.75)",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.infoTitle,
                {
                  color: isDark ? "#C4B5FD" : "#6D28D9",
                },
              ]}
            >
              Checklist Status
            </ThemedText>
            <ThemedText
              style={[
                styles.infoText,
                { color: isDark ? "#ffffff" : "#4C1D95" },
              ]}
            >
              18 out of 32 tasks completed
            </ThemedText>
            <View
              style={[
                styles.progressBarBg,
                {
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#DDD6FE",
                },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  { width: "56%", backgroundColor: isDark ? "#A78BFA" : "#7C3AED" },
                ]}
              />
            </View>
          </BlurView>

          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={Platform.OS === "ios" ? 45 : 75}
            style={[
              styles.infoCard,
              {
                borderColor: isDark ? "rgba(167, 139, 250, 0.15)" : "rgba(124, 58, 237, 0.15)",
                backgroundColor: isDark ? "rgba(42, 27, 61, 0.55)" : "rgba(237, 233, 254, 0.75)",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.infoTitle,
                {
                  color: isDark ? "#C4B5FD" : "#6D28D9",
                },
              ]}
            >
              RSVP Status Summary
            </ThemedText>
            <ThemedText
              style={[
                styles.infoText,
                { color: isDark ? "#ffffff" : "#4C1D95" },
              ]}
            >
              142 Guests Confirmed Attending
            </ThemedText>
            <ThemedText
              style={[
                styles.infoSubText,
                { color: isDark ? "#A78BFA" : "#7C3AED" },
              ]}
            >
              300 Total Invited Guest List
            </ThemedText>
          </BlurView>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
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
  },
  coupleNames: {
    fontSize: 25,
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
    overflow: "hidden",
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
  horizontalScrollWrapper: {
    width: "100%",
  },
  horizontalScrollContent: {
    alignItems: "center",
  },
  cardPage: {
    width: Dimensions.get("window").width,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
