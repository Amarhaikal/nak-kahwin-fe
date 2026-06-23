import { DatePicker } from "@/components/date-picker";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWeddingDetails } from "@/hooks/use-wedding-details";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
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
    updateEventDetails,
  } = useWeddingDetails();

  const activeDetails = activeEvent === "marriage" ? marriage : engagement;
  const customImageUrl =
    activeEvent === "marriage"
      ? plan?.marriageImageUrl
      : plan?.engagementImageUrl;

  const [isUploading, setIsUploading] = useState(false);

  // Edit Mode state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState(""); // YYYY-MM-DD
  const [editVenue, setEditVenue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const getYYYYMMDD = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  const handleEditPress = () => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditTitle(title || "");
    setEditDate(getYYYYMMDD(activeDetails?.date));
    setEditVenue(activeDetails?.venue || "");
    setIsEditModalVisible(true);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const payload: any = {
        title: editTitle,
      };

      if (activeEvent === "marriage") {
        payload.marriageVenue = editVenue;
        payload.marriageDate = editDate || null;
      } else {
        payload.engagementVenue = editVenue;
        payload.engagementDate = editDate || null;
      }

      const error = await updateEventDetails(payload);
      if (error) {
        Alert.alert("Update Failed", error);
      } else {
        if (Platform.OS === "ios" || Platform.OS === "android") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setIsEditModalVisible(false);
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "An error occurred while saving details.",
      );
    } finally {
      setIsSaving(false);
    }
  };

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
        setIsUploading(true);
        
        // Convert image (handles HEIC on iOS) to standard JPEG before upload
        const rawUri = result.assets[0].uri;
        const manipResult = await ImageManipulator.manipulateAsync(
          rawUri,
          [],
          { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
        );
        const selectedUri = manipResult.uri;

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
                            : "rgba(124, 58, 237, 0.15)",
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
                {/* Floating Edit Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.cardEditButton,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={handleEditPress}
                >
                  <BlurView
                    tint={isDark ? "dark" : "light"}
                    intensity={60}
                    style={styles.cardEditButtonBlur}
                  >
                    <IconSymbol name="pencil" size={14} color={accentColor} />
                  </BlurView>
                </Pressable>
                <ThemedText
                  style={[styles.countdownHeader, { color: accentColor }]}
                >
                  Nikah Countdown
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
                {/* Floating Edit Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.cardEditButton,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={handleEditPress}
                >
                  <BlurView
                    tint={isDark ? "dark" : "light"}
                    intensity={60}
                    style={styles.cardEditButtonBlur}
                  >
                    <IconSymbol name="pencil" size={14} color={accentColor} />
                  </BlurView>
                </Pressable>
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

      {/* Edit Event Details Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={95}
            style={[
              styles.modalContentContainer,
              {
                backgroundColor: isDark
                  ? "rgba(18, 18, 18, 0.95)"
                  : "rgba(255, 255, 255, 0.95)",
              },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalTitle}>
                  {activeEvent === "marriage"
                    ? "Edit Nikah Details"
                    : "Edit Tunang Details"}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.modalSubtitle,
                    {
                      color: isDark
                        ? "rgba(255,255,255,0.5)"
                        : "rgba(0,0,0,0.5)",
                    },
                  ]}
                >
                  Hold event card to edit anytime
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setIsEditModalVisible(false)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                />
              </Pressable>
            </View>

            {/* Scrollable Form Content */}
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Cover Photo Customization in Modal */}
              <View style={styles.modalFieldGroup}>
                <ThemedText
                  style={[
                    styles.modalLabel,
                    {
                      color: isDark
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(0,0,0,0.6)",
                    },
                  ]}
                >
                  Cover Picture
                </ThemedText>
                <View
                  style={[
                    styles.modalImageWrapper,
                    {
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(0, 0, 0, 0.08)",
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                    },
                  ]}
                >
                  {customImageUrl ? (
                    <Image
                      source={{ uri: customImageUrl }}
                      style={styles.modalImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <LinearGradient
                        colors={defaultGradientColors}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                      <IconSymbol
                        name="photo.fill"
                        size={32}
                        color={
                          isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"
                        }
                      />
                    </View>
                  )}

                  {/* Upload overlay button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalImageOverlayButton,
                      { opacity: pressed ? 0.9 : 1 },
                    ]}
                    onPress={handleImagePick}
                    disabled={isUploading}
                  >
                    <BlurView
                      tint="dark"
                      intensity={80}
                      style={styles.modalImageOverlayBlur}
                    >
                      <IconSymbol name="camera.fill" size={14} color="#fff" />
                      <Text style={styles.modalImageOverlayText}>
                        Change Photo
                      </Text>
                    </BlurView>
                  </Pressable>

                  {/* Loading indicator during cover photo upload */}
                  {isUploading && (
                    <View style={styles.modalImageUploadingOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                </View>
              </View>

              {/* Title Field */}
              <View style={styles.modalFieldGroup}>
                <ThemedText
                  style={[
                    styles.modalLabel,
                    {
                      color: isDark
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(0,0,0,0.6)",
                    },
                  ]}
                >
                  Wedding Title
                </ThemedText>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: isDark ? "#2A2A2A" : "#F8FAFC",
                      color: isDark ? "#fff" : "#1E1B4B",
                      borderColor: isDark ? "#3A3A3A" : "#E2E8F0",
                    },
                  ]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="e.g. Amar & Syamimie"
                  placeholderTextColor={isDark ? "#555" : "#94A3B8"}
                  autoCapitalize="words"
                />
              </View>

              {/* Date Field */}
              <View style={styles.modalFieldGroup}>
                <DatePicker
                  value={editDate}
                  onChange={setEditDate}
                  placeholder="Select event date"
                  label={
                    activeEvent === "marriage"
                      ? "Wedding (Nikah) Date"
                      : "Engagement (Tunang) Date"
                  }
                />
              </View>

              {/* Venue Field */}
              <View style={styles.modalFieldGroup}>
                <ThemedText
                  style={[
                    styles.modalLabel,
                    {
                      color: isDark
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(0,0,0,0.6)",
                    },
                  ]}
                >
                  Venue
                </ThemedText>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: isDark ? "#2A2A2A" : "#F8FAFC",
                      color: isDark ? "#fff" : "#1E1B4B",
                      borderColor: isDark ? "#3A3A3A" : "#E2E8F0",
                    },
                  ]}
                  value={editVenue}
                  onChangeText={setEditVenue}
                  placeholder="e.g. Grand Ballroom"
                  placeholderTextColor={isDark ? "#555" : "#94A3B8"}
                />
              </View>

              {/* Actions Button Row */}
              <View style={styles.modalButtonRow}>
                <Pressable
                  onPress={() => setIsEditModalVisible(false)}
                  disabled={isSaving}
                  style={[
                    styles.modalSecondaryButton,
                    { borderColor: isDark ? "#3A3A3A" : "#DDD6FE" },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.modalSecondaryButtonText,
                      { color: isDark ? "#A78BFA" : "#7C3AED" },
                    ]}
                  >
                    Cancel
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleSaveChanges}
                  disabled={isSaving}
                  style={styles.modalPrimaryButton}
                >
                  <LinearGradient
                    colors={["#7C3AED", "#9F67FA"]}
                    style={styles.modalPrimaryButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalPrimaryButtonText}>
                        Save Changes
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end", // Slide up from bottom
  },
  modalContentContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSubtitle: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 2,
  },
  modalScrollContent: {
    gap: 20,
  },
  modalFieldGroup: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  modalImageSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  modalImageWrapper: {
    width: "100%",
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageOverlayButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modalImageOverlayBlur: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  modalImageOverlayText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  modalImageUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  modalPrimaryButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  modalPrimaryButtonGradient: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  modalPrimaryButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalSecondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSecondaryButtonText: {
    fontWeight: "600",
    fontSize: 15,
  },
  cardEditButton: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 18,
    overflow: "hidden",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardEditButtonBlur: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
