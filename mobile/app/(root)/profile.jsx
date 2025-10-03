import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const styles = getProfileStyles(theme);
  const { user } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await user.update({
        firstName: firstName,
        lastName: lastName,
      });
      
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeProfilePicture = async () => {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Permission to access camera roll is required!");
      return;
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      
      try {
        // Upload the image to Clerk
        const response = await fetch(selectedImage.uri);
        const blob = await response.blob();
        
        await user?.setProfileImage({
          file: blob,
        });
        
        Alert.alert("Success", "Profile picture updated!");
      } catch (error) {
        console.error("Error updating profile picture:", error);
        Alert.alert("Error", "Failed to update profile picture. Please try again.");
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    Alert.alert(
      "Remove Profile Picture",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: async () => {
            try {
              await user?.setProfileImage({ file: null });
              Alert.alert("Success", "Profile picture removed!");
            } catch (error) {
              console.error("Error removing profile picture:", error);
              Alert.alert("Error", "Failed to remove profile picture. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {!isEditing ? (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="create-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.editButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={() => {
                setFirstName(user?.firstName || "");
                setLastName(user?.lastName || "");
                setIsEditing(false);
              }}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]} 
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={handleChangeProfilePicture}
        >
          {user?.hasImage ? (
            <></>
          ) : (
            <View style={styles.placeholderAvatar}>
              <Ionicons name="person-outline" size={48} color={theme.textLight} />
            </View>
          )}
          
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera-outline" size={20} color={theme.white} />
          </View>
        </TouchableOpacity>
        
        {user?.hasImage && (
          <TouchableOpacity 
            style={styles.removePictureButton}
            onPress={handleRemoveProfilePicture}
          >
            <Text style={styles.removePictureText}>Remove Picture</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.userEmail}>{user?.emailAddresses[0]?.emailAddress}</Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              editable={!loading}
            />
          ) : (
            <Text style={styles.valueText}>{firstName || "Not set"}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              editable={!loading}
            />
          ) : (
            <Text style={styles.valueText}>{lastName || "Not set"}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <Text style={styles.valueText}>{user?.emailAddresses[0]?.emailAddress}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Account Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Member since</Text>
            <Text style={styles.infoValue}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last signed in</Text>
            <Text style={styles.infoValue}>
              {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : "Unknown"}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getProfileStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.text,
  },
  editButton: {
    padding: 10,
  },
  editButtons: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: theme.border,
  },
  cancelButtonText: {
    color: theme.text,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: theme.primary,
  },
  saveButtonText: {
    color: theme.white,
    fontWeight: "600",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  removePictureButton: {
    marginBottom: 15,
  },
  removePictureText: {
    color: theme.expense,
    textDecorationLine: "underline",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: theme.textLight,
  },
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textLight,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: theme.text,
  },
  valueText: {
    fontSize: 16,
    color: theme.text,
    paddingVertical: 10,
  },
  infoSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.textLight,
  },
  infoValue: {
    fontSize: 16,
    color: theme.text,
    fontWeight: "500",
  },
});
