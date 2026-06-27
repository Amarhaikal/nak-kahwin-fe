import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { getToken, useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { deleteSaving, getSavings, SavingEntry, reorderSavings } from "@/services/savings-service";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  SharedValue,
} from "react-native-reanimated";

const ROW_HEIGHT = 60;

interface DraggableRowProps {
  item: SavingEntry;
  index: number;
  filtered: SavingEntry[];
  positions: SharedValue<Record<string, number>>;
  isDarkMode: boolean;
  accentColor: string;
  userRole?: string;
  formatCurrency: (amount: number) => string;
  handleDeleteSaving: (id: string) => void;
  onOrderChange: (orderedIds: string[]) => void;
  renderRightActions: (id: string) => React.ReactNode;
}

function DraggableRow({
  item,
  filtered,
  positions,
  isDarkMode,
  accentColor,
  userRole,
  formatCurrency,
  handleDeleteSaving,
  onOrderChange,
  renderRightActions,
}: DraggableRowProps) {
  const isMyContribution = item.contributorRole === userRole;

  const isDragging = useSharedValue(false);
  const startY = useSharedValue(0);
  const top = useSharedValue((positions.value[item.id] ?? 0) * ROW_HEIGHT);
  const hasRendered = useSharedValue(false);

  // Keep top value in sync when positions are updated by other items shifting
  useAnimatedReaction(
    () => positions.value[item.id],
    (newIdx) => {
      if (newIdx !== undefined && !isDragging.value) {
        if (!hasRendered.value) {
          top.value = newIdx * ROW_HEIGHT;
          hasRendered.value = true;
        } else {
          top.value = withTiming(newIdx * ROW_HEIGHT, { duration: 200 });
        }
      }
    }
  );

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(350)
    .onStart(() => {
      isDragging.value = true;
      startY.value = top.value;
    })
    .onUpdate((event) => {
      // Calculate immediate new position
      const newTop = startY.value + event.translationY;
      top.value = newTop;

      const currentIdx = Math.round(newTop / ROW_HEIGHT);
      const activeId = item.id;
      const oldIdx = positions.value[activeId];

      if (
        currentIdx !== oldIdx &&
        currentIdx >= 0 &&
        currentIdx < filtered.length
      ) {
        // Find which item is currently occupying the target index
        const targetId = Object.keys(positions.value).find(
          (key) => positions.value[key] === currentIdx
        );

        if (targetId) {
          // Swap indices in the shared object
          const nextPositions = { ...positions.value };
          nextPositions[activeId] = currentIdx;
          nextPositions[targetId] = oldIdx;
          positions.value = nextPositions;
        }
      }
    })
    .onEnd(() => {
      isDragging.value = false;
      const finalIdx = positions.value[item.id] ?? 0;
      top.value = withTiming(finalIdx * ROW_HEIGHT, { duration: 200 }, () => {
        // Collect updated order mapping and trigger API request
        const sortedIds = Object.keys(positions.value).sort(
          (a, b) => positions.value[a] - positions.value[b]
        );
        runOnJS(onOrderChange)(sortedIds);
      });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      top: top.value,
      zIndex: isDragging.value ? 99 : 1,
      transform: [
        { scale: isDragging.value ? withTiming(1.04, { duration: 150 }) : withTiming(1.0, { duration: 150 }) },
      ],
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: isDragging.value ? 10 : 0,
      },
      shadowOpacity: isDragging.value ? 0.15 : 0,
      shadowRadius: isDragging.value ? 10 : 0,
      elevation: isDragging.value ? 5 : 0,
    };
  });

  const rowContent = (
    <View
      style={[
        styles.savingRow,
        {
          backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff",
          height: ROW_HEIGHT,
        },
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={styles.dragHandle}>
          <IconSymbol
            name="list.bullet"
            size={16}
            color={isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
          />
        </View>
        <ThemedText style={styles.rowMonth}>{item.month}</ThemedText>
      </View>
      <View style={styles.rowRight}>
        <ThemedText
          style={[
            styles.rowAmount,
            { color: isDarkMode ? "#FFFFFF" : "#1E1B4B" },
          ]}
        >
          {formatCurrency(Number(item.amount))}
        </ThemedText>

        {!isMyContribution && (
          <View style={styles.lockIconWrapper}>
            <IconSymbol
              name="lock.fill"
              size={14}
              color={
                isDarkMode
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(0,0,0,0.25)"
              }
            />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: "absolute",
            left: 0,
            right: 0,
            height: ROW_HEIGHT,
          },
        ]}
      >
        {isMyContribution ? (
          <Swipeable
            renderRightActions={() => renderRightActions(item.id)}
            friction={1.8}
            rightThreshold={40}
          >
            {rowContent}
          </Swipeable>
        ) : (
          rowContent
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export default function AllSavingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDarkMode = colorScheme === "dark";
  const theme = Colors[colorScheme];
  const accentColor = theme.tint; // Purple accent

  const { user } = useAuth();

  const [savings, setSavings] = useState<SavingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "you" | "partner">("all");

  const positions = useSharedValue<Record<string, number>>({});

  const parsePeriodToDate = (periodStr: string): number => {
    const timestamp = Date.parse(periodStr);
    if (!isNaN(timestamp)) {
      return timestamp;
    }
    const yearMatch = periodStr.match(/\b\d{4}\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0], 10);
      const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const lowerStr = periodStr.toLowerCase();
      for (let i = 0; i < months.length; i++) {
        if (lowerStr.includes(months[i])) {
          return new Date(year, i, 1).getTime();
        }
      }
      return new Date(year, 0, 1).getTime();
    }
    return 0;
  };

  const getFilteredSavings = () => {
    return savings
      .filter((item) => {
        if (selectedFilter === "all") return true;
        if (selectedFilter === "you") return item.contributorRole === user?.role;
        if (selectedFilter === "partner") return item.contributorRole !== user?.role;
        return true;
      })
      .sort((a, b) => {
        const posA = a.position ?? 0;
        const posB = b.position ?? 0;
        if (posA !== posB) return posA - posB;
        const dateA = parsePeriodToDate(a.month) || new Date(a.createdAt).getTime();
        const dateB = parsePeriodToDate(b.month) || new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
  };

  const filtered = getFilteredSavings();

  // Sync positions when filter changes or data refreshes
  useEffect(() => {
    const newPositions: Record<string, number> = {};
    filtered.forEach((item, index) => {
      newPositions[item.id] = index;
    });
    positions.value = newPositions;
  }, [savings, selectedFilter]);

  const fetchSavingsData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Not authenticated.");
        return;
      }
      const { data, error: fetchErr } = await getSavings(token, null);
      if (fetchErr || !data) {
        setError(fetchErr ?? "Failed to retrieve savings records.");
      } else {
        setSavings(data);
      }
    } catch (err: any) {
      setError(err.message ?? "An error occurred while fetching savings.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSavingsData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavingsData(false);
  };

  const handleDeleteSaving = async (savingId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const { error: err } = await deleteSaving(savingId, token);
      if (err) {
        alert(err);
      } else {
        setSavings((prev) => prev.filter((s) => s.id !== savingId));
      }
    } catch (err: any) {
      alert(err.message ?? "Error deleting saving.");
    }
  };

  const handleOrderChange = async (orderedIds: string[]) => {
    // Map order back to global state optimistically
    const updatedSavings = savings.map((s) => {
      const matchIdx = orderedIds.indexOf(s.id);
      if (matchIdx !== -1) {
        return { ...s, position: matchIdx };
      }
      return s;
    });
    setSavings(updatedSavings);

    try {
      const token = await getToken();
      if (!token) return;

      const { error: err } = await reorderSavings(orderedIds, token);
      if (err) {
        alert(err);
        fetchSavingsData(false);
      }
    } catch (error: any) {
      alert(error.message ?? "Error reordering savings.");
      fetchSavingsData(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const renderRightActions = (savingId: string) => {
    return (
      <Pressable
        onPress={() => handleDeleteSaving(savingId)}
        style={styles.swipeDeleteButton}
      >
        <IconSymbol name="trash.fill" size={18} color="#ffffff" />
      </Pressable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#F8FAFC" }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[accentColor]}
              tintColor={accentColor}
            />
          }
        >
          <View style={styles.contentSection}>
            {/* Separate filter buttons */}
            <View style={styles.filterContainer}>
              <Pressable
                onPress={() => setSelectedFilter("all")}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor:
                      selectedFilter === "all"
                        ? accentColor
                        : isDarkMode
                          ? "#2A2A2A"
                          : "#F1F5F9",
                    borderColor:
                      selectedFilter === "all"
                        ? accentColor
                        : isDarkMode
                          ? "#3A3A3A"
                          : "#CBD5E1",
                  },
                  selectedFilter === "all" && styles.activeFilterTab,
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterTabText,
                    selectedFilter === "all" && styles.activeFilterTabText,
                    {
                      color:
                        selectedFilter === "all"
                          ? "#ffffff"
                          : isDarkMode
                            ? "#A0AEC0"
                            : "#475569",
                    },
                  ]}
                >
                  All
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setSelectedFilter("you")}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor:
                      selectedFilter === "you"
                        ? accentColor
                        : isDarkMode
                          ? "#2A2A2A"
                          : "#F1F5F9",
                    borderColor:
                      selectedFilter === "you"
                        ? accentColor
                        : isDarkMode
                          ? "#3A3A3A"
                          : "#CBD5E1",
                  },
                  selectedFilter === "you" && styles.activeFilterTab,
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterTabText,
                    selectedFilter === "you" && styles.activeFilterTabText,
                    {
                      color:
                        selectedFilter === "you"
                          ? "#ffffff"
                          : isDarkMode
                            ? "#A0AEC0"
                            : "#475569",
                    },
                  ]}
                >
                  You
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setSelectedFilter("partner")}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor:
                      selectedFilter === "partner"
                        ? accentColor
                        : isDarkMode
                          ? "#2A2A2A"
                          : "#F1F5F9",
                    borderColor:
                      selectedFilter === "partner"
                        ? accentColor
                        : isDarkMode
                          ? "#3A3A3A"
                          : "#CBD5E1",
                  },
                  selectedFilter === "partner" && styles.activeFilterTab,
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterTabText,
                    selectedFilter === "partner" && styles.activeFilterTabText,
                    {
                      color:
                        selectedFilter === "partner"
                          ? "#ffffff"
                          : isDarkMode
                            ? "#A0AEC0"
                            : "#475569",
                    },
                  ]}
                >
                  Partner
                </ThemedText>
              </Pressable>
            </View>

            {isLoading && !refreshing ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={accentColor} />
                <ThemedText style={styles.loadingText}>
                  Loading savings record...
                </ThemedText>
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <IconSymbol
                  name="exclamationmark.triangle.fill"
                  size={32}
                  color="#EF4444"
                />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <Pressable
                  onPress={() => fetchSavingsData()}
                  style={[styles.retryBtn, { backgroundColor: accentColor }]}
                >
                  <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.listHeaderRow}>
                  <ThemedText style={styles.sectionTitle}>SAVINGS RECORD HISTORY</ThemedText>
                </View>

                {filtered.length === 0 ? (
                  <View
                    style={[
                      styles.listCardEmpty,
                      {
                        backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff",
                        borderColor: isDarkMode ? "#2D3748" : "#E2E8F0",
                      },
                    ]}
                  >
                    <ThemedText style={styles.emptyText}>
                      {selectedFilter === "all"
                        ? "No cash in logs yet."
                        : selectedFilter === "you"
                          ? "You haven't logged any savings yet."
                          : "Your partner hasn't logged any savings yet."}
                    </ThemedText>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.listCard,
                      {
                        backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff",
                        borderColor: isDarkMode ? "#2D3748" : "#E2E8F0",
                        height: filtered.length * ROW_HEIGHT,
                        position: "relative",
                      },
                    ]}
                  >
                    {filtered.map((item, index) => (
                      <DraggableRow
                        key={item.id}
                        item={item}
                        index={index}
                        filtered={filtered}
                        positions={positions}
                        isDarkMode={isDarkMode}
                        accentColor={accentColor}
                        userRole={user?.role}
                        formatCurrency={formatCurrency}
                        handleDeleteSaving={handleDeleteSaving}
                        onOrderChange={handleOrderChange}
                        renderRightActions={renderRightActions}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  contentSection: {
    width: "100%",
  },
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  listCardEmpty: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  emptyText: {
    paddingVertical: 24,
    textAlign: "center",
    opacity: 0.5,
    fontSize: 14,
  },
  savingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dragHandle: {
    justifyContent: "center",
    alignItems: "center",
    width: 20,
    height: 20,
  },
  rowMonth: {
    fontSize: 14,
    fontWeight: "600",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  lockIconWrapper: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.6,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  swipeDeleteButton: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    borderRadius: 10,
    height: 34,
    alignSelf: "center",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    width: "100%",
  },
  filterTab: {
    flex: 1,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
  },
  activeFilterTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  activeFilterTabText: {
    fontWeight: "bold",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.5,
    letterSpacing: 1,
  },
  instructionText: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.4,
  },
});
