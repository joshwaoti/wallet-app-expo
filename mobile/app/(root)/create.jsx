import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { getCreateStyles } from "../../assets/styles/create.styles";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import AccountCardSelector from "../../components/AccountCardSelector"; // Import the new component
import AccountSelectionModal from "../../components/AccountSelectionModal"; // Import the new modal component
import AddCategoryModal from "../../components/AddCategoryModal"; // Import the new modal component
import { useCategories } from "../../hooks/useCategories";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const CreateScreen = () => {
  const { theme } = useTheme();
  const styles = getCreateStyles(theme);
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isExpense, setIsExpense] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState(null);
  const { categories, isLoading: categoriesLoading, error: categoriesError, createCategory } = useCategories();
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false); // New state for modal visibility
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const fetchAccounts = async () => {
    if (!user?.id) return;
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const response = await fetch(`${API_URL}/accounts/${user.id}`);
      const data = await response.json();
      setAccounts(data);
      if (data.length > 0) {
        setSelectedAccount(data[0].id); // Select the first account by default
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setAccountsError("Failed to load accounts. Please try again.");
      Alert.alert("Error", "Failed to load accounts for transaction. Please try again.");
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleCreate = async () => {
    // validations
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a transaction title");
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (!selectedAccount) {
      Alert.alert("Error", "Please select an account");
      return;
    }

    setIsLoading(true);
    try {
      // Format the amount (negative for expenses, positive for income)
      const formattedAmount = isExpense
        ? -Math.abs(parseFloat(amount))
        : Math.abs(parseFloat(amount));

      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName || user.username,
          title,
          amount: formattedAmount,
          category_id: selectedCategory,
          account_id: selectedAccount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.message || "Failed to create transaction");
      }

      Alert.alert("Success", "Transaction created successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create transaction");
      console.error("Error creating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Transaction</Text>
        <TouchableOpacity
          style={[styles.saveButtonContainer, isLoading && styles.saveButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading || accountsLoading}
        >
          <Text style={styles.saveButton}>{isLoading ? "Saving..." : "Save"}</Text>
          {!isLoading && <Ionicons name="checkmark" size={18} color={theme.primary} />}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.typeSelector}>
          {/* EXPENSE SELECTOR */}
          <TouchableOpacity
            style={[styles.typeButton, isExpense && styles.typeButtonActive]}
            onPress={() => setIsExpense(true)}
          >
            <Ionicons
              name="arrow-down-circle"
              size={22}
              color={isExpense ? theme.white : theme.expense}
              style={styles.typeIcon}
            />
            <Text style={[styles.typeButtonText, isExpense && styles.typeButtonTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>

          {/* INCOME SELECTOR */}
          <TouchableOpacity
            style={[styles.typeButton, !isExpense && styles.typeButtonActive]}
            onPress={() => setIsExpense(false)}
          >
            <Ionicons
              name="arrow-up-circle"
              size={22}
              color={!isExpense ? theme.white : theme.income}
              style={styles.typeIcon}
            />
            <Text style={[styles.typeButtonText, !isExpense && styles.typeButtonTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* AMOUNT CONTAINER */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={theme.textLight}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* INPUT CONTAINER */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="create-outline"
            size={22}
            color={theme.textLight}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Transaction Title"
            placeholderTextColor={theme.textLight}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.categoryHeader}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="pricetag-outline" size={16} color={theme.text} /> Category
          </Text>
          <TouchableOpacity onPress={() => setIsCategoryModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {categoriesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={{ color: theme.textLight, marginTop: 5 }}>Loading categories...</Text>
            </View>
          ) : categoriesError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error loading categories.</Text>
            </View>
          ) : categories && categories.length > 0 ? (categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon}
                size={20}
                color={selectedCategory === category.id ? theme.white : theme.text}
                style={styles.categoryIcon}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))) : (
            <Text style={{ color: theme.textLight, textAlign: "center", flex: 1 }}>No categories available. Add one!</Text>
          )}
        </View>

        {/* ACCOUNT SELECTOR */}
        {accountsLoading ? (
          <View style={[styles.loadingContainer, { marginTop: 20 }]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={{ color: theme.textLight, marginTop: 5 }}>Loading accounts...</Text>
          </View>
        ) : accountsError ? (
          <View style={[styles.errorContainer, { marginTop: 20 }]}>
            <Text style={styles.errorText}>Error loading accounts.</Text>
          </View>
        ) : accounts.length > 0 && (
          <AccountCardSelector
            selectedAccount={selectedAccount}
            accounts={accounts}
            onPress={() => setIsAccountModalVisible(true)}
            style={{ marginTop: 20 }}
          />
        )}

      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}

      <AccountSelectionModal
        isVisible={isAccountModalVisible}
        onClose={() => setIsAccountModalVisible(false)}
        accounts={accounts}
        selectedAccount={selectedAccount}
        onSelectAccount={(accountId) => {
          setSelectedAccount(accountId);
          setIsAccountModalVisible(false);
        }}
      />

      <AddCategoryModal
        isVisible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        createCategory={createCategory}
      />
    </View>
  );
};
export default CreateScreen;