import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Switch, Platform, TextInput } from 'react-native';
import { useColorScheme, useTheme } from '@/hooks/use-color-scheme';
import { useWeddingDetails } from '@/hooks/use-wedding-details';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

// ISO string (or other formats) to dd/MM/yyyy
const toLocalDateString = (isoString: string) => {
  try {
    if (!isoString) return "";
    
    // If already in dd/MM/yyyy format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoString)) {
      return isoString;
    }

    // Extract date component
    const datePart = isoString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }

    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return isoString;
  }
};

// dd/MM/yyyy format back to YYYY-MM-DD format for backend
const toISODateOnly = (dateStr: string) => {
  try {
    if (!dateStr) return null;
    const cleanDate = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return cleanDate;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDate)) {
      const [day, month, year] = cleanDate.split('/');
      return `${year}-${month}-${day}`;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { themePreference, setThemePreference } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  
  const {
    plan,
    title,
    updateTitle,
    marriage,
    updateMarriage,
    engagement,
    updateEngagement,
    updateEventDetails,
  } = useWeddingDetails();

  const isDarkMode = colorScheme === 'dark';
  const [editTab, setEditTab] = useState<'marriage' | 'engagement'>('marriage');
  const [isEditing, setIsEditing] = useState(false);

  // Local editing states
  const [editTitle, setEditTitle] = useState(title);
  const [editIsEngagementEnabled, setEditIsEngagementEnabled] = useState(plan?.isEngagementEnabled ?? false);
  const [marriageVenue, setMarriageVenue] = useState(marriage?.venue ?? "");
  const [marriageDate, setMarriageDate] = useState(toLocalDateString(marriage?.date ?? ""));
  const [engagementVenue, setEngagementVenue] = useState(engagement?.venue ?? "");
  const [engagementDate, setEngagementDate] = useState(toLocalDateString(engagement?.date ?? ""));

  // Sync state with incoming details/plan updates when not editing
  React.useEffect(() => {
    if (!isEditing) {
      setEditTitle(title);
      setEditIsEngagementEnabled(plan?.isEngagementEnabled ?? false);
      setMarriageVenue(marriage?.venue ?? "");
      setMarriageDate(toLocalDateString(marriage?.date ?? ""));
      setEngagementVenue(engagement?.venue ?? "");
      setEngagementDate(toLocalDateString(engagement?.date ?? ""));
      if (!plan?.isEngagementEnabled) {
        setEditTab('marriage');
      }
    }
  }, [plan?.isEngagementEnabled, title, marriage, engagement, isEditing]);

  const startEditing = () => {
    setEditTitle(title);
    setEditIsEngagementEnabled(plan?.isEngagementEnabled ?? false);
    setMarriageVenue(marriage?.venue ?? "");
    setMarriageDate(toLocalDateString(marriage?.date ?? ""));
    setEngagementVenue(engagement?.venue ?? "");
    setEngagementDate(toLocalDateString(engagement?.date ?? ""));
    setIsEditing(true);
    if (!plan?.isEngagementEnabled) {
      setEditTab('marriage');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    const isoMarriage = toISODateOnly(marriageDate);
    const isoEngagement = toISODateOnly(engagementDate);

    if (marriageDate && !isoMarriage) {
      alert("Invalid Nikah date format. Please use DD/MM/YYYY");
      return;
    }
    if (editIsEngagementEnabled && engagementDate && !isoEngagement) {
      alert("Invalid Tunang date format. Please use DD/MM/YYYY");
      return;
    }

    const error = await updateEventDetails({
      title: editTitle,
      isEngagementEnabled: editIsEngagementEnabled,
      marriageVenue,
      marriageDate: isoMarriage,
      engagementVenue,
      engagementDate: isoEngagement,
    });

    if (error) {
      alert("Failed to update event details: " + error);
      return;
    }

    // Update local non-DB states
    updateTitle(editTitle);

    if (!editIsEngagementEnabled) {
      setEditTab('marriage');
    }

    setIsEditing(false);
  };

  const handleToggleTheme = (value: boolean) => {
    setThemePreference(value ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
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
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <IconSymbol name="pencil.and.outline" size={20} color={theme.tint} />
                <ThemedText style={[styles.cardTitle, { color: theme.tint }]}>CUSTOMIZE EVENTS</ThemedText>
              </View>
              {!isEditing && (
                <Pressable onPress={startEditing} style={styles.editIconButton}>
                  <IconSymbol name="pencil" size={18} color={theme.tint} />
                </Pressable>
              )}
            </View>
            
            {/* Title Section */}
            <View style={[styles.inputContainer, !isEditing && { marginBottom: 6 }]}>
              <ThemedText style={styles.inputLabel}>Title</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: isDarkMode ? '#2D3748' : '#F1F5F9',
                    color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                    borderColor: isDarkMode ? '#4A5568' : '#CBD5E1',
                  }]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="e.g. Amar & Syamimie"
                  placeholderTextColor={isDarkMode ? '#A0AEC0' : '#94A3B8'}
                />
              ) : (
                <ThemedText style={styles.detailTextValue}>{title}</ThemedText>
              )}
            </View>

            {/* Engagement Toggle Status / Switch (Edit Mode Only) */}
            {isEditing && (
              <View style={styles.inputContainer}>
                <View style={styles.toggleRow}>
                  <ThemedText style={styles.toggleText}>Enable Engagement</ThemedText>
                  <Switch
                    value={editIsEngagementEnabled}
                    onValueChange={(val) => {
                      setEditIsEngagementEnabled(val);
                      if (!val) {
                        setEditTab('marriage');
                      }
                    }}
                    trackColor={{ false: '#767577', true: isDarkMode ? '#A78BFA' : '#7C3AED' }}
                    thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
                  />
                </View>
              </View>
            )}

            {isEditing && <View style={styles.divider} />}

            {/* Edit Tab Switcher (Visible in edit mode, or in view mode if engagement is enabled) */}
            {(isEditing || plan?.isEngagementEnabled) && (
              <View style={[styles.editSwitcherContainer, !isEditing && { marginTop: 4, marginBottom: 10 }]}>
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
            )}

            {/* Date Input/Display */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Date (DD/MM/YYYY)</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDarkMode ? '#2D3748' : '#F1F5F9',
                      color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                      borderColor: isDarkMode ? '#4A5568' : '#CBD5E1',
                    },
                    (editTab === 'engagement' && !editIsEngagementEnabled) && {
                      backgroundColor: isDarkMode ? '#1A202C' : '#E2E8F0',
                      color: isDarkMode ? '#718096' : '#A0AEC0',
                      borderColor: isDarkMode ? '#2D3748' : '#CBD5E1',
                    }
                  ]}
                  value={editTab === 'marriage' ? marriageDate : engagementDate}
                  editable={editTab === 'marriage' || editIsEngagementEnabled}
                  onChangeText={(text) => editTab === 'marriage' ? setMarriageDate(text) : setEngagementDate(text)}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={isDarkMode ? '#A0AEC0' : '#94A3B8'}
                />
              ) : (
                <ThemedText style={styles.detailTextValue}>
                  {editTab === 'marriage' ? marriageDate : engagementDate}
                </ThemedText>
              )}
            </View>



            {/* Venue Input/Display */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Venue Place</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDarkMode ? '#2D3748' : '#F1F5F9',
                      color: isDarkMode ? '#FFFFFF' : '#1E1B4B',
                      borderColor: isDarkMode ? '#4A5568' : '#CBD5E1',
                    },
                    (editTab === 'engagement' && !editIsEngagementEnabled) && {
                      backgroundColor: isDarkMode ? '#1A202C' : '#E2E8F0',
                      color: isDarkMode ? '#718096' : '#A0AEC0',
                      borderColor: isDarkMode ? '#2D3748' : '#CBD5E1',
                    }
                  ]}
                  value={editTab === 'marriage' ? marriageVenue : engagementVenue}
                  editable={editTab === 'marriage' || editIsEngagementEnabled}
                  onChangeText={(text) => editTab === 'marriage' ? setMarriageVenue(text) : setEngagementVenue(text)}
                  placeholder="e.g. Venue / Place"
                  placeholderTextColor={isDarkMode ? '#A0AEC0' : '#94A3B8'}
                />
              ) : (
                <ThemedText style={styles.detailTextValue}>
                  {editTab === 'marriage' ? marriageVenue : engagementVenue}
                </ThemedText>
              )}
            </View>

            {/* Save / Cancel Action Buttons */}
            {isEditing && (
              <View style={styles.actionButtonRow}>
                <Pressable onPress={handleCancel} style={[styles.actionButton, styles.cancelButton]}>
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </Pressable>
                <Pressable onPress={handleSave} style={[styles.actionButton, styles.saveButton]}>
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                </Pressable>
              </View>
            )}

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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editIconButton: {
    padding: 6,
  },
  detailTextValue: {
    fontSize: 15,
    fontWeight: '600',
    paddingTop: 2,
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    width: '100%',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    marginBottom: 4,
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
