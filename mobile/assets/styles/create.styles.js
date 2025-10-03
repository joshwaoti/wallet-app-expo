import { StyleSheet } from 'react-native';

export const getCreateStyles = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    backButton: {
      padding: 5,
    },
    saveButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButton: {
      fontSize: 16,
      color: theme.primary,
      fontWeight: '600',
    },
    card: {
      backgroundColor: theme.card,
      margin: 16,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    typeSelector: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 10,
    },
    typeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: theme.border,
    },
    typeButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    typeIcon: {
      marginRight: 8,
    },
    typeButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '500',
    },
    typeButtonTextActive: {
      color: theme.white,
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 16,
      marginBottom: 20,
    },
    currencySymbol: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
      marginRight: 8,
    },
    amountInput: {
      flex: 1,
      fontSize: 36,
      fontWeight: 'bold',
      color: theme.text,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
      backgroundColor: theme.white,
    },
    inputIcon: {
      marginHorizontal: 12,
    },
    input: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: theme.text,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 15,
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.white,
    },
    categoryButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    categoryIcon: {
      marginRight: 6,
    },
    categoryButtonText: {
      color: theme.text,
      fontSize: 14,
    },
    categoryButtonTextActive: {
      color: theme.white,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.card,
      borderRadius: 20,
      marginTop: 20,
    },
    errorText: {
      color: theme.expense,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 10,
    },
    picker: {
      height: 50,
      width: '100%',
      color: theme.text,
    },
    pickerItem: {
      fontSize: 16,
      color: theme.text,
    },
  });
};