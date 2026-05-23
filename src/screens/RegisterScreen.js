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
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';
import AppIcon from '../components/AppIcon';
import { DEFAULT_CAMPUS } from '../config/env';
import { validateRegistration } from '../utils/validators';

const C = {
  blue: '#1a6edb',
  white: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
};

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const error = validateRegistration({
      name,
      email,
      password,
      confirmPassword,
    });

    if (error) {
      return Alert.alert('Validation', error);
    }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        campus: DEFAULT_CAMPUS,
      });
      Alert.alert('Success', 'Account created successfully.');
    } catch (_err) {
      // AuthContext already shows a user-friendly error alert.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient
        colors={['#1a6edb', '#0f4ca8', '#0a3a7f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <AppIcon name="account-plus-outline" size={42} color="#ffffff" />
              <Text style={styles.appTitle}>Create Account</Text>
              <Text style={styles.tagline}>Join the campus community</Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="account-outline" size={20} color={C.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    value={name}
                    onChangeText={setName}
                    editable={!submitting}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="email-outline" size={20} color={C.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    editable={!submitting}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="lock-outline" size={20} color={C.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!submitting}
                  />
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="lock-check-outline" size={20} color={C.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!submitting}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                style={[styles.registerButton, submitting && styles.buttonDisabled]}
                onPress={onSubmit}
                disabled={submitting}
              >
                <LinearGradient
                  colors={['#1a6edb', '#0f4ca8']}
                  style={styles.buttonGradient}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <AppIcon name="account-check-outline" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Create Account</Text>
                    </View>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Login Link */}
              <Pressable
                style={styles.loginLink}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginHighlight}>Sign In</Text>
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  gradient: { flex: 1 },
  keyboardWrap: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  header: { alignItems: 'center', marginBottom: 32 },
  appTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 12 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },

  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: C.text,
  },

  registerButton: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.7 },

  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { fontSize: 14, color: C.muted },
  loginHighlight: { color: C.blue, fontWeight: '700' },
});

export default RegisterScreen;
