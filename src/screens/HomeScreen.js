import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useItems } from '../context/ItemsContext';
import { useAuth } from '../context/AuthContext';
import ItemCard from '../components/ItemCard';
import EmptyState from '../components/EmptyState';
import AppIcon from '../components/AppIcon';
import { lafmsGallery, lafmsHeroImage } from '../assets/images';

const HomeScreen = ({ navigation }) => {
  const { items, loadLatest, loading } = useItems();
  const { user } = useAuth();

  const init = useCallback(() => {
    loadLatest().catch((error) => console.error(error));
  }, [loadLatest]);

  useEffect(() => {
    init();
  }, [init]);

  const summary = useMemo(() => {
    const lost = items.filter((item) => item.status === 'lost').length;
    const found = items.filter((item) => item.status === 'found').length;
    const recovered = items.filter((item) => item.status === 'recovered').length;

    return { lost, found, recovered };
  }, [items]);


  const requireLogin = useCallback(() => {
    Alert.alert('Login required', 'Please sign in first to use this feature.');
    navigation.navigate('Account');
  }, [navigation]);

  const listHeader = (
    <View style={styles.headerContainer}>
      <ImageBackground source={lafmsHeroImage} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>LAFMS</Text>
          <Text style={styles.heroSubtitle}>Fast reporting, trusted matching, easy recovery</Text>
        </View>
      </ImageBackground>

      <View style={styles.actionGrid}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
          onPress={() => (user ? navigation.navigate('Report') : requireLogin())}
        >
          <View style={styles.actionTitleRow}>
            <AppIcon name="file-document-edit-outline" size={16} color="#153742" />
            <Text style={styles.actionTitle}>Report Item</Text>
          </View>
          <Text style={styles.actionMeta}>Lost or found</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]} onPress={() => navigation.navigate('Search')}>
          <View style={styles.actionTitleRow}>
            <AppIcon name="magnify" size={16} color="#153742" />
            <Text style={styles.actionTitle}>Search Reports</Text>
          </View>
          <Text style={styles.actionMeta}>Filter by item details</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]} onPress={() => navigation.navigate('Saved')}>
          <View style={styles.actionTitleRow}>
            <AppIcon name="bookmark-outline" size={16} color="#153742" />
            <Text style={styles.actionTitle}>Saved Items</Text>
          </View>
          <Text style={styles.actionMeta}>Your bookmarks</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
          onPress={() => (user ? navigation.navigate('Alerts') : requireLogin())}
        >
          <View style={styles.actionTitleRow}>
            <AppIcon name="bell-outline" size={16} color="#153742" />
            <Text style={styles.actionTitle}>Check Alerts</Text>
          </View>
          <Text style={styles.actionMeta}>Stay updated</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <AppIcon name="chart-box-outline" size={18} color="#173944" />
          <Text style={styles.sectionTitle}>LAFMS Overview</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <AppIcon name="help-circle-outline" size={18} color="#8a1f1f" />
            <Text style={styles.summaryValue}>{summary.lost}</Text>
            <Text style={styles.summaryLabel}>Lost</Text>
          </View>
          <View style={styles.summaryCard}>
            <AppIcon name="hand-coin-outline" size={18} color="#156e22" />
            <Text style={styles.summaryValue}>{summary.found}</Text>
            <Text style={styles.summaryLabel}>Found</Text>
          </View>
          <View style={styles.summaryCard}>
            <AppIcon name="check-circle-outline" size={18} color="#2b3c78" />
            <Text style={styles.summaryValue}>{summary.recovered}</Text>
            <Text style={styles.summaryLabel}>Recovered</Text>
          </View>
        </View>
      </View>


      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <AppIcon name="image-multiple-outline" size={18} color="#173944" />
          <Text style={styles.sectionTitle}>LAFMS Gallery</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
          {lafmsGallery.map((image, index) => (
            <View style={styles.galleryCard} key={`gallery-${index}`}>
              <Image source={image} style={styles.galleryImage} />
              <Text style={styles.galleryText}>LAFMS</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.feedTitleRow}>
        <AppIcon name="timeline-text-outline" size={18} color="#13363d" />
        <Text style={styles.feedTitle}>Latest Lost & Found Reports</Text>
      </View>
      <Text style={styles.feedSubtitle}>Live feed from the community</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        renderItem={({ item }) => (
          <ItemCard item={item} onPress={() => navigation.navigate('ItemDetail', { item })} />
        )}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={init} />}
        ListEmptyComponent={(
          <EmptyState
            iconName="basket-outline"
            title="No Reports Yet"
            message="Start by posting a lost or found item."
            actionLabel="Create First Report"
            onAction={() => (user ? navigation.navigate('Report') : requireLogin())}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f7f8' },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  headerContainer: { paddingTop: 12 },
  hero: {
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0b2232',
  },
  heroImage: { opacity: 0.86 },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: 'rgba(12, 36, 46, 0.42)',
  },
  heroTitle: { color: '#f9feff', fontSize: 24, fontWeight: '900' },
  heroSubtitle: { color: '#d8edf2', marginTop: 4, fontSize: 14, fontWeight: '600' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  actionButton: {
    flexGrow: 1,
    minWidth: 105,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d5e4e8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionPressed: { opacity: 0.75 },
  actionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionTitle: { color: '#153742', fontWeight: '800', fontSize: 13 },
  actionMeta: { color: '#638088', marginTop: 3, fontSize: 12 },
  section: { marginTop: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#173944' },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d4e4e8',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#164a55' },
  summaryLabel: { color: '#5f7a80', marginTop: 2, fontSize: 12 },
  galleryRow: { gap: 10 },
  galleryCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8e5e8',
    overflow: 'hidden',
  },
  galleryImage: { width: '100%', height: 128 },
  galleryText: { color: '#32525a', fontWeight: '700', padding: 10 },
  feedTitleRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedTitle: { fontSize: 20, fontWeight: '900', color: '#13363d' },
  feedSubtitle: { color: '#5f7a80', marginTop: 2, marginBottom: 2, marginLeft: 24 },
});

export default HomeScreen;
