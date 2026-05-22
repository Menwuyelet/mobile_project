import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { itemService } from '../services/itemService';
import { generateItemImageUrl, resolveItemImageUrl } from '../utils/imageFallback';

const MATCH_LIMIT = 5;
const THEME_COLORS = {
  background: '#f4f8fa',
  card: '#ffffff',
  cardAlt: '#f0f7f9',
  text: '#143942',
  textMuted: '#567279',
  primary: '#0b7285',
  primarySoft: '#d8edf2',
  border: '#cfe0e5',
};

const toDisplayTime = (value) => {
  if (!value) {
    return 'Not available';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return parsed.toLocaleString();
};

const getStatusVisual = (status, colors) => {
  if (status === 'lost') {
    return {
      label: 'LOST',
      icon: 'compass-outline',
      textColor: '#8a1f1f',
      bgColor: '#ffdfe0',
      borderColor: '#efb6bb',
    };
  }

  if (status === 'recovered') {
    return {
      label: 'RECOVERED',
      icon: 'check-circle-outline',
      textColor: '#21407a',
      bgColor: '#e5ebff',
      borderColor: '#c7d4fd',
    };
  }

  if (status === 'found') {
    return {
      label: 'FOUND',
      icon: 'package-variant-closed',
      textColor: '#156e22',
      bgColor: '#dbf4de',
      borderColor: '#badcc0',
    };
  }

  if (status === 'archived') {
    return {
      label: 'ARCHIVED',
      icon: 'archive-outline',
      textColor: '#6b7280',
      bgColor: '#f3f4f6',
      borderColor: '#d1d5db',
    };
  }

  return {
    label: 'UNKNOWN',
    icon: 'help-circle-outline',
    textColor: colors.textMuted,
    bgColor: colors.primarySoft,
    borderColor: colors.border,
  };
};

const OptionCard = ({ iconName, title, subtitle, onPress, colors, disabled = false, tone = 'primary' }) => {
  const toneMap = {
    primary: { bg: colors.primary, border: colors.primary, icon: '#ffffff', title: '#ffffff', subtitle: '#d7f2f8' },
    neutral: { bg: colors.cardAlt, border: colors.border, icon: colors.primary, title: colors.text, subtitle: colors.textMuted },
    success: { bg: '#1d7e3f', border: '#1d7e3f', icon: '#ffffff', title: '#ffffff', subtitle: '#dcf9e6' },
    warning: { bg: '#9d6f15', border: '#9d6f15', icon: '#ffffff', title: '#ffffff', subtitle: '#ffecc7' },
    danger: { bg: '#a93f3f', border: '#a93f3f', icon: '#ffffff', title: '#ffffff', subtitle: '#ffdede' },
  };
  const palette = toneMap[tone] || toneMap.primary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionCard,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && !disabled ? 0.99 : 1 }],
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
    >
      <View style={styles.optionIconWrap}>
        <AppIcon name={iconName} size={16} color={palette.icon} />
      </View>
      <View style={styles.optionTextWrap}>
        <Text style={[styles.optionTitle, { color: palette.title }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.optionSubtitle, { color: palette.subtitle }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <AppIcon name="arrow-right-circle-outline" size={16} color={palette.icon} />
    </Pressable>
  );
};

const ItemDetailScreen = ({ route, navigation }) => {
  const initial = route.params?.item || {};
  const { user } = useAuth();
  const colors = THEME_COLORS;
  const {
    markRecovered,
    flagReport,
    deleteReport,
    getMatchesFor,
    toggleSavedItem,
    isItemSaved,
    recordViewedItem,
  } = useItems();

  const [item, setItem] = useState(initial);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(!initial?.title);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [failedPrimaryImage, setFailedPrimaryImage] = useState(false);
  const [flagReason, setFlagReason] = useState('Suspicious or spam report');

  useEffect(() => {
    setFailedPrimaryImage(false);
  }, [item?._id]);

  useEffect(() => {
    const bootstrap = async () => {
      if (initial?.title || !initial?._id) {
        return;
      }

      setLoading(true);
      try {
        const data = await itemService.getById(initial._id);
        setItem(data.item || initial);
      } catch (error) {
        Alert.alert('Item', error?.response?.data?.message || 'Could not load item details.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [initial]);

  useEffect(() => {
    const loadMatches = async () => {
      if (!item?._id || !user?._id) {
        setMatches([]);
        return;
      }

      setMatchesLoading(true);
      try {
        const found = await getMatchesFor(item);
        setMatches(Array.isArray(found) ? found : []);
      } catch (error) {
        console.error(error);
      } finally {
        setMatchesLoading(false);
      }
    };

    loadMatches();
  }, [getMatchesFor, item, user?._id]);

  useEffect(() => {
    if (!item?._id) {
      return;
    }
    recordViewedItem(item).catch((error) => {
      console.warn('Failed to record recently viewed item', error);
    });
  }, [item, recordViewedItem]);

  const reporterId = typeof item?.reportedBy === 'string' ? item.reportedBy : item?.reportedBy?._id;
  const receiverId = reporterId;
  const isRecovered = item?.status === 'recovered';
  const isGuest = !user?._id;
  const saved = isItemSaved(item?._id);
  const isOwner = Boolean(user?._id) && reporterId === user?._id;
  const canManage = Boolean(user?._id) && (isOwner || user?.role === 'admin');
  const canChat = Boolean(user?._id) && Boolean(receiverId) && receiverId !== user?._id;
  const statusVisual = getStatusVisual(item?.status, colors);
  const imageSource = useMemo(() => {
    const url = failedPrimaryImage ? generateItemImageUrl(item) : resolveItemImageUrl(item);
    return { uri: url };
  }, [failedPrimaryImage, item]);

  const details = [
    {
      key: 'category',
      label: 'Category',
      value: item?.category || 'N/A',
      icon: 'tag-outline',
    },
    {
      key: 'location',
      label: 'Location',
      value: item?.locationText || 'Not provided',
      icon: 'map-marker-outline',
    },
    {
      key: 'reportedBy',
      label: 'Reported by',
      value: item?.reportedBy?.name || 'Unknown',
      icon: 'account-outline',
    },
    {
      key: 'reportedAt',
      label: 'Reported at',
      value: toDisplayTime(item?.createdAt),
      icon: 'clock-time-four-outline',
    },
  ];

  const openAccountTab = () => {
    const localState = navigation.getState?.();
    if (localState?.routeNames?.includes('Login')) {
      navigation.navigate('Login');
      return;
    }
    if (localState?.routeNames?.includes('Account')) {
      navigation.navigate('Account');
      return;
    }

    const parentNav = navigation.getParent?.();
    const parentState = parentNav?.getState?.();
    if (parentState?.routeNames?.includes('Login')) {
      parentNav.navigate('Login');
      return;
    }
    if (parentState?.routeNames?.includes('Main')) {
      parentNav.navigate('Main', { screen: 'Account' });
      return;
    }

    navigation.goBack();
  };

  const onRecovered = async () => {
    if (!user?._id) {
      Alert.alert('Login required', 'Please sign in to update item status.');
      openAccountTab();
      return;
    }

    if (!item?._id) {
      return;
    }

    try {
      const data = await markRecovered(item._id);
      setItem(data.item || { ...item, status: 'recovered' });
      Alert.alert('Updated', 'Item marked as recovered.');
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Could not update status.');
    }
  };

  const onFlag = async () => {
    if (!user?._id) {
      Alert.alert('Login required', 'Please sign in to flag a report.');
      openAccountTab();
      return;
    }

    if (!item?._id) {
      return;
    }

    try {
      await flagReport(item._id, flagReason.trim() || 'Suspicious or spam report');
      Alert.alert('Reported', 'This post has been flagged for admin review.');
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Could not flag this post.');
    }
  };

  const onDeleteReport = () => {
    if (!item?._id) {
      return;
    }

    Alert.alert('Delete Report', 'This action will permanently delete this report.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReport(item._id);
            Alert.alert('Deleted', 'Report removed successfully.');
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Could not delete this report.');
          }
        },
      },
    ]);
  };

  const onToggleSaved = async () => {
    if (!item?._id) {
      return;
    }

    try {
      const nowSaved = await toggleSavedItem(item);
      Alert.alert(nowSaved ? 'Saved' : 'Removed', nowSaved ? 'Item saved to your device.' : 'Item removed from saved list.');
    } catch (error) {
      Alert.alert('Save failed', error?.message || 'Could not update saved items.');
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `${item.title || 'Lost/Found Item'}\n${item.description || ''}\nLocation: ${item.locationText || 'N/A'}`,
        title: item.title || 'Lost/Found Item',
      });
    } catch (error) {
      Alert.alert('Share failed', error?.message || 'Could not share this item right now.');
    }
  };

  const onOpenVerify = () => {
    const localState = navigation.getState?.();
    if (localState?.routeNames?.includes('Verify')) {
      navigation.navigate('Verify', { item });
      return;
    }

    const parentNav = navigation.getParent?.();
    if (parentNav?.getState?.()?.routeNames?.includes('Verify')) {
      parentNav.navigate('Verify', { item });
      return;
    }

    Alert.alert('Verification', 'Verification is available after sign-in from the main app.');
  };

  const onOpenChat = () => {
    navigation.navigate('Chat', { item, otherUserId: receiverId });
  };

  const onOpenMatch = (candidate) => {
    if (!candidate) {
      return;
    }
    navigation.push('ItemDetail', { item: candidate });
  };

  const recommendedActions = [
    isGuest
      ? {
          key: 'login',
          iconName: 'login',
          title: 'Sign In For Full Tools',
          subtitle: 'Unlock chat, recovery updates, and moderation actions.',
          onPress: openAccountTab,
          tone: 'primary',
        }
      : null,
    !isGuest && canChat
      ? {
          key: 'chat',
          iconName: 'chat-processing-outline',
          title: 'Message Reporter',
          subtitle: 'Ask for identifying details and coordinate a safe handoff.',
          onPress: onOpenChat,
          tone: 'success',
        }
      : null,
    !isGuest
      ? {
          key: 'recover',
          iconName: 'check-circle-outline',
          title: isRecovered ? 'Already Recovered' : 'Mark As Recovered',
          subtitle: isRecovered ? 'This report is already closed.' : 'Close this report once the item is returned.',
          onPress: onRecovered,
          tone: 'primary',
          disabled: isRecovered,
        }
      : null,
    {
      key: 'verify',
      iconName: 'shield-check-outline',
      title: 'Verify + Similar',
      subtitle: 'Run ownership token checks and compare similar reports.',
      onPress: onOpenVerify,
      tone: 'neutral',
    },
    {
      key: 'save',
      iconName: saved ? 'bookmark-remove-outline' : 'bookmark-outline',
      title: saved ? 'Remove From Saved' : 'Save Item',
      subtitle: saved ? 'This report is stored on your device.' : 'Bookmark this report for quick access.',
      onPress: onToggleSaved,
      tone: 'warning',
    },
    {
      key: 'share',
      iconName: 'share-variant-outline',
      title: 'Share Report',
      subtitle: 'Send this item to groups so the owner can be found faster.',
      onPress: onShare,
      tone: 'neutral',
    },
  ].filter(Boolean);

  if (loading) {
    return (
      <SafeAreaView style={[styles.loaderWrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.bgOrbTop, { backgroundColor: colors.primarySoft }]} />
      <View style={[styles.bgOrbBottom, { backgroundColor: colors.cardAlt }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Image
            source={imageSource}
            style={styles.heroImage}
            resizeMode="cover"
            onError={() => setFailedPrimaryImage(true)}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: statusVisual.bgColor,
                  borderColor: statusVisual.borderColor,
                },
              ]}
            >
              <AppIcon name={statusVisual.icon} size={13} color={statusVisual.textColor} />
              <Text style={[styles.statusText, { color: statusVisual.textColor }]}>{statusVisual.label}</Text>
            </View>
            {saved ? (
              <View style={[styles.savedPill, { backgroundColor: 'rgba(14, 31, 36, 0.85)' }]}>
                <AppIcon name="bookmark-outline" size={12} color="#ffffff" />
                <Text style={styles.savedPillText}>Saved</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title || 'Item Details'}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {item.description || 'No description provided for this report.'}
          </Text>
        </View>

        <View style={styles.sectionTitleRow}>
          <AppIcon name="clipboard-list-outline" size={17} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>View Details</Text>
        </View>
        <View style={styles.infoGrid}>
          {details.map((entry) => (
            <View key={entry.key} style={[styles.infoCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={styles.infoLabelRow}>
                <AppIcon name={entry.icon} size={13} color={colors.textMuted} />
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{entry.label}</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
                {entry.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionTitleRow}>
          <AppIcon name="hand-coin-outline" size={17} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Best Options For You</Text>
        </View>
        <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
          Recommended actions are shown in priority order for this report.
        </Text>
        {recommendedActions.map((entry) => (
          <OptionCard
            key={entry.key}
            iconName={entry.iconName}
            title={entry.title}
            subtitle={entry.subtitle}
            onPress={entry.onPress}
            colors={colors}
            disabled={entry.disabled}
            tone={entry.tone}
          />
        ))}

        {!isGuest ? (
          <View style={[styles.manageSection, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={styles.sectionTitleRow}>
              <AppIcon name="shield-account-outline" size={16} color={colors.text} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Safety & Moderation</Text>
            </View>

            <Text style={[styles.manageHint, { color: colors.textMuted }]}>
              Flag suspicious reports so admins can review and protect the community.
            </Text>
            <TextInput
              style={[
                styles.flagInput,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.cardAlt },
              ]}
              value={flagReason}
              onChangeText={setFlagReason}
              placeholder="Reason for flagging"
              placeholderTextColor={colors.textMuted}
              keyboardAppearance="light"
            />

            <OptionCard
              iconName="flag-outline"
              title="Flag This Report"
              subtitle="Send your reason to admin moderation."
              onPress={onFlag}
              colors={colors}
              tone="danger"
            />

            {canManage ? (
              <OptionCard
                iconName="delete-outline"
                title="Delete Report"
                subtitle="Permanently remove this report from the feed."
                onPress={onDeleteReport}
                colors={colors}
                tone="danger"
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.sectionTitleRow}>
          <AppIcon name="target-account" size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Potential Matches</Text>
        </View>
        {isGuest ? (
          <Text style={[styles.matchMeta, { color: colors.textMuted }]}>
            Sign in to see personalized match confidence.
          </Text>
        ) : matchesLoading ? (
          <View style={[styles.matchesLoader, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.matchMeta, { color: colors.textMuted }]}>Checking similar reports...</Text>
          </View>
        ) : matches.length ? (
          matches.slice(0, MATCH_LIMIT).map((entry, index) => {
            const candidate = entry.item || entry;
            const score = entry.score;
            const matchStatus = getStatusVisual(candidate?.status, colors);

            return (
              <Pressable
                key={candidate?._id || `match-${index}`}
                onPress={() => onOpenMatch(candidate)}
                style={({ pressed }) => [
                  styles.matchCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={styles.matchTitleRow}>
                  <Text style={[styles.matchTitle, { color: colors.text }]} numberOfLines={1}>
                    {candidate?.title || 'Untitled Item'}
                  </Text>
                  <View
                    style={[
                      styles.miniStatusPill,
                      { backgroundColor: matchStatus.bgColor, borderColor: matchStatus.borderColor },
                    ]}
                  >
                    <AppIcon name={matchStatus.icon} size={11} color={matchStatus.textColor} />
                    <Text style={[styles.miniStatusText, { color: matchStatus.textColor }]}>{matchStatus.label}</Text>
                  </View>
                </View>

                <Text style={[styles.matchMeta, { color: colors.textMuted }]} numberOfLines={1}>
                  <AppIcon name="map-marker-outline" size={12} color={colors.textMuted} /> {candidate?.locationText || 'Location not provided'}
                </Text>
                {typeof score === 'number' ? (
                  <Text style={[styles.matchMeta, { color: colors.textMuted }]}>
                    <AppIcon name="chart-box-outline" size={12} color={colors.textMuted} /> Confidence: {Math.round(score * 100)}%
                  </Text>
                ) : null}
              </Pressable>
            );
          })
        ) : (
          <Text style={[styles.matchMeta, { color: colors.textMuted }]}>No strong matches found yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
  },
  bgOrbTop: {
    position: 'absolute',
    top: -70,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 200,
    opacity: 0.9,
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: -110,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 220,
    opacity: 0.8,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  heroImage: {
    width: '100%',
    height: 230,
    backgroundColor: '#dfecef',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  savedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  savedPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  titleBlock: {
    marginBottom: 6,
  },
  title: {
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -0.2,
    fontWeight: '900',
  },
  description: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  sectionTitleRow: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionMeta: {
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 9,
  },
  infoCard: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  infoLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  optionCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 1,
  },
  optionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  manageSection: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 13,
    padding: 11,
  },
  manageHint: {
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  flagInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginBottom: 4,
  },
  matchesLoader: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  matchCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  matchTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  matchTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  miniStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  miniStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  matchMeta: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
});

export default ItemDetailScreen;
