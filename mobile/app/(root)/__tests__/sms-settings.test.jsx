import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SMSSettingsScreen from '../sms-settings';
import { getSMSSettings, setSMSSettings } from '../../../lib/storage';
import { smsMonitorService } from '../../../lib/SMSMonitorService';
import { Alert } from 'react-native';

// Mock external modules
jest.mock('../../../lib/storage');
jest.mock('../../../lib/SMSMonitorService');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock Slider component from @react-native-community/slider
jest.mock('@react-native-community/slider', () => 'Slider');

describe('SMSSettingsScreen', () => {
  const mockDefaultSettings = {
    enabled: false,
    trustedSenders: [],
    popupDuration: 30,
    useOverlay: true,
    autoCategories: {},
    minimumAmount: 0,
    keywordFilters: [],
    excludeKeywords: [],
    currency: 'USD',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getSMSSettings.mockResolvedValue(mockDefaultSettings);
    setSMSSettings.mockResolvedValue(undefined);
    smsMonitorService.startMonitoring.mockResolvedValue(true);
    smsMonitorService.stopMonitoring.mockResolvedValue(true);
    smsMonitorService.isMonitoring.mockReturnValue(false);
  });

  it('renders correctly and loads default settings', async () => {
    const { getByText, getByLabelText } = render(<SMSSettingsScreen />);

    await waitFor(() => expect(getByText('SMS Transaction Settings')).toBeTruthy());
    expect(getByText('Enable SMS Monitoring')).toBeTruthy();
    expect(getByLabelText('Toggle SMS Monitoring')).toBeFalsy(); // Check if switch exists
    expect(getSMSSettings).toHaveBeenCalledTimes(1);
  });

  it('toggles SMS monitoring and updates settings', async () => {
    const { getByText, getByA11yRole } = render(<SMSSettingsScreen />);
    await waitFor(() => expect(getByText('Enable SMS Monitoring')).toBeTruthy());

    const toggle = getByA11yRole('switch');
    fireEvent(toggle, 'valueChange', true);

    await waitFor(() => expect(setSMSSettings).toHaveBeenCalledWith(expect.objectContaining({
      enabled: true,
    })));
    expect(smsMonitorService.startMonitoring).toHaveBeenCalledTimes(1);

    fireEvent(toggle, 'valueChange', false);

    await waitFor(() => expect(setSMSSettings).toHaveBeenCalledWith(expect.objectContaining({
      enabled: false,
    })));
    expect(smsMonitorService.stopMonitoring).toHaveBeenCalledTimes(1);
  });

  it('handles adding and removing trusted senders', async () => {
    getSMSSettings.mockResolvedValue({ ...mockDefaultSettings, enabled: true });
    const { getByText, getByPlaceholderText, queryByText } = render(<SMSSettingsScreen />);
    await waitFor(() => expect(getByText('Trusted Senders')).toBeTruthy());

    const senderInput = getByPlaceholderText('Add a trusted sender (e.g., BANKMSG)');
    const addButton = getByText('Add');

    fireEvent.changeText(senderInput, 'M-PESA');
    fireEvent.press(addButton);

    await waitFor(() => expect(setSMSSettings).toHaveBeenCalledWith(expect.objectContaining({
      trustedSenders: ['M-PESA'],
    })));
    expect(Alert.alert).toHaveBeenCalledWith('Sender Added', 'Sender "M-PESA" added to trusted list.');
    expect(getByText('M-PESA')).toBeTruthy();

    // Test removing a sender
    Alert.alert.mockClear(); // Clear previous alerts
    const removeButton = getByText('Remove');
    fireEvent.press(removeButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Confirm Removal',
      'Are you sure you want to remove "M-PESA" from trusted senders?',
      expect.any(Array)
    );

    // Simulate pressing the 'Remove' button in the alert
    const confirmRemoveAction = Alert.alert.mock.calls[0][2][1];
    await act(async () => { // Use act to wrap state updates inside the callback
      await confirmRemoveAction.onPress();
    });

    await waitFor(() => expect(setSMSSettings).toHaveBeenCalledWith(expect.objectContaining({
      trustedSenders: [],
    })));
    expect(Alert.alert).toHaveBeenCalledWith('Sender Removed', 'Sender "M-PESA" removed from trusted list.');
    expect(queryByText('M-PESA')).toBeNull();
  });

  it('adjusts popup duration', async () => {
    getSMSSettings.mockResolvedValue({ ...mockDefaultSettings, enabled: true });
    const { getByText, getByA11yLabel } = render(<SMSSettingsScreen />);
    await waitFor(() => expect(getByText('Popup Display Duration')).toBeTruthy());

    // The Slider component is mocked as a string 'Slider', so we can't directly interact with it.
    // We'll simulate its `onValueChange` prop being called.
    const slider = getByA11yLabel('Slider');
    fireEvent(slider, 'onValueChange', 15);

    await waitFor(() => expect(setSMSSettings).toHaveBeenCalledWith(expect.objectContaining({
      popupDuration: 15,
    })));
    expect(getByText('Dismiss after: 15 seconds')).toBeTruthy();
  });

  it('toggles use overlay setting', async () => {
    getSMSSettings.mockResolvedValue({ ...mockDefaultSettings, enabled: true });
    const { getByText, getByA11yRole } = render(<SMSSettingsScreen />);
    await waitFor(() => expect(getByText('Use Overlay Popups')).toBeTruthy());

    const toggle = getByA11yRole('switch', { name: 'Use Overlay Popups' });
    fireEvent(toggle, 'valueChange', false);

    await waitFor(() => expect(setSMSSettings).toHaveBeenCalledWith(expect.objectContaining({
      useOverlay: false,
    })));

    fireEvent(toggle, 'valueChange', true);

    await waitFor(() => expect(setSMSSettings).toHaveBeenCalledWith(expect.objectContaining({
      useOverlay: true,
    })));
  });

  it('adjusts minimum transaction amount', async () => {
    getSMSSettings.mockResolvedValue({ ...mockDefaultSettings, enabled: true });
    const { getByText, getByA11yLabel } = render(<SMSSettingsScreen />);
    await waitFor(() => expect(getByText('Minimum Transaction Amount')).toBeTruthy());

    const slider = getByA11yLabel('Slider');
    fireEvent(slider, 'onValueChange', 500);

    await waitFor(() => expect(setSMSSettings).toHaveBeenCalledWith(expect.objectContaining({
      minimumAmount: 500,
    })));
    expect(getByText('Only detect transactions above: 500 USD')).toBeTruthy();
  });
});
