import { useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { Tabs } from "expo-router/tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import TabBar from "@/components/TabBar.jsx";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Layout() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null; // this is for a better ux

  if (!isSignedIn) return <Redirect href={"/sign-in"} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: "Accounts",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="wallet-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: "Budgets",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cash-multiple" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: "Statistics",
            tabBarIcon: ({ color }) => (
              <Ionicons name="stats-chart-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            href: null, // Hide this tab from the tab bar
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            href: null, // Hide this tab from the tab bar
            tabBarLabel: () => null, // Hide label for the FAB
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add-account"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="sms-settings"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="themes"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
