import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const TransactionPopup = ({
  visible,
  transaction,
  onAddTransaction,
  onDismiss,
  categories = ['Shopping', 'Bills', 'Entertainment', 'Food', 'Transport', 'Health'],
  userId,
  accountId,
  onViewDetails, // Destructure new prop
  onReportIncorrectExtraction,
}) => {
  const [editedTitle, setEditedTitle] = useState(transaction.title || '');
  const [selectedCategory, setSelectedCategory] = useState(transaction.category || categories[0]); // Default or inferred category
  const slideAnim = useState(new Animated.Value(height))[0]; // Initial position off-screen

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0, // Slide up to show
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height, // Slide down to hide
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleAddTransaction = () => {
    const finalTransaction = {
      ...transaction,
      title: editedTitle,
      category: selectedCategory,
      // Ensure all required fields are present, even if they are optional from extractor
      id: transaction.id || `temp-id-${Date.now()}`,
      messageId: transaction.messageId || `temp-message-id-${Date.now()}`,
      type: transaction.type || "UNKNOWN", // Changed from enum to string
      amount: transaction.amount || 0,
      currency: transaction.currency || 'USD',
      merchant: transaction.merchant || 'Unknown',
      timestamp: transaction.timestamp || new Date(),
      rawMessage: transaction.rawMessage || '',
      confidence: transaction.confidence || 0,
      source: transaction.source || 'sms',
    };
    onAddTransaction(finalTransaction, userId, accountId);
  };

  const amountColor = transaction.type === "DEBIT" ? styles.expenseText : styles.incomeText; // Changed from enum to string

  if (!visible && slideAnim.__getValue() === height) {
    return null; // Don't render if not visible and already off-screen
  }

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <BlurView intensity={20} style={styles.absolute}>
        <Animated.View style={[
          styles.popupContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.contentContainer}>
              <Text style={styles.title}>New Transaction Detected</Text>

              <View style={styles.transactionDetails}>
                {transaction.merchant && (
                  <Text style={styles.merchantText}>from &quot;{transaction.merchant}&quot;</Text>
                )}
                <Text style={[styles.amountText, amountColor]}>
                  {transaction.type === "DEBIT" ? '-' : '+'}{transaction.currency} {transaction.amount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Transaction Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  placeholder="Enter transaction title"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        selectedCategory === category && styles.selectedCategoryButton,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        selectedCategory === category && styles.selectedCategoryButtonText,
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
                  <Text style={styles.addButtonText}>Add Transaction</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
                  <Text style={styles.dismissButtonText}>Dismiss</Text>
                </TouchableOpacity>
                {transaction.id && (
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => onViewDetails(transaction.id)}
                  >
                    <Text style={styles.viewDetailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                )}
                {transaction.rawMessage && transaction.id && (
                  <TouchableOpacity
                    style={styles.reportButton}
                    onPress={() => onReportIncorrectExtraction(transaction.rawMessage, transaction, userId)}
                  >
                    <Text style={styles.reportButtonText}>Report Incorrect</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  popupContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Light glassmorphic effect
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 20,
    height: height * 0.7, // Occupy 70% of screen height
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4A3428',
    marginBottom: 10,
  },
  transactionDetails: {
    alignItems: 'center',
    marginBottom: 20,
  },
  merchantText: {
    fontSize: 14,
    color: '#4A3428',
    opacity: 0.7,
    marginBottom: 5,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  expenseText: {
    color: '#E74C3C',
  },
  incomeText: {
    color: '#2ECC71',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A3428',
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: 'rgba(240, 240, 240, 0.7)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#4A3428',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: 'rgba(240, 240, 240, 0.7)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  selectedCategoryButton: {
    backgroundColor: '#8B593E',
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#4A3428',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  addButton: {
    backgroundColor: '#8B593E',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#8B593E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A0A0A0',
  },
  dismissButtonText: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '500',
  },
  viewDetailsButton: {
    backgroundColor: '#5F8670',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#5F8670',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#FFC107', // A distinct color for reporting
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TransactionPopup;
