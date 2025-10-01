import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const AccountItem = ({ account, onPress }) => {
  const getAccountIcon = (type) => {
    switch (type.toLowerCase()) {
      case "bank":
        return "bank-outline";
      case "card":
        return "credit-card-outline";
      case "cash":
        return "cash";
      default:
        return "wallet-outline";
    }
  };

  return (
    <TouchableOpacity style={accountStyles.accountCard} onPress={() => onPress(account)}>
      <View style={accountStyles.accountInfo}>
        <View style={accountStyles.iconContainer}>
          <MaterialCommunityIcons
            name={getAccountIcon(account.type)}
            size={24}
            color={COLORS.primary}
          />
        </View>
        <View>
          <Text style={accountStyles.accountName}>{account.name}</Text>
          <Text style={accountStyles.accountType}>{account.type}</Text>
        </View>
      </View>
      <Text style={accountStyles.accountBalance}>${parseFloat(account.balance).toFixed(2)}</Text>
    </TouchableOpacity>
  );
};

export default function AccountsScreen() {
  const { user } = useUser();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!user?.id) return;
    if (!refreshing) setLoading(true); // Only show loader if not a refresh action
    setError(null);
    try {
      const response = await fetch(`${API_URL}/accounts/${user.id}`);
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Failed to load accounts. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [user, fetchAccounts]);

  const handleAddAccount = () => {
    router.push("/add-account");
  };

  const handleAccountPress = (account) => {
    router.push({
      pathname: "/add-account",
      params: { accountId: account.id, name: account.name, type: account.type, balance: account.balance },
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccounts();
  }, [fetchAccounts]);

  if (loading) {
    return (
      <SafeAreaView style={accountStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textLight, marginTop: 10 }}>Loading accounts...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={accountStyles.errorContainer}>
        <Text style={accountStyles.errorText}>{error}</Text>
        <TouchableOpacity style={accountStyles.retryButton} onPress={fetchAccounts}>
          <Text style={accountStyles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={accountStyles.container}>
      <View style={accountStyles.header}>
        <Text style={accountStyles.headerTitle}>My Accounts</Text>
        <TouchableOpacity style={accountStyles.addButton} onPress={handleAddAccount}>
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={accountStyles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <AccountItem account={item} onPress={handleAccountPress} />}
        contentContainerStyle={accountStyles.listContent}
        ListEmptyComponent={
          <View style={accountStyles.emptyState}>
            <MaterialCommunityIcons name="wallet-plus-outline" size={60} color={COLORS.textLight} />
            <Text style={accountStyles.emptyStateTitle}>No Accounts Found</Text>
            <Text style={accountStyles.emptyStateText}>
              Looks like you haven&apos;t added any accounts yet. Tap &quot;Add New&quot; to get started!
            </Text>
            <TouchableOpacity style={accountStyles.emptyStateButton} onPress={handleAddAccount}>
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={accountStyles.emptyStateButtonText}>Add Account</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const accountStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  accountCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  accountName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  accountType: {
    fontSize: 14,
    color: COLORS.textLight,
    textTransform: "capitalize",
  },
  accountBalance: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    color: COLORS.expense,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateText: {
    color: COLORS.textLight,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
});
