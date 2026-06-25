import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Platform
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import {
  ChecklistGroup,
  ChecklistItem,
  getChecklist,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems
} from '@/services/checklist-service';

export default function ChecklistScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const accentColor = theme.tint; // Purple accent
  const { user } = useAuth();

  // Checklist Groups state
  const [groups, setGroups] = useState<ChecklistGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  // Track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Custom task inputs state
  const [newTasksText, setNewTasksText] = useState<Record<string, string>>({});

  // Modals state
  const [isAddGroupModalVisible, setIsAddGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameGroupId, setRenameGroupId] = useState('');
  const [renameGroupName, setRenameGroupName] = useState('');
  const [isRenamingGroup, setIsRenamingGroup] = useState(false);

  // Load checklist from server
  const loadChecklist = useCallback(async (showIndicator = true) => {
    if (!user?.accessToken) return;
    if (showIndicator) setIsLoading(true);

    const { data, error } = await getChecklist(user.accessToken);
    if (error) {
      Alert.alert('Connection Error', error);
    } else if (data) {
      setGroups(data);
      // Expand first category by default if none are expanded yet
      if (Object.keys(expandedCategories).length === 0 && data.length > 0) {
        setExpandedCategories({ [data[0].id]: true });
      }
    }
    if (showIndicator) setIsLoading(false);
  }, [user?.accessToken, expandedCategories]);

  // Pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadChecklist(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (user?.accessToken) {
      loadChecklist();
    }
  }, [user?.accessToken]);

  // Add Item to a Group
  const handleAddTask = async (groupId: string) => {
    const text = newTasksText[groupId]?.trim();
    if (!text || !user?.accessToken) return;

    // Optimistic UI update
    const tempId = 'temp-' + Date.now();
    const optimisticItem: ChecklistItem = {
      id: tempId,
      groupId,
      title: text,
      isCompleted: false,
      order: 999,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setGroups(prevGroups =>
      prevGroups.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          items: [...g.items, optimisticItem]
        };
      })
    );

    // Clear input field
    setNewTasksText(prev => ({ ...prev, [groupId]: '' }));

    const { data, error } = await createChecklistItem({ groupId, title: text }, user.accessToken);
    if (error) {
      Alert.alert('Error', error);
      // Rollback
      loadChecklist(false);
    } else if (data) {
      // Replace optimistic item with server response
      setGroups(prevGroups =>
        prevGroups.map(g => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            items: g.items.map(item => (item.id === tempId ? data : item))
          };
        })
      );
    }
  };

  // Delete checklist item
  const handleDeleteTask = async (groupId: string, itemId: string) => {
    if (!user?.accessToken) return;

    // Optimistic UI update
    setGroups(prevGroups =>
      prevGroups.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          items: g.items.filter(item => item.id !== itemId)
        };
      })
    );

    const { error } = await deleteChecklistItem(itemId, user.accessToken);
    if (error) {
      Alert.alert('Error', error);
      // Rollback
      loadChecklist(false);
    }
  };

  // Toggle item completed status
  const handleToggleTask = async (groupId: string, itemId: string, currentCompleted: boolean) => {
    if (!user?.accessToken) return;

    const newCompleted = !currentCompleted;

    // Optimistic UI update
    setGroups(prevGroups =>
      prevGroups.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          items: g.items.map(item =>
            item.id === itemId ? { ...item, isCompleted: newCompleted } : item
          )
        };
      })
    );

    const { error } = await updateChecklistItem(itemId, { isCompleted: newCompleted }, user.accessToken);
    if (error) {
      Alert.alert('Error', error);
      // Rollback
      loadChecklist(false);
    }
  };

  // Add Group
  const handleAddGroup = async () => {
    const name = newGroupName.trim();
    if (!name || !user?.accessToken) return;

    setIsSavingGroup(true);
    const { data, error } = await createGroup({ name }, user.accessToken);
    setIsSavingGroup(false);

    if (error) {
      Alert.alert('Error', error);
    } else if (data) {
      setGroups(prev => [...prev, data]);
      setExpandedCategories(prev => ({ ...prev, [data.id]: true }));
      setNewGroupName('');
      setIsAddGroupModalVisible(false);
    }
  };

  // Open Rename Modal
  const openRenameModal = (group: ChecklistGroup) => {
    setRenameGroupId(group.id);
    setRenameGroupName(group.name);
    setIsRenameModalVisible(true);
  };

  // Rename Group
  const handleRenameGroup = async () => {
    const name = renameGroupName.trim();
    if (!name || !user?.accessToken) return;

    setIsRenamingGroup(true);
    const { data, error } = await updateGroup(renameGroupId, { name }, user.accessToken);
    setIsRenamingGroup(false);

    if (error) {
      Alert.alert('Error', error);
    } else if (data) {
      setGroups(prev => prev.map(g => (g.id === renameGroupId ? { ...g, name: data.name } : g)));
      setIsRenameModalVisible(false);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!user?.accessToken) return;

    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete the group "${groupName}" and all of its tasks? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Optimistic UI update
            setGroups(prev => prev.filter(g => g.id !== groupId));

            const { error } = await deleteGroup(groupId, user.accessToken);
            if (error) {
              Alert.alert('Error', error);
              // Rollback
              loadChecklist(false);
            }
          }
        }
      ]
    );
  };

  // Move Group Up
  const handleMoveGroupUp = async (index: number) => {
    if (index === 0 || !user?.accessToken) return;
    const newGroups = [...groups];

    // Swap
    const temp = newGroups[index];
    newGroups[index] = newGroups[index - 1];
    newGroups[index - 1] = temp;

    // Update orders locally
    const updated = newGroups.map((g, idx) => ({ ...g, order: idx }));
    setGroups(updated);

    const { error } = await reorderGroups(updated.map(g => g.id), user.accessToken);
    if (error) {
      Alert.alert('Error', error);
      loadChecklist(false);
    }
  };

  // Move Group Down
  const handleMoveGroupDown = async (index: number) => {
    if (index === groups.length - 1 || !user?.accessToken) return;
    const newGroups = [...groups];

    // Swap
    const temp = newGroups[index];
    newGroups[index] = newGroups[index + 1];
    newGroups[index + 1] = temp;

    // Update orders locally
    const updated = newGroups.map((g, idx) => ({ ...g, order: idx }));
    setGroups(updated);

    const { error } = await reorderGroups(updated.map(g => g.id), user.accessToken);
    if (error) {
      Alert.alert('Error', error);
      loadChecklist(false);
    }
  };

  // Move Item Up
  const handleMoveItemUp = async (groupIndex: number, itemIndex: number) => {
    if (itemIndex === 0 || !user?.accessToken) return;
    const newGroups = [...groups];
    const group = { ...newGroups[groupIndex] };
    const items = [...group.items];

    // Swap
    const temp = items[itemIndex];
    items[itemIndex] = items[itemIndex - 1];
    items[itemIndex - 1] = temp;

    // Update orders locally
    group.items = items.map((it, idx) => ({ ...it, order: idx }));
    newGroups[groupIndex] = group;
    setGroups(newGroups);

    const { error } = await reorderChecklistItems(group.id, group.items.map(it => it.id), user.accessToken);
    if (error) {
      Alert.alert('Error', error);
      loadChecklist(false);
    }
  };

  // Move Item Down
  const handleMoveItemDown = async (groupIndex: number, itemIndex: number) => {
    const newGroups = [...groups];
    const group = { ...newGroups[groupIndex] };
    if (itemIndex === group.items.length - 1 || !user?.accessToken) return;
    const items = [...group.items];

    // Swap
    const temp = items[itemIndex];
    items[itemIndex] = items[itemIndex + 1];
    items[itemIndex + 1] = temp;

    // Update orders locally
    group.items = items.map((it, idx) => ({ ...it, order: idx }));
    newGroups[groupIndex] = group;
    setGroups(newGroups);

    const { error } = await reorderChecklistItems(group.id, group.items.map(it => it.id), user.accessToken);
    if (error) {
      Alert.alert('Error', error);
      loadChecklist(false);
    }
  };

  // Toggle expand/collapse category
  const toggleCategory = (catId: string) => {
    if (reorderMode) return; // Prevent expansion toggling in reorder mode
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Render Swipeable Right Delete Action for Items (only active in normal mode)
  const renderRightActions = (groupId: string, itemId: string) => {
    return (
      <Pressable
        onPress={() => handleDeleteTask(groupId, itemId)}
        style={styles.deleteButton}>
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
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={accentColor} />
          }
        >
          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <ThemedText type="title" style={styles.headerTitle}>Checklist</ThemedText>
              <View style={styles.headerActions}>
                <Pressable
                  onPress={() => setReorderMode(!reorderMode)}
                  style={[
                    styles.actionPillButton,
                    { borderColor: colorScheme === 'light' ? '#E2E8F0' : '#2D3748' },
                    reorderMode && { backgroundColor: accentColor + '20', borderColor: accentColor }
                  ]}
                >
                  <IconSymbol name="list.bullet" size={14} color={reorderMode ? accentColor : theme.icon} />
                  <ThemedText style={[styles.actionPillText, { color: reorderMode ? accentColor : theme.text }]}>
                    {reorderMode ? 'Done' : 'Reorder'}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setIsAddGroupModalVisible(true)}
                  style={[styles.actionPillButton, { borderColor: colorScheme === 'light' ? '#E2E8F0' : '#2D3748' }]}
                >
                  <IconSymbol name="plus" size={14} color={theme.icon} />
                  <ThemedText style={styles.actionPillText}>Group</ThemedText>
                </Pressable>
              </View>
            </View>
            <ThemedText style={styles.headerSubtitle}>Collaborative wedding planning tasks</ThemedText>
          </View>

          {/* Loading Indicator */}
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={accentColor} />
              <ThemedText style={styles.loaderText}>Loading workspace checklist...</ThemedText>
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="list.bullet" size={48} color={theme.icon + '60'} />
              <ThemedText style={styles.emptyText}>No checklist groups created yet.</ThemedText>
              <Pressable
                onPress={() => setIsAddGroupModalVisible(true)}
                style={[styles.emptyButton, { backgroundColor: accentColor }]}>
                <ThemedText style={styles.emptyButtonText}>Create First Group</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.categoriesContainer}>
              {groups.map((group, groupIdx) => {
                const completedCount = group.items.filter(t => t.isCompleted).length;
                const totalCount = group.items.length;
                const isExpanded = !!expandedCategories[group.id] || reorderMode; // force expand in reorder mode

                return (
                  <View
                    key={group.id}
                    style={[
                      styles.categoryWrapper,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#ffffff',
                        borderColor: colorScheme === 'light' ? '#E2E8F0' : '#2D3748',
                      }
                    ]}>
                    
                    {/* Accordion Header */}
                    <Pressable
                      onPress={() => toggleCategory(group.id)}
                      style={({ pressed }) => [
                        styles.categoryHeader,
                        { opacity: pressed && !reorderMode ? 0.8 : 1 }
                      ]}>
                      <View style={styles.headerLeft}>
                        <View style={[styles.iconWrapper, { backgroundColor: accentColor + '15' }]}>
                          <IconSymbol name="list.bullet" size={18} color={accentColor} />
                        </View>
                        <View style={styles.headerTitleContainer}>
                          <ThemedText style={styles.categoryTitle}>{group.name}</ThemedText>
                          {!reorderMode && (
                            <ThemedText style={styles.categoryProgress}>
                              {completedCount} of {totalCount} completed
                            </ThemedText>
                          )}
                        </View>
                      </View>

                      {/* Header Actions depending on Mode */}
                      {reorderMode ? (
                        <View style={styles.reorderControls}>
                          <Pressable
                            disabled={groupIdx === 0}
                            onPress={() => handleMoveGroupUp(groupIdx)}
                            style={({ pressed }) => [
                              styles.reorderArrowButton,
                              groupIdx === 0 && { opacity: 0.2 },
                              pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }
                            ]}
                          >
                            <IconSymbol name="arrow.up" size={14} color={theme.text} />
                          </Pressable>
                          <Pressable
                            disabled={groupIdx === groups.length - 1}
                            onPress={() => handleMoveGroupDown(groupIdx)}
                            style={({ pressed }) => [
                              styles.reorderArrowButton,
                              groupIdx === groups.length - 1 && { opacity: 0.2 },
                              pressed && { backgroundColor: 'rgba(0,0,0,0.05)' }
                            ]}
                          >
                            <IconSymbol name="arrow.down" size={14} color={theme.text} />
                          </Pressable>
                          <Pressable
                            onPress={() => openRenameModal(group)}
                            style={styles.reorderEditButton}
                          >
                            <IconSymbol name="pencil" size={14} color={theme.tint} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteGroup(group.id, group.name)}
                            style={styles.reorderTrashButton}
                          >
                            <IconSymbol name="trash.fill" size={14} color="#EF4444" />
                          </Pressable>
                        </View>
                      ) : (
                        <IconSymbol
                          name="chevron.right"
                          size={18}
                          color={theme.icon}
                          style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                        />
                      )}
                    </Pressable>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <View style={styles.tasksList}>
                        {group.items.map((item, itemIdx) => (
                          <Swipeable
                            key={item.id}
                            enabled={!reorderMode}
                            renderRightActions={() => renderRightActions(group.id, item.id)}
                            friction={1.8}
                            rightThreshold={40}>
                            <View
                              style={[
                                styles.taskItem,
                                {
                                  backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#ffffff',
                                }
                              ]}>
                              
                              {/* Left Side: Checkbox & Text */}
                              <Pressable
                                disabled={reorderMode}
                                onPress={() => handleToggleTask(group.id, item.id, item.isCompleted)}
                                style={({ pressed }) => [
                                  styles.taskItemLeft,
                                  { opacity: pressed && !reorderMode ? 0.75 : 1 }
                                ]}
                              >
                                <View style={[
                                  styles.checkbox,
                                  item.isCompleted && { backgroundColor: accentColor, borderColor: accentColor }
                                ]}>
                                  {item.isCompleted && (
                                    <IconSymbol name="checkmark" size={12} color="#ffffff" />
                                  )}
                                </View>
                                <ThemedText
                                  style={[
                                    styles.taskText,
                                    item.isCompleted && { textDecorationLine: 'line-through', opacity: 0.5 }
                                  ]}>
                                  {item.title}
                                </ThemedText>
                              </Pressable>

                              {/* Right Side: Reordering arrows in reorder mode */}
                              {reorderMode && (
                                <View style={styles.itemReorderControls}>
                                  <Pressable
                                    disabled={itemIdx === 0}
                                    onPress={() => handleMoveItemUp(groupIdx, itemIdx)}
                                    style={[styles.itemReorderArrow, itemIdx === 0 && { opacity: 0.2 }]}
                                  >
                                    <IconSymbol name="arrow.up" size={12} color={theme.text} />
                                  </Pressable>
                                  <Pressable
                                    disabled={itemIdx === group.items.length - 1}
                                    onPress={() => handleMoveItemDown(groupIdx, itemIdx)}
                                    style={[styles.itemReorderArrow, itemIdx === group.items.length - 1 && { opacity: 0.2 }]}
                                  >
                                    <IconSymbol name="arrow.down" size={12} color={theme.text} />
                                  </Pressable>
                                  <Pressable
                                    onPress={() => handleDeleteTask(group.id, item.id)}
                                    style={styles.itemReorderTrash}
                                  >
                                    <IconSymbol name="trash.fill" size={12} color="#EF4444" />
                                  </Pressable>
                                </View>
                              )}
                            </View>
                          </Swipeable>
                        ))}

                        {/* Add Custom Task Input (disabled in reorder mode) */}
                        {!reorderMode && (
                          <View style={styles.inputContainer}>
                            <TextInput
                              placeholder="Add custom task..."
                              placeholderTextColor={colorScheme === 'light' ? '#94A3B8' : '#64748B'}
                              style={[
                                styles.inputField,
                                {
                                  borderColor: colorScheme === 'light' ? '#E2E8F0' : '#2D3748',
                                  backgroundColor: colorScheme === 'light' ? '#F8FAFC' : '#0F172A',
                                  color: theme.text,
                                }
                              ]}
                              value={newTasksText[group.id] || ''}
                              onChangeText={(text) => setNewTasksText(prev => ({ ...prev, [group.id]: text }))}
                              onSubmitEditing={() => handleAddTask(group.id)}
                              returnKeyType="done"
                            />
                            <Pressable
                              onPress={() => handleAddTask(group.id)}
                              style={({ pressed }) => [
                                styles.addButton,
                                {
                                  backgroundColor: accentColor,
                                  opacity: pressed ? 0.8 : 1
                                }
                              ]}>
                              <IconSymbol name="plus" size={16} color="#ffffff" />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ── Add Group Modal ─────────────────────────────────────── */}
        <Modal
          visible={isAddGroupModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAddGroupModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#ffffff' }]}>
              <ThemedText style={styles.modalTitle}>New Checklist Group</ThemedText>
              <TextInput
                placeholder="Enter group name (e.g. Catering)"
                placeholderTextColor={colorScheme === 'light' ? '#94A3B8' : '#64748B'}
                style={[
                  styles.modalInput,
                  {
                    borderColor: colorScheme === 'light' ? '#E2E8F0' : '#2D3748',
                    color: theme.text,
                  }
                ]}
                value={newGroupName}
                onChangeText={setNewGroupName}
                autoFocus
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    setNewGroupName('');
                    setIsAddGroupModalVisible(false);
                  }}
                  style={[styles.modalButton, { borderColor: colorScheme === 'light' ? '#E2E8F0' : '#2D3748', borderWidth: 1 }]}
                >
                  <ThemedText style={{ fontWeight: '600' }}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  disabled={isSavingGroup || !newGroupName.trim()}
                  onPress={handleAddGroup}
                  style={[styles.modalButton, { backgroundColor: accentColor }]}
                >
                  {isSavingGroup ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <ThemedText style={{ color: '#ffffff', fontWeight: '600' }}>Create</ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Rename Group Modal ──────────────────────────────────── */}
        <Modal
          visible={isRenameModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsRenameModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : '#ffffff' }]}>
              <ThemedText style={styles.modalTitle}>Rename Group</ThemedText>
              <TextInput
                placeholder="Enter group name"
                placeholderTextColor={colorScheme === 'light' ? '#94A3B8' : '#64748B'}
                style={[
                  styles.modalInput,
                  {
                    borderColor: colorScheme === 'light' ? '#E2E8F0' : '#2D3748',
                    color: theme.text,
                  }
                ]}
                value={renameGroupName}
                onChangeText={setRenameGroupName}
                autoFocus
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    setRenameGroupName('');
                    setIsRenameModalVisible(false);
                  }}
                  style={[styles.modalButton, { borderColor: colorScheme === 'light' ? '#E2E8F0' : '#2D3748', borderWidth: 1 }]}
                >
                  <ThemedText style={{ fontWeight: '600' }}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  disabled={isRenamingGroup || !renameGroupName.trim()}
                  onPress={handleRenameGroup}
                  style={[styles.modalButton, { backgroundColor: accentColor }]}
                >
                  {isRenamingGroup ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <ThemedText style={{ color: '#ffffff', fontWeight: '600' }}>Rename</ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scrollContainer: {
    paddingBottom: 120, // Sit nicely above bottom navigation bar
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loaderContainer: {
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    opacity: 0.5,
  },
  emptyContainer: {
    paddingVertical: 100,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  categoryWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoryProgress: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  tasksList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 12,
    paddingTop: 12,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    borderRadius: 12,
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  inputField: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Reorder Mode Styles
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderArrowButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  reorderEditButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    marginLeft: 4,
  },
  reorderTrashButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  itemReorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemReorderArrow: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  itemReorderTrash: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
});
