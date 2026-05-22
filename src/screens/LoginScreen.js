import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';
import AppIcon from '../components/AppIcon';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      Alert.alert('Validation', 'Please enter your email');
      return;
    }

    if (!password) {
      setError('Password is required');
      Alert.alert('Validation', 'Please enter your password');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient
        colors={['#0B7285', '#0A5F75', '#073B4B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
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
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#FFFFFF', '#F0F9FA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoBg}
                >
                  <AppIcon name="shield-search-outline" size={32} color="#0B7285" />
                </LinearGradient>
              </View>
              <Text style={styles.appTitle}>LAFMS</Text>
              <Text style={styles.appSubtitle}>Campus Lost & Found</Text>
              <Text style={styles.tagline}>Sign in to recover your items</Text>
            </View>

            {/* Card Section */}
            <View style={styles.card}>
              {error ? (
                <View style={styles.errorContainer}>
                  <AppIcon name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View style={styles.fieldContainer}>
                <View style={styles.fieldHeader}>
                  <AppIcon name="email-outline" size={16} color="#0B7285" />
                  <Text style={styles.fieldLabel}>Email Address</Text>
                </View>
                <TextInput
                  style={[styles.input, email && styles.inputFocused]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  placeholderTextColor="#A0ADB5"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                  }}
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardAppearance="light"
                  selectionColor="#0B7285"
                  cursorColor="#0B7285"
                  editable={!submitting}
                />
              </View>

              {/* Password Input */}
              <View style={styles.fieldContainer}>
                <View style={styles.fieldHeader}>
                  <AppIcon name="lock-outline" size={16} color="#0B7285" />
                  <Text style={styles.fieldLabel}>Password</Text>
                </View>
                <View style={[styles.passwordWrapper, password && styles.inputFocused]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#A0ADB5"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError('');
                    }}
                    autoComplete="password"
                    textContentType="password"
                    keyboardAppearance="light"
                    selectionColor="#0B7285"
                    cursorColor="#0B7285"
                    editable={!submitting}
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <AppIcon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#0B7285"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <Pressable
                  style={styles.rememberBox}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && (
                      <AppIcon name="check" size={12} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </Pressable>

                <Pressable onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.forgotText}>Create account</Text>
                </Pressable>
              </View>

              {/* Login Button */}
              <LinearGradient
                colors={['#0B7285', '#0A5F75']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Pressable
                  style={[styles.button, submitting && styles.buttonDisabled]}
                  onPress={onSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <AppIcon name="login" size={16} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Sign In</Text>
                    </View>
                  )}
                </Pressable>
              </LinearGradient>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>New here?</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register Button */}
              <Pressable
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Register')}
              >
                <AppIcon name="account-plus-outline" size={16} color="#0B7285" />
                <Text style={styles.secondaryButtonText}>Create New Account</Text>
              </Pressable>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
              Secure • Fast • Reliable
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B7285'
  },
  gradientBackground: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },

  /* Header Section */
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#B3E5FC',
    fontWeight: '500',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 24,
  },

  /* Error */
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Field */
  fieldContainer: {
    marginBottom: 18,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#073B4B',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#073B4B',
    backgroundColor: '#F9FAFB',
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: '#0B7285',
    backgroundColor: '#F0FFFE',
  },

  /* Password Wrapper */
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#073B4B',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },

  /* Options Row */
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#0B7285',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0B7285',
    borderColor: '#0B7285',
  },
  rememberText: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 12,
    color: '#0B7285',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  /* Button */
  buttonGradient: {
    borderRadius: 12,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* Divider */
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  /* Secondary Button */
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0B7285',
    backgroundColor: '#F0FFFE',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#0B7285',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Footer */
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
  },
});

export default LoginScreen;
color: '#355158',
  fontSize: 13,
    fontWeight: '700',
      marginBottom: 0,
        marginTop: 0,
  },
input: {
  borderWidth: 1,
    borderColor: '#d3dee2',
      borderRadius: 8,
        paddingHorizontal: 10,
          paddingVertical: 10,
            marginBottom: 10,
              minHeight: 48,
                backgroundColor: '#fff',
                  color: '#0f2f36',
                    fontSize: 16,
                      lineHeight: 21,
  },
button: {
  backgroundColor: '#0b7285',
    paddingVertical: 12,
      borderRadius: 8,
        alignItems: 'center',
          marginTop: 4,
            minHeight: 44,
  },
buttonDisabled: {
  backgroundColor: '#86a9b2',
  },
buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
buttonText: { color: '#fff', fontWeight: '700' },
linkRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
link: { color: '#0b7285', textAlign: 'center', fontWeight: '600' },
});

export default LoginScreen;
