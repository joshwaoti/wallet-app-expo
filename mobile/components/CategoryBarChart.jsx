import React, { useEffect } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import Svg, { Rect, G, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

const { width } = Dimensions.get("window");

const CategoryBarChart = ({ data }) => {
  const { theme } = useTheme();
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    animatedHeight.value = withTiming(1, { duration: 500 });
  }, []);

  const maxAmount = data && data.length > 0 ? Math.max(...data.map((item) => Math.abs(parseFloat(item.amount)))) : 0;
  const chartHeight = 150;
  const barWidth = 30;
  const spacing = 20;
  const totalWidth = data && data.length > 0 ? data.length * (barWidth + spacing) : 0;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value * chartHeight,
    };
  });

  if (!data || data.length === 0) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: theme.textLight}}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Animated.View style={animatedStyle}>
          <Svg height={chartHeight} width={Math.max(width - 40, totalWidth)} style={{ marginTop: 10 }}>
            {data.map((item, index) => {
              const barHeight = (Math.abs(parseFloat(item.amount)) / maxAmount) * (chartHeight - 30);
              const x = index * (barWidth + spacing) + spacing / 2;
              const y = chartHeight - barHeight - 20;

              return (
                <G key={`${item.category_name}-${index}`} x={x}>
                  <Rect
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={theme.primary}
                    rx={5}
                    ry={5}
                  />
                  <SvgText
                    x={barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fill={theme.text}
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {Math.abs(parseInt(item.amount))}
                  </SvgText>
                  <SvgText
                    x={barWidth / 2}
                    y={chartHeight - 5}
                    textAnchor="middle"
                    fill={theme.textLight}
                    fontSize="10"
                    rotation="-45"
                    origin={`${barWidth / 2},${chartHeight - 5}`}
                  >
                    {item.category_name}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default CategoryBarChart;