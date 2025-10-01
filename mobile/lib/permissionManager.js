/**
 * Permission Manager Service
 * 
 * This service handles SMS and overlay permission requests, status checking,
 * state management with secure storage, and permission change detection.
 */

import * as SMS from 'expo-sms';

import * as SecureStore from 'expo-secure-store';
import { Platform, Alert, Linking } from 'react-native';
import {
  ANDROID_PERMISSIONS,
  PERMISSION_MESSAGES,
  PERMISSION_CONFIG,
  PERMISSION_STORAGE_KEYS,
  DEFAULT_SMS_SETTINGS,
} from '../constants/permissions';

export class PermissionManager {
  static instance;
  permissionState = null;
  permissionChangeListeners = [];

  constructor() {
    this.initializePermissionState();
  }

  static getInstance() {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Initialize permission state from secure storage
   */
  async initializePermissionState() {
    try {
      const storedState = await SecureStore.getItemAsync(PERMISSION_STORAGE_KEYS.PERMISSION_STATE);
      if (storedState) {
        this.permissionState = {
          ...JSON.parse(storedState),
          lastChecked: new Date(JSON.parse(storedState).lastChecked)
        };
      } else {
        this.permissionState = {
          smsPermission: 'not-requested',
          overlayPermission: 'not-requested',
          lastChecked: new Date(),
          requestCount: 0
        };
        await this.savePermissionState();
      }
    } catch (error) {
      console.error('Failed to initialize permission state:', error);
      this.permissionState = {
        smsPermission: 'not-requested',
        overlayPermission: 'not-requested',
        lastChecked: new Date(),
        requestCount: 0
      };
    }
  }

  /**
   * Save permission state to secure storage
   */
  async savePermissionState() {
    if (!this.permissionState) return;

    try {
      await SecureStore.setItemAsync(
        PERMISSION_STORAGE_KEYS.PERMISSION_STATE,
        JSON.stringify(this.permissionState)
      );
    } catch (error) {
      console.error('Failed to save permission state:', error);
    }
  }

  /**
   * Get current permission state
   */
  async getPermissionState() {
    if (!this.permissionState) {
      await this.initializePermissionState();
    }
    return this.permissionState;
  }

  /**
   * Check SMS permission status
   */
  async checkSMSPermission() {
    try {
      if (Platform.OS !== 'android') {
        return 'not-requested'; // SMS permissions are Android-specific
      }

      // Use a simplified approach for SMS permission checking
      // In a real implementation, this would check actual SMS permissions
      let permissionStatus = 'not-requested';
      
      try {
        // For now, we'll use a placeholder that returns 'not-requested'
        // This can be enhanced later with proper SMS permission checking
        permissionStatus = 'not-requested';
      } catch (error) {
        permissionStatus = 'undetermined';
      }

      // Update state
      if (this.permissionState) {
        this.permissionState.smsPermission = permissionStatus;
        this.permissionState.lastChecked = new Date();
        await this.savePermissionState();
        this.notifyPermissionChange();
      }

      return permissionStatus;
    } catch (error) {
      console.error('Failed to check SMS permission:', error);
      return 'undetermined';
    }
  }

  /**
   * Request SMS permission
   */
  async requestSMSPermission() {
    try {
      if (Platform.OS !== 'android') {
        return {
          granted: false,
          status: 'not-requested',
          error: "NOT_SUPPORTED"
        };
      }

      // Check if we should show rationale
      if (PERMISSION_CONFIG.SHOW_RATIONALE) {
        const shouldShowRationale = await this.shouldShowPermissionRationale('sms');
        if (shouldShowRationale) {
          const userWantsToGrant = await this.showPermissionRationale('sms');
          if (!userWantsToGrant) {
            return {
              granted: false,
              status: 'denied',
              error: "DENIED",
              canAskAgain: true
            };
          }
        }
      }

      // Simplified SMS permission request implementation
      // In a real implementation, this would use the appropriate SMS permission API
      let permissionStatus = 'denied';
      let granted = false;
      let canAskAgain = true;

      try {
        // For now, we'll simulate a permission request
        // This can be enhanced later with proper SMS permission handling
        permissionStatus = 'denied';
        granted = false;
        canAskAgain = true;
      } catch (error) {
        permissionStatus = 'undetermined';
        granted = false;
        canAskAgain = false;
      }

      // Update state
      if (this.permissionState) {
        this.permissionState.smsPermission = permissionStatus;
        this.permissionState.lastChecked = new Date();
        this.permissionState.requestCount += 1;
        
        if (!granted) {
          this.permissionState.lastDenied = new Date();
        }

        await this.savePermissionState();
        this.notifyPermissionChange();
      }

      return {
        granted,
        status: permissionStatus,
        canAskAgain
      };

    } catch (error) {
      console.error('Failed to request SMS permission:', error);
      
      if (error instanceof Error && error.message.includes('timeout')) {
        return {
          granted: false,
          status: 'undetermined',
          error: "TIMEOUT"
        };
      }

      return {
        granted: false,
        status: 'undetermined',
        error: "SYSTEM_ERROR"
      };
    }
  }

  /**
   * Check overlay permission status (Android only)
   */
  async checkOverlayPermission() {
    try {
      if (Platform.OS !== 'android') {
        return 'not-requested';
      }

      // Use a simplified approach for overlay permission checking
      // In a real implementation, this would check actual overlay permissions
      let permissionStatus = 'not-requested';
      
      try {
        // For now, we'll use a placeholder that returns 'not-requested'
        // This can be enhanced later with proper overlay permission checking
        permissionStatus = 'not-requested';
      } catch (error) {
        permissionStatus = 'undetermined';
      }

      // Update state
      if (this.permissionState) {
        this.permissionState.overlayPermission = permissionStatus;
        this.permissionState.lastChecked = new Date();
        await this.savePermissionState();
        this.notifyPermissionChange();
      }

      return permissionStatus;
    } catch (error) {
      console.error('Failed to check overlay permission:', error);
      return 'undetermined';
    }
  }

  /**
   * Request overlay permission
   */
  async requestOverlayPermission() {
    try {
      if (Platform.OS !== 'android') {
        return {
          granted: false,
          status: 'not-requested',
          error: "NOT_SUPPORTED"
        };
      }

      // Show rationale if needed
      if (PERMISSION_CONFIG.SHOW_RATIONALE) {
        const shouldShowRationale = await this.shouldShowPermissionRationale('overlay');
        if (shouldShowRationale) {
          const userWantsToGrant = await this.showPermissionRationale('overlay');
          if (!userWantsToGrant) {
            return {
              granted: false,
              status: 'denied',
              error: "DENIED",
              canAskAgain: true
            };
          }
        }
      }

      // Simplified overlay permission request implementation
      // In a real implementation, this would use the appropriate overlay permission API
      let permissionStatus = 'denied';
      let granted = false;
      let canAskAgain = true;

      try {
        // For now, we'll simulate a permission request
        // This can be enhanced later with proper overlay permission handling
        permissionStatus = 'denied';
        granted = false;
        canAskAgain = true;
      } catch (error) {
        permissionStatus = 'undetermined';
        granted = false;
        canAskAgain = false;
      }

      // Update state
      if (this.permissionState) {
        this.permissionState.overlayPermission = permissionStatus;
        this.permissionState.lastChecked = new Date();
        this.permissionState.requestCount += 1;
        
        if (!granted) {
          this.permissionState.lastDenied = new Date();
        }

        await this.savePermissionState();
        this.notifyPermissionChange();
      }

      return {
        granted,
        status: permissionStatus,
        canAskAgain
      };

    } catch (error) {
      console.error('Failed to request overlay permission:', error);
      return {
        granted: false,
        status: 'undetermined',
        error: "SYSTEM_ERROR"
      };
    }
  }

  /**
   * Check if both required permissions are granted
   */
  async areAllPermissionsGranted() {
    const smsStatus = await this.checkSMSPermission();
    const overlayStatus = await this.checkOverlayPermission();
    
    return smsStatus === 'granted' && overlayStatus === 'granted';
  }

  /**
   * Request all required permissions
   */
  async requestAllPermissions() {
    const smsResult = await this.requestSMSPermission();
    const overlayResult = await this.requestOverlayPermission();

    return {
      sms: smsResult,
      overlay: overlayResult
    };
  }

  /**
   * Show permission rationale dialog
   */
  async showPermissionRationale(type) {
    return new Promise((resolve) => {
      const message = type === 'sms' ? PERMISSION_MESSAGES.SMS_PERMISSION : PERMISSION_MESSAGES.OVERLAY_PERMISSION;
      
      Alert.alert(
        message.title,
        message.message,
        [
          {
            text: message.buttonNegative,
            onPress: () => resolve(false),
            style: 'cancel'
          },
          {
            text: message.buttonPositive,
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  /**
   * Check if we should show permission rationale
   */
  async shouldShowPermissionRationale(type) {
    if (!this.permissionState) return true;

    // Show rationale if permission was denied before
    const permissionStatus = type === 'sms' ? this.permissionState.smsPermission : this.permissionState.overlayPermission;
    return permissionStatus === 'denied' && this.permissionState.requestCount > 0;
  }

  /**
   * Open app settings for manual permission grant
   */
  async openAppSettings() {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Failed to open app settings:', error);
      Alert.alert(
        'Settings Unavailable',
        'Please manually enable permissions in your device settings.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Show permission denied dialog with option to open settings
   */
  async showPermissionDeniedDialog() {
    return new Promise((resolve) => {
      Alert.alert(
        PERMISSION_MESSAGES.PERMISSION_DENIED.title,
        PERMISSION_MESSAGES.PERMISSION_DENIED.message,
        [
          {
            text: PERMISSION_MESSAGES.PERMISSION_DENIED.buttonNegative,
            onPress: () => resolve(),
            style: 'cancel'
          },
          {
            text: PERMISSION_MESSAGES.PERMISSION_DENIED.buttonPositive,
            onPress: async () => {
              await this.openAppSettings();
              resolve();
            }
          }
        ]
      );
    });
  }

  /**
   * Add permission change listener
   */
  addPermissionChangeListener(listener) {
    this.permissionChangeListeners.push(listener);
  }

  /**
   * Remove permission change listener
   */
  removePermissionChangeListener(listener) {
    const index = this.permissionChangeListeners.indexOf(listener);
    if (index > -1) {
      this.permissionChangeListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of permission state changes
   */
  notifyPermissionChange() {
    if (this.permissionState) {
      this.permissionChangeListeners.forEach(listener => {
        try {
          listener(this.permissionState);
        } catch (error) {
          console.error('Error in permission change listener:', error);
        }
      });
    }
  }

  /**
   * Reset permission state (for testing or troubleshooting)
   */
  async resetPermissionState() {
    try {
      await SecureStore.deleteItemAsync(PERMISSION_STORAGE_KEYS.PERMISSION_STATE);
      this.permissionState = {
        smsPermission: 'not-requested',
        overlayPermission: 'not-requested',
        lastChecked: new Date(),
        requestCount: 0
      };
      await this.savePermissionState();
      this.notifyPermissionChange();
    } catch (error) {
      console.error('Failed to reset permission state:', error);
    }
  }

  /**
   * Get SMS settings from secure storage
   */
  async getSMSSettings() {
    try {
      const storedSettings = await SecureStore.getItemAsync(PERMISSION_STORAGE_KEYS.SMS_SETTINGS);
      if (storedSettings) {
        return { ...DEFAULT_SMS_SETTINGS, ...JSON.parse(storedSettings) };
      }
      return DEFAULT_SMS_SETTINGS;
    } catch (error) {
      console.error('Failed to get SMS settings:', error);
      return DEFAULT_SMS_SETTINGS;
    }
  }

  /**
   * Save SMS settings to secure storage
   */
  async saveSMSSettings(settings) {
    try {
      await SecureStore.setItemAsync(
        PERMISSION_STORAGE_KEYS.SMS_SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Failed to save SMS settings:', error);
      throw error;
    }
  }

  /**
   * Check if permissions need to be refreshed
   */
  shouldRefreshPermissions() {
    if (!this.permissionState) return true;
    
    const now = new Date();
    const lastChecked = this.permissionState.lastChecked;
    const timeDiff = now.getTime() - lastChecked.getTime();
    
    return timeDiff > PERMISSION_CONFIG.CHECK_INTERVAL;
  }

  /**
   * Refresh all permission statuses
   */
  async refreshPermissions() {
    await Promise.all([
      this.checkSMSPermission(),
      this.checkOverlayPermission()
    ]);
  }
}

// Export singleton instance
export const permissionManager = PermissionManager.getInstance();