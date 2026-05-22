import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AppIcon from './AppIcon';

const IconInput = ({ iconName, style, ...props }) => (
  <View style={[styles.inputWrap, style]}>
    <AppIcon name={iconName} size={16} color="#5f7a80" />
    <TextInput
      {...props}
      style={styles.inputField}
      placeholderTextColor="#6a7f86"
    />
  </View>
);

const StatusButton = ({ value, current, onSelect }) => {
  const active = value === current;
  const iconName = value === 'lost' ? 'help-circle-outline' : 'hand-coin-outline';

  return (
    <Pressable
      style={[styles.statusButton, active && styles.statusButtonActive]}
      onPress={() => onSelect(active ? '' : value)}
    >
      <View style={styles.statusInner}>
        <AppIcon name={iconName} size={14} color={active ? '#ffffff' : '#33545c'} />
        <Text style={[styles.statusButtonText, active && styles.statusButtonTextActive]}>{value}</Text>
      </View>
    </Pressable>
  );
};

const FilterBar = ({ filters, onChange, onSearch, onReset }) => {
  return (
    <View style={styles.container}>
      <IconInput
        iconName="magnify"
        placeholder="Search by title, description, or location"
        value={filters.keyword}
        onChangeText={(text) => onChange({ ...filters, keyword: text })}
      />

      <IconInput
        iconName="tag-outline"
        placeholder="Category"
        value={filters.category}
        onChangeText={(text) => onChange({ ...filters, category: text })}
      />

      <View style={styles.row}>
        <StatusButton value="lost" current={filters.status} onSelect={(status) => onChange({ ...filters, status })} />
        <StatusButton
          value="found"
          current={filters.status}
          onSelect={(status) => onChange({ ...filters, status })}
        />
        <Pressable style={styles.resetButton} onPress={onReset}>
          <View style={styles.actionInner}>
            <AppIcon name="refresh" size={14} color="#34545c" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </View>
        </Pressable>
        <Pressable style={styles.searchButton} onPress={onSearch}>
          <View style={styles.actionInner}>
            <AppIcon name="magnify" size={14} color="#ffffff" />
            <Text style={styles.searchButtonText}>Search</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  inputWrap: {
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: 42,
    backgroundColor: '#fff',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputField: {
    flex: 1,
    color: '#12343b',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  statusButton: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 36,
    backgroundColor: '#fff',
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusButtonActive: { backgroundColor: '#0b7285', borderColor: '#0b7285' },
  statusButtonText: { textTransform: 'uppercase', color: '#33545c', fontWeight: '700', fontSize: 12 },
  statusButtonTextActive: { color: '#fff' },
  actionInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resetButton: {
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: '#dfe9ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: { color: '#34545c', fontWeight: '700', fontSize: 12 },
  searchButton: {
    paddingHorizontal: 14,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: '#0b7285',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});

export default FilterBar;
