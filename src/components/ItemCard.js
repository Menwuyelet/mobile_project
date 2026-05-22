import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';
import { generateItemImageUrl, resolveItemImageUrl } from '../utils/imageFallback';

const ItemCard = ({ item, onPress }) => {
  const statusStyle =
    item.status === 'lost'
      ? styles.lost
      : item.status === 'recovered'
      ? styles.recovered
      : item.status === 'archived'
      ? styles.archived
      : styles.found;
  const statusIcon =
    item.status === 'lost'
      ? 'compass-outline'
      : item.status === 'recovered'
      ? 'check-circle-outline'
      : item.status === 'archived'
      ? 'archive-outline'
      : 'package-variant-closed';
  const statusColor =
    item.status === 'lost'
      ? '#8a1f1f'
      : item.status === 'recovered'
      ? '#2b3c78'
      : item.status === 'archived'
      ? '#6b7280'
      : '#156e22';
  const [failedPrimaryImage, setFailedPrimaryImage] = useState(false);
  const imageSource = useMemo(() => {
    const sourceUrl = failedPrimaryImage ? generateItemImageUrl(item) : resolveItemImageUrl(item);
    return { uri: sourceUrl };
  }, [failedPrimaryImage, item]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={4}
      android_ripple={{ color: '#d8e8ed' }}
    >
      <Image
        source={imageSource}
        style={styles.image}
        resizeMode="cover"
        onError={() => setFailedPrimaryImage(true)}
      />
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.badge, statusStyle]}>
          <AppIcon name={statusIcon} size={12} color={statusColor} /> {item.status}
        </Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.meta}>
        <AppIcon name="tag-outline" size={13} color="#777" /> {item.category}
      </Text>
      <Text style={styles.meta}>
        <AppIcon name="map-marker-outline" size={13} color="#777" /> {item.locationText || 'No location text'}
      </Text>
      <View style={styles.footerRow}>
        <Text style={styles.dateMeta}>
          <AppIcon name="clock-time-four-outline" size={13} color="#5f7a82" /> {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently posted'}
        </Text>
        <View style={styles.ctaPill}>
          <View style={styles.ctaInner}>
            <AppIcon name="arrow-right-circle-outline" size={12} color="#1b5e6b" />
            <Text style={styles.ctaText}>View Details</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#dbe7ea',
  },
  image: {
    width: '100%',
    height: 128,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#dfecef',
  },
  cardPressed: {
    opacity: 0.84,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1e1e1e', paddingRight: 8 },
  badge: {
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '700',
    minWidth: 74,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  lost: { backgroundColor: '#ffd9d9', color: '#8a1f1f' },
  found: { backgroundColor: '#d8f8dc', color: '#156e22' },
  recovered: { backgroundColor: '#e8ebf8', color: '#2b3c78' },
  archived: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  description: { color: '#444', marginBottom: 8 },
  meta: { color: '#777', fontSize: 12 },
  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateMeta: { color: '#5f7a82', fontSize: 12, fontWeight: '600' },
  ctaPill: {
    borderWidth: 1,
    borderColor: '#bfd8de',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f2fafc',
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaText: { color: '#1b5e6b', fontSize: 11, fontWeight: '700' },
});

export default ItemCard;
