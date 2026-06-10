import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Switch, Platform, TextInput } from 'react-native';
import { useColorScheme, useTheme } from '@/hooks/use-color-scheme';
import { useWeddingDetails } from '@/hooks/use-wedding-details';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';

// ISO string to YYYY-MM-DD
const toLocalDateString = (isoString: string) => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return isoString;
  }
};

// YYYY-MM-DD to ISO string
const toISOString = (dateStr: string) => {
  try {
    if (dateStr.includes('T')) return dateStr;
    const cleanDate = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return `${cleanDate}T12:00:00.000Z`; // UTC Noon
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { themePreference, setThemePreference } = useTheme();
  
  const {
    coupleNames,
    updateCoupleNames,
    marriage,
    updateMarriage,
    engagement,
    updateEngagement,
  } = useWeddingDetails();

  const isDarkMode = colorScheme === 'dark';
  const [editTab, setEditTab] = useState<'marriage' | 'engagement'>('marriage');

  const handleToggleTheme = (value: boolean) => {
    setThemePreference(value ? 'dark' : 'light');
  };

  const activeEventData = editTab === 'marriage' ? marriage : engagement;
  const updateActiveEvent = editTab === 'marriage' ? updateMarriage : updateEngagement;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Profile Premium Header Banner */}
        <LinearGradient
          colors={isDarkMode ? ['#4C1D95', '#1E1B4B'] : ['#7C3AED', '#C084FC']}
          style={styles.profileBanner}
        >
          <View style={styles.bannerOverlay} />
          
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={isDarkMode ? ['#A78BFA', '#7C3AED'] : ['#F3E8FF', '#E9D5FF']}
              style={styles.avatarWrapper}
            >
              <ThemedText style={[styles.avatarText, { color: isDarkMode ? '#1E1B4B' : '#7C3AED' }]}>
                AH
              </ThemedText>
            </LinearGradient>
            
            <View style={styles.headerInfo}>
              <ThemedText style={styles.profileName}>Amar Haikal</ThemedText>
              <ThemedText style={styles.profileRole}>Groom-to-be</ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* Wedding / Event Customizer Card */}
        <View style={styles.cardContainer}>
          <View style={[styles.infoCard, { 
            backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
            borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          }]}>
            <View style={styles.cardHeader}>
              <IconSymbol name="pencil.and.outline" size={20} color={theme.tint} />
              <ThemedText style={[styles.cardTitle, { color: theme.tint }]}>CUSTOMIZE EVENTS</ThemedText>
            </View>
            
            {/* Couple Names Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Couple Names</ThemedText>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: isDarkMode ? '#2D3748' : '#F1F5F9',
                  color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                  borderColor: isDarkMode ? '#4A5568' : '#CBD5E1',
                }]}
                value={coupleNames}
                onChangeText={updateCoupleNames}
                placeholder="e.g. Amar & Syamimie"
                placeholderTextColor={isDarkMode ? '#A0AEC0' : '#94A3B8'}
              />
            </View>

            <View style={styles.divider} />

            {/* Edit Tab Switcher */}
            <View style={styles.editSwitcherContainer}>
              <Pressable
                onPress={() => setEditTab('marriage')}
                style={[
                  styles.editTabButton,
                  editTab === 'marriage' && {
                    backgroundColor: isDarkMode ? 'rgba(167, 139, 250, 0.2)' : '#ECE9FC',
                    borderColor: theme.tint,
                  }
                ]}
              >
                <ThemedText style={[
                  styles.editTabButtonText,
                  { color: editTab === 'marriage' ? theme.tint : (isDarkMode ? '#A0AEC0' : '#64748B') },
                  editTab === 'marriage' && { fontWeight: '700' }
                ]}>
                  Nikah
                </ThemedText>
              </Pressable>
              
              <Pressable
                onPress={() => setEditTab('engagement')}
                style={[
                  styles.editTabButton,
                  editTab === 'engagement' && {
                    backgroundColor: isDarkMode ? 'rgba(167, 139, 250, 0.2)' : '#ECE9FC',
                    borderColor: theme.tint,
                  }
                ]}
              >
                <ThemedText style={[
                  styles.editTabButtonText,
                  { color: editTab === 'engagement' ? theme.tint : (isDarkMode ? '#A0AEC0' : '#64748B') },
                  editTab === 'engagement' && { fontWeight: '700' }
                ]}>
                  Tunang
                </ThemedText>
              </Pressable>
            </View>

            {/* Date Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Date (YYYY-MM-DD)</ThemedText>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: isDarkMode ? '#2D3748' : '#F1F5F9',
                  color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                  borderColor: isDarkMode ? '#4A5568' : '#CBD5E1',
                }]}
                value={toLocalDateString(activeEventData.date)}
                onChangeText={(text) => updateActiveEvent({ date: toISOString(text) })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDarkMode ? '#A0AEC0' : '#94A3B8'}
              />
            </View>

            {/* Time Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Time</ThemedText>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: isDarkMode ? '#2D3748' : '#F1F5F9',
                  color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                  borderColor: isDarkMode ? '#4A5568' : '#CBD5E1',
                }]}
                value={activeEventData.time}
                onChangeText={(text) => updateActiveEvent({ time: text })}
                placeholder="e.g. 11:00 AM"
                placeholderTextColor={isDarkMode ? '#A0AEC0' : '#94A3B8'}
              />
            </View>

            {/* Venue Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Venue Place</ThemedText>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: isDarkMode ? '#2D3748' : '#F1F5F9',
                  color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                  borderColor: isDarkMode ? '#4A5568' : '#CBD5E1',
                }]}
                value={activeEventData.venue}
                onChangeText={(text) => updateActiveEvent({ venue: text })}
                placeholder="e.g. Venue / Place"
                placeholderTextColor={isDarkMode ? '#A0AEC0' : '#94A3B8'}
              />
            </View>

          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <ThemedText style={styles.sectionHeader}>SETTINGS</ThemedText>
          
          <View style={[styles.settingsList, {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
            borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          }]}>
            
            {/* Dark Mode Switch Row */}
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(167, 139, 250, 0.15)' : 'rgba(124, 58, 237, 0.1)' }]}>
                  <IconSymbol name={isDarkMode ? 'moon.fill' : 'sun.max.fill'} size={20} color={theme.tint} />
                </View>
                <View style={styles.settingTextContainer}>
                  <ThemedText style={styles.settingTitle}>Dark Mode</ThemedText>
                  <ThemedText style={styles.settingSubtitle}>Switch between dark and light themes</ThemedText>
                </View>
              </View>
              
              <Switch
                value={isDarkMode}
                onValueChange={handleToggleTheme}
                trackColor={{ false: '#767577', true: isDarkMode ? '#A78BFA' : '#7C3AED' }}
                thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>

            <View style={styles.rowDivider} />

            {/* Notification Row (aesthetic) */}
            <Pressable style={({ pressed }) => [styles.pressableSettingItem, { opacity: pressed ? 0.7 : 1 }]}>
              <View style={styles.settingItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                  <IconSymbol name="bell.fill" size={20} color={theme.icon} />
                </View>
                <View style={styles.settingTextContainer}>
                  <ThemedText style={styles.settingTitle}>Notifications</ThemedText>
                  <ThemedText style={styles.settingSubtitle}>Configure push alert preferences</ThemedText>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={theme.icon} />
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Edit Profile Row (aesthetic) */}
            <Pressable style={({ pressed }) => [styles.pressableSettingItem, { opacity: pressed ? 0.7 : 1 }]}>
              <View style={styles.settingItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                  <IconSymbol name="person.fill" size={20} color={theme.icon} />
                </View>
                <View style={styles.settingTextContainer}>
                  <ThemedText style={styles.settingTitle}>Account Settings</ThemedText>
                  <ThemedText style={styles.settingSubtitle}>Change your user details and profile info</ThemedText>
                </View>
              </View>
            </Pressable>

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
    paddingBottom: 120,
  },
  profileBanner: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginTop: -20,
    zIndex: 10,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginVertical: 4,
  },
  settingsSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    opacity: 0.5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  settingsList: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pressableSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  inputContainer: {
    marginBottom: 14,
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    opacity: 0.65,
  },
  textInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  editSwitcherContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
    width: '100%',
  },
  editTabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  editTabButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  imageSelectorContainer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  imageOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  imageOptionText: {
    fontSize: 13,
  },
});
