import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { THEMES } from '@/constants/colors';

export default function Themes() {
  const { theme, changeTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Select a Theme</Text>
      {Object.keys(THEMES).map((themeName) => (
        <TouchableOpacity
          key={themeName}
          style={[
            styles.themeOption,
            { backgroundColor: THEMES[themeName].primary },
          ]}
          onPress={() => changeTheme(themeName)}
        >
          <Text style={styles.themeName}>{themeName}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  themeOption: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  themeName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});
