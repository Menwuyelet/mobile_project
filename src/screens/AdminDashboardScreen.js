import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';

const C = {
  blue: '#1a6edb',
  bg: '#f5f7fb',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  muted: '#6b7280',
  red: '#b42318',
};

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'lost', label: 'Lost' },
  { key: 'found', label: 'Found' },
  { key: 'recovered', label: 'Recovered' },
];

const normalizeStatus = (status = '') => (String(status).toLowerCase() === 'returned' ? 'recovered' : String(status).toLowerCase());

const statusColor = (status) => {
  const key = normalizeStatus(status);
  if (key === 'lost') return { bg: '#fff0f0', text: '#cc2222' };
  if (key === 'found') return { bg: '#e8f5e9', text: '#1b5e20' };
  if (key === 'recovered') return { bg: '#eff6ff', text: '#1a6edb' };
  return { bg: '#f3f4f6', text: C.muted };
};

const fmt = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
};

const SummaryCard = ({ label, value, icon, color = '#1a6edb', bg = '#eff6ff' }) => (
  <View style={[styles.summaryCard, { backgroundColor: bg }]}> 
    <AppIcon name={icon} size={17} color={color} />
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
  </View>
);

const ActionButton = ({ icon, label, onPress, tone = 'neutral', disabled, loading }) => {
  const palette =
    tone === 'danger'
      ? { bg: '#fff1f2', border: '#fecdd3', text: '#b42318' }
      : tone === 'success'
        ? { bg: '#ecfdf3', border: '#bbf7d0', text: '#15803d' }
        : { bg: '#eef4fb', border: '#d7e5f6', text: '#18416c' };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: palette.bg, borderColor: palette.border },
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          <AppIcon name={icon} size={16} color={palette.text} />
          <Text style={[styles.actionText, { color: palette.text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

const FlagCard = ({ item, busy, onKeep, onClear, onDelete }) => {
  const sc = statusColor(item.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Untitled Report'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusBadgeText, { color: sc.text }]}>{normalizeStatus(item.status).toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.metaLine} numberOfLines={2}>Reason: {item.flagReason || 'No reason provided'}</Text>
      <Text style={styles.metaLine}>Reporter: {item?.reportedBy?.name || 'Unknown'}</Text>
      <Text style={styles.metaLine}>Posted: {fmt(item.createdAt)}</Text>

      <View style={styles.actionsRow}>
        <ActionButton icon="flag-variant-outline" label="Keep" onPress={onKeep} disabled={busy} />
        <ActionButton icon="check-circle-outline" label="Clear" tone="success" onPress={onClear} disabled={busy} />
        <ActionButton icon="delete-outline" label="Delete" tone="danger" onPress={onDelete} loading={busy} disabled={busy} />
      </View>
    </View>
  );
};

const AdminDashboardScreen = () => {
  const { isAdmin } = useAuth();
  const { getFlaggedReports, deleteReport, reviewFlaggedReport, getAdminStats } = useItems();

  const [flagged, setFlagged] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [flaggedResp, statsResp] = await Promise.all([
        getFlaggedReports({ limit: 100 }),
        getAdminStats(),
      ]);
      setFlagged(flaggedResp?.items || []);
      setStats(statsResp?.stats || null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Could not load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [getAdminStats, getFlaggedReports]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totals = useMemo(() => ({
    reports: stats?.totalReports || 0,
    flagged: stats?.flaggedReports || 0,
    users: stats?.totalUsers || 0,
    recovered: stats?.recoveredReports || 0,
    lost: stats?.lostReports || 0,
    found: stats?.foundReports || 0,
  }), [stats]);

  const visibleFlagged = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return (flagged || []).filter((entry) => {
      const normalizedStatus = normalizeStatus(entry?.status);
      const statusMatches = statusFilter === 'all' || normalizedStatus === statusFilter;
      if (!statusMatches) {
        return false;
      }

      if (!q) {
        return true;
      }

      const haystack = `${entry?.title || ''} ${entry?.flagReason || ''} ${entry?.reportedBy?.name || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [flagged, keyword, statusFilter]);

  const onDelete = (id) => {
    Alert.alert('Delete Report', 'This will permanently remove this report.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setWorkingId(id);
          try {
            await deleteReport(id);
            await loadDashboard();
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Delete failed.');
          } finally {
            setWorkingId('');
          }
        },
      },
    ]);
  };

  const onReview = (id, action) => {
    Alert.alert(
      action === 'clear' ? 'Clear Flag' : 'Keep Flag',
      action === 'clear' ? 'Remove moderation flag from this report?' : 'Keep this report flagged for moderation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setWorkingId(id);
            try {
              await reviewFlaggedReport(id, action, action === 'clear' ? 'False alarm' : 'Kept flagged');
              await loadDashboard();
            } catch (error) {
              Alert.alert('Failed', error?.response?.data?.message || 'Could not review this report.');
            } finally {
              setWorkingId('');
            }
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.root}>
        <EmptyState iconName="shield-lock-outline" title="Restricted" message="Admin access only." />
      </SafeAreaView>
    );
  }

  const listHeader = (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroTitle}>Admin Dashboard</Text>
            <Text style={styles.heroSubtitle}>Simple moderation queue</Text>
          </View>
          <Pressable style={styles.refreshBtn} onPress={loadDashboard}>
            <AppIcon name="refresh" size={18} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.lastUpdated}>Updated: {lastUpdated || 'Now'}</Text>

        <View style={styles.summaryRow}>
          <SummaryCard label="Flagged" value={totals.flagged} icon="flag-outline" color="#b42318" bg="#fff1f2" />
          <SummaryCard label="Reports" value={totals.reports} icon="file-document-multiple-outline" />
          <SummaryCard label="Users" value={totals.users} icon="account-group-outline" color="#15803d" bg="#ecfdf3" />
        </View>
      </View>

      <View style={styles.filterCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search flagged items"
          placeholderTextColor={C.muted}
          value={keyword}
          onChangeText={setKeyword}
        />

        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((entry) => {
            const active = statusFilter === entry.key;
            return (
              <Pressable
                key={entry.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(entry.key)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{entry.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.resetFilters}
          onPress={() => {
            setStatusFilter('all');
            setKeyword('');
          }}
        >
          <Text style={styles.resetText}>Reset Filters</Text>
        </Pressable>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Flagged Reports</Text>
        <Text style={styles.sectionCount}>{visibleFlagged.length} / {totals.flagged}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={visibleFlagged}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard} tintColor={C.blue} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={C.blue} />
            </View>
          ) : keyword || statusFilter !== 'all' ? (
            <EmptyState iconName="magnify" title="No Match" message="Try different filter values." />
          ) : (
            <EmptyState iconName="shield-check-outline" title="All Clean" message="No flagged reports right now." />
          )
        }
        renderItem={({ item }) => (
          <FlagCard
            item={item}
            busy={workingId === item._id}
            onKeep={() => onReview(item._id, 'keep')}
            onClear={() => onReview(item._id, 'clear')}
            onDelete={() => onDelete(item._id)}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  hero: {
    backgroundColor: C.blue,
    padding: 16,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    marginBottom: 12,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  lastUpdated: { color: 'rgba(255,255,255,0.8)', marginTop: 8, fontSize: 12 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryRow: { marginTop: 14, flexDirection: 'row', gap: 9 },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '700' },

  filterCard: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: C.text,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cfd8e3',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  filterChipText: {
    color: '#355367',
    fontWeight: '700',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resetFilters: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#eef4fb',
  },
  resetText: { color: '#18416c', fontWeight: '700', fontSize: 12 },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  sectionCount: { color: C.red, fontWeight: '800' },

  listContent: { paddingHorizontal: 14, paddingBottom: 30 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text, marginRight: 8 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },

  metaLine: { fontSize: 12, color: C.muted, marginBottom: 6 },

  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionButton: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.84 },

  loaderWrap: { paddingVertical: 40, alignItems: 'center' },
});

export default AdminDashboardScreen;
