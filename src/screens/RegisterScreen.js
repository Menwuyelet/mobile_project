import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import AppIcon from '../components/AppIcon';
import { DEFAULT_CAMPUS } from '../config/env';
import { isValidEmail } from '../utils/validators';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter your name.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Validation', 'Please enter a valid email.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation', 'Password should be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, campus: DEFAULT_CAMPUS });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
              onPress={() => navigation.goBack()}
            >
              <AppIcon name="chevron-left" size={14} color="#174651" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <View style={styles.titleRow}>
              <AppIcon name="account-plus-outline" size={22} color="#12343b" />
              <Text style={styles.title}>Create Account</Text>
            </View>

            <View style={styles.fieldLabelRow}>
              <AppIcon name="account-outline" size={14} color="#355158" />
              <Text style={styles.fieldLabel}>Full Name</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#6a7f86"
              value={name}
              onChangeText={setName}
            />
            <View style={styles.fieldLabelRow}>
              <AppIcon name="email-outline" size={14} color="#355158" />
              <Text style={styles.fieldLabel}>Email</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6a7f86"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              autoCorrect={false}
            />
            <View style={styles.fieldLabelRow}>
              <AppIcon name="lock-outline" size={14} color="#355158" />
              <Text style={styles.fieldLabel}>Password</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6a7f86"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={styles.buttonInner}>
                  <AppIcon name="account-check-outline" size={14} color="#ffffff" />
                  <Text style={styles.buttonText}>Create Account</Text>
                </View>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef5f8' },
  keyboardWrap: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#e2edf0' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d3dee2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
    backgroundColor: '#f8fbfc',
  },
  backButtonPressed: { opacity: 0.7 },
  backText: { color: '#174651', fontWeight: '700', fontSize: 13 },
  title: { fontSize: 22, fontWeight: '800', color: '#12343b' },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, marginTop: 2 },
  fieldLabel: { color: '#355158', fontSize: 13, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#d3dee2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#12343b',
  },
  button: { backgroundColor: '#0b7285', borderRadius: 8, paddingVertical: 12, alignItems: 'center', minHeight: 44 },
  buttonDisabled: { backgroundColor: '#86a9b2' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buttonText: { color: '#fff', fontWeight: '700' },
});

export default RegisterScreen;
