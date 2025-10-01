import { Slot, useSegments, router } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { smsMonitorService } from "../lib/SMSMonitorService";
import { Alert } from 'react-native';
import { overlayManager } from "../lib/OverlayManager"; // Import overlayManager
import { storeParsedTransaction } from "../lib/storage"; // Import storeParsedTransaction
import { getSMSSettings } from "../lib/storage";
import { reportIncorrectExtraction } from "../lib/transactionService"; // Import reportIncorrectExtraction

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user?.id) {
      const currentUserId = user.id;
      // TODO: Fetch defaultAccountId dynamically based on user's primary account
      // For now, using a placeholder/mock ID
      const defaultAccountId = 'mock_account_id_123'; 

      smsMonitorService.setUserId(currentUserId);
      smsMonitorService.setDefaultAccountId(defaultAccountId);

      // Initialize OverlayManager callbacks
      overlayManager.setPopupCallbacks(
        (transaction) => { /* onShowPopup - usually handled by TransactionPopup component */ },
        () => { /* onDismissPopup - usually handled by TransactionPopup component */ },
        (transaction) => { Alert.alert('New Transaction', `In-app: ${transaction.title} ${transaction.amount}`); }, // onShowInAppNotification
        async (transaction, userId, accountId) => {
          await storeParsedTransaction(transaction, userId, accountId);
          Alert.alert('Transaction Added', `Successfully added ${transaction.title} of ${transaction.amount}`);
        },
        (transactionId) => { router.push(`/transactions/${transactionId}`); }, // onViewDetails
        async (rawMessage, parsedTransaction, userId) => {
          await reportIncorrectExtraction(rawMessage, parsedTransaction, userId);
          Alert.alert('Feedback Submitted', 'Thank you for reporting the incorrect extraction. We will review it.');
        } // onReportIncorrectExtraction
      );

      const initializeMonitoring = async () => {
        const settings = await getSMSSettings(); // Assuming getSMSSettings is available
        if (settings?.enabled) {
          const started = await smsMonitorService.startMonitoring();
          if (!started) {
            Alert.alert('SMS Monitoring Failed', 'Could not start SMS monitoring. Please check permissions in settings.');
          }
        }
      };
      initializeMonitoring();
    } else {
      // If signed out, stop monitoring and clear user info
      smsMonitorService.stopMonitoring();
      smsMonitorService.setUserId(null);
      smsMonitorService.setDefaultAccountId(null);
    }
  }, [isSignedIn, isLoaded, user?.id]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <SafeScreen>
        <InitialLayout />
      </SafeScreen>
      <StatusBar style="dark" />
    </ClerkProvider>
  );
}
