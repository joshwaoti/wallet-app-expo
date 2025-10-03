import { StyleSheet } from 'react-native';

export const getAddCategoryModalStyles = (theme) => {
  return StyleSheet.create({
    blurContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: '80%',
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 10,
      alignSelf: 'flex-start',
    },
    inputContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
      backgroundColor: theme.white,
    },
    input: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: theme.text,
    },
    iconContainer: {
      width: '100%',
      marginBottom: 20,
    },
    iconButton: {
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 10,
    },
    iconButtonSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    createButton: {
      width: '100%',
      backgroundColor: theme.primary,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 10,
    },
    createButtonText: {
      color: theme.white,
      fontWeight: 'bold',
      fontSize: 16,
    },
    closeButton: {
      marginTop: 20,
      backgroundColor: theme.primary,
      padding: 10,
      borderRadius: 8,
    },
    closeButtonText: {
      color: theme.white,
      fontWeight: 'bold',
    },
  });
};
