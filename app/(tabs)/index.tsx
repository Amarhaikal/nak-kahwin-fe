import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWeddingDetails } from "@/hooks/use-wedding-details";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
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

  const defaultGradientColors = isDark
    ? (["#2E1065", "#1E1B4B", "#121212"] as const)
    : (["#EDE9FE", "#E0F2FE", "#F1F5F9"] as const);

  const {
    activeEvent,
    setActiveEvent,
    marriage,
    engagement,
    title,
    plan,
    uploadEventPicture,
  } = useWeddingDetails();

  const activeDetails = activeEvent === "marriage" ? marriage : engagement;
  const customImageUrl =
    activeEvent === "marriage"
      ? plan?.marriageImageUrl
      : plan?.engagementImageUrl;

  const [isUploading, setIsUploading] = useState(false);

  const handleImagePick = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to upload cover photos.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setIsUploading(true);
        const error = await uploadEventPicture(selectedUri, activeEvent);
        if (error) {
          Alert.alert("Upload Failed", error);
        } else {
          Alert.alert("Success", "Cover image uploaded successfully.");
        }
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "An error occurred during image selection.",
      );
    } finally {
      setIsUploading(false);
    }
  };

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
    const calculateTimeLeftForDate = (
      targetDateStr: string | null | undefined,
    ) => {
      if (!targetDateStr) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      const tDate = new Date(targetDateStr);
      if (isNaN(tDate.getTime()))
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
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
      setMarriageTimeLeft(calculateTimeLeftForDate(marriage?.date));
      setEngagementTimeLeft(calculateTimeLeftForDate(engagement?.date));
    };

    updateAllTimers();
    const timer = setInterval(updateAllTimers, 1000);

    return () => clearInterval(timer);
  }, [marriage?.date, engagement?.date]);

  // Sync state when user swipes
  const onScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const viewSize = event.nativeEvent.layoutMeasurement.width;
    if (viewSize <= 0) return;
    const index = Math.round(contentOffset / viewSize);
    isInternalScroll.current = true;
    if (index === 0 && activeEvent !== "marriage") {
      setActiveEvent("marriage");
    } else if (index === 1 && activeEvent !== "engagement") {
      setActiveEvent("engagement");
    }
  };

  // Sync scroll position when activeEvent updates from outside
  useEffect(() => {
    if (isInternalScroll.current) {
      isInternalScroll.current = false;
      return;
    }
    if (horizontalScrollRef.current) {
      const page = activeEvent === "marriage" ? 0 : 1;
      horizontalScrollRef.current.scrollTo({
        x: page * Dimensions.get("window").width,
        animated: true,
      });
    }
  }, [activeEvent]);

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, "0");
  };

  const formatDateString = (dateInput: Date | string | null | undefined) => {
    if (!dateInput) return "Not Scheduled";
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "Not Scheduled";
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
        { backgroundColor: isDark ? "#121212" : "#F1F5F9" },
      ]}
    >
      {/* Floating Action Button to change the cover picture if already set */}
      {customImageUrl && (
        <Pressable
          style={({ pressed }) => [
            styles.changeImageButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleImagePick}
          disabled={isUploading}
        >
          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={60}
            style={styles.changeImageBlur}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : (
              <>
                <IconSymbol name="camera.fill" size={16} color={accentColor} />
                <ThemedText style={styles.changeImageText}>
                  Change Cover
                </ThemedText>
              </>
            )}
          </BlurView>
        </Pressable>
      )}

      {/* 70% Height Animated Image Header with Gradient Fade */}
      <Animated.View
        style={[
          styles.imageContainer,
          { height: imageHeight },
          animatedBackgroundStyle,
        ]}
      >
        {customImageUrl ? (
          <Image
            source={{ uri: customImageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={defaultGradientColors}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
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
        <View style={[styles.topSpacer, { height: height - 370 }]}>
          {!customImageUrl && (
            <Pressable
              style={({ pressed }) => [
                styles.uploadPlaceholderCard,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleImagePick}
              disabled={isUploading}
            >
              <BlurView
                tint={isDark ? "dark" : "light"}
                intensity={60}
                style={styles.uploadPlaceholderBlur}
              >
                {isUploading ? (
                  <View style={styles.uploadLoadingBox}>
                    <ActivityIndicator size="large" color={accentColor} />
                    <ThemedText style={styles.uploadLoadingText}>
                      Uploading...
                    </ThemedText>
                  </View>
                ) : (
                  <>
                    <View
                      style={[
                        styles.cameraIconContainer,
                        {
                          backgroundColor: isDark
                            ? "rgba(167, 139, 250, 0.15)"
                            : "rgba(124, 58, 237, 0.1)",
                        },
                      ]}
                    >
                      <IconSymbol
                        name="camera.fill"
                        size={28}
                        color={accentColor}
                      />
                    </View>
                    <ThemedText style={styles.uploadPlaceholderText}>
                      Upload Cover Photo
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.uploadPlaceholderSubtext,
                        {
                          color: isDark
                            ? "rgba(255, 255, 255, 0.5)"
                            : "rgba(0, 0, 0, 0.5)",
                        },
                      ]}
                    >
                      {activeEvent === "marriage"
                        ? "Nikah Cover"
                        : "Tunang Cover"}
                    </ThemedText>
                  </>
                )}
              </BlurView>
            </Pressable>
          )}
        </View>

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
                <ThemedText
                  style={[styles.countdownHeader, { color: accentColor }]}
                >
                  Save the Date
                </ThemedText>
                <ThemedText
                  style={[
                    styles.title,
                    { color: isDark ? "#ffffff" : "#1E1B4B" },
                  ]}
                >
                  {title}
                </ThemedText>
                <ThemedText style={[styles.dateText, { color: accentColor }]}>
                  {formatDateString(marriage?.date)}
                </ThemedText>

                <View style={styles.timerContainer}>
                  {/* Days */}
                  <View style={styles.timeBlock}>
                    <ThemedText
                      style={[styles.timeNumber, { color: accentColor }]}
                    >
                      {formatNumber(marriageTimeLeft.days)}
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
                    <ThemedText
                      style={[styles.timeNumber, { color: accentColor }]}
                    >
                      {formatNumber(marriageTimeLeft.hours)}
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
                    <ThemedText
                      style={[styles.timeNumber, { color: accentColor }]}
                    >
                      {formatNumber(marriageTimeLeft.minutes)}
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
                    <ThemedText
                      style={[styles.timeNumber, { color: accentColor }]}
                    >
                      {formatNumber(marriageTimeLeft.seconds)}
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
                <ThemedText
                  style={[styles.countdownHeader, { color: accentColor }]}
                >
                  Tunang Countdown
                </ThemedText>
                <ThemedText
                  style={[
                    styles.title,
                    { color: isDark ? "#ffffff" : "#1E1B4B" },
                  ]}
                >
                  {title}
                </ThemedText>
                <ThemedText style={[styles.dateText, { color: accentColor }]}>
                  {formatDateString(engagement?.date)}
                </ThemedText>

                <View style={styles.timerContainer}>
                  {/* Days */}
                  <View style={styles.timeBlock}>
                    <ThemedText
                      style={[styles.timeNumber, { color: accentColor }]}
                    >
                      {formatNumber(engagementTimeLeft.days)}
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
                    <ThemedText
                      style={[styles.timeNumber, { color: accentColor }]}
                    >
                      {formatNumber(engagementTimeLeft.hours)}
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
                    <ThemedText
                      style={[styles.timeNumber, { color: accentColor }]}
                    >
                      {formatNumber(engagementTimeLeft.minutes)}
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
                    <ThemedText
                      style={[styles.timeNumber, { color: accentColor }]}
                    >
                      {formatNumber(engagementTimeLeft.seconds)}
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
          </ScrollView>
        </View>

        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  activeEvent === "marriage"
                    ? accentColor
                    : isDark
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(0, 0, 0, 0.15)",
                width: activeEvent === "marriage" ? 16 : 6,
              },
            ]}
          />
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  activeEvent === "engagement"
                    ? accentColor
                    : isDark
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(0, 0, 0, 0.15)",
                width: activeEvent === "engagement" ? 16 : 6,
              },
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
                borderColor: isDark
                  ? "rgba(167, 139, 250, 0.15)"
                  : "rgba(124, 58, 237, 0.15)",
                backgroundColor: isDark
                  ? "rgba(42, 27, 61, 0.55)"
                  : "rgba(237, 233, 254, 0.75)",
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
              {activeEvent === "marriage"
                ? "Wedding Event"
                : "Engagement Event"}
            </ThemedText>
            <ThemedText
              style={[
                styles.infoText,
                { color: isDark ? "#ffffff" : "#4C1D95" },
              ]}
            >
              {activeDetails?.venue || "Not Scheduled"}
            </ThemedText>
          </BlurView>

          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={Platform.OS === "ios" ? 45 : 75}
            style={[
              styles.infoCard,
              {
                borderColor: isDark
                  ? "rgba(167, 139, 250, 0.15)"
                  : "rgba(124, 58, 237, 0.15)",
                backgroundColor: isDark
                  ? "rgba(42, 27, 61, 0.55)"
                  : "rgba(237, 233, 254, 0.75)",
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
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "#DDD6FE",
                },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: "56%",
                    backgroundColor: isDark ? "#A78BFA" : "#7C3AED",
                  },
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
                borderColor: isDark
                  ? "rgba(167, 139, 250, 0.15)"
                  : "rgba(124, 58, 237, 0.15)",
                backgroundColor: isDark
                  ? "rgba(42, 27, 61, 0.55)"
                  : "rgba(237, 233, 254, 0.75)",
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
  title: {
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
  topSpacer: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  uploadPlaceholderCard: {
    width: "85%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  uploadPlaceholderBlur: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadPlaceholderText: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  uploadPlaceholderSubtext: {
    fontSize: 12,
  },
  uploadLoadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  uploadLoadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  changeImageButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    borderRadius: 20,
    overflow: "hidden",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  changeImageBlur: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  changeImageText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
