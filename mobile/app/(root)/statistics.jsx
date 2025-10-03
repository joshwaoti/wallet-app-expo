import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { useTheme } from "@/hooks/useTheme";
import { BlurView } from "expo-blur";
import CategoryBarChart from "@/components/CategoryBarChart";
import ExpenseLineGraph from "@/components/ExpenseLineGraph";
import CategoryPieChart from "@/components/CategoryPieChart";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function StatisticsScreen() {
  const { theme } = useTheme();
  const statsStyles = getStatsStyles(theme);
  const { user } = useUser();
  const [statisticsData, setStatisticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month"); // month, year, week, all
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatistics = useCallback(async () => {
    if (!user?.id) return;
    if (!refreshing) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/statistics/${user.id}?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStatisticsData(data);
    } catch (_err) {
      console.error("Error fetching statistics:", _err);
      setError("Failed to load statistics. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedPeriod, refreshing]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStatistics();
  }, [fetchStatistics]);

  const topCategory = statisticsData?.spendingByCategory?.[0]?.category_name;
  const dailyAverage = statisticsData?.totalExpenses / 30; // Assuming a 30-day month for simplicity

  return (
    <SafeAreaView style={statsStyles.container}>
      <ScrollView
        contentContainerStyle={statsStyles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={statsStyles.header}>
          <Text style={statsStyles.headerTitle}>Statistics</Text>
          <View style={statsStyles.periodSelector}>
            <TouchableOpacity
              style={[statsStyles.periodButton, selectedPeriod === "week" && statsStyles.periodButtonActive]}
              onPress={() => setSelectedPeriod("week")}
            >
              <Text style={[statsStyles.periodButtonText, selectedPeriod === "week" && statsStyles.periodButtonTextActive]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[statsStyles.periodButton, selectedPeriod === "month" && statsStyles.periodButtonActive]}
              onPress={() => setSelectedPeriod("month")}
            >
              <Text style={[statsStyles.periodButtonText, selectedPeriod === "month" && statsStyles.periodButtonTextActive]}>Month</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[statsStyles.periodButton, selectedPeriod === "year" && statsStyles.periodButtonActive]}
              onPress={() => setSelectedPeriod("year")}
            >
              <Text style={[statsStyles.periodButtonText, selectedPeriod === "year" && statsStyles.periodButtonTextActive]}>Year</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={statsStyles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.textLight, marginTop: 10 }}>Loading statistics...</Text>
          </View>
        ) : error ? (
          <View style={statsStyles.errorContainer}>
            <Text style={statsStyles.errorText}>{error}</Text>
            <TouchableOpacity style={statsStyles.retryButton} onPress={fetchStatistics}>
              <Text style={statsStyles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (statisticsData && (
          <>
            <BlurView intensity={20} tint="light" style={statsStyles.summaryCard}>
              <Text style={statsStyles.summaryTitle}>Total Income</Text>
              <Text style={[statsStyles.summaryAmount, { color: theme.income }]}>${statisticsData.totalIncome}</Text>
            </BlurView>

            <BlurView intensity={20} tint="light" style={statsStyles.summaryCard}>
              <Text style={statsStyles.summaryTitle}>Total Expenses</Text>
              <Text style={[statsStyles.summaryAmount, { color: theme.expense }]}>${Math.abs(parseFloat(statisticsData.totalExpenses)).toFixed(2)}</Text>
            </BlurView>

            <BlurView intensity={20} tint="light" style={statsStyles.summaryCard}>
              <Text style={statsStyles.summaryTitle}>Top Spending Category</Text>
              <Text style={statsStyles.summaryAmount}>{topCategory || "N/A"}</Text>
            </BlurView>

            <BlurView intensity={20} tint="light" style={statsStyles.summaryCard}>
              <Text style={statsStyles.summaryTitle}>Daily Average Spending</Text>
              <Text style={statsStyles.summaryAmount}>${Math.abs(dailyAverage).toFixed(2)}</Text>
            </BlurView>

            <BlurView intensity={20} tint="light" style={statsStyles.chartCard}>
              <Text style={statsStyles.chartTitle}>Spending by Category</Text>
              <CategoryPieChart data={statisticsData.spendingByCategory} />
            </BlurView>

            <BlurView intensity={20} tint="light" style={statsStyles.chartCard}>
              <Text style={statsStyles.chartTitle}>Spending by Category (Bar)</Text>
              <CategoryBarChart data={statisticsData.spendingByCategory} />
            </BlurView>

            <BlurView intensity={20} tint="light" style={statsStyles.chartCard}>
              <Text style={statsStyles.chartTitle}>Expense History</Text>
              <ExpenseLineGraph data={statisticsData.timeSeries} />
            </BlurView>
          </>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatsStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
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
  periodSelector: {
    flexDirection: "row",
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 5,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  periodButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  periodButtonActive: {
    backgroundColor: theme.primary,
  },
  periodButtonText: {
    color: theme.textLight,
    fontWeight: "600",
  },
  periodButtonTextActive: {
    color: theme.white,
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  summaryTitle: {
    fontSize: 16,
    color: theme.textLight,
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "bold",
  },
  chartCard: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
    minHeight: 250, // Increased height
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
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
});
