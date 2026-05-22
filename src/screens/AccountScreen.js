import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { DEFAULT_CAMPUS } from '../config/env';
import { imageService } from '../services/imageService';
import { permissionsService } from '../services/permissionsService';
import { storageService } from '../services/storageService';
import { isValidEmail } from '../utils/validators';
import AppIcon from '../components/AppIcon';

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return 'U';
  }
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
};

const toProfileImageValue = (asset) => {
  if (!asset) {
    return '';
  }
  if (asset.base64) {
    const mime = asset.type || 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }
  return asset.uri || '';
};

const CompactButton = ({ label, iconName, onPress, loading, disabled, tone = 'neutral', style }) => {
  const toneStyle =
    tone === 'danger'
      ? styles.compactButtonDanger
      : tone === 'primary'
        ? styles.compactButtonPrimary
        : styles.compactButtonNeutral;
  const toneTextStyle =
    tone === 'danger'
      ? styles.compactButtonDangerText
      : tone === 'primary'
        ? styles.compactButtonPrimaryText
        : styles.compactButtonNeutralText;
  const iconColor = tone === 'primary' ? '#ffffff' : tone === 'danger' ? '#9f3333' : '#21464f';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.compactButton,
        toneStyle,
        style,
        (disabled || loading) && styles.compactButtonDisabled,
        pressed && !disabled && !loading && styles.compactButtonPressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <View style={styles.compactInner}>
          {iconName ? <AppIcon name={iconName} size={14} color={iconColor} /> : null}
          <Text style={[styles.compactButtonText, toneTextStyle]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

const AccountScreen = () => {
  const { user, updateProfile, updatePassword, logout } = useAuth();
  const { clearSavedItems } = useItems();
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    avatarUrl: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',
    });
  }, [user]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) {
      return 'Unknown';
    }
    try {
      return new Date(user.createdAt).toLocaleDateString();
    } catch (_error) {
      return 'Unknown';
    }
  }, [user?.createdAt]);

  const updateProfileField = (patch) => setProfileForm((prev) => ({ ...prev, ...patch }));
  const updatePasswordField = (patch) => setPasswordForm((prev) => ({ ...prev, ...patch }));

  const chooseProfileImage = async (source) => {
    const loadingKey = source === 'camera' ? 'cameraImage' : 'galleryImage';
    setActionLoading(loadingKey);
    try {
      const allowed =
        source === 'camera'
          ? await permissionsService.requestCameraPermission()
          : await permissionsService.requestGalleryPermission();
      if (!allowed) {
        Alert.alert('Permission', 'Permission is required to change profile image.');
        return;
      }

      const asset =
        source === 'camera'
          ? await imageService.openCamera({ includeBase64: true })
          : await imageService.openGallery({ includeBase64: true });
      const avatarUrl = toProfileImageValue(asset);
      if (!avatarUrl) {
        return;
      }
      updateProfileField({ avatarUrl });
    } catch (_error) {
      Alert.alert('Image', 'Could not load image. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const onSaveProfile = async () => {
    const payload = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      campus: (user?.campus || DEFAULT_CAMPUS).trim(),
      avatarUrl: profileForm.avatarUrl,
    };

    if (!payload.name) {
      Alert.alert('Validation', 'Please enter your name.');
      return;
    }
    if (!isValidEmail(payload.email)) {
      Alert.alert('Validation', 'Please enter a valid email.');
      return;
    }

    setActionLoading('saveProfile');
    try {
      await updateProfile(payload);
      Alert.alert('Success', 'Profile updated successfully.');
    } finally {
      setActionLoading('');
    }
  };

  const onChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      Alert.alert('Validation', 'Please fill all password fields.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Validation', 'New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      Alert.alert('Validation', 'New password and confirm password do not match.');
      return;
    }

    setActionLoading('changePassword');
    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      Alert.alert('Success', 'Password updated successfully.');
    } finally {
      setActionLoading('');
    }
  };

  const onLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const onClearSavedItems = () => {
    Alert.alert('Clear Saved Items', 'Remove all your bookmarked/saved items from this phone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setActionLoading('clearSaved');
          try {
            await clearSavedItems();
            Alert.alert('Done', 'Saved items cleared.');
          } finally {
            setActionLoading('');
          }
        },
      },
    ]);
  };

  const onClearDraftAndCache = () => {
    Alert.alert(
      'Clear Draft + Cache',
      'This clears report draft and cached feed data on this phone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('clearCache');
            try {
              await Promise.all([
                storageService.remove(storageService.keys.LAST_REPORT_DRAFT),
                storageService.remove(storageService.keys.CACHED_REPORTS),
              ]);
              Alert.alert('Done', 'Draft and cache cleared.');
            } finally {
              setActionLoading('');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerCard}>
            <View style={styles.avatarWrap}>
              {profileForm.avatarUrl ? (
                <Image source={{ uri: profileForm.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(profileForm.name)}</Text>
              )}
            </View>
            <View style={styles.nameRow}>
              <AppIcon name="account-circle-outline" size={20} color="#143b44" />
              <Text style={styles.nameText}>{profileForm.name || 'LAFMS User'}</Text>
            </View>
            <View style={styles.metaRow}>
              <AppIcon name="calendar-month-outline" size={14} color="#5f7a80" />
              <Text style={styles.metaText}>Member since {memberSince}</Text>
            </View>
            <View style={styles.imageButtonsRow}>
              <CompactButton
                label="Camera"
                iconName="camera-outline"
                tone="neutral"
                loading={actionLoading === 'cameraImage'}
                onPress={() => chooseProfileImage('camera')}
                style={styles.inlineCompact}
              />
              <CompactButton
                label="Gallery"
                iconName="image-outline"
                tone="neutral"
                loading={actionLoading === 'galleryImage'}
                onPress={() => chooseProfileImage('gallery')}
                style={styles.inlineCompact}
              />
              <CompactButton
                label="Remove"
                iconName="image-remove-outline"
                tone="danger"
                loading={false}
                onPress={() => updateProfileField({ avatarUrl: '' })}
                style={styles.inlineCompact}
                disabled={Boolean(actionLoading)}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <AppIcon name="account-edit-outline" size={16} color="#123841" />
              <Text style={styles.cardTitle}>Profile Settings</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#6a7f86"
              value={profileForm.name}
              onChangeText={(name) => updateProfileField({ name })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6a7f86"
              keyboardType="email-address"
              autoCapitalize="none"
              value={profileForm.email}
              onChangeText={(email) => updateProfileField({ email })}
              autoCorrect={false}
            />
            <CompactButton
              label="Save Profile"
              iconName="content-save-outline"
              tone="primary"
              loading={actionLoading === 'saveProfile'}
              onPress={onSaveProfile}
              disabled={Boolean(actionLoading) && actionLoading !== 'saveProfile'}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <AppIcon name="shield-lock-outline" size={16} color="#123841" />
              <Text style={styles.cardTitle}>Account Security</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Current password"
              placeholderTextColor="#6a7f86"
              secureTextEntry
              value={passwordForm.currentPassword}
              onChangeText={(currentPassword) => updatePasswordField({ currentPassword })}
            />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor="#6a7f86"
              secureTextEntry
              value={passwordForm.newPassword}
              onChangeText={(newPassword) => updatePasswordField({ newPassword })}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#6a7f86"
              secureTextEntry
              value={passwordForm.confirmNewPassword}
              onChangeText={(confirmNewPassword) => updatePasswordField({ confirmNewPassword })}
            />
            <CompactButton
              label="Change Password"
              iconName="lock-reset"
              tone="primary"
              loading={actionLoading === 'changePassword'}
              onPress={onChangePassword}
              disabled={Boolean(actionLoading) && actionLoading !== 'changePassword'}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <AppIcon name="cog-outline" size={16} color="#123841" />
              <Text style={styles.cardTitle}>Account Actions</Text>
            </View>
            <View style={styles.actionsStack}>
              <CompactButton
                label="Clear Saved Items"
                iconName="bookmark-remove-outline"
                tone="neutral"
                loading={actionLoading === 'clearSaved'}
                onPress={onClearSavedItems}
                disabled={Boolean(actionLoading) && actionLoading !== 'clearSaved'}
              />
              <CompactButton
                label="Clear Draft + Cache"
                iconName="broom"
                tone="neutral"
                loading={actionLoading === 'clearCache'}
                onPress={onClearDraftAndCache}
                disabled={Boolean(actionLoading) && actionLoading !== 'clearCache'}
              />
              <CompactButton
                label="Sign Out"
                iconName="logout"
                tone="danger"
                loading={false}
                onPress={onLogout}
                disabled={Boolean(actionLoading)}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f8fa' },
  content: { padding: 14, paddingBottom: 24, gap: 12 },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e7ea',
    padding: 14,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#d7edf2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#9cc3cd',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 34, fontWeight: '800', color: '#184650' },
  nameRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameText: { fontSize: 20, fontWeight: '800', color: '#143b44' },
  metaRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: '#5f7a80' },
  imageButtonsRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
  inlineCompact: {
    flex: 1,
  },
  compactButton: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  compactButtonPressed: { opacity: 0.75 },
  compactButtonDisabled: { opacity: 0.6 },
  compactButtonNeutral: { borderColor: '#c0d6dc', backgroundColor: '#f7fcfd' },
  compactButtonPrimary: { borderColor: '#0b7285', backgroundColor: '#0b7285' },
  compactButtonDanger: { borderColor: '#e3b1b1', backgroundColor: '#fff6f6' },
  compactInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  compactButtonText: { fontWeight: '700', fontSize: 13, lineHeight: 16 },
  compactButtonNeutralText: { color: '#21464f' },
  compactButtonPrimaryText: { color: '#ffffff' },
  compactButtonDangerText: { color: '#9f3333' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e7ea',
    padding: 14,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#123841' },
  input: {
    borderWidth: 1,
    borderColor: '#d2dde1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#12343b',
    backgroundColor: '#fff',
  },
  actionsStack: { gap: 8 },
});

export default AccountScreen;
