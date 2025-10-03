import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from '@/hooks/useTheme';
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function SettingsScreen() {
  const { theme } = useTheme();
  const settingsStyles = getSettingsStyles(theme);
  const { signOut } = useAuth();
  const { user } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Placeholder for notification state

  const handleExportTransactions = async () => {
    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/transactions/export/${user.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvData = await response.text();

      // Using React Native Share API for simplicity
      await Share.share({
        message: "Here are your transactions in CSV format.",
        url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`,
        title: "Export Transactions to CSV",
      });

    } catch (err) {
      console.error("Error exporting transactions:", err);
      Alert.alert("Error", err.message || "Failed to export transactions. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/sign-in"); // Redirect to sign-in page after logout
    } catch (err) {
      console.error("Error logging out:", err);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  return (
    <SafeAreaView style={settingsStyles.container}>
      <View style={settingsStyles.header}>
        <Text style={settingsStyles.headerTitle}>Settings</Text>
      </View>

      <View style={settingsStyles.section}>
        <Text style={settingsStyles.sectionTitle}>GENERAL</Text>
        <View style={settingsStyles.optionsCard}>
          <TouchableOpacity 
            style={settingsStyles.optionItem} 
            onPress={() => router.push("/(root)/profile")}
          >
            <View style={settingsStyles.optionLeft}>
              <Ionicons name="person-outline" size={24} color={theme.primary} />
              <Text style={settingsStyles.optionText}>Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={settingsStyles.optionItem} onPress={() => router.push("/(root)/themes")}>
            <View style={settingsStyles.optionLeft}>
              <Ionicons name="color-palette-outline" size={24} color={theme.primary} />
              <Text style={settingsStyles.optionText}>Theme</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textLight} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={settingsStyles.optionItem} 
            onPress={() => router.push("/(root)/sms-settings")}
          >
            <View style={settingsStyles.optionLeft}>
              <Ionicons name="chatbox-ellipses-outline" size={24} color={theme.primary} />
              <Text style={settingsStyles.optionText}>SMS Transaction Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textLight} />
          </TouchableOpacity>
          <View style={settingsStyles.optionItemNoBorder}>
            <View style={settingsStyles.optionLeft}>
              <Ionicons name="notifications-outline" size={24} color={theme.primary} />
              <Text style={settingsStyles.optionText}>Notifications</Text>
            </View>
            <Switch
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={notificationsEnabled ? theme.white : theme.white}
              ios_backgroundColor={theme.border}
              onValueChange={() => setNotificationsEnabled(previousState => !previousState)}
              value={notificationsEnabled}
            />
          </View>
        </View>
      </View>

      <View style={settingsStyles.section}>
        <Text style={settingsStyles.sectionTitle}>DATA MANAGEMENT</Text>
        <View style={settingsStyles.optionsCard}>
          <TouchableOpacity style={settingsStyles.optionItemNoBorder} onPress={handleExportTransactions}>
            <View style={settingsStyles.optionLeft}>
              <MaterialCommunityIcons name="download-box-outline" size={24} color={theme.primary} />
              <Text style={settingsStyles.optionText}>Export Transactions to CSV</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={settingsStyles.spacer} />

      <TouchableOpacity style={settingsStyles.logoutButton} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={24} color={theme.expense} />
        <Text style={settingsStyles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getSettingsStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 20,
    paddingBottom: 100, // Increased padding
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.text,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textLight,
    marginBottom: 10,
    paddingLeft: 5,
  },
  optionsCard: {
    backgroundColor: theme.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  optionItemNoBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  optionText: {
    fontSize: 16,
    color: theme.text,
  },
  spacer: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.expense + "20", // 20% opacity
    padding: 15,
    borderRadius: 15,
    gap: 10,
  },
  logoutButtonText: {
    color: theme.expense,
    fontSize: 18,
    fontWeight: "700",
  },
});