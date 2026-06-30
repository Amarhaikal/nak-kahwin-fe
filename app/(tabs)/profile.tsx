import React from 'react';
import { StyleSheet, View, ScrollView, Pressable, Switch, Platform, Alert, Modal, TextInput, ActivityIndicator, Text } from 'react-native';
import { useColorScheme, useTheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { useWeddingDetails } from '@/hooks/use-wedding-details';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { themePreference, setThemePreference } = useTheme();
  const { logout, user } = useAuth();
  const { plan, invitePartnerDetails, removePartnerDetails } = useWeddingDetails();
  const router = useRouter();
  
  const isDarkMode = colorScheme === 'dark';

  // Partner Modal & Submission states
  const [isPartnerModalVisible, setIsPartnerModalVisible] = React.useState(false);
  const [partnerEmail, setPartnerEmail] = React.useState("");
  const [isSubmittingPartner, setIsSubmittingPartner] = React.useState(false);

  const handleToggleTheme = (value: boolean) => {
    setThemePreference(value ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Determine partner name (if current user is owner, show partnerName; if current user is partner, show ownerName)
  const partnerName = plan
    ? (user?.userId === plan.ownerId ? plan.partnerName : plan.ownerName)
    : null;

  const handlePartnerPress = () => {
    if (partnerName) {
      // Unlink confirmation
      Alert.alert(
        "Remove Partner",
        `Are you sure you want to unlink ${partnerName} from your wedding plan?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unlink",
            style: "destructive",
            onPress: async () => {
              const err = await removePartnerDetails();
              if (err) {
                Alert.alert("Error", err);
              } else {
                Alert.alert("Success", "Partner unlinked successfully.");
              }
            }
          }
        ]
      );
    } else {
      // Open add partner modal
      setPartnerEmail("");
      setIsPartnerModalVisible(true);
    }
  };

  const handleLinkPartner = async () => {
    if (!partnerEmail.trim()) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    setIsSubmittingPartner(true);
    try {
      const err = await invitePartnerDetails(partnerEmail.trim());
      if (err) {
        Alert.alert("Failed to link partner", err);
      } else {
        setIsPartnerModalVisible(false);
        Alert.alert("Success", "Partner linked successfully!");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingPartner(false);
    }
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
            <View style={styles.avatarWrapper}>
              <Image
                source={require("@/assets/images/Image.jpeg")}
                style={styles.avatarImage}
                contentFit="cover"
              />
            </View>
            
            <View style={styles.headerInfo}>
              <ThemedText style={styles.profileName}>{user?.name ?? 'Guest'}</ThemedText>
              <ThemedText style={styles.profileRole}>
                {user?.role === 'groom' ? 'Groom-to-be' : user?.role === 'bride' ? 'Bride-to-be' : 'Guest'}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

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

            <View style={styles.rowDivider} />

            {/* Linked Partner Row */}
            <Pressable 
              onPress={handlePartnerPress}
              style={({ pressed }) => [styles.pressableSettingItem, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)' }]}>
                  <IconSymbol name="heart.fill" size={20} color="#EC4899" />
                </View>
                <View style={styles.settingTextContainer}>
                  <ThemedText style={styles.settingTitle}>Linked Partner</ThemedText>
                  <ThemedText style={styles.settingSubtitle}>
                    {partnerName ? `Linked with ${partnerName}` : 'Tap to link your partner'}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={theme.icon} />
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Logout Row */}
            <Pressable 
              onPress={handleLogout}
              style={({ pressed }) => [styles.pressableSettingItem, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.settingItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#EF4444" />
                </View>
                <View style={styles.settingTextContainer}>
                  <ThemedText style={[styles.settingTitle, { color: '#EF4444' }]}>Log Out</ThemedText>
                  <ThemedText style={styles.settingSubtitle}>Sign out of your account</ThemedText>
                </View>
              </View>
            </Pressable>

          </View>
        </View>

      </ScrollView>

      {/* Link Partner Modal */}
      <Modal
        visible={isPartnerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPartnerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff' }]}>
            <ThemedText style={styles.modalTitle}>Link Your Partner</ThemedText>
            <ThemedText style={styles.modalDescription}>
              Enter your partner's registered email address. This will link your accounts, allowing you to plan your wedding checklist, savings, and budget together!
            </ThemedText>
            
            <TextInput
              style={[
                styles.input,
                {
                  color: isDarkMode ? '#ffffff' : '#000000',
                  borderColor: isDarkMode ? '#2D3748' : '#E2E8F0',
                  backgroundColor: isDarkMode ? '#121212' : '#F8FAFC',
                }
              ]}
              placeholder="partner@example.com"
              placeholderTextColor={isDarkMode ? '#666666' : '#94A3B8'}
              value={partnerEmail}
              onChangeText={setPartnerEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              editable={!isSubmittingPartner}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setIsPartnerModalVisible(false)}
                disabled={isSubmittingPartner}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                onPress={handleLinkPartner}
                disabled={isSubmittingPartner}
                style={[styles.modalButton, styles.submitButton, { backgroundColor: theme.tint }]}
              >
                {isSubmittingPartner ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Link</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  submitButton: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
