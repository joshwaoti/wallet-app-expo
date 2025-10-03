import React, { useEffect } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import Svg, { Path, G, Circle, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import Animated, { useSharedValue, useAnimatedProps, withTiming } from "react-native-reanimated";

const { width } = Dimensions.get("window");
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ExpenseLineGraph = ({ data }) => {
  const { theme } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000 });
  }, []);

  const allExpenses = data && data.length > 0 ? data.map(item => Math.abs(parseFloat(item.expenses))) : [0];
  const maxExpense = Math.max(...allExpenses);
  const minExpense = Math.min(...allExpenses);

  const chartWidth = data && data.length > 0 ? Math.max(width - 40, data.length * 50) : width - 40;
  const chartHeight = 120;
  const padding = 20;

  const animatedProps = useAnimatedProps(() => {
    const length = 1000; // A large enough number
    return {
      strokeDashoffset: length - length * progress.value,
    };
  });

  if (!data || data.length === 0) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: theme.textLight}}>No data available</Text>
      </View>
    );
  }

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
              fill={theme.expense}
              stroke={theme.white}
              strokeWidth="2"
            />
            <SvgText
              x={x}
              y={y - 10}
              textAnchor="middle"
              fill={theme.text}
              fontSize="12"
              fontWeight="bold"
            >
              {`$${Math.abs(parseFloat(data[0].expenses)).toFixed(2)}`}
            </SvgText>
            <SvgText
              x={x}
              y={y + 15}
              textAnchor="middle"
              fill={theme.textLight}
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
              <Stop offset="0%" stopColor={theme.expense} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={theme.primary} stopOpacity="0.8" />
            </LinearGradient>
          </Defs>
          <AnimatedPath
            d={pathData}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeDasharray={1000}
            animatedProps={animatedProps}
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * (chartWidth - padding * 2) + padding;
            const y = chartHeight - padding - ((Math.abs(parseFloat(item.expenses)) - minExpense) / (maxExpense - minExpense || 1)) * (chartHeight - padding * 2);
            return (
              <G key={index} x={x} y={y}>
                <Circle r="4" fill={theme.expense} stroke={theme.white} strokeWidth="1" />
                <SvgText
                  x="0"
                  y="-10"
                  textAnchor="middle"
                  fill={theme.text}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {`$${Math.abs(parseFloat(item.expenses)).toFixed(0)}`}
                </SvgText>
                <SvgText
                  x="0"
                  y="15"
                  textAnchor="middle"
                  fill={theme.textLight}
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

export default ExpenseLineGraph;