import { View, ActivityIndicator } from "react-native";
import { getHomeStyles } from "../assets/styles/home.styles";
import { useTheme } from "@/hooks/useTheme";

const PageLoader = ({ visible }) => {
  const { theme } = useTheme();
  const styles = getHomeStyles(theme);
  if (!visible) return null;

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
};
export default PageLoader;