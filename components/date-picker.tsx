import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
}

export function DatePicker({ value, onChange, placeholder = "Select date", label }: DatePickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [modalVisible, setModalVisible] = useState(false);

  // Parse initial value or default to current date
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    // Split by dash to avoid timezone conversions shifting the local date
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const [currentDate, setCurrentDate] = useState(() => parseDate(value));
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? parseDate(value) : null);

  // Month navigation
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Calendar math
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentYear, currentMonth, i));
  }

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return "";
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${daysOfWeek[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatValueDate = (date: Date): string => {
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const handleOpen = () => {
    const initial = value ? parseDate(value) : new Date();
    setCurrentDate(initial);
    setSelectedDate(value ? parseDate(value) : null);
    setModalVisible(true);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onChange(formatValueDate(selectedDate));
    } else {
      onChange("");
    }
    setModalVisible(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange("");
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: isDark ? "rgba(255,255,255,0.6)" : "rgba(30,27,75,0.6)" }]}>{label}</Text>}
      
      <Pressable
        onPress={handleOpen}
        style={[
          styles.inputButton,
          {
            backgroundColor: isDark ? "#2A2A2A" : "#F8FAFC",
            borderColor: isDark ? "#3A3A3A" : "#E2E8F0",
          }
        ]}
      >
        <Text
          style={[
            styles.inputText,
            { color: value ? (isDark ? "#fff" : "#1E1B4B") : (isDark ? "#555" : "#94A3B8") }
          ]}
        >
          {value ? formatDisplayDate(parseDate(value)) : placeholder}
        </Text>
        <MaterialIcons
          name="calendar-today"
          size={18}
          color={isDark ? "#A78BFA" : "#7C3AED"}
          style={styles.icon}
        />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }
            ]}
          >
            {/* Header / Selected Date Banner */}
            <View style={[styles.headerBanner, { borderBottomColor: isDark ? "#2A2A2A" : "#F1F5F9" }]}>
              <Text style={[styles.bannerSub, { color: isDark ? "#888" : "#64748B" }]}>
                {selectedDate ? "SELECTED DAY" : "SELECT A DATE"}
              </Text>
              <Text
                style={[
                  styles.bannerTitle,
                  { color: selectedDate ? (isDark ? "#C084FC" : "#7C3AED") : (isDark ? "#888" : "#64748B") }
                ]}
              >
                {selectedDate ? formatDisplayDate(selectedDate) : "Please choose a day"}
              </Text>
            </View>

            {/* Month & Year Navigation */}
            <View style={styles.monthSelector}>
              <Pressable onPress={prevMonth} style={styles.navButton}>
                <MaterialIcons name="chevron-left" size={28} color={isDark ? "#fff" : "#1F2937"} />
              </Pressable>
              <Text style={[styles.monthText, { color: isDark ? "#fff" : "#1F2937" }]}>
                {monthsList[currentMonth]} {currentYear}
              </Text>
              <Pressable onPress={nextMonth} style={styles.navButton}>
                <MaterialIcons name="chevron-right" size={28} color={isDark ? "#fff" : "#1F2937"} />
              </Pressable>
            </View>

            {/* Weekdays Header */}
            <View style={styles.weekdaysContainer}>
              {weekdays.map((day, idx) => {
                const isWeekend = idx === 0 || idx === 6;
                return (
                  <View key={day} style={styles.weekdayCell}>
                    <Text
                      style={[
                        styles.weekdayText,
                        isWeekend && styles.weekendText,
                        { color: isWeekend ? (idx === 0 ? "#EF4444" : "#F59E0B") : (isDark ? "#aaa" : "#64748B") }
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {days.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.dayCellContainer} />;
                }

                const dayOfWeek = day.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isSelected = selectedDate &&
                  selectedDate.getDate() === day.getDate() &&
                  selectedDate.getMonth() === day.getMonth() &&
                  selectedDate.getFullYear() === day.getFullYear();

                const isToday = (() => {
                  const today = new Date();
                  return today.getDate() === day.getDate() &&
                    today.getMonth() === day.getMonth() &&
                    today.getFullYear() === day.getFullYear();
                })();

                return (
                  <View key={day.toISOString()} style={styles.dayCellContainer}>
                    <Pressable
                      onPress={() => setSelectedDate(day)}
                      style={[
                        styles.dayCellButton,
                        isWeekend && !isSelected && {
                          backgroundColor: dayOfWeek === 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.08)"
                        },
                        isToday && styles.todayCell,
                        isSelected && {
                          backgroundColor: "#7C3AED",
                          borderColor: "#7C3AED"
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          isWeekend && !isSelected && {
                            color: dayOfWeek === 0 ? "#EF4444" : "#F59E0B",
                            fontWeight: "600"
                          },
                          !isWeekend && !isSelected && {
                            color: isDark ? "#fff" : "#1F2937"
                          },
                          isToday && !isSelected && { fontWeight: "bold", color: isDark ? "#C084FC" : "#7C3AED" },
                          isSelected && { color: "#ffffff", fontWeight: "bold" }
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Action Row */}
            <View style={[styles.actionsRow, { borderTopColor: isDark ? "#2A2A2A" : "#F1F5F9" }]}>
              <Pressable
                onPress={handleClear}
                style={styles.actionButton}
              >
                <Text style={[styles.actionButtonText, { color: "#EF4444" }]}>Clear</Text>
              </Pressable>
              
              <View style={styles.actionsRight}>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={styles.actionButton}
                >
                  <Text style={[styles.actionButtonText, { color: isDark ? "#aaa" : "#64748B" }]}>Cancel</Text>
                </Pressable>
                
                <Pressable
                  onPress={handleConfirm}
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                >
                  <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    fontSize: 15,
  },
  icon: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  headerBanner: {
    padding: 20,
    borderBottomWidth: 1,
  },
  bannerSub: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  navButton: {
    padding: 4,
    borderRadius: 20,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "700",
  },
  weekdaysContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
  },
  weekendText: {
    fontWeight: "700",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  dayCellContainer: {
    width: "14.28%", // 7 columns
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  dayCellButton: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  dayCellText: {
    fontSize: 14,
  },
  todayCell: {
    borderColor: "#A78BFA",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  actionsRight: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonPrimary: {
    backgroundColor: "#7C3AED",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonTextPrimary: {
    color: "#ffffff",
  },
});
