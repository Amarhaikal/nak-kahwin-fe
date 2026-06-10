import React from 'react';
import { StyleSheet, View, ScrollView, Pressable, Switch, Platform } from 'react-native';
import { useColorScheme, useTheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { themePreference, setThemePreference } = useTheme();

  const isDarkMode = colorScheme === 'dark';

  const handleToggleTheme = (value: boolean) => {
    setThemePreference(value ? 'dark' : 'light');
  };

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

        {/* Wedding Summary Card */}
        <View style={styles.cardContainer}>
          <View style={[styles.infoCard, { 
            backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
            borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
          }]}>
            <View style={styles.cardHeader}>
              <IconSymbol name="house.fill" size={20} color={theme.tint} />
              <ThemedText style={[styles.cardTitle, { color: theme.tint }]}>WEDDING DETAILS</ThemedText>
            </View>
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Partner</ThemedText>
              <ThemedText style={styles.detailValue}>Syamimie</ThemedText>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Date</ThemedText>
              <ThemedText style={styles.detailValue}>August 8, 2027</ThemedText>
            </View>

            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Venue</ThemedText>
              <ThemedText style={styles.detailValue}>De'Emerald Garden, Banting</ThemedText>
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
});
