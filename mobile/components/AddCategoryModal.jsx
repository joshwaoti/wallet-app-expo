import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { getAddCategoryModalStyles } from '../assets/styles/AddCategoryModal.styles';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

const SUGGESTED_CATEGORIES = [
  { name: 'Freelance', icon: 'briefcase-outline' },
  { name: 'Salary', icon: 'cash-outline' },
  { name: 'Investment', icon: 'trending-up-outline' },
  { name: 'Gift', icon: 'gift-outline' },
];

const ICON_LIST = [
  'home-outline',
  'cart-outline',
  'fast-food-outline',
  'car-outline',
  'film-outline',
  'receipt-outline',
  'cash-outline',
  'ellipsis-horizontal-outline',
  'briefcase-outline',
  'trending-up-outline',
  'gift-outline',
  'airplane-outline',
  'medkit-outline',
  'school-outline',
  'card-outline',
];

const AddCategoryModal = ({ isVisible, onClose, createCategory }) => {
  const { theme } = useTheme();
  const styles = getAddCategoryModalStyles(theme);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(null);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !selectedIcon) {
      alert('Please enter a category name and select an icon.');
      return;
    }
    await createCategory(newCategoryName, selectedIcon);
    setNewCategoryName('');
    setSelectedIcon(null);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <BlurView intensity={10} style={styles.blurContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Add Category</Text>

          <Text style={styles.subtitle}>Create New</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Category Name"
              placeholderTextColor={theme.textLight}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
          </View>

          <Text style={styles.subtitle}>Select Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconContainer}>
            {ICON_LIST.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconButton,
                  selectedIcon === icon && styles.iconButtonSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Ionicons name={icon} size={24} color={selectedIcon === icon ? theme.white : theme.text} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={handleCreateCategory} style={styles.createButton}>
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
};

export default AddCategoryModal;
