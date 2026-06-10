import React, { useState } from 'react';
import { StyleSheet, View, useColorScheme, ScrollView, Pressable, TextInput } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Category {
  id: string;
  title: string;
  icon: 'house.fill' | 'list.bullet' | 'bell.fill' | 'person.fill'; // Supported SF symbols in project
  tasks: Task[];
}

export default function ChecklistScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const accentColor = theme.tint; // Purple accent

  // Grouped Categories state
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'cat1',
      title: 'Pra-Nikah (Pre-Marriage)',
      icon: 'list.bullet',
      tasks: [
        { id: '1', title: 'Hadiri Kursus Pra-Perkahwinan (Kursus Kahwin)', completed: true },
        { id: '2', title: 'Ujian Saringan HIV (Klinik Kesihatan)', completed: true },
        { id: '3', title: 'Penyediaan Dokumen Nikah (IC, Saksi, Sijil)', completed: false },
        { id: '4', title: 'Hantar Permohonan Kebenaran Nikah Online', completed: false },
        { id: '5', title: 'Dapatkan Pengesahan Wali & Saksi', completed: false },
      ],
    },
    {
      id: 'cat2',
      title: 'Persiapan Majlis (Wedding Prep)',
      icon: 'house.fill',
      tasks: [
        { id: '6', title: 'Tempah Venue & Dewan Resepsi', completed: true },
        { id: '7', title: 'Fitting Baju Pengantin & Solekan', completed: false },
        { id: '8', title: 'Pilih Catering & Senarai Menu Makanan', completed: false },
        { id: '9', title: 'Tempah Pelamin & Dekorasi Dewan', completed: false },
      ],
    },
    {
      id: 'cat3',
      title: 'Dokumen & Jemputan (RSVP)',
      icon: 'person.fill',
      tasks: [
        { id: '10', title: 'Daftar Tok Kadi / Jurunikah', completed: false },
        { id: '11', title: 'Tempah Kad Jemputan Digital / Fizikal', completed: false },
        { id: '12', title: 'Edarkan Jemputan kepada Saudara & Teman', completed: false },
      ],
    },
  ]);

  // Track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    cat1: true, // Expand first section by default
    cat2: false,
    cat3: false,
  });

  // Custom task inputs state
  const [newTasksText, setNewTasksText] = useState<Record<string, string>>({});

  const addTask = (catId: string) => {
    const text = newTasksText[catId]?.trim();
    if (!text) return;

    setCategories(prevCategories =>
      prevCategories.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          tasks: [
            ...cat.tasks,
            { id: Date.now().toString(), title: text, completed: false }
          ]
        };
      })
    );

    // Clear input
    setNewTasksText(prev => ({
      ...prev,
      [catId]: ''
    }));
  };

  const deleteTask = (catId: string, taskId: string) => {
    setCategories(prevCategories =>
      prevCategories.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          tasks: cat.tasks.filter(task => task.id !== taskId),
        };
      })
    );
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const toggleTask = (catId: string, taskId: string) => {
    setCategories(prevCategories =>
      prevCategories.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          tasks: cat.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        };
      })
    );
  };

  const renderRightActions = (catId: string, taskId: string) => {
    return (
      <Pressable
        onPress={() => deleteTask(catId, taskId)}
        style={styles.deleteButton}>
        <IconSymbol name="trash.fill" size={18} color="#ffffff" />
      </Pressable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>Checklist</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Step-by-step wedding planning checklist</ThemedText>
          </View>

          <View style={styles.categoriesContainer}>
            {categories.map(cat => {
              const completedCount = cat.tasks.filter(t => t.completed).length;
              const totalCount = cat.tasks.length;
              const isExpanded = !!expandedCategories[cat.id];

              return (
                <View
                  key={cat.id}
                  style={[
                    styles.categoryWrapper,
                    {
                      backgroundColor: theme.background,
                      borderColor: colorScheme === 'light' ? '#E2E8F0' : '#2D3748',
                    }
                  ]}>
                  {/* Accordion Header */}
                  <Pressable
                    onPress={() => toggleCategory(cat.id)}
                    style={({ pressed }) => [
                      styles.categoryHeader,
                      { opacity: pressed ? 0.8 : 1 }
                    ]}>
                    <View style={styles.headerLeft}>
                      <View style={[styles.iconWrapper, { backgroundColor: accentColor + '15' }]}>
                        <IconSymbol name={cat.icon} size={20} color={accentColor} />
                      </View>
                      <View style={styles.headerTitleContainer}>
                        <ThemedText style={styles.categoryTitle}>{cat.title}</ThemedText>
                        <ThemedText style={styles.categoryProgress}>
                          {completedCount} of {totalCount} completed
                        </ThemedText>
                      </View>
                    </View>
                    <IconSymbol
                      name="chevron.right"
                      size={18}
                      color={theme.icon}
                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                    />
                  </Pressable>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <View style={styles.tasksList}>
                      {cat.tasks.map(task => (
                        <Swipeable
                          key={task.id}
                          renderRightActions={() => renderRightActions(cat.id, task.id)}
                          friction={1.8}
                          rightThreshold={40}>
                          <Pressable
                            onPress={() => toggleTask(cat.id, task.id)}
                            style={({ pressed }) => [
                              styles.taskItem,
                              {
                                backgroundColor: theme.background,
                                opacity: pressed ? 0.85 : 1
                              }
                            ]}>
                            <View style={[styles.checkbox, task.completed && { backgroundColor: accentColor, borderColor: accentColor }]}>
                              {task.completed && (
                                <IconSymbol name="chevron.right" size={14} color="#ffffff" />
                              )}
                            </View>
                            <ThemedText
                              style={[
                                styles.taskText,
                                task.completed && { textDecorationLine: 'line-through', opacity: 0.5 }
                              ]}>
                              {task.title}
                            </ThemedText>
                          </Pressable>
                        </Swipeable>
                      ))}

                      {/* Add Custom Task Input */}
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
                          value={newTasksText[cat.id] || ''}
                          onChangeText={(text) => setNewTasksText(prev => ({ ...prev, [cat.id]: text }))}
                          onSubmitEditing={() => addTask(cat.id)}
                          returnKeyType="done"
                        />
                        <Pressable
                          onPress={() => addTask(cat.id)}
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
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
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
    paddingBottom: 120, // Sit nicely above the floating bottom menu
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
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
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12, // Increased padding for easier swiping
    paddingHorizontal: 4,
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
});
