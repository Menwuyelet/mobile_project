import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';

const C = {
  blue: '#1a6edb',
};

const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <AppIcon name="loading" size={42} color="#ffffff" />
        <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
        
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 12,
  },
  message: {
    marginTop: 16,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LoadingOverlay;