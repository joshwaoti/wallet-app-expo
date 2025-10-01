import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Alert, Platform, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSMSSettings, setSMSSettings } from '../../lib/storage';
import { smsMonitorService } from '../../lib/SMSMonitorService';
import PageLoader from '../../components/PageLoader';
import Slider from '@react-native-community/slider'; // Import Slider

const SMSSettingsScreen = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
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
      setIsMonitoring(smsMonitorService.isMonitoring());
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
      setIsMonitoring(started);
    } else {
      await smsMonitorService.stopMonitoring();
      setIsMonitoring(false);
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>SMS Transaction Settings</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Enable SMS Monitoring</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings?.enabled ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
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
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={settings.trustedSenders}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <View style={styles.senderItem}>
                  <Text style={styles.senderText}>{item}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSender(item)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyListText}>No trusted senders added yet.</Text>}
            />
          </View>
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
              minimumTrackTintColor="#81b0ff"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#f5dd4b"
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
              minimumTrackTintColor="#81b0ff"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#f5dd4b"
            />
          </View>
        )}

        {settings?.enabled && (
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Use Overlay Popups</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings?.useOverlay ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={handleToggleUseOverlay}
              value={settings?.useOverlay || false}
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  container: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  trustedSendersContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    fontSize: 16,
    borderColor: '#DDD',
    borderWidth: 1,
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  senderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    borderColor: '#EEE',
    borderWidth: 1,
  },
  senderText: {
    fontSize: 16,
    color: '#555',
  },
  removeButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 10,
    fontStyle: 'italic',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValueText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default SMSSettingsScreen;
