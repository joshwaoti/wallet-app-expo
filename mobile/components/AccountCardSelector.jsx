import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const AccountCardSelector = ({
  selectedAccount,
  accounts,
  onPress,
  style,
}) => {
  const displayAccountName = selectedAccount
    ? accounts.find((acc) => acc.id === selectedAccount)?.name || 'Select Account'
    : 'Select Account';

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
      <Ionicons name="wallet-outline" size={22} color={COLORS.textLight} style={styles.icon} />
      <Text style={styles.accountName}>{displayAccountName}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  accountName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
});

export default AccountCardSelector;
