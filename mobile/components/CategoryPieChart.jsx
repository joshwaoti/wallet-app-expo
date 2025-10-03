import React from "react";
import { View, Text } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";

const CategoryPieChart = ({ data }) => {
  const { theme } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: theme.textLight}}>No data available</Text>
      </View>
    );
  }

  const totalAmount = data.reduce((acc, item) => acc + Math.abs(parseFloat(item.amount)), 0);
  let startAngle = 0;

  const colors = [theme.primary, theme.income, theme.expense, theme.textLight, theme.border];

  const pieSlices = data.map((item, index) => {
    const angle = (Math.abs(parseFloat(item.amount)) / totalAmount) * 360;
    const endAngle = startAngle + angle;
    const largeArcFlag = angle > 180 ? 1 : 0;

    const x1 = 50 + 40 * Math.cos((Math.PI / 180) * startAngle);
    const y1 = 50 + 40 * Math.sin((Math.PI / 180) * startAngle);
    const x2 = 50 + 40 * Math.cos((Math.PI / 180) * endAngle);
    const y2 = 50 + 40 * Math.sin((Math.PI / 180) * endAngle);

    const d = `M50,50 L${x1},${y1} A40,40 0 ${largeArcFlag},1 ${x2},${y2} Z`;

    startAngle = endAngle;

    return <Path key={`${item.category_name}-${index}`} d={d} fill={colors[index % colors.length]} />;
  });

  return (
    <View style={{ alignItems: "center" }}>
      <Svg height="100" width="100" viewBox="0 0 100 100">
        <G>{pieSlices}</G>
      </Svg>
    </View>
  );
};

export default CategoryPieChart;