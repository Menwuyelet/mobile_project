import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FilterBar from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import ItemCard from '../components/ItemCard';
import AppIcon from '../components/AppIcon';
import { useItems } from '../context/ItemsContext';

const defaultFilters = { keyword: '', status: '', category: '' };

const SearchScreen = ({ navigation }) => {
  const { searchReports } = useItems();

  const [filters, setFilters] = useState(defaultFilters);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(
    async (currentFilters) => {
      setLoading(true);
      try {
        const found = await searchReports(currentFilters);
        setResults(found);
      } catch (error) {
        Alert.alert('Search failed', error?.response?.data?.message || 'Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [searchReports]
  );

  useEffect(() => {
    runSearch(defaultFilters);
  }, [runSearch]);

  const onSearch = () => runSearch(filters);

  const onReset = () => {
    setFilters(defaultFilters);
    runSearch(defaultFilters);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <AppIcon name="database-search-outline" size={20} color="#12343b" />
          <Text style={styles.title}>Search Items</Text>
        </View>
        <View style={styles.subtitleRow}>
          <AppIcon name="magnify" size={16} color="#5d7a80" />
          <Text style={styles.subtitle}>{results.length} result(s)</Text>
        </View>
        <FilterBar filters={filters} onChange={setFilters} onSearch={onSearch} onReset={onReset} />

        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={() => navigation.navigate('ItemDetail', { item })} />
          )}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          ListEmptyComponent={
            <EmptyState
              iconName="compass-outline"
              title="No Results"
              message="Try changing filters or keywords."
              actionLabel="Reset Filters"
              onAction={onReset}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onSearch} />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6fafb' },
  content: { flex: 1, padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 20, fontWeight: '800', color: '#12343b' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginTop: 2 },
  subtitle: { color: '#5d7a80' },
});

export default SearchScreen;
