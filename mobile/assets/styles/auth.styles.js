import { StyleSheet } from 'react-native';

export const getAuthStyles = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 20,
      justifyContent: 'center',
    },
    illustration: {
      height: 310,
      width: 300,
      resizeMode: 'contain',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
      marginVertical: 15,
      textAlign: 'center',
    },
    input: {
      backgroundColor: theme.white,
      borderRadius: 12,
      padding: 15,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
      fontSize: 16,
      color: theme.text,
    },
    errorInput: {
      borderColor: theme.expense,
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 20,
    },
    buttonText: {
      color: theme.white,
      fontSize: 18,
      fontWeight: '600',
    },
    footerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    footerText: {
      color: theme.text,
      fontSize: 16,
    },
    linkText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    verificationContainer: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    verificationTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    verificationInput: {
      backgroundColor: theme.white,
      borderRadius: 12,
      padding: 15,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
      fontSize: 16,
      color: theme.text,
      width: '100%',
      textAlign: 'center',
      letterSpacing: 2,
    },
    errorBox: {
      backgroundColor: '#FFE5E5',
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.expense,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    errorText: {
      color: theme.text,
      marginLeft: 8,
      flex: 1,
      fontSize: 14,
    },
  });
};