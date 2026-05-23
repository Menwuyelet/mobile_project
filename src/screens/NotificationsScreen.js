import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import EmptyState from '../components/EmptyState';
import AppIcon from '../components/AppIcon';
import { notificationService } from '../services/notificationService';

const C = {
  blue: '#1a6edb',
  white: '#ffffff',
  bg: '#f5f7fb',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  muted: '#6b7280',
};

const NotificationCard = ({ item, onPress }) => {
  const unread = !item.readAt;

  return (
    <Pressable 
      style={[styles.card, unread && styles.unreadCard]} 
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <AppIcon 
            name={unread ? 'bell-alert-outline' : 'bell-check-outline'} 
            size={22} 
            color={unread ? C.blue : C.muted} 
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        </View>

        {unread && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.metaRow}>
        <AppIcon name="clock-outline" size={14} color={C.muted} />
        <Text style={styles.meta}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications({ limit: 50 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      Alert.alert('Notifications', error?.response?.data?.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNotification = async (notification) => {
    try {
      if (!notification.readAt) {
        await notificationService.markRead(notification._id);
      }
      await load();

      if (notification?.meta?.itemId) {
        navigation.navigate('ItemDetail', { item: { _id: notification.meta.itemId } });
      }
    } catch (error) {
      Alert.alert('Notifications', error?.response?.data?.message || 'Could not open notification.');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      await load();
    } catch (error) {
      Alert.alert('Notifications', error?.response?.data?.message || 'Could not update notifications.');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppIcon name="bell-badge-outline" size={26} color={C.text} />
          <View>
            <Text style={styles.headerTitle}>Alerts</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <Pressable style={styles.markAllButton} onPress={markAllRead}>
            <AppIcon name="email-check-outline" size={16} color="#fff" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        renderItem={({ item }) => (
          <NotificationCard item={item} onPress={() => openNotification(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.blue} />}
        ListEmptyComponent={
          <EmptyState
            iconName="bell-outline"
            title="No Alerts Yet"
            message="Important updates, matches, and messages will appear here."
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  headerSubtitle: { fontSize: 13, color: C.muted, marginTop: 2 },

  markAllButton: {
    backgroundColor: C.blue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  markAllText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  listContent: { padding: 12, paddingBottom: 30 },

  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: C.blue,
    backgroundColor: '#f8fbff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
  body: { fontSize: 13, color: C.muted, lineHeight: 18 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  meta: { fontSize: 12, color: C.muted },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.blue,
    marginTop: 4,
  },
});

export default NotificationsScreen;