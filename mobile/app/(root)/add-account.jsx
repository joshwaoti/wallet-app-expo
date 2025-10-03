import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { router, useLocalSearchParams } from "expo-router";
import { Picker } from "@react-native-picker/picker";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AddAccountScreen() {
  const { theme } = useTheme();
  const addAccountStyles = getAddAccountStyles(theme);
  const { user } = useUser();
  const params = useLocalSearchParams();
  const isEditing = !!params.accountId;

  const [name, setName] = useState(Array.isArray(params.name) ? params.name[0] : params.name || "");
  const [type, setType] = useState(params.type || "bank");
  const [balance, setBalance] = useState(params.balance ? String(params.balance) : "0.00");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing && !type) {
      setType("bank");
    }
    if (!isEditing && balance === "") {
      setBalance("0.00");
    }
  }, [isEditing, type, balance]);

  const handleSaveAccount = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an account name.");
      return;
    }
    if (!type) {
      Alert.alert("Error", "Please select an account type.");
      return;
    }
    if (balance === "") {
      Alert.alert("Error", "Please enter a balance.");
      return;
    }
    if (!user?.id) {
      Alert.alert("Error", "User not authenticated. Please sign in again.");
      return;
    }
    if (isNaN(parseFloat(balance))) {
      Alert.alert("Error", "Invalid balance amount.");
      return;
    }

    setLoading(true);
    try {
      const accountData = {
        name,
        type,
        balance: parseFloat(balance),
        user_id: user.id,
      };

      if (isEditing) {
        const response = await fetch(`${API_URL}/accounts/${params.accountId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(accountData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update account");
        }
        Alert.alert("Success", "Account updated successfully!");
      } else {
        const response = await fetch(`${API_URL}/accounts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(accountData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create account");
        }
        Alert.alert("Success", "Account created successfully!");
      }
      router.back();
    } catch (err) {
      console.error("Error saving account:", err);
      Alert.alert("Error", err.message || "Failed to save account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!isEditing) return;

    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete this account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_URL}/accounts/${params.accountId}`, {
                method: "DELETE",
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete account");
              }
              Alert.alert("Success", "Account deleted successfully!");
              router.back();
            } catch (err) {
              console.error("Error deleting account:", err);
              Alert.alert("Error", err.message || "Failed to delete account. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={addAccountStyles.container}>
      <View style={addAccountStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={addAccountStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={addAccountStyles.headerTitle}>{isEditing ? "Edit Account" : "Add New Account"}</Text>
        {isEditing && (
          <TouchableOpacity onPress={handleDeleteAccount} style={addAccountStyles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color={theme.expense} />
          </TouchableOpacity>
        )}
        {!isEditing && <View style={{ width: 24 }} />}
      </View>

      <View style={addAccountStyles.formGroup}>
        <Text style={addAccountStyles.label}>Account Name</Text>
        <TextInput
          style={addAccountStyles.input}
          placeholder="e.g., My Checking Account"
          placeholderTextColor={theme.textLight}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={addAccountStyles.formGroup}>
        <Text style={addAccountStyles.label}>Account Type</Text>
        <View style={addAccountStyles.pickerContainer}>
          <Picker
            selectedValue={type}
            onValueChange={(itemValue) => setType(itemValue)}
            style={addAccountStyles.picker}
            itemStyle={addAccountStyles.pickerItem}
          >
            <Picker.Item label="Bank" value="bank" />
            <Picker.Item label="Card" value="card" />
            <Picker.Item label="Cash" value="cash" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>
      </View>

      <View style={addAccountStyles.formGroup}>
        <Text style={addAccountStyles.label}>Initial Balance</Text>
        <TextInput
          style={addAccountStyles.input}
          placeholder="0.00"
          placeholderTextColor={theme.textLight}
          keyboardType="numeric"
          value={balance}
          onChangeText={setBalance}
        />
      </View>

      <TouchableOpacity
        style={[addAccountStyles.saveButton, loading && { opacity: 0.7 }]} // Dim button when loading
        onPress={handleSaveAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.white} />
        ) : (
          <Text style={addAccountStyles.saveButtonText}>{isEditing ? "Update Account" : "Create Account"}</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getAddAccountStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.text,
  },
  deleteButton: {
    padding: 5,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerContainer: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    height: 50,
    width: "100%",
    color: theme.text,
  },
  pickerItem: {
    fontSize: 16,
    color: theme.text,
  },
  saveButton: {
    backgroundColor: theme.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  saveButtonText: {
    color: theme.white,
    fontSize: 18,
    fontWeight: "700",
  },
});