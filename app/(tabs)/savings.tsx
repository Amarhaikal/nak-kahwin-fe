import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TextInput, Platform, Dimensions, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeddingDetails } from '@/hooks/use-wedding-details';
import { useAuth, getToken } from '@/hooks/use-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getSavings, 
  createSavingsGoal, 
  deleteSavingsGoal, 
  createContribution, 
  deleteContribution, 
  SavingsGoal 
} from '@/services/savings-service';

const { width } = Dimensions.get('window');

export default function SavingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDarkMode = colorScheme === 'dark';
  const theme = Colors[colorScheme];
  const accentColor = theme.tint; // Purple accent
  const purpleAccent = accentColor;

  const { user } = useAuth();
  const { budget, title } = useWeddingDetails();

  // API State
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [contributionInputs, setContributionInputs] = useState<{[goalId: string]: string}>({});
  const [expandedGoals, setExpandedGoals] = useState<{[goalId: string]: boolean}>({});

  const fetchSavingsData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Not authenticated.');
        return;
      }
      const { data, error: fetchErr } = await getSavings(token);
      if (fetchErr || !data) {
        setError(fetchErr ?? 'Failed to retrieve savings data.');
      } else {
        setGoals(data);
      }
    } catch (err: any) {
      setError(err.message ?? 'An error occurred while fetching savings.');
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

  const totalSavings = goals.reduce((acc, curr) => acc + Number(curr.currentAmount), 0);
  const groomSavings = goals.reduce((acc, goal) => {
    const goalGroom = goal.contributions
      .filter(c => c.contributorRole === 'groom')
      .reduce((s, c) => s + Number(c.amount), 0);
    return acc + goalGroom;
  }, 0);

  const brideSavings = goals.reduce((acc, goal) => {
    const goalBride = goal.contributions
      .filter(c => c.contributorRole === 'bride')
      .reduce((s, c) => s + Number(c.amount), 0);
    return acc + goalBride;
  }, 0);

  const remainingTarget = Math.max(0, budget.total - totalSavings);
  
  const savingsVsSpentPercent = totalSpent > 0 ? (totalSavings / totalSpent) * 100 : 0;
  const savingsVsBudgetPercent = budget.total > 0 ? (totalSavings / budget.total) * 100 : 0;

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim() || !newGoalTarget.trim()) return;
    const targetVal = parseFloat(newGoalTarget.replace(/[^0-9.]/g, '')) || 0;
    if (targetVal <= 0) return;

    try {
      const token = await getToken();
      if (!token) return;

      const { data, error: err } = await createSavingsGoal({
        title: newGoalTitle.trim(),
        targetAmount: targetVal
      }, token);

      if (err || !data) {
        alert(err ?? 'Failed to create savings goal.');
      } else {
        setGoals(prev => [...prev, data]);
        setNewGoalTitle('');
        setNewGoalTarget('');
        setShowGoalForm(false);
      }
    } catch (err: any) {
      alert(err.message ?? 'Error creating savings goal.');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const { error: err } = await deleteSavingsGoal(goalId, token);
      if (err) {
        alert(err);
      } else {
        setGoals(prev => prev.filter(g => g.id !== goalId));
      }
    } catch (err: any) {
      alert(err.message ?? 'Error deleting savings goal.');
    }
  };

  const handleAddContribution = async (goalId: string) => {
    const rawVal = contributionInputs[goalId] || '';
    if (!rawVal.trim()) return;
    const amountVal = parseFloat(rawVal.replace(/[^0-9.]/g, '')) || 0;
    if (amountVal <= 0) return;

    try {
      const token = await getToken();
      if (!token) return;

      const { data, error: err } = await createContribution(goalId, { amount: amountVal }, token);
      if (err || !data) {
        alert(err ?? 'Failed to add contribution deposit.');
      } else {
        // Update local goals state to reflect the changes
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            const updatedContributions = [data, ...(g.contributions || [])];
            return {
              ...g,
              currentAmount: Number(g.currentAmount) + amountVal,
              contributions: updatedContributions
            };
          }
          return g;
        }));
        setContributionInputs(prev => ({ ...prev, [goalId]: '' }));
      }
    } catch (err: any) {
      alert(err.message ?? 'Error adding contribution.');
    }
  };

  const handleDeleteContribution = async (goalId: string, contributionId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const { error: err } = await deleteContribution(contributionId, token);
      if (err) {
        alert(err);
      } else {
        // Update local goals state
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            const contrib = g.contributions.find(c => c.id === contributionId);
            const subAmount = contrib ? Number(contrib.amount) : 0;
            return {
              ...g,
              currentAmount: Math.max(0, Number(g.currentAmount) - subAmount),
              contributions: g.contributions.filter(c => c.id !== contributionId)
            };
          }
          return g;
        }));
      }
    } catch (err: any) {
      alert(err.message ?? 'Error removing contribution.');
    }
  };

  const toggleExpandGoal = (goalId: string) => {
    setExpandedGoals(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accentColor]} tintColor={accentColor} />
        }
      >
        
        {/* Banner header */}
        <LinearGradient
          colors={isDarkMode ? ['#2E1065', '#121212'] : [accentColor, '#ECE9FC']}
          style={styles.headerBanner}
        >
          <View style={styles.bannerOverlay} />
          <View style={styles.headerContent}>
            <ThemedText style={styles.screenTitle}>Monthly Savings</ThemedText>
            <ThemedText style={styles.screenSub}>{title}'s Cash In Logs</ThemedText>
          </View>
        </LinearGradient>

        {/* Core summary dashboard */}
        <View style={styles.dashboardContainer}>
          {/* Bank Account-style Card */}
          <LinearGradient
            colors={isDarkMode ? ['#1E1B4B', '#0F0E17'] : ['#4C1D95', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bankCard}
          >
            {/* Overlay reflection shine for debit card realism */}
            <View style={styles.cardShine} />

            {/* Bank Card Balance */}
            <View style={[styles.bankCardBalanceContainer, { marginTop: 0 }]}>
              <View style={styles.balanceCol}>
                <ThemedText style={styles.bankCardBalanceLabel}>AVAILABLE BALANCE</ThemedText>
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
                <ThemedText style={styles.bankCardFooterLabel}>GOAL REMAINING</ThemedText>
                <ThemedText style={styles.bankCardFooterVal}>
                  {formatCurrency(remainingTarget)}
                </ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText style={styles.bankCardFooterLabel}>TARGET BUDGET</ThemedText>
                <ThemedText style={styles.bankCardFooterVal}>{formatCurrency(budget.total)}</ThemedText>
              </View>
            </View>
          </LinearGradient>

          {/* Analytics progress card */}
          <View style={[styles.dashboardCard, {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
            borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
            marginTop: 16,
          }]}>
            {/* Spent Coverage Meter */}
            <View style={styles.meterWrapper}>
              <View style={styles.meterLabelRow}>
                <ThemedText style={styles.meterTitle}>Savings Coverage of Spent Expenses</ThemedText>
                <ThemedText style={[styles.meterPercent, { color: accentColor }]}>
                  {savingsVsSpentPercent.toFixed(0)}%
                </ThemedText>
              </View>
              <View style={[styles.meterBg, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E2E8F0' }]}>
                <View style={[styles.meterFill, {
                  width: `${Math.min(savingsVsSpentPercent, 100)}%`,
                  backgroundColor: accentColor,
                }]} />
              </View>
              <ThemedText style={styles.meterDesc}>
                RM {totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} saved out of RM {totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent so far.
              </ThemedText>
            </View>

            <View style={[styles.divider, { marginVertical: 12 }]} />

            {/* Target Budget Limit Progress */}
            <View style={styles.meterWrapper}>
              <View style={styles.meterLabelRow}>
                <ThemedText style={styles.meterTitle}>Progress to Target Budget</ThemedText>
                <ThemedText style={[styles.meterPercent, { color: purpleAccent }]}>
                  {savingsVsBudgetPercent.toFixed(0)}%
                </ThemedText>
              </View>
              <View style={[styles.meterBg, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E2E8F0' }]}>
                <View style={[styles.meterFill, {
                  width: `${Math.min(savingsVsBudgetPercent, 100)}%`,
                  backgroundColor: purpleAccent,
                }]} />
              </View>
              <ThemedText style={styles.meterDesc}>
                RM {totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} saved out of RM {budget.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} budget target.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Goal creation Form Toggle button and Form */}
        <View style={styles.savingsFormSection}>
          <Pressable 
            onPress={() => setShowGoalForm(!showGoalForm)}
            style={[styles.createGoalToggleBtn, {
              backgroundColor: isDarkMode ? '#2A2A2A' : '#ffffff',
              borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
            }]}
          >
            <ThemedText style={styles.createGoalToggleText}>
              {showGoalForm ? 'CLOSE NEW POOL FORM' : 'CREATE A SAVINGS POOL'}
            </ThemedText>
            <IconSymbol name={showGoalForm ? 'chevron.up' : 'plus.circle.fill'} size={18} color={accentColor} />
          </Pressable>

          {showGoalForm && (
            <View style={[styles.formCard, {
              backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
              borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
              marginTop: 10,
            }]}>
              <View style={styles.formRow}>
                <View style={styles.monthBox}>
                  <ThemedText style={styles.fieldLabel}>Pool Title</ThemedText>
                  <TextInput
                    style={[styles.savingTextInput, {
                      backgroundColor: isDarkMode ? '#2A2A2A' : '#F1F5F9',
                      color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                      borderColor: isDarkMode ? '#3A3A3A' : '#CBD5E1',
                    }]}
                    value={newGoalTitle}
                    onChangeText={setNewGoalTitle}
                    placeholder="e.g. Catering Savings"
                    placeholderTextColor={isDarkMode ? '#666666' : '#94A3B8'}
                  />
                </View>
                <View style={styles.amountBox}>
                  <ThemedText style={styles.fieldLabel}>Target (RM)</ThemedText>
                  <TextInput
                    style={[styles.savingTextInput, {
                      backgroundColor: isDarkMode ? '#2A2A2A' : '#F1F5F9',
                      color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                      borderColor: isDarkMode ? '#3A3A3A' : '#CBD5E1',
                    }]}
                    value={newGoalTarget}
                    onChangeText={setNewGoalTarget}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={isDarkMode ? '#666666' : '#94A3B8'}
                  />
                </View>
                <Pressable
                  onPress={handleCreateGoal}
                  style={({ pressed }) => [
                    styles.addButton,
                    {
                      backgroundColor: accentColor,
                      opacity: pressed ? 0.85 : 1,
                    }
                  ]}
                >
                  <IconSymbol name="plus" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Loading and Error States */}
        {isLoading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <ThemedText style={styles.loadingText}>Loading savings pools...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <IconSymbol name="exclamationmark.triangle.fill" size={32} color="#EF4444" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable onPress={() => fetchSavingsData()} style={[styles.retryBtn, { backgroundColor: accentColor }]}>
              <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
            </Pressable>
          </View>
        ) : (
          /* Savings Pools Cards */
          <View style={styles.savingsListSection}>
            <ThemedText style={styles.sectionTitle}>ACTIVE SAVINGS POOLS</ThemedText>
            
            {goals.length === 0 ? (
              <View style={[styles.emptyCard, {
                backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
                borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
              }]}>
                <IconSymbol name="archivebox.fill" size={24} color={isDarkMode ? '#444' : '#ccc'} />
                <ThemedText style={styles.emptyText}>No savings pools set up yet.</ThemedText>
              </View>
            ) : (
              goals.map((goal) => {
                const goalProgressPercent = goal.targetAmount > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0;
                const isExpanded = !!expandedGoals[goal.id];
                const contribAmount = contributionInputs[goal.id] || '';

                return (
                  <View key={goal.id} style={[styles.goalCard, {
                    backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
                    borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
                  }]}>
                    
                    {/* Goal Header: Title, Target, Action */}
                    <View style={styles.goalHeaderRow}>
                      <View style={styles.goalTitleContainer}>
                        <ThemedText style={styles.goalCardTitle}>{goal.title}</ThemedText>
                        <ThemedText style={styles.goalCardTarget}>
                          Target: {formatCurrency(Number(goal.targetAmount))}
                        </ThemedText>
                      </View>
                      
                      <View style={styles.goalActions}>
                        <Pressable 
                          onPress={() => handleDeleteGoal(goal.id)}
                          style={({ pressed }) => [
                            styles.deleteGoalBtn,
                            { backgroundColor: pressed ? 'rgba(239, 68, 68, 0.15)' : 'transparent' }
                          ]}
                        >
                          <IconSymbol name="trash" size={16} color="#EF4444" />
                        </Pressable>

                        <Pressable 
                          onPress={() => toggleExpandGoal(goal.id)}
                          style={[styles.expandBtn, { backgroundColor: isDarkMode ? '#2D3748' : '#F1F5F9' }]}
                        >
                          <IconSymbol name={isExpanded ? 'chevron.up' : 'chevron.down'} size={14} color={isDarkMode ? '#A0AEC0' : '#4A5568'} />
                        </Pressable>
                      </View>
                    </View>

                    {/* Progress Bar for Goal */}
                    <View style={styles.goalProgressContainer}>
                      <View style={styles.goalProgressLabelRow}>
                        <ThemedText style={styles.goalProgressLabel}>
                          Saved: <ThemedText style={{ fontWeight: 'bold', color: accentColor }}>{formatCurrency(Number(goal.currentAmount))}</ThemedText>
                        </ThemedText>
                        <ThemedText style={[styles.goalProgressPercentText, { color: accentColor }]}>
                          {goalProgressPercent.toFixed(0)}%
                        </ThemedText>
                      </View>
                      <View style={[styles.goalProgressBarBg, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E2E8F0' }]}>
                        <View style={[styles.goalProgressBarFill, {
                          width: `${Math.min(goalProgressPercent, 100)}%`,
                          backgroundColor: accentColor,
                        }]} />
                      </View>
                    </View>

                    {/* Add Contribution Input for this Goal */}
                    <View style={styles.contributionAddRow}>
                      <TextInput
                        style={[styles.contribTextInput, {
                          backgroundColor: isDarkMode ? '#2A2A2A' : '#F1F5F9',
                          color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                          borderColor: isDarkMode ? '#3A3A3A' : '#CBD5E1',
                        }]}
                        value={contribAmount}
                        onChangeText={(val) => setContributionInputs(prev => ({ ...prev, [goal.id]: val }))}
                        keyboardType="numeric"
                        placeholder="Add deposit (RM)..."
                        placeholderTextColor={isDarkMode ? '#666666' : '#94A3B8'}
                      />
                      <Pressable 
                        onPress={() => handleAddContribution(goal.id)}
                        style={({ pressed }) => [
                          styles.contribSubmitBtn,
                          {
                            backgroundColor: accentColor,
                            opacity: pressed ? 0.85 : 1
                          }
                        ]}
                      >
                        <ThemedText style={styles.contribSubmitBtnText}>Deposit</ThemedText>
                      </Pressable>
                    </View>

                    {/* Expandable Contributions List */}
                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        <View style={[styles.expandedDivider, { backgroundColor: isDarkMode ? '#2D3748' : '#E2E8F0' }]} />
                        <ThemedText style={styles.depositsListTitle}>DEPOSITS HISTORY</ThemedText>
                        
                        {(!goal.contributions || goal.contributions.length === 0) ? (
                          <ThemedText style={styles.emptyDepositsText}>No deposits logged yet.</ThemedText>
                        ) : (
                          goal.contributions.map((contribution, idx) => {
                            const isMyContrib = contribution.contributorRole === user?.role;
                            return (
                              <View key={contribution.id}>
                                <View style={styles.savingRow}>
                                  <View style={styles.rowLeft}>
                                    <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? accentColor + '20' : accentColor + '10' }]}>
                                      <IconSymbol name="dollarsign.circle.fill" size={14} color={accentColor} />
                                    </View>
                                    <View style={styles.contribMetaContainer}>
                                      <ThemedText style={styles.rowDate}>{formatDate(contribution.contributedAt)}</ThemedText>
                                      <ThemedText style={styles.contribNameText}>By: {contribution.contributorName}</ThemedText>
                                    </View>
                                    
                                    {/* Contributor role tag */}
                                    <View style={[
                                      styles.badgeContainer,
                                      { backgroundColor: isMyContrib ? (isDarkMode ? 'rgba(167, 139, 250, 0.15)' : '#ECE9FC') : (isDarkMode ? 'rgba(236, 72, 153, 0.15)' : '#FCE7F3') }
                                    ]}>
                                      <ThemedText style={[
                                        styles.badgeText,
                                        { color: isMyContrib ? purpleAccent : '#EC4899' }
                                      ]}>
                                        {isMyContrib ? 'You' : 'Partner'}
                                      </ThemedText>
                                    </View>
                                  </View>
                                  
                                  <View style={styles.rowRight}>
                                    <ThemedText style={[styles.rowAmount, { color: isDarkMode ? '#FFFFFF' : '#1E1B4B' }]}>
                                      {formatCurrency(Number(contribution.amount))}
                                    </ThemedText>
                                    
                                    {isMyContrib ? (
                                      <Pressable
                                        onPress={() => handleDeleteContribution(goal.id, contribution.id)}
                                        style={({ pressed }) => [
                                          styles.deleteButton,
                                          { backgroundColor: pressed ? 'rgba(239, 68, 68, 0.15)' : 'transparent' }
                                        ]}
                                      >
                                        <IconSymbol name="trash.fill" size={14} color="#EF4444" />
                                      </Pressable>
                                    ) : (
                                      <View style={styles.lockIconWrapper}>
                                        <IconSymbol name="lock.fill" size={12} color={isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'} />
                                      </View>
                                    )}
                                  </View>
                                </View>
                                {idx < goal.contributions.length - 1 && (
                                  <View style={[styles.rowDivider, { backgroundColor: isDarkMode ? '#2D3748' : '#E2E8F0' }]} />
                                )}
                              </View>
                            );
                          })
                        )}
                      </View>
                    )}

                  </View>
                );
              })
            )}
          </View>
        )}

      </ScrollView>
    </ThemedView>
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
    paddingTop: Platform.OS === 'ios' ? 65 : 45,
    paddingBottom: 35,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  screenSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  bankCard: {
    borderRadius: 22,
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ skewY: '-15deg' }, { translateY: -30 }],
  },
  bankCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bankCardLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bankCardNumber: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
    letterSpacing: 1,
  },
  bankCardBalanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
  },
  balanceCol: {
    flex: 1,
  },
  bankCardBalanceLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  bankCardBalanceText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  eyeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 14,
  },
  bankCardFooterLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.8,
  },
  bankCardFooterVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 16,
  },
  meterWrapper: {
    width: '100%',
  },
  meterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  meterTitle: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
  },
  meterPercent: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  meterBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  meterDesc: {
    fontSize: 11,
    opacity: 0.45,
    marginTop: 6,
    fontWeight: '500',
  },
  savingsFormSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  createGoalToggleBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  createGoalToggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    opacity: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  formCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    width: '100%',
  },
  monthBox: {
    flex: 2,
  },
  amountBox: {
    flex: 1.5,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  savingTextInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsListSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 35,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    opacity: 0.5,
    fontSize: 14,
  },
  goalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goalTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  goalCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalCardTarget: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
    fontWeight: '500',
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteGoalBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalProgressContainer: {
    marginTop: 14,
  },
  goalProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalProgressLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  goalProgressPercentText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalProgressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  goalProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  contributionAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  contribTextInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '500',
  },
  contribSubmitBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contribSubmitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandedSection: {
    marginTop: 12,
  },
  expandedDivider: {
    height: 1,
    marginVertical: 12,
  },
  depositsListTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    opacity: 0.4,
    marginBottom: 8,
  },
  emptyDepositsText: {
    fontSize: 12,
    opacity: 0.4,
    textAlign: 'center',
    paddingVertical: 10,
  },
  savingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contribMetaContainer: {
    flexDirection: 'column',
  },
  rowDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  contribNameText: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowAmount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowDivider: {
    height: 1,
  },
  badgeContainer: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  lockIconWrapper: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.6,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
