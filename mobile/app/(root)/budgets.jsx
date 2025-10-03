import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, TextInput, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useCategories } from "../../hooks/useCategories";
import { useTheme } from "@/hooks/useTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const BudgetProgressBar = ({ spent, totalAmount }) => {
  const { theme } = useTheme();
  const budgetStyles = getBudgetStyles(theme);
  const percentage = (spent / totalAmount) * 100;
  let progressBarColor = theme.income;

  if (percentage > 75 && percentage <= 100) {
    progressBarColor = theme.primary;
  } else if (percentage > 100) {
    progressBarColor = theme.expense;
  }

  return (
    <View style={budgetStyles.progressBarBackground}>
      <View style={[budgetStyles.progressBarFill, { width: `${Math.min(100, percentage)}%`, backgroundColor: progressBarColor }]} />
    </View>
  );
};

const BudgetCategoryIcon = ({ icon }) => {
  const { theme } = useTheme();
  const budgetStyles = getBudgetStyles(theme);
  return (
    <View style={budgetStyles.budgetCategoryIconContainer}>
      <Ionicons name={icon} size={20} color={theme.white} />
    </View>
  );
};

// Moved BudgetAddEditModal definition outside of BudgetsScreen
const BudgetAddEditModal = ({ isVisible, onClose, onSave, budgetToEdit }) => {
  const { theme } = useTheme();
  const budgetStyles = getBudgetStyles(theme);
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const [category, setCategory] = useState(budgetToEdit?.category_id || (categories.length > 0 ? categories[0].id : ""));
  const [amount, setAmount] = useState(budgetToEdit?.amount ? String(budgetToEdit.amount) : "");

  useEffect(() => {
    if (budgetToEdit) {
      setCategory(budgetToEdit.category_id);
      setAmount(String(budgetToEdit.amount));
    } else {
      // Only set initial category if categories are loaded and not in an error state
      if (!categoriesLoading && !categoriesError && categories.length > 0) {
        setCategory(categories[0].id);
      }
    }
  }, [isVisible, budgetToEdit, categories, categoriesLoading, categoriesError]);

  const handleModalSave = async () => {
    if (!category || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please select a valid category and enter a valid amount.");
      return;
    }
    onSave({ category, amount: parseFloat(amount) });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={budgetStyles.modalOverlay}>
        <View style={budgetStyles.modalContent}>
          <Text style={budgetStyles.modalTitle}>{budgetToEdit ? "Edit Budget" : "Add New Budget"}</Text>

          <Text style={budgetStyles.label}>Category</Text>
          <View style={budgetStyles.pickerContainer}>
            {categoriesLoading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : categoriesError ? (
              <Text style={{ color: theme.expense, textAlign: "center", paddingVertical: 15 }}>Error loading categories.</Text>
            ) : categories && categories.length > 0 ? (
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={budgetStyles.picker}
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                ))}
              </Picker>
            ) : (
              <Text style={{ color: theme.textLight, textAlign: "center", paddingVertical: 15 }}>No categories available. Add one!</Text>
            )}
          </View>

          <Text style={budgetStyles.label}>Budget Amount</Text>
          <TextInput
            style={budgetStyles.input}
            placeholder="e.g., 500"
            placeholderTextColor={theme.textLight}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <View style={budgetStyles.modalButtonContainer}>
            <TouchableOpacity style={budgetStyles.modalCancelButton} onPress={onClose}>
              <Text style={budgetStyles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={budgetStyles.modalSaveButton} onPress={handleModalSave}>
              <Text style={budgetStyles.modalSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Main BudgetsScreen component
// This is the correct and only declaration for BudgetsScreen
export default function BudgetsScreen() {
  const { theme } = useTheme();
  const budgetStyles = getBudgetStyles(theme);
  const router = useRouter();
  const { user } = useUser();
  const { categories } = useCategories();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const getCurrentMonth = () => {
    const date = new Date();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  };
  const currentMonth = getCurrentMonth();

  const fetchBudgets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/budgets/${user.id}/${currentMonth}`);
      const data = await response.json();
      setBudgets(data);
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setError("Failed to load budgets. Please try again.");
      Alert.alert("Error", "Failed to load budgets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentMonth]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleAddBudget = () => {
    setEditingBudget(null);
    setIsModalVisible(true);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setIsModalVisible(true);
  };

  const handleSaveBudget = async (budgetData) => {
    try {
      if (editingBudget) {
        const response = await fetch(`${API_URL}/budgets/${editingBudget.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...budgetData, user_id: user.id, month: currentMonth }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update budget");
        }
        Alert.alert("Success", "Budget updated successfully!");
      } else {
        const response = await fetch(`${API_URL}/budgets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...budgetData, user_id: user.id, month: currentMonth }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create budget");
        }
        Alert.alert("Success", "Budget created successfully!");
      }
      fetchBudgets();
    } catch (err) {
      console.error("Error saving budget:", err);
      Alert.alert("Error", err.message || "Failed to save budget. Please try again.");
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    Alert.alert(
      "Delete Budget",
      "Are you sure you want to delete this budget?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
                method: "DELETE",
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete budget");
              }
              Alert.alert("Success", "Budget deleted successfully!");
              fetchBudgets();
            } catch (err) {
              console.error("Error deleting budget:", err);
              Alert.alert("Error", err.message || "Failed to delete budget. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={budgetStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textLight, marginTop: 10 }}>Loading budgets...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={budgetStyles.errorContainer}>
        <Text style={budgetStyles.errorText}>{error}</Text>
        <TouchableOpacity style={budgetStyles.retryButton} onPress={fetchBudgets}>
          <Text style={budgetStyles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={budgetStyles.container}>
      <View style={budgetStyles.header}>
        <Text style={budgetStyles.headerTitle}>Budgets</Text>
        <TouchableOpacity style={budgetStyles.addButton} onPress={handleAddBudget}>
          <Ionicons name="add" size={20} color={theme.white} />
          <Text style={budgetStyles.addButtonText}>Add Budget</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={budgetStyles.budgetCard} onLongPress={() => handleDeleteBudget(item.id)} onPress={() => handleEditBudget(item)}>
            <View style={budgetStyles.budgetCardHeader}>
              <View style={budgetStyles.budgetCategoryInfo}>
                <BudgetCategoryIcon icon={item.category_icon} />
                <Text style={budgetStyles.budgetCategory}>{item.category_name}</Text>
              </View>
              <Text style={budgetStyles.budgetAmount}>${parseFloat(item.spent || 0).toFixed(2)} / <Text style={{ opacity: 0.7 }}>${parseFloat(item.amount || 0).toFixed(2)}</Text></Text>
            </View>
            <BudgetProgressBar spent={item.spent} totalAmount={item.amount} />
          </TouchableOpacity>
        )}
        contentContainerStyle={budgetStyles.listContent}
        ListEmptyComponent={
          <View style={budgetStyles.emptyState}>
            <MaterialCommunityIcons name="cash-minus" size={60} color={theme.textLight} />
            <Text style={budgetStyles.emptyStateTitle}>No Budgets Set</Text>
            <Text style={budgetStyles.emptyStateText}>
              You haven&apos;t set any budgets for this month. Tap &quot;Add Budget&quot; to get started!
            </Text>
            <TouchableOpacity style={budgetStyles.emptyStateButton} onPress={handleAddBudget}>
              <Ionicons name="add" size={20} color={theme.white} />
              <Text style={budgetStyles.emptyStateButtonText}>Add Budget</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchBudgets} />}
        showsVerticalScrollIndicator={false}
      />

      <BudgetAddEditModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveBudget}
        budgetToEdit={editingBudget}
      />
    </SafeAreaView>
  );
}

const getBudgetStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.text,
  },
  addButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: theme.white,
    fontWeight: "600",
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  budgetCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  budgetCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  budgetCategoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
  },
  budgetAmount: {
    fontSize: 16,
    color: theme.text,
    fontWeight: "500",
  },
  progressBarBackground: {
    width: "100%",
    backgroundColor: theme.background,
    borderRadius: 10,
    height: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
    padding: 20,
  },
  errorText: {
    color: theme.expense,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.text,
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateText: {
    color: theme.textLight,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: theme.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyStateButtonText: {
    color: theme.white,
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 25,
    width: "90%",
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: theme.background,
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
    backgroundColor: theme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: "100%",
    color: theme.text,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
    gap: 15,
  },
  modalCancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    backgroundColor: theme.border,
  },
  modalCancelButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalSaveButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: "600",
  },
  budgetCategoryIconContainer: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});