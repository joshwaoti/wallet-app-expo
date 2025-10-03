import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";

const SafeScreen = ({ children }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, flex: 1, backgroundColor: theme.background }}>
      {children}
    </View>
  );
};

export default SafeScreen;