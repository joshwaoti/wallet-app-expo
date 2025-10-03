// react custom hook file

import { useCallback, useState } from "react";
import { Alert } from "react-native";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// const API_URL = "https://wallet-api-cxqp.onrender.com/api";
// const API_URL = "http://localhost:5001/api";

export const useTransactions = (userId) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const PAGE_SIZE = 20; // Number of transactions per page

  const fetchTransactions = useCallback(async (page = 1, append = false) => {
    if (!userId) return;
    if (isFetchingMore && append) return; // Prevent multiple fetches
    if (!hasMore && append) return; // No more data to fetch

    if (append) setIsFetchingMore(true);
    else setIsLoading(true);

    try {
      const offset = (page - 1) * PAGE_SIZE;
      const response = await fetch(`${API_URL}/transactions/${userId}?limit=${PAGE_SIZE}&offset=${offset}`);
      const data = await response.json();

      if (append) {
        setTransactions((prev) => [...prev, ...data]);
      } else {
        setTransactions(data);
      }
      setHasMore(data.length === PAGE_SIZE);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Alert.alert("Error", "Failed to load transactions.");
    } finally {
      if (append) setIsFetchingMore(false);
      else setIsLoading(false);
    }
  }, [userId, isFetchingMore, hasMore]);

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

  const loadData = useCallback(async (refresh = false) => {
    if (!userId) return;

    if (refresh) {
      setCurrentPage(1);
      setHasMore(true);
      setIsLoading(true);
    } else {
      setIsLoading(true);
    }

    try {
      await Promise.all([
        fetchTransactions(1, false), // Fetch first page of transactions
        fetchSummary(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchSummary, userId]);

  const loadMoreTransactions = useCallback(() => {
    if (hasMore && !isLoading && !isFetchingMore) {
      fetchTransactions(currentPage + 1, true);
    }
  }, [hasMore, isLoading, isFetchingMore, currentPage, fetchTransactions]);

  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete transaction");

      loadData(true); // Refresh all data after deletion
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
    loadData,
    deleteTransaction,
    loadMoreTransactions,
    hasMore,
    isFetchingMore,
  };
};
