import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, Platform, Dimensions, Pressable } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeddingDetails, SavingEntry } from '@/hooks/use-wedding-details';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SavingsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = Colors[colorScheme];
  const accentColor = '#10B981'; // Emerald Green for savings
  const purpleAccent = isDarkMode ? '#A78BFA' : '#7C3AED';

  const { 
    budget, 
    coupleNames,
    savings,
    addSaving,
    deleteSaving
  } = useWeddingDetails();

  // Input states for savings form
  const [newSavingMonth, setNewSavingMonth] = useState('');
  const [newSavingAmount, setNewSavingAmount] = useState('');

  // Calculations
  const totalSpent = 
    budget.place.spent + 
    budget.catering.spent + 
    budget.clothes.spent + 
    budget.ring.spent + 
    budget.others.spent;

  const totalSavings = savings.reduce((acc, curr) => acc + curr.amount, 0);
  const groomSavings = savings.filter(s => s.by === 'him').reduce((acc, curr) => acc + curr.amount, 0);
  const brideSavings = savings.filter(s => s.by === 'her').reduce((acc, curr) => acc + curr.amount, 0);
  const remainingTarget = Math.max(0, budget.total - totalSavings);
  
  const savingsVsSpentPercent = totalSpent > 0 ? (totalSavings / totalSpent) * 100 : 0;
  const savingsVsBudgetPercent = budget.total > 0 ? (totalSavings / budget.total) * 100 : 0;

  const handleAddSaving = () => {
    if (!newSavingMonth.trim() || !newSavingAmount.trim()) return;
    const amountVal = parseInt(newSavingAmount.replace(/[^0-9]/g, '')) || 0;
    if (amountVal <= 0) return;
    addSaving(newSavingMonth.trim(), amountVal);
    setNewSavingMonth('');
    setNewSavingAmount('');
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString()}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Banner header */}
        <LinearGradient
          colors={isDarkMode ? ['#064E3B', '#121212'] : ['#10B981', '#E6F4EA']}
          style={styles.headerBanner}
        >
          <View style={styles.bannerOverlay} />
          <View style={styles.headerContent}>
            <ThemedText style={styles.screenTitle}>Monthly Savings</ThemedText>
            <ThemedText style={styles.screenSub}>{coupleNames}'s Cash In Logs</ThemedText>
          </View>
        </LinearGradient>

        {/* Core summary dashboard */}
        <View style={styles.dashboardContainer}>
          <View style={[styles.dashboardCard, {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
            borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          }]}>
            
            {/* Total Savings Field */}
            <View style={styles.totalSavingsRow}>
              <View>
                <ThemedText style={styles.summaryLabel}>TOTAL ACCUMULATED SAVINGS</ThemedText>
                <ThemedText style={[styles.savingsText, { color: accentColor }]}>
                  {formatCurrency(totalSavings)}
                </ThemedText>
              </View>
              <View style={styles.remainingTargetBox}>
                <ThemedText style={styles.remainingLabel}>GOAL REMAINING</ThemedText>
                <ThemedText style={[styles.remainingVal, { color: isDarkMode ? '#E2E8F0' : '#1E1B4B' }]}>
                  {formatCurrency(remainingTarget)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Split Savings Row */}
            <View style={styles.splitSavingsContainer}>
              <View style={styles.splitBox}>
                <ThemedText style={styles.splitLabel}>YOUR SAVINGS (GROOM)</ThemedText>
                <ThemedText style={[styles.splitVal, { color: purpleAccent }]}>
                  {formatCurrency(groomSavings)}
                </ThemedText>
              </View>
              <View style={styles.summaryBoxDivider} />
              <View style={styles.splitBox}>
                <ThemedText style={styles.splitLabel}>PARTNER'S SAVINGS (BRIDE)</ThemedText>
                <ThemedText style={[styles.splitVal, { color: '#EC4899' }]}>
                  {formatCurrency(brideSavings)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

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
                RM {totalSavings.toLocaleString()} saved out of RM {totalSpent.toLocaleString()} spent so far.
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
                RM {totalSavings.toLocaleString()} saved out of RM {budget.total.toLocaleString()} budget target.
              </ThemedText>
            </View>

          </View>
        </View>

        {/* Add Cash In form */}
        <View style={styles.savingsFormSection}>
          <ThemedText style={styles.sectionTitle}>LOG YOUR CASH IN</ThemedText>
          
          <View style={[styles.formCard, {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
            borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          }]}>
            <View style={styles.formRow}>
              <View style={styles.monthBox}>
                <ThemedText style={styles.fieldLabel}>Month</ThemedText>
                <TextInput
                  style={[styles.savingTextInput, {
                    backgroundColor: isDarkMode ? '#2A2A2A' : '#F1F5F9',
                    color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                    borderColor: isDarkMode ? '#3A3A3A' : '#CBD5E1',
                  }]}
                  value={newSavingMonth}
                  onChangeText={setNewSavingMonth}
                  placeholder="e.g. July 2026"
                  placeholderTextColor={isDarkMode ? '#666666' : '#94A3B8'}
                />
              </View>
              <View style={styles.amountBox}>
                <ThemedText style={styles.fieldLabel}>Amount (RM)</ThemedText>
                <TextInput
                  style={[styles.savingTextInput, {
                    backgroundColor: isDarkMode ? '#2A2A2A' : '#F1F5F9',
                    color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                    borderColor: isDarkMode ? '#3A3A3A' : '#CBD5E1',
                  }]}
                  value={newSavingAmount}
                  onChangeText={setNewSavingAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={isDarkMode ? '#666666' : '#94A3B8'}
                />
              </View>
              <Pressable
                onPress={handleAddSaving}
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    backgroundColor: pressed ? 'rgba(16, 185, 129, 0.85)' : accentColor,
                  }
                ]}
              >
                <IconSymbol name="plus" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* History logs list */}
        <View style={styles.savingsListSection}>
          <ThemedText style={styles.sectionTitle}>SAVINGS RECORD HISTORY</ThemedText>
          
          <View style={[styles.listCard, {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
            borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          }]}>
            {savings.length === 0 ? (
              <ThemedText style={styles.emptyText}>No cash in logs yet.</ThemedText>
            ) : (
              savings.map((item, index) => {
                const isGroom = item.by === 'him';
                return (
                  <View key={item.id}>
                    <View style={styles.savingRow}>
                      <View style={styles.rowLeft}>
                        <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)' }]}>
                          <IconSymbol name="dollarsign.circle.fill" size={16} color={accentColor} />
                        </View>
                        <ThemedText style={styles.rowMonth}>{item.month}</ThemedText>
                        
                        {/* Partner Tag Badge */}
                        <View style={[
                          styles.badgeContainer,
                          { backgroundColor: isGroom ? (isDarkMode ? 'rgba(167, 139, 250, 0.15)' : '#ECE9FC') : (isDarkMode ? 'rgba(236, 72, 153, 0.15)' : '#FCE7F3') }
                        ]}>
                          <ThemedText style={[
                            styles.badgeText,
                            { color: isGroom ? purpleAccent : '#EC4899' }
                          ]}>
                            {isGroom ? 'You' : 'Partner'}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.rowRight}>
                        <ThemedText style={[styles.rowAmount, { color: isDarkMode ? '#FFFFFF' : '#1E1B4B' }]}>
                          {formatCurrency(item.amount)}
                        </ThemedText>
                        
                        {isGroom ? (
                          <Pressable
                            onPress={() => deleteSaving(item.id)}
                            style={({ pressed }) => [
                              styles.deleteButton,
                              {
                                backgroundColor: pressed ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                              }
                            ]}
                          >
                            <IconSymbol name="trash.fill" size={16} color="#EF4444" />
                          </Pressable>
                        ) : (
                          <View style={styles.lockIconWrapper}>
                            <IconSymbol name="lock.fill" size={14} color={isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'} />
                          </View>
                        )}
                      </View>
                    </View>
                    {index < savings.length - 1 && <View style={[styles.rowDivider, { backgroundColor: isDarkMode ? '#2D3748' : '#E2E8F0' }]} />}
                  </View>
                );
              })
            )}
          </View>
        </View>

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
  totalSavingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    opacity: 0.5,
  },
  savingsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  remainingTargetBox: {
    alignItems: 'flex-end',
  },
  remainingLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    opacity: 0.5,
  },
  remainingVal: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 4,
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
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  emptyText: {
    paddingVertical: 24,
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 14,
  },
  savingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowMonth: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowDivider: {
    height: 1,
  },
  splitSavingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  splitBox: {
    flex: 1,
  },
  splitLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    opacity: 0.5,
    marginBottom: 4,
  },
  splitVal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryBoxDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 16,
  },
  badgeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  lockIconWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
