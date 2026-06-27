import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { getToken, useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWeddingDetails } from "@/hooks/use-wedding-details";
import {
  addSaving,
  deleteSaving,
  getSavings,
  SavingEntry,
} from "@/services/savings-service";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
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

const { width } = Dimensions.get("window");

export default function SavingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDarkMode = colorScheme === "dark";
  const theme = Colors[colorScheme];
  const accentColor = theme.tint; // Purple accent
  const purpleAccent = accentColor;

  const { user } = useAuth();
  const { budget, title } = useWeddingDetails();

  // API states
  const [savings, setSavings] = useState<SavingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "you" | "partner"
  >("all");

  // No Form states

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

  // Calculations
  const totalSpent =
    budget.place.spent +
    budget.catering.spent +
    budget.clothes.spent +
    budget.ring.spent +
    budget.others.spent;

  const totalSavings = savings.reduce(
    (acc, curr) => acc + Number(curr.amount),
    0,
  );
  const groomSavings = savings
    .filter((s) => s.contributorRole === "groom")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  const brideSavings = savings
    .filter((s) => s.contributorRole === "bride")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  const remainingTarget = Math.max(0, budget.total - totalSavings);

  const savingsVsSpentPercent =
    totalSpent > 0 ? (totalSavings / totalSpent) * 100 : 0;
  const savingsVsBudgetPercent =
    budget.total > 0 ? (totalSavings / budget.total) * 100 : 0;

  // Deleted handleAddSaving

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
      <ThemedView style={styles.container}>
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
          {/* Banner header */}
          <LinearGradient
            colors={
              isDarkMode ? ["#2E1065", "#121212"] : [accentColor, "#ECE9FC"]
            }
            style={styles.headerBanner}
          >
            <View style={styles.bannerOverlay} />
            <View style={styles.headerContent}>
              <ThemedText style={styles.screenTitle}>
                Monthly Savings
              </ThemedText>
              {/* <ThemedText style={styles.screenSub}>{title}'s Cash In Logs</ThemedText> */}
            </View>
          </LinearGradient>

          {/* Core summary dashboard */}
          <View style={styles.dashboardContainer}>
            <LinearGradient
              colors={["#4C1D95", "#6D28D9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bankCard}
            >
              {/* Overlay reflection shine for debit card realism */}
              <View style={styles.cardShine} />

              {/* Bank Card Balance */}
              <View style={[styles.bankCardBalanceContainer, { marginTop: 0 }]}>
                <View style={styles.balanceCol}>
                  <ThemedText style={styles.bankCardBalanceLabel}>
                    TOTAL ACCUMULATED SAVINGS
                  </ThemedText>
                  <View style={styles.balanceRow}>
                    <ThemedText style={styles.bankCardBalanceText}>
                      {formatCurrency(totalSavings)}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Bank Card Footer details */}
              <View style={styles.bankCardFooter}>
                <View>
                  <ThemedText style={styles.bankCardFooterLabel}>
                    GOAL REMAINING
                  </ThemedText>
                  <ThemedText style={styles.bankCardFooterVal}>
                    {formatCurrency(remainingTarget)}
                  </ThemedText>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <ThemedText style={styles.bankCardFooterLabel}>
                    TARGET BUDGET
                  </ThemedText>
                  <ThemedText style={styles.bankCardFooterVal}>
                    {formatCurrency(budget.total)}
                  </ThemedText>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Cash In form removed */}

          {/* History logs list */}
          <View style={styles.savingsListSection}>
            <ThemedText style={styles.sectionTitle}>
              SAVINGS RECORD HISTORY
            </ThemedText>

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
                    const filtered = savings.filter((item) => {
                      if (selectedFilter === "all") return true;
                      if (selectedFilter === "you")
                        return item.contributorRole === user?.role;
                      if (selectedFilter === "partner")
                        return item.contributorRole !== user?.role;
                      return true;
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

                    const displayed = filtered.slice(0, 6);
                    return displayed.map((item, index) => {
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
                          {index < displayed.length - 1 && (
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
                {(() => {
                  const filtered = savings.filter((item) => {
                    if (selectedFilter === "all") return true;
                    if (selectedFilter === "you")
                      return item.contributorRole === user?.role;
                    if (selectedFilter === "partner")
                      return item.contributorRole !== user?.role;
                    return true;
                  });
                  if (filtered.length > 6) {
                    return (
                      <Pressable
                        onPress={() => router.push("/all-savings")}
                        style={styles.seeMoreBtn}
                      >
                        <ThemedText style={[styles.seeMoreText, { color: accentColor }]}>
                          See More ({filtered.length - 6} more)
                        </ThemedText>
                      </Pressable>
                    );
                  }
                  return null;
                })()}
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
    paddingBottom: 130, // sit cleanly above floating navigation tab bar
  },
  headerBanner: {
    paddingTop: Platform.OS === "ios" ? 65 : 45,
    paddingBottom: 35,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: "relative",
    overflow: "hidden",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  headerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  screenSub: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 4,
  },
  dashboardContainer: {
    paddingHorizontal: 24,
    marginTop: -20,
    zIndex: 10,
  },
  dashboardCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  bankCard: {
    borderRadius: 22,
    padding: 22,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  cardShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    transform: [{ skewY: "-15deg" }, { translateY: -30 }],
  },
  bankCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bankCardLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.65)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bankCardNumber: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 3,
    letterSpacing: 1,
  },
  bankCardBalanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
  },
  balanceCol: {
    flex: 1,
  },
  bankCardBalanceLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.55)",
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  bankCardBalanceText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
  },
  eyeBtn: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  bankCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 14,
  },
  bankCardFooterLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.5)",
    letterSpacing: 0.8,
  },
  bankCardFooterVal: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 16,
  },
  meterWrapper: {
    width: "100%",
  },
  meterLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  meterTitle: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.6,
  },
  meterPercent: {
    fontSize: 12,
    fontWeight: "bold",
  },
  meterBg: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    borderRadius: 4,
  },
  meterDesc: {
    fontSize: 11,
    opacity: 0.45,
    marginTop: 6,
    fontWeight: "500",
  },
  savingsFormSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
    opacity: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  formCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    width: "100%",
  },
  monthBox: {
    flex: 2,
  },
  amountBox: {
    flex: 1.5,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  savingTextInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: "500",
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  savingsListSection: {
    paddingHorizontal: 24,
    marginTop: 24,
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
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
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
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  rowDivider: {
    height: 1,
  },
  // Removed individual split savings styles
  badgeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
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
  seeMoreBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
