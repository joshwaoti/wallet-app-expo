/**
 * usePermissions Hook
 * 
 * React hook for managing SMS and overlay permissions in components.
 * Provides easy access to permission status, request functions, and state management.
 */

import { useState, useEffect, useCallback } from 'react';
import { permissionManager } from '../lib/permissionManager';

export const usePermissions = () => {
  const [permissionState, setPermissionState] = useState(null);
  const [smsSettings, setSmsSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize permissions and settings
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        setIsLoading(true);
        
        // Get current permission state
        const state = await permissionManager.getPermissionState();
        setPermissionState(state);
        
        // Get SMS settings
        const settings = await permissionManager.getSMSSettings();
        setSmsSettings(settings);
        
        // Check current permission status if needed
        if (permissionManager.shouldRefreshPermissions()) {
          await permissionManager.refreshPermissions();
          const updatedState = await permissionManager.getPermissionState();
          setPermissionState(updatedState);
        }
      } catch (error) {
        console.error('Failed to initialize permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePermissions();
  }, []);

  // Set up permission change listener
  useEffect(() => {
    const handlePermissionChange = (newState) => {
      setPermissionState(newState);
    };

    permissionManager.addPermissionChangeListener(handlePermissionChange);

    return () => {
      permissionManager.removePermissionChangeListener(handlePermissionChange);
    };
  }, []);

  // Permission request functions
  const requestSMSPermission = useCallback(async () => {
    try {
      const result = await permissionManager.requestSMSPermission();
      return result;
    } catch (error) {
      console.error('Failed to request SMS permission:', error);
      return {
        granted: false,
        status: 'undetermined',
        error: 'SYSTEM_ERROR'
      };
    }
  }, []);

  const requestOverlayPermission = useCallback(async () => {
    try {
      const result = await permissionManager.requestOverlayPermission();
      return result;
    } catch (error) {
      console.error('Failed to request overlay permission:', error);
      return {
        granted: false,
        status: 'undetermined',
        error: 'SYSTEM_ERROR'
      };
    }
  }, []);

  const requestAllPermissions = useCallback(async () => {
    try {
      const results = await permissionManager.requestAllPermissions();
      return results;
    } catch (error) {
      console.error('Failed to request all permissions:', error);
      return {
        sms: {
          granted: false,
          status: 'undetermined',
          error: 'SYSTEM_ERROR'
        },
        overlay: {
          granted: false,
          status: 'undetermined',
          error: 'SYSTEM_ERROR'
        }
      };
    }
  }, []);

  // Check permissions
  const checkPermissions = useCallback(async () => {
    try {
      await permissionManager.refreshPermissions();
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  }, []);

  // Settings functions
  const openAppSettings = useCallback(async () => {
    try {
      await permissionManager.openAppSettings();
    } catch (error) {
      console.error('Failed to open app settings:', error);
    }
  }, []);

  const showPermissionDeniedDialog = useCallback(async () => {
    try {
      await permissionManager.showPermissionDeniedDialog();
    } catch (error) {
      console.error('Failed to show permission denied dialog:', error);
    }
  }, []);

  // SMS settings management
  const updateSMSSettings = useCallback(async (settings) => {
    try {
      await permissionManager.saveSMSSettings(settings);
      setSmsSettings(settings);
    } catch (error) {
      console.error('Failed to update SMS settings:', error);
      throw error;
    }
  }, []);

  // Utility functions
  const refreshPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      await permissionManager.refreshPermissions();
      const updatedState = await permissionManager.getPermissionState();
      setPermissionState(updatedState);
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      await permissionManager.resetPermissionState();
      const newState = await permissionManager.getPermissionState();
      setPermissionState(newState);
    } catch (error) {
      console.error('Failed to reset permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Computed values
  const smsPermission = permissionState?.smsPermission || 'not-requested';
  const overlayPermission = permissionState?.overlayPermission || 'not-requested';
  const allPermissionsGranted = smsPermission === 'granted' && overlayPermission === 'granted';
  const shouldRefreshPermissions = permissionManager.shouldRefreshPermissions();

  return {
    // Permission state
    permissionState,
    isLoading,
    
    // Permission status
    smsPermission,
    overlayPermission,
    allPermissionsGranted,
    
    // Permission actions
    requestSMSPermission,
    requestOverlayPermission,
    requestAllPermissions,
    checkPermissions,
    openAppSettings,
    showPermissionDeniedDialog,
    
    // SMS settings
    smsSettings,
    updateSMSSettings,
    
    // Utility functions
    shouldRefreshPermissions,
    refreshPermissions,
    resetPermissions
  };
};

export default usePermissions;