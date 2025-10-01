/**
 * Permission Configuration Constants and Types for SMS Transaction Detection
 * 
 * This file contains all permission-related constants, types, and configuration
 * needed for SMS reading and system overlay functionality.
 */

// Android Permission Constants
export const ANDROID_PERMISSIONS = {
  READ_SMS: 'android.permission.READ_SMS',
  SYSTEM_ALERT_WINDOW: 'android.permission.SYSTEM_ALERT_WINDOW',
};

// Permission Request Messages
export const PERMISSION_MESSAGES = {
  SMS_PERMISSION: {
    title: 'SMS Access Required',
    message: 'This app needs access to your SMS messages to automatically detect financial transactions and help you track expenses.',
    buttonPositive: 'Grant Access',
    buttonNegative: 'Not Now',
  },
  OVERLAY_PERMISSION: {
    title: 'Display Over Other Apps',
    message: 'Allow this app to display transaction popups over other apps for quick expense tracking.',
    buttonPositive: 'Allow',
    buttonNegative: 'Cancel',
  },
  PERMISSION_DENIED: {
    title: 'Permission Required',
    message: 'SMS and overlay permissions are required for automatic transaction detection. You can enable them in Settings.',
    buttonPositive: 'Open Settings',
    buttonNegative: 'Cancel',
  },
};

// Permission Configuration
export const PERMISSION_CONFIG = {
  // Minimum Android API level required for SMS reading
  MIN_API_LEVEL: 23,

  // Permission request timeout in milliseconds
  REQUEST_TIMEOUT: 30000,

  // How often to check permission status (in milliseconds)
  CHECK_INTERVAL: 60000, // 1 minute

  // Whether to show rationale before requesting permissions
  SHOW_RATIONALE: true,

  // Whether to automatically request permissions on app start
  AUTO_REQUEST_ON_START: false,
};

// SMS Settings Types
// export interface SMSSettings {
//   enabled: boolean;
//   trustedSenders: string[];
//   popupDuration: number; // seconds
//   useOverlay: boolean;
//   autoCategories: Record<string, string>;
//   minimumAmount: number;
//   keywordFilters: string[];
//   excludeKeywords: string[];
//   currency: string; // Add this line
// }

// Default SMS Settings
export const DEFAULT_SMS_SETTINGS = {
  enabled: false,
  trustedSenders: [],
  popupDuration: 30,
  useOverlay: true,
  autoCategories: {},
  minimumAmount: 0,
  keywordFilters: [],
  excludeKeywords: [],
};

// Permission Error Types
export const PermissionError = {
  NOT_SUPPORTED: 'PERMISSION_NOT_SUPPORTED',
  DENIED: 'PERMISSION_DENIED',
  TIMEOUT: 'PERMISSION_TIMEOUT',
  SYSTEM_ERROR: 'PERMISSION_SYSTEM_ERROR',
};

// Permission Request Result
export interface PermissionRequestResult {
  granted: boolean;
  status: PermissionStatus;
  error?: PermissionError;
  canAskAgain?: boolean;
}

// Expo Permission Types (for compatibility)
export const EXPO_PERMISSIONS = {
  SMS: 'sms',
  SYSTEM_ALERT_WINDOW: 'systemAlertWindow',
};

// Permission Storage Keys
export const PERMISSION_STORAGE_KEYS = {
  SMS_SETTINGS: 'sms_settings',
  PERMISSION_STATE: 'permission_state',
  LAST_PERMISSION_CHECK: 'last_permission_check',
};