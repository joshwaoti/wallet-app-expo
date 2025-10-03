
import { useCallback, useState } from "react";
import { Alert } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const PAGE_SIZE = 20;

export const useTransactions = (userId) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expenses: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async (page, append = false) => {
    if (!userId) return;

    if (append) {
      setIsFetchingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const offset = (page - 1) * PAGE_SIZE;
      const response = await fetch(`${API_URL}/transactions/${userId}?limit=${PAGE_SIZE}&offset=${offset}`);
      if (!response.ok) throw new Error("Failed to fetch data from server.");
      const data = await response.json();

      if (append) {
        setTransactions((prev) => {
          // Create a Set of existing IDs for efficient lookup
          const existingIds = new Set(prev.map(tx => tx.id));
          // Filter out any new items that are already in the list
          const uniqueNewTransactions = data.filter(tx => !existingIds.has(tx.id));
          return [...prev, ...uniqueNewTransactions];
        });
      } else {
        // Replace the list for a refresh or initial load
        setTransactions(data);
      }

      setHasMore(data.length === PAGE_SIZE);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Alert.alert("Error", "Failed to load transactions.");
    } finally {
      if (append) {
        setIsFetchingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [userId]);

  const fetchSummary = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/transactions/summary/${userId}`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    // Let fetchTransactions handle its own isLoading state
    await Promise.all([
      fetchSummary(),
      fetchTransactions(1, false),
    ]);
  }, [userId, fetchSummary, fetchTransactions]);

  const loadMoreTransactions = useCallback(() => {
    if (hasMore && !isLoading && !isFetchingMore) {
      fetchTransactions(currentPage + 1, true);
    }
  }, [hasMore, isLoading, isFetchingMore, currentPage, fetchTransactions]);

  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete transaction");

      setTransactions(prev => prev.filter(tx => tx.id !== id));
      // Optionally refetch summary after a deletion
      fetchSummary();
      Alert.alert("Success", "Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      Alert.alert("Error", error.message);
    }
  };

  return {
    transactions,
    summary,
    isLoading,
    isFetchingMore,
    hasMore,
    loadData,
    loadMoreTransactions,
    deleteTransaction,
  };
};