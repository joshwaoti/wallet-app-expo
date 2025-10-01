/**
 * Overlay Manager Service
 *
 * This service handles system overlay permissions and popup display coordination.
 * It includes functions for requesting and checking overlay permissions, managing
 * a queue of popups, and providing fallback logic for in-app notifications.
 */

import { Platform, AppState, AppStateStatus } from 'react-native';

import { getSMSSettings } from './storage';

// Native module for Android overlay permission (requires a custom native module or a well-configured library)
// For Expo Go, direct SYSTEM_ALERT_WINDOW permission request is not available through expo-permissions alone.
// This is a conceptual implementation assuming such a native module or a bare workflow setup.

// We'll mock this or provide a fallback for non-bare Expo projects.
const NativeOverlayModule = {
  requestOverlayPermission: async () => {
    console.warn('NativeOverlayModule.requestOverlayPermission: Not implemented in Expo Go. Always returning true for testing.');
    return true;
  },
  hasOverlayPermission: async () => {
    console.warn('NativeOverlayModule.hasOverlayPermission: Not implemented in Expo Go. Always returning true for testing.');
    return true;
  },
  isDeviceLocked: async () => {
    console.warn('NativeOverlayModule.isDeviceLocked: Using AppState for basic check. May not be fully accurate for lock screen.');
    return AppState.currentState !== 'active'; // Simplified check: if app is not active, assume device might be locked or in background
  },
  hasOtherOverlaysActive: async () => {
    console.warn('NativeOverlayModule.hasOtherOverlaysActive: Not implemented in Expo Go. Always returning false.');
    return false;
  },
};

export class OverlayManager {
  static instance;
  popupQueue = [];
  isPopupVisible = false;
  popupDismissTimer = null;
  onShowPopupCallback = null;
  onDismissPopupCallback = null;
  onShowInAppNotificationCallback = null;
  onAddTransactionCallback = null; // New callback
  onViewDetailsCallback = null; // New callback
  onReportIncorrectExtractionCallback = null; // New callback for reporting

  constructor() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  static getInstance() {
    if (!OverlayManager.instance) {
      OverlayManager.instance = new OverlayManager();
    }
    return OverlayManager.instance;
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      console.log('App has come to the foreground, processing queued popups.');
      this.processQueue();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      console.log('App has gone to background/inactive, pausing popup display.');
      this.hidePopup(); // Hide any active popup when app goes to background
    }
  };

  async requestOverlayPermission() {
    if (Platform.OS !== 'android') {
      console.warn('Overlay permissions are Android-specific.');
      return true;
    }
    // In a bare workflow, you'd call a native module here.
    // In Expo Go, this is a simulated permission.
    const granted = await NativeOverlayModule.requestOverlayPermission();
    return granted;
  }

  async hasOverlayPermission() {
    if (Platform.OS !== 'android') {
      return true;
    }
    // In a bare workflow, you'd call a native module here.
    // In Expo Go, this is a simulated permission.
    const hasPermission = await NativeOverlayModule.hasOverlayPermission();
    return hasPermission;
  }

  async getPermissionState() {
    const smsPermissionStatus = (await Permissions.getAsync(Permissions.SMS)).status;
    const overlayPermissionGranted = await this.hasOverlayPermission();

    return {
      smsPermission: smsPermissionStatus === 'granted' ? 'granted' : 'denied',
      overlayPermission: overlayPermissionGranted ? 'granted' : 'denied',
      lastChecked: new Date(),
    };
  }

  setPopupCallbacks(
    onShow,
    onDismiss,
    onShowInAppNotification,
    onAddTransaction,
    onViewDetails, // New callback parameter
    onReportIncorrectExtraction // New callback parameter
  ) {
    this.onShowPopupCallback = onShow;
    this.onDismissPopupCallback = onDismiss;
    this.onShowInAppNotificationCallback = onShowInAppNotification;
    this.onAddTransactionCallback = onAddTransaction;
    this.onViewDetailsCallback = onViewDetails; // Set new callback
    this.onReportIncorrectExtractionCallback = onReportIncorrectExtraction; // Set new callback
  }

  async showTransactionPopup(transaction) {
    const settings = await getSMSSettings();
    
    const useOverlay = settings?.useOverlay ?? true; // Default to true if setting is null/undefined

    if (!useOverlay) {
      console.log('Overlay popups are disabled in settings. Falling back to in-app notification.');
      this.showInAppNotification(transaction);
      return;
    }

    const hasPermission = await this.hasOverlayPermission();
    if (!hasPermission) {
      console.warn('Overlay permission not granted. Cannot show popup. Falling back to in-app notification.');
      this.showInAppNotification(transaction);
      return;
    }

    const isDeviceLocked = await NativeOverlayModule.isDeviceLocked();
    const hasOtherOverlays = await NativeOverlayModule.hasOtherOverlaysActive();

    if (isDeviceLocked || hasOtherOverlays) {
      console.log('Device is locked or other overlays are active. Queuing popup.');
      this.popupQueue.push(transaction);
      return;
    }

    if (this.isPopupVisible) {
      console.log('Popup already visible, queuing new transaction.');
      this.popupQueue.push(transaction);
      return;
    }

    this.displayPopup(transaction);
  }

  displayPopup(transaction) {
    this.isPopupVisible = true;
    if (this.onShowPopupCallback) {
      this.onShowPopupCallback(transaction);
    }
    this.startDismissTimer();
  }

  handleAddTransactionFromPopup(transaction, userId, accountId) {
    if (this.onAddTransactionCallback) {
      this.onAddTransactionCallback(transaction, userId, accountId);
    } else {
      console.warn('onAddTransactionCallback is not set. Cannot add transaction from popup.');
    }
    this.hidePopup(); // Dismiss popup after adding transaction
  }

  handleViewDetailsFromPopup(transactionId) {
    if (this.onViewDetailsCallback) {
      this.onViewDetailsCallback(transactionId);
    } else {
      console.warn('onViewDetailsCallback is not set. Cannot view transaction details from popup.');
    }
    this.hidePopup(); // Dismiss popup after viewing details
  }

  handleReportIncorrectExtractionFromPopup(rawMessage, parsedTransaction, userId) {
    if (this.onReportIncorrectExtractionCallback) {
      this.onReportIncorrectExtractionCallback(rawMessage, parsedTransaction, userId);
    } else {
      console.warn('onReportIncorrectExtractionCallback is not set. Cannot report incorrect extraction.');
    }
    this.hidePopup(); // Dismiss popup after reporting
  }

  hidePopup() {
    if (this.isPopupVisible) {
      this.isPopupVisible = false;
      if (this.onDismissPopupCallback) {
        this.onDismissPopupCallback();
      }
      this.clearDismissTimer();
      this.processQueue();
    }
  }

  showInAppNotification(transaction) {
    if (this.onShowInAppNotificationCallback) {
      this.onShowInAppNotificationCallback(transaction);
    } else {
      console.warn('onShowInAppNotificationCallback is not set. Cannot show in-app notification.');
    }
  }

  startDismissTimer() {
    this.clearDismissTimer();
    const settingsPromise = getSMSSettings();
    settingsPromise.then(settings => {
      const duration = settings?.popupDuration || 30; // Default to 30 seconds
      this.popupDismissTimer = setTimeout(() => {
        console.log('Popup auto-dismissed.');
        this.hidePopup();
      }, duration * 1000);
    });
  }

  clearDismissTimer() {
    if (this.popupDismissTimer) {
      clearTimeout(this.popupDismissTimer);
      this.popupDismissTimer = null;
    }
  }

  processQueue() {
    if (this.popupQueue.length > 0 && !this.isPopupVisible) {
      const nextTransaction = this.popupQueue.shift();
      if (nextTransaction) {
        console.log('Displaying next queued popup.');
        this.displayPopup(nextTransaction);
      }
    }
  }

  isCurrentlyShowingPopup() {
    return this.isPopupVisible;
  }
}

export const overlayManager = OverlayManager.getInstance();
