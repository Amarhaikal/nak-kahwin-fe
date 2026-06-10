import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, Platform, Dimensions, Pressable, Modal, KeyboardAvoidingView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeddingDetails, BudgetItem, BudgetDetails } from '@/hooks/use-wedding-details';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface CategoryConfig {
  key: keyof Omit<BudgetDetails, 'total'>;
  title: string;
  icon: 'house.fill' | 'fork.knife' | 'hanger' | 'gift.fill' | 'list.bullet';
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'place', title: 'Venue & Place', icon: 'house.fill' },
  { key: 'catering', title: 'Catering Service', icon: 'fork.knife' },
  { key: 'clothes', title: 'Bridal & Attire', icon: 'hanger' },
  { key: 'ring', title: 'Wedding Rings & Gifts', icon: 'gift.fill' },
  { key: 'others', title: 'Others & Emergency', icon: 'list.bullet' },
];

export default function BudgetScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = Colors[colorScheme];
  const accentColor = isDarkMode ? '#A78BFA' : '#7C3AED';

  const { 
    budget, 
    updateBudgetCategory, 
    updateTotalBudgetLimit, 
    coupleNames,
    savings
  } = useWeddingDetails();

  // State for total budget edit mode
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [tempTotal, setTempTotal] = useState(String(budget.total));

  const handleStartEditTotal = () => {
    setTempTotal(String(budget.total));
    setIsEditingTotal(true);
  };

  const handleSaveTotal = () => {
    const numericVal = parseInt(tempTotal.replace(/[^0-9]/g, '')) || 0;
    updateTotalBudgetLimit(numericVal);
    setIsEditingTotal(false);
  };

  // Calculations
  const totalSpent = 
    budget.place.spent + 
    budget.catering.spent + 
    budget.clothes.spent + 
    budget.ring.spent + 
    budget.others.spent;

  const totalAllocated = 
    budget.place.allocated + 
    budget.catering.allocated + 
    budget.clothes.allocated + 
    budget.ring.allocated + 
    budget.others.allocated;

  const totalSavings = savings.reduce((acc, curr) => acc + curr.amount, 0);

  const remainingBudget = budget.total - totalSpent;
  const overallProgressPercent = budget.total > 0 ? (totalSpent / budget.total) * 100 : 0;
  const overallAllocatedPercent = budget.total > 0 ? (totalAllocated / budget.total) * 100 : 0;
  const savingProgressPercent = totalSpent > 0 ? (totalSavings / totalSpent) * 100 : 0;

  const handleUpdateCategory = (
    categoryKey: keyof Omit<BudgetDetails, 'total'>,
    field: 'allocated' | 'spent',
    text: string
  ) => {
    const numericVal = parseInt(text.replace(/[^0-9]/g, '')) || 0;
    updateBudgetCategory(categoryKey, { [field]: numericVal });
  };

  const handleUpdateTotal = (text: string) => {
    const numericVal = parseInt(text.replace(/[^0-9]/g, '')) || 0;
    updateTotalBudgetLimit(numericVal);
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString()}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Banner header */}
        <LinearGradient
          colors={isDarkMode ? ['#2E1065', '#121212'] : ['#7C3AED', '#ECE9FC']}
          style={styles.headerBanner}
        >
          <View style={styles.bannerOverlay} />
          <View style={styles.headerContent}>
            <ThemedText style={styles.screenTitle}>Wedding Budget</ThemedText>
            <ThemedText style={styles.screenSub}>{coupleNames}'s Finance Tracker</ThemedText>
          </View>
        </LinearGradient>

        {/* Total Budget Setting Card */}
        <View style={styles.dashboardContainer}>
          <View style={[styles.dashboardCard, {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
            borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          }]}>
            <View style={styles.titleArea}>
              <ThemedText style={styles.summaryLabel}>TOTAL BUDGET LIMIT</ThemedText>
              <View style={styles.limitDisplayRow}>
                <ThemedText style={[styles.limitValueText, { color: isDarkMode ? '#FFFFFF' : '#1E1B4B' }]}>
                  {formatCurrency(budget.total)}
                </ThemedText>
                <Pressable 
                  onPress={handleStartEditTotal} 
                  style={({ pressed }) => [
                    styles.editIconButton,
                    { opacity: pressed ? 0.6 : 1 }
                  ]}
                >
                  <IconSymbol name="pencil" size={18} color={accentColor} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Edit Budget Modal Popup */}
        <Modal
          visible={isEditingTotal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsEditingTotal(false)}
        >
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setIsEditingTotal(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <Pressable 
                style={[styles.modalCard, {
                  backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
                  borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
                }]}
                onPress={(e) => e.stopPropagation()}
              >
                <ThemedText style={styles.modalTitle}>Edit Total Budget</ThemedText>
                <ThemedText style={styles.modalSub}>Set the maximum budget target for your wedding.</ThemedText>
                
                <View style={[styles.modalInputWrapper, {
                  backgroundColor: isDarkMode ? '#2A2A2A' : '#F1F5F9',
                  borderColor: isDarkMode ? '#3A3A3A' : '#CBD5E1',
                }]}>
                  <ThemedText style={[styles.modalCurrency, { color: isDarkMode ? '#A0AEC0' : '#475569' }]}>RM</ThemedText>
                  <TextInput
                    style={[styles.modalTextInput, {
                      color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                    }]}
                    value={tempTotal === '' ? '' : (parseInt(tempTotal.replace(/[^0-9]/g, '')) || 0).toLocaleString()}
                    onChangeText={(text) => setTempTotal(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    autoFocus
                    placeholder="0"
                    placeholderTextColor={isDarkMode ? '#666666' : '#94A3B8'}
                  />
                </View>

                <View style={styles.modalButtonsRow}>
                  <Pressable
                    onPress={() => setIsEditingTotal(false)}
                    style={[styles.modalButton, styles.cancelButton, { borderColor: isDarkMode ? '#3A3A3A' : '#E2E8F0' }]}
                  >
                    <ThemedText style={[styles.buttonText, { color: isDarkMode ? '#A0AEC0' : '#475569' }]}>Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveTotal}
                    style={[styles.modalButton, styles.saveButton, { backgroundColor: accentColor }]}
                  >
                    <ThemedText style={[styles.buttonText, { color: '#FFFFFF', fontWeight: 'bold' }]}>Save</ThemedText>
                  </Pressable>
                </View>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>

        {/* Core summary dashboard */}
        <View style={[styles.dashboardContainer, { marginTop: 16 }]}>
          <View style={[styles.dashboardCard, {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
            borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          }]}>
            
            {/* Overall totals row - Styled as premium micro-cards */}
            <View style={styles.totalsSummaryGrid}>
              <View style={[styles.microCard, {
                backgroundColor: isDarkMode ? 'rgba(124, 58, 237, 0.08)' : '#F5F3FF',
                borderColor: isDarkMode ? 'rgba(124, 58, 237, 0.2)' : '#DDD6FE',
              }]}>
                <ThemedText style={[styles.microCardLabel, { color: isDarkMode ? '#A78BFA' : '#7C3AED' }]}>ALLOCATED</ThemedText>
                <ThemedText style={[styles.microCardVal, { color: totalAllocated > budget.total ? '#F59E0B' : (isDarkMode ? '#FFFFFF' : '#1E1B4B') }]}>
                  {formatCurrency(totalAllocated)}
                </ThemedText>
              </View>
              
              <View style={[styles.microCard, {
                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.08)' : '#EEF2FF',
                borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#C7D2FE',
              }]}>
                <ThemedText style={[styles.microCardLabel, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>SPENT</ThemedText>
                <ThemedText style={[styles.microCardVal, { color: isDarkMode ? '#FFFFFF' : '#1E1B4B' }]}>
                  {formatCurrency(totalSpent)}
                </ThemedText>
              </View>

              <View style={[styles.microCard, {
                backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5',
                borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
              }]}>
                <ThemedText style={[styles.microCardLabel, { color: '#10B981' }]}>SAVED (CASH)</ThemedText>
                <ThemedText style={[styles.microCardVal, { color: isDarkMode ? '#FFFFFF' : '#1E1B4B' }]}>
                  {formatCurrency(totalSavings)}
                </ThemedText>
              </View>
            </View>

            {/* Overall spent progress bar */}
            <View style={styles.overallProgressWrapper}>
              <View style={styles.progressBarLabelRow}>
                <ThemedText style={styles.progressBarTitle}>Budget Spent Ratio</ThemedText>
                <ThemedText style={[styles.progressBarPercent, { color: accentColor }]}>
                  {overallProgressPercent.toFixed(0)}%
                </ThemedText>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E2E8F0' }]}>
                <View style={[styles.progressBarFill, {
                  width: `${Math.min(overallProgressPercent, 100)}%`,
                  backgroundColor: overallProgressPercent > 100 ? '#EF4444' : accentColor,
                }]} />
              </View>
            </View>


          </View>
        </View>

        {/* Budget Categories section */}
        <View style={styles.categoriesSection}>
          <ThemedText style={styles.sectionTitle}>BUDGET ALLOCATIONS</ThemedText>
          
          {CATEGORIES.map(category => {
            const data = budget[category.key];
            const spentPercent = data.allocated > 0 ? (data.spent / data.allocated) * 100 : 0;
            const isOverspent = data.spent > data.allocated;

            return (
              <View key={category.key} style={[styles.categoryCard, {
                backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
                borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
              }]}>
                
                {/* Category Card Header */}
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryHeaderLeft}>
                    <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(167, 139, 250, 0.12)' : 'rgba(124, 58, 237, 0.08)' }]}>
                      <IconSymbol name={category.icon} size={20} color={accentColor} />
                    </View>
                    <ThemedText style={styles.categoryCardTitle}>{category.title}</ThemedText>
                  </View>
                  <ThemedText style={[styles.categoryPercentText, { color: isOverspent ? '#EF4444' : accentColor }]}>
                    {spentPercent.toFixed(0)}% spent
                  </ThemedText>
                </View>

                {/* Category Progress Bar */}
                <View style={[styles.categoryProgressBarBg, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E2E8F0' }]}>
                  <View style={[styles.categoryProgressBarFill, {
                    width: `${Math.min(spentPercent, 100)}%`,
                    backgroundColor: isOverspent ? '#EF4444' : accentColor,
                  }]} />
                </View>

                {/* Categories editable numeric inputs */}
                <View style={styles.inputsRow}>
                  
                  {/* Allocated Input */}
                  <View style={styles.inputFieldBox}>
                    <ThemedText style={styles.fieldLabel}>Allocated (RM)</ThemedText>
                    <TextInput
                      style={[styles.fieldTextInput, {
                        backgroundColor: isDarkMode ? '#2A2A2A' : '#F8FAFC',
                        color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                        borderColor: isDarkMode ? '#3A3A3A' : '#E2E8F0',
                      }]}
                      value={data.allocated === 0 ? '' : data.allocated.toLocaleString()}
                      onChangeText={(text) => handleUpdateCategory(category.key, 'allocated', text)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={isDarkMode ? '#555555' : '#94A3B8'}
                    />
                  </View>
                  
                  {/* Spent Input */}
                  <View style={styles.inputFieldBox}>
                    <ThemedText style={styles.fieldLabel}>Spent (RM)</ThemedText>
                    <TextInput
                      style={[styles.fieldTextInput, {
                        backgroundColor: isDarkMode ? '#2A2A2A' : '#F8FAFC',
                        color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                        borderColor: isDarkMode ? '#3A3A3A' : '#E2E8F0',
                      }]}
                      value={data.spent === 0 ? '' : data.spent.toLocaleString()}
                      onChangeText={(text) => handleUpdateCategory(category.key, 'spent', text)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={isDarkMode ? '#555555' : '#94A3B8'}
                    />
                  </View>

                </View>

              </View>
            );
          })}
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
    paddingBottom: 130, // sit cleanly above floating tab bar
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
  totalBudgetWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  limitDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  limitValueText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editIconButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    opacity: 0.5,
  },
  overallRemainingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputTotalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    width: 140,
    overflow: 'hidden',
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingLeft: 10,
    paddingRight: 4,
    opacity: 0.7,
  },
  totalTextInput: {
    flex: 1,
    height: '100%',
    paddingRight: 12,
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'right',
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 16,
  },
  titleArea: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  totalsSummaryGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  microCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  microCardLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  microCardVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  coverageBanner: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  overallProgressWrapper: {
    marginTop: 18,
    width: '100%',
  },
  progressBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressBarTitle: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
  },
  progressBarPercent: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoriesSection: {
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
  categoryCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryPercentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryProgressBarBg: {
    height: 5,
    borderRadius: 2.5,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 14,
  },
  categoryProgressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  inputFieldBox: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldTextInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  savingsComparisonText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    width: '100%',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  modalCurrency: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  modalTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  buttonText: {
    fontSize: 14,
  },
});
