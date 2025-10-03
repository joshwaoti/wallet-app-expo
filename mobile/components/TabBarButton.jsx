import { StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

const PILL_WIDTH = 84;
const PILL_HEIGHT = 44;

const TabBarButton = (props) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { isFocused, onPress, routeName, color, label } = props;

  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, { damping: 12, stiffness: 150 });
  }, [isFocused]);

  // pill (background) animated style
  const pillStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [0, 1]);
    // move pill slightly up when focused so it sits centered behind icon
    const translateY = interpolate(scale.value, [0, 1], [8, 0]);
    const pillScale = interpolate(scale.value, [0, 1], [0.85, 1]); // small pop
    return {
      opacity,
      transform: [{ translateY }, { scale: pillScale }],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    const iconScale = interpolate(scale.value, [0, 1], [1, 1.08]);
    // small upward nudge so icon visually centers inside pill
    const translateY = interpolate(scale.value, [0, 1], [0, 2]);
    return {
      transform: [{ scale: iconScale }, { translateY }],
    };
  });

  const getIcon = (name, iconColor, size) => {
    switch (name) {
      case 'index':
        return <Ionicons name="home-outline" size={size} color={iconColor} />;
      case 'accounts':
        return <MaterialCommunityIcons name="wallet-outline" size={size} color={iconColor} />;
      case 'budgets':
        return <MaterialCommunityIcons name="cash-multiple" size={size} color={iconColor} />;
      case 'statistics':
        return <Ionicons name="stats-chart-outline" size={size} color={iconColor} />;
      case 'settings':
        return <Ionicons name="settings-outline" size={size} color={iconColor} />;
      default:
        return <Ionicons name="help-circle-outline" size={size} color={iconColor} />;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={styles.container}
    >
      {/* pill background - render first so icon sits on top */}
      <Animated.View
        style={[
          styles.pill,
          pillStyle,
          // change color when focused
          { backgroundColor: isFocused ? theme.primary : 'transparent' },
        ]}
      />

      {/* icon */}
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        {getIcon(routeName, isFocused ? theme.white : theme.textLight, 24)}
      </Animated.View>

      {/* optional label */}
      {typeof label === 'string' && (
        <Animated.Text style={[styles.label]}>
          {label}
        </Animated.Text>
      )}
    </TouchableOpacity>
  );
};

export default TabBarButton;

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    // center everything horizontally inside each tab
    justifyContent: 'center',
    alignItems: 'center',
    // allow the pill/shadow to overflow outside the tab row if needed
    overflow: 'visible',
    paddingVertical: 8,
  },
  pill: {
    // absolutely positioned behind the icon (centered by alignSelf)
    position: 'absolute',
    alignSelf: 'center',
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    // subtle shadow (iOS + Android)
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
    // ensure pill sits under icon
    zIndex: 0,
  },
  iconContainer: {
    // icon sits above the pill
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
    width: 30,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: theme.textLight,
    zIndex: 1,
  },
});
