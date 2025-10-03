import { View, StyleSheet, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import TabBarButton from './TabBarButton.jsx';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

const TabBar = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const filteredRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    return options.tabBarItemStyle?.display !== 'none';
  });

  const buttonWidth = dimensions.width / filteredRoutes.length;

  const tabPositionX = useSharedValue(0);

  useEffect(() => {
    const focusedRoute = state.routes[state.index];
    const focusedFilteredIndex = filteredRoutes.findIndex(route => route.key === focusedRoute.key);
    if (focusedFilteredIndex !== -1) {
      tabPositionX.value = withSpring(buttonWidth * focusedFilteredIndex, { duration: 500 });
    }
  }, [state.index, buttonWidth, filteredRoutes]);

  const onTabBarLayout = (e) => {
    setDimensions({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    });
  };

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPositionX.value }],
    };
  });

  return (
    <View style={styles.tabBarContainer}>

      <View onLayout={onTabBarLayout} style={styles.tabBar}>
        {filteredRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === state.routes.indexOf(route);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
            tabPositionX.value = withSpring(buttonWidth * index, { duration: 500 });
          };

          return (
            <TabBarButton
              key={route.key}
              routeName={route.name}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              color={isFocused ? theme.white : theme.textLight}
            />
          );
        })}
      </View>
    </View>
  );
};

export default TabBar;

const getStyles = (theme) => StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.card,
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  activeBackground: {
    position: 'absolute',
    height: 45,
    borderRadius: 22.5,
  },
});
