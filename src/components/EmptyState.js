import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';

const EmptyState = ({ title = 'No Data Yet', message, icon, iconName = 'inbox-outline', actionLabel, onAction }) => {
  return (
    <View style={styles.container}>
      {icon ? (
        <Text style={styles.iconEmoji}>{icon}</Text>
      ) : (
        <View style={styles.iconWrap}>
          <AppIcon name={iconName} size={30} color="#1a6edb" />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#eef2ff',
  },
  iconEmoji: { fontSize: 28, marginBottom: 8 },
  title: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  text: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1a6edb',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default EmptyState;
