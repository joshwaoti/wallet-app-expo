import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

const AccountSelectionModal = ({
  isVisible,
  onClose,
  accounts,
  selectedAccount,
  onSelectAccount,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const renderAccountItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.accountItem,
        selectedAccount === item.id && styles.selectedAccountItem,
      ]}
      onPress={() => onSelectAccount(item.id)}
    >
      <Ionicons
        name="wallet-outline"
        size={24}
        color={selectedAccount === item.id ? theme.white : theme.text}
        style={styles.accountIcon}
      />
      <Text
        style={[
          styles.accountName,
          selectedAccount === item.id && styles.selectedAccountName,
        ]}
      >
        {item.name}
      </Text>
      {selectedAccount === item.id && (
        <Ionicons name="checkmark-circle" size={20} color={theme.white} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Account</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {accounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No accounts available.</Text>
            </View>
          ) : (
            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderAccountItem}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.background,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedAccountItem: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  accountIcon: {
    marginRight: 10,
  },
  accountName: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  selectedAccountName: {
    color: theme.white,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: theme.textLight,
    fontSize: 16,
  },
});

export default AccountSelectionModal;