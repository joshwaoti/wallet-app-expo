import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSMSSettings, setSMSSettings } from '../../lib/storage';
import { smsMonitorService } from '../../lib/SMSMonitorService';
import PageLoader from '../../components/PageLoader';
import Slider from '@react-native-community/slider'; // Import Slider
import { COLORS } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

const SMSSettingsScreen = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newSender, setNewSender] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      const storedSettings = await getSMSSettings();
      setSettings(storedSettings || {
        enabled: false,
        trustedSenders: [],
        popupDuration: 30,
        useOverlay: true,
        autoCategories: {},
        minimumAmount: 0,
        keywordFilters: [],
        excludeKeywords: [],
        currency: 'USD', // Default currency
      });
      setIsLoading(false);
    };

    loadSettings();
  }, []);

  const handleToggleSMSMonitoring = async (newValue) => {
    if (!settings) return;

    const updatedSettings = { ...settings, enabled: newValue };
    setSettings(updatedSettings);
    await setSMSSettings(updatedSettings);

    if (newValue) {
      const started = await smsMonitorService.startMonitoring();
      if (!started) {
        Alert.alert('Permission Required', 'SMS permission is required to enable monitoring. Please grant access in your device settings.');
        setSettings({ ...updatedSettings, enabled: false }); // Revert toggle if not started
        await setSMSSettings({ ...updatedSettings, enabled: false });
      }
    } else {
      await smsMonitorService.stopMonitoring();
    }
  };

  const handleAddSender = () => {
    if (!newSender.trim() || settings?.trustedSenders.includes(newSender.trim())) {
      Alert.alert('Invalid Sender', 'Please enter a valid sender and ensure it\'s not already added.');
      return;
    }
    setSettings({
      ...settings,
      trustedSenders: [...(settings?.trustedSenders || []), newSender.trim()],
    });
    setNewSender('');
    Alert.alert('Sender Added', `Sender "${newSender.trim()}" added to trusted list.`);
  };

  const handleRemoveSender = (sender) => {
    Alert.alert(
      'Confirm Removal',
      `Are you sure you want to remove "${sender}" from trusted senders?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          onPress: async () => {
            const updatedSenders = (settings?.trustedSenders || []).filter(s => s !== sender);
            const updatedSettings = { ...settings, trustedSenders: updatedSenders };
            setSettings(updatedSettings);
            await setSMSSettings(updatedSettings);
            Alert.alert('Sender Removed', `Sender "${sender}" removed from trusted list.`);
          },
        },
      ],
    );
  };

  const handlePopupDurationChange = async (value) => {
    if (!settings) return;
    const updatedSettings = { ...settings, popupDuration: value };
    setSettings(updatedSettings);
    await setSMSSettings(updatedSettings);
  };

  const handleToggleUseOverlay = async (newValue) => {
    if (!settings) return;
    const updatedSettings = { ...settings, useOverlay: newValue };
    setSettings(updatedSettings);
    await setSMSSettings(updatedSettings);
  };

  const handleMinimumAmountChange = async (value) => {
    if (!settings) return;
    const updatedSettings = { ...settings, minimumAmount: value };
    setSettings(updatedSettings);
    await setSMSSettings(updatedSettings);
  };

  if (isLoading) {
    return <PageLoader visible={true} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>SMS Transaction Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="phone-portrait-outline" size={24} color={COLORS.primary} />
            <Text style={styles.settingLabel}>Enable SMS Monitoring</Text>
          </View>
          <Switch
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={settings?.enabled ? COLORS.white : COLORS.white}
            ios_backgroundColor={COLORS.border}
            onValueChange={handleToggleSMSMonitoring}
            value={settings?.enabled || false}
          />
        </View>

        {settings?.enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Trusted Senders</Text>
            <View style={styles.trustedSendersContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Add a trusted sender (e.g., BANKMSG)"
                value={newSender}
                onChangeText={setNewSender}
                onSubmitEditing={handleAddSender}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddSender}>
                <Ionicons name="add-outline" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {settings?.enabled && (
          <FlatList
            data={settings?.trustedSenders || []}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View style={styles.senderItem}>
                <Text style={styles.senderText}>{item}</Text>
                <TouchableOpacity onPress={() => handleRemoveSender(item)} style={styles.removeButton}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyListText}>No trusted senders added yet.</Text>}
            style={{ width: '100%', marginBottom: 20 }}
          />
        )}

        {settings?.enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Popup Display Duration</Text>
            <Text style={styles.sliderValueText}>Dismiss after: {settings?.popupDuration} seconds</Text>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={60}
              step={1}
              value={settings?.popupDuration || 30}
              onValueChange={handlePopupDurationChange}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
            />
          </View>
        )}

        {settings?.enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Minimum Transaction Amount</Text>
            <Text style={styles.sliderValueText}>Only detect transactions above: {settings?.minimumAmount} {settings?.currency || 'USD'}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10000}
              step={100}
              value={settings?.minimumAmount || 0}
              onValueChange={handleMinimumAmountChange}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
            />
          </View>
        )}

        {settings?.enabled && (
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="layers-outline" size={24} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Use Overlay Popups</Text>
            </View>
            <Switch
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={settings?.useOverlay ? COLORS.white : COLORS.white}
              ios_backgroundColor={COLORS.border}
              onValueChange={handleToggleUseOverlay}
              value={settings?.useOverlay || false}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: COLORS.text,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  trustedSendersContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    fontSize: 16,
    borderColor: COLORS.border,
    borderWidth: 1,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  senderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  senderText: {
    fontSize: 16,
    color: COLORS.text,
  },
  removeButton: {
    backgroundColor: COLORS.expense,
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: 10,
    fontStyle: 'italic',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValueText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default SMSSettingsScreen;
