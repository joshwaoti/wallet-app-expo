import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/colors";
import { BlurView } from "expo-blur";
import Svg, { Rect, G, Text as SvgText, Defs, LinearGradient, Stop, Path, Circle } from "react-native-svg";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { width } = Dimensions.get("window");

const CategoryBarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={statsStyles.noDataContainer}>
        <Text style={statsStyles.noDataText}>No spending data available for this period.</Text>
      </View>
    );
  }

  const maxAmount = Math.max(...data.map((item) => Math.abs(parseFloat(item.amount))));
  const chartHeight = 150;
  const barWidth = 30;
  const spacing = 20;
  const totalWidth = data.length * (barWidth + spacing);

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg height={chartHeight} width={Math.max(width - 40, totalWidth)} style={{ marginTop: 10 }}>
          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = (Math.abs(parseFloat(item.amount)) / maxAmount) * (chartHeight - 30); // 30 for text labels
            const x = index * (barWidth + spacing) + spacing / 2;
            const y = chartHeight - barHeight - 20; // 20 for category label

            return (
              <G key={item.category} x={x}>
                <Rect
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={COLORS.primary}
                  rx={5} // Rounded corners
                  ry={5}
                />
                <SvgText
                  x={barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fill={COLORS.text}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {Math.abs(parseInt(item.amount)) // Display absolute integer amount
                  }
                </SvgText>
                <SvgText
                  x={barWidth / 2}
                  y={chartHeight - 5}
                  textAnchor="middle"
                  fill={COLORS.textLight}
                  fontSize="10"
                  rotation="-45"
                  origin={`${barWidth / 2},${chartHeight - 5}`}
                >
                  {item.category}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
};

const ExpenseLineGraph = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={statsStyles.noDataContainer}>
        <Text style={statsStyles.noDataText}>No expense history available for this period.</Text>
      </View>
    );
  }

  const allExpenses = data.map(item => Math.abs(parseFloat(item.expenses)));
  const maxExpense = Math.max(...allExpenses);
  const minExpense = Math.min(...allExpenses);

  const chartWidth = Math.max(width - 40, data.length * 50); // Minimum width or based on data points
  const chartHeight = 120;
  const padding = 20;

  if (data.length === 1) {
    const x = chartWidth / 2;
    const y = chartHeight - padding - ((Math.abs(parseFloat(data[0].expenses)) - minExpense) / (maxExpense - minExpense || 1)) * (chartHeight - padding * 2);
    return (
      <View style={{ width: "100%", alignItems: "center" }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Svg width={chartWidth} height={chartHeight}>
            <Circle
              cx={x}
              cy={y}
              r="6"
              fill={COLORS.expense}
              stroke={COLORS.white}
              strokeWidth="2"
            />
            <SvgText
              x={x}
              y={y - 10} // Position text above the circle
              textAnchor="middle"
              fill={COLORS.text}
              fontSize="12"
              fontWeight="bold"
            >
              {`$${Math.abs(parseFloat(data[0].expenses)).toFixed(2)}`}
            </SvgText>
            <SvgText
              x={x}
              y={y + 15} // Position text below the circle
              textAnchor="middle"
              fill={COLORS.textLight}
              fontSize="10"
            >
              {data[0].date}
            </SvgText>
          </Svg>
        </ScrollView>
      </View>
    );
  }

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * (chartWidth - padding * 2) + padding;
    const y = chartHeight - padding - ((Math.abs(parseFloat(item.expenses)) - minExpense) / (maxExpense - minExpense || 1)) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  const pathData = `M${points.split(" ")[0]} C${points.substring(points.split(" ")[0].length)}`;

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={COLORS.expense} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0.8" />
            </LinearGradient>
          </Defs>
          {/* Line */}
          <Path
            d={pathData}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
          />
          {/* Points and Labels */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * (chartWidth - padding * 2) + padding;
            const y = chartHeight - padding - ((Math.abs(parseFloat(item.expenses)) - minExpense) / (maxExpense - minExpense || 1)) * (chartHeight - padding * 2);
            return (
              <G key={index} x={x} y={y}>
                <Circle r="4" fill={COLORS.expense} stroke={COLORS.white} strokeWidth="1" />
                <SvgText
                  x="0"
                  y="-10"
                  textAnchor="middle"
                  fill={COLORS.text}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {`$${Math.abs(parseFloat(item.expenses)).toFixed(0)}`}
                </SvgText>
                <SvgText
                  x="0"
                  y="15"
                  textAnchor="middle"
                  fill={COLORS.textLight}
                  fontSize="8"
                >
                  {item.date}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
};

export default function StatisticsScreen() {
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
      const response = await fetch(`${API_URL}/statistics/${user.id}?period=${selectedPeriod}`); // Updated route and using fetch
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
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ color: COLORS.textLight, marginTop: 10 }}>Loading statistics...</Text>
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
              <Text style={[statsStyles.summaryAmount, { color: COLORS.income }]}>${statisticsData.totalIncome}</Text>
            </BlurView>

            <BlurView intensity={20} tint="light" style={statsStyles.summaryCard}>
              <Text style={statsStyles.summaryTitle}>Total Expenses</Text>
              <Text style={[statsStyles.summaryAmount, { color: COLORS.expense }]}>${Math.abs(parseFloat(statisticsData.totalExpenses)).toFixed(2)}</Text>
            </BlurView>

            <BlurView intensity={20} tint="light" style={statsStyles.chartCard}>
              <Text style={statsStyles.chartTitle}>Spending by Category</Text>
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

const statsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 5,
    shadowColor: COLORS.shadow,
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
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    color: COLORS.textLight,
    fontWeight: "600",
  },
  periodButtonTextActive: {
    color: COLORS.white,
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
    color: COLORS.textLight,
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
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
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
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 150,
    backgroundColor: COLORS.background,
    borderRadius: 15,
    marginTop: 10,
  },
  noDataText: {
    color: COLORS.textLight,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
