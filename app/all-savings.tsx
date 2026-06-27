import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { getToken, useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { deleteSaving, getSavings, SavingEntry } from "@/services/savings-service";
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
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

export default function AllSavingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDarkMode = colorScheme === "dark";
  const theme = Colors[colorScheme];
  const accentColor = theme.tint; // Purple accent
  const purpleAccent = accentColor;

  const { user } = useAuth();
  
  const [savings, setSavings] = useState<SavingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "you" | "partner">("all");

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
              <View
                style={[
                  styles.listCard,
                  {
                    backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff",
                    borderColor: isDarkMode ? "#2D3748" : "#E2E8F0",
                  },
                ]}
              >
                {(() => {
                  const filtered = savings
                    .filter((item) => {
                      if (selectedFilter === "all") return true;
                      if (selectedFilter === "you")
                        return item.contributorRole === user?.role;
                      if (selectedFilter === "partner")
                        return item.contributorRole !== user?.role;
                      return true;
                    })
                    .sort((a, b) => {
                      const dateA = parsePeriodToDate(a.month) || new Date(a.createdAt).getTime();
                      const dateB = parsePeriodToDate(b.month) || new Date(b.createdAt).getTime();
                      return dateB - dateA;
                    });

                  if (filtered.length === 0) {
                    return (
                      <ThemedText style={styles.emptyText}>
                        {selectedFilter === "all"
                          ? "No cash in logs yet."
                          : selectedFilter === "you"
                            ? "You haven't logged any savings yet."
                            : "Your partner hasn't logged any savings yet."}
                      </ThemedText>
                    );
                  }

                  return filtered.map((item, index) => {
                    const isMyContribution =
                      item.contributorRole === user?.role;

                    const rowContent = (
                      <View
                        style={[
                          styles.savingRow,
                          {
                            backgroundColor: isDarkMode ? "#1E1E1E" : "#ffffff",
                          },
                        ]}
                      >
                        <View style={styles.rowLeft}>
                          <ThemedText style={styles.rowMonth}>
                            {item.month}
                          </ThemedText>
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
                      <View key={item.id}>
                        {isMyContribution ? (
                          <Swipeable
                            renderRightActions={() =>
                              renderRightActions(item.id)
                            }
                            friction={1.8}
                            rightThreshold={40}
                          >
                            {rowContent}
                          </Swipeable>
                        ) : (
                          rowContent
                        )}
                        {index < filtered.length - 1 && (
                          <View
                            style={[
                              styles.rowDivider,
                              {
                                backgroundColor: isDarkMode
                                  ? "#2D3748"
                                  : "#E2E8F0",
                              },
                            ]}
                          />
                        )}
                      </View>
                    );
                  });
                })()}
              </View>
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
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  rowDivider: {
    height: 1,
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
});
