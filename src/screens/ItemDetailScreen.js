import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable,
  SafeAreaView, ScrollView, Share, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import AppIcon from '../components/AppIcon';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { itemService } from '../services/itemService';
import { generateItemImageUrl, resolveItemImageUrl } from '../utils/imageFallback';

// ─── Constants ────────────────────────────────────────────────────
const C = {
  blue: '#1a6edb',
  blueSoft: '#eff6ff',
  blueAlpha: 'rgba(26,110,219,0.12)',
  white: '#ffffff',
  bg: '#f2f4f8',
  card: '#ffffff',
  border: '#e8eaed',
  borderSoft: '#f0f2f5',
  textDark: '#111827',
  textMid: '#6b7280',
  textLight: '#9ca3af',
  green: '#16a34a',
  greenBg: '#e8f5e9',
  red: '#cc2222',
  redBg: '#fff0f0',
  amber: '#b45309',
  amberBg: '#fff3e0',
  purpleBg: '#e8edff',
  purple: '#1a3edb',
};

const MATCH_LIMIT = 5;

// ─── Helpers ──────────────────────────────────────────────────────
const toDisplayTime = (val) => {
  if (!val) return 'Not available';
  const d = new Date(val);
  return isNaN(d.getTime()) ? 'Not available' : d.toLocaleString();
};

const STATUS_MAP = {
  lost: { label: 'LOST', icon: 'compass-outline', text: C.red, bg: C.redBg, border: '#efb6bb' },
  found: { label: 'FOUND', icon: 'package-variant-closed', text: C.green, bg: C.greenBg, border: '#badcc0' },
  recovered: { label: 'RETURNED', icon: 'check-circle-outline', text: C.purple, bg: C.purpleBg, border: '#c7d4fd' },
  returned: { label: 'RETURNED', icon: 'check-circle-outline', text: C.purple, bg: C.purpleBg, border: '#c7d4fd' },
  archived: { label: 'ARCHIVED', icon: 'archive-outline', text: C.textMid, bg: '#f3f4f6', border: '#d1d5db' },
};
const DEFAULT_STATUS = { label: 'UNKNOWN', icon: 'help-circle-outline', text: C.textMid, bg: C.blueSoft, border: C.border };
const getStatus = (s) => STATUS_MAP[s] ?? DEFAULT_STATUS;

const TONE_MAP = {
  primary: { bg: C.blue, border: C.blue, icon: C.white, title: C.white, sub: 'rgba(255,255,255,0.75)' },
  success: { bg: C.green, border: C.green, icon: C.white, title: C.white, sub: 'rgba(255,255,255,0.75)' },
  danger: { bg: '#a93f3f', border: '#a93f3f', icon: C.white, title: C.white, sub: '#ffdede' },
  warning: { bg: C.amber, border: C.amber, icon: C.white, title: C.white, sub: '#ffecc7' },
  neutral: { bg: C.card, border: C.border, icon: C.blue, title: C.textDark, sub: C.textMid },
};

// ─── OptionCard ───────────────────────────────────────────────────
const OptionCard = ({ iconName, title, subtitle, onPress, tone = 'neutral', disabled = false }) => {
  const t = TONE_MAP[tone] ?? TONE_MAP.neutral;
  return (
    <Pressable
      style={({ pressed }) => [s.optionCard, { backgroundColor: t.bg, borderColor: t.border },
      pressed && !disabled && { opacity: 0.88 }, disabled && { opacity: 0.5 }]}
      onPress={onPress} disabled={disabled}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
    >
      <View style={[s.optionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
        <AppIcon name={iconName} size={16} color={t.icon} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.optionTitle, { color: t.title }]} numberOfLines={1}>{title}</Text>
        <Text style={[s.optionSub, { color: t.sub }]} numberOfLines={2}>{subtitle}</Text>
      </View>
      <AppIcon name="chevron-right" size={16} color={t.icon} />
    </Pressable>
  );
};

// ─── InfoChip ─────────────────────────────────────────────────────
const InfoChip = ({ icon, label, value }) => (
  <View style={s.infoChip}>
    <View style={s.infoChipIcon}>
      <AppIcon name={icon} size={13} color={C.blue} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.infoChipLabel}>{label}</Text>
      <Text style={s.infoChipValue} numberOfLines={2}>{value}</Text>
    </View>
  </View>
);

// ─── SectionHeader ────────────────────────────────────────────────
const SectionHeader = ({ icon, title, sub }) => (
  <View style={{ marginTop: 18, marginBottom: 10 }}>
    <View style={s.secTitleRow}>
      <View style={s.secIconWrap}><AppIcon name={icon} size={15} color={C.blue} /></View>
      <Text style={s.secTitle}>{title}</Text>
    </View>
    {sub ? <Text style={s.secSub}>{sub}</Text> : null}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────
const ItemDetailScreen = ({ route, navigation }) => {
  const initial = route.params?.item || {};
  const { user } = useAuth();
  const {
    markRecovered, flagReport, deleteReport, getMatchesFor,
    requestClaim, reviewClaim, getClaimContact,
    toggleSavedItem, isItemSaved, recordViewedItem,
  } = useItems();

  const [item, setItem] = useState(initial);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(!initial?.title);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [flagReason, setFlagReason] = useState('Suspicious or spam report');
  const [claimAnswers, setClaimAnswers] = useState([]);
  const [claimNote, setClaimNote] = useState('');
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimContact, setClaimContact] = useState(null);

  useEffect(() => { setImgFailed(false); }, [item?._id]);

  // Load full item if only id passed
  useEffect(() => {
    if (initial?.title || !initial?._id) return;
    setLoading(true);
    itemService.getById(initial._id)
      .then(d => setItem(d.item || initial))
      .catch(e => Alert.alert('Error', e?.response?.data?.message || 'Could not load item.'))
      .finally(() => setLoading(false));
  }, [initial]);

  // Load matches
  useEffect(() => {
    if (!item?._id || !user?._id) { setMatches([]); return; }
    setMatchesLoading(true);
    getMatchesFor(item)
      .then(r => setMatches(Array.isArray(r) ? r : []))
      .catch(console.error)
      .finally(() => setMatchesLoading(false));
  }, [getMatchesFor, item, user?._id]);

  // Record view
  useEffect(() => {
    if (item?._id) recordViewedItem(item).catch(console.warn);
  }, [item, recordViewedItem]);

  // Reset claim state when item changes
  useEffect(() => {
    const count = Array.isArray(item?.secretQuestions) ? item.secretQuestions.length : 0;
    setClaimAnswers(Array.from({ length: count }, () => ''));
    setClaimNote(''); setClaimContact(null); setShowClaimForm(false);
  }, [item?._id, item?.secretQuestions]);

  // ── Derived state ──
  const reporterId = typeof item?.reportedBy === 'string' ? item.reportedBy : item?.reportedBy?._id;
  const isGuest = !user?._id;
  const isOwner = !isGuest && reporterId === user?._id;
  const canManage = !isGuest && (isOwner || user?.role === 'admin');
  const canChat = !isGuest && Boolean(reporterId) && reporterId !== user?._id;
  const isRecovered = item?.status === 'recovered' || item?.status === 'returned';
  const saved = isItemSaved(item?._id);
  const claimStatus = item?.claim?.status || 'none';
  const claimReqId = typeof item?.claim?.requester === 'string' ? item.claim.requester : item?.claim?.requester?._id;
  const isClaimRequester = !isGuest && claimReqId === user?._id;
  const canRequestClaim = !isGuest && !isOwner && item?.status === 'found' &&
    claimStatus !== 'approved' && claimStatus !== 'pending' &&
    Array.isArray(item?.secretQuestions) && item.secretQuestions.length > 0;
  const canReviewClaim = canManage && claimStatus === 'pending';
  const statusVis = getStatus(item?.status);

  const imageSource = useMemo(() => ({
    uri: imgFailed ? generateItemImageUrl(item) : resolveItemImageUrl(item),
  }), [imgFailed, item]);

  const DETAILS = [
    { key: 'category', label: 'Category', value: item?.category || 'N/A', icon: 'tag-outline' },
    { key: 'location', label: 'Location', value: item?.locationText || 'Not provided', icon: 'map-marker-outline' },
    { key: 'reporter', label: 'Reported by', value: item?.reportedBy?.name || 'Unknown', icon: 'account-outline' },
    { key: 'reportedAt', label: 'Reported at', value: toDisplayTime(item?.createdAt), icon: 'clock-outline' },
  ];

  // ── Navigation helpers ──
  const goAccount = () => {
    const nav = navigation.getParent?.() || navigation;
    nav.navigate?.('Main', { screen: 'Account' }) || navigation.navigate('Account');
  };

  // ── Actions ──
  const onRecovered = async () => {
    if (isGuest) { Alert.alert('Login required'); goAccount(); return; }
    try {
      const d = await markRecovered(item._id);
      setItem(d.item || { ...item, status: 'recovered' });
      Alert.alert('Updated', 'Marked as recovered.');
    } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Failed.'); }
  };

  const onFlag = async () => {
    if (isGuest) { Alert.alert('Login required'); goAccount(); return; }
    try {
      await flagReport(item._id, flagReason.trim() || 'Suspicious or spam report');
      Alert.alert('Flagged', 'Sent for admin review.');
    } catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Failed.'); }
  };

  const onDelete = () => {
    Alert.alert('Delete Report', 'This will permanently delete this report.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteReport(item._id); navigation.goBack(); }
          catch (e) { Alert.alert('Error', e?.response?.data?.message || 'Failed.'); }
        }
      },
    ]);
  };

  const onToggleSaved = async () => {
    try {
      const now = await toggleSavedItem(item);
      Alert.alert(now ? 'Saved' : 'Removed', now ? 'Bookmarked.' : 'Removed from saved.');
    } catch (e) { Alert.alert('Error', e?.message); }
  };

  const onShare = () => Share.share({
    message: `${item.title || 'Lost/Found'}\n${item.description || ''}\nLocation: ${item.locationText || 'N/A'}`,
  }).catch(console.warn);

  const onSubmitClaim = async () => {
    if (claimAnswers.some(a => !String(a || '').trim())) {
      Alert.alert('Claim', 'Answer all questions.'); return;
    }
    setClaimLoading(true);
    try {
      await requestClaim(item._id, { answers: claimAnswers.map(a => String(a).trim()), note: claimNote.trim() });
      const d = await itemService.getById(item._id);
      setItem(d.item || item);
      Alert.alert('Submitted', 'Claim sent to finder.');
      setShowClaimForm(false);
    } catch (e) { Alert.alert('Failed', e?.response?.data?.message || 'Try again.'); }
    finally { setClaimLoading(false); }
  };

  const onReviewClaim = async (action) => {
    setClaimLoading(true);
    try {
      await reviewClaim(item._id, { action });
      const d = await itemService.getById(item._id);
      setItem(d.item || item);
      Alert.alert('Done', action === 'approve' ? 'Claim approved.' : 'Claim declined.');
    } catch (e) { Alert.alert('Failed', e?.response?.data?.message); }
    finally { setClaimLoading(false); }
  };

  const onRevealContact = async () => {
    setClaimLoading(true);
    try {
      const d = await getClaimContact(item._id);
      setClaimContact(d?.contact || null);
    } catch (e) { Alert.alert('Error', e?.response?.data?.message); }
    finally { setClaimLoading(false); }
  };

  // ── Actions list ──
  const actions = [
    isGuest && { key: 'login', iconName: 'login', title: 'Sign In For Full Access', subtitle: 'Unlock chat, claims and moderation.', onPress: goAccount, tone: 'primary' },
    !isGuest && canChat && {
      key: 'chat',
      iconName: 'chat-processing-outline',
      title: 'Message Reporter',
      subtitle: 'Coordinate a safe handoff directly.',
      onPress: () => navigation.navigate('Main', { screen: 'Chat', params: { item, otherUserId: reporterId } }),
      tone: 'success'
    },
    canRequestClaim && { key: 'claim', iconName: 'account-check-outline', title: 'This is Mine!', subtitle: 'Answer secret questions to claim this item.', onPress: () => setShowClaimForm(p => !p), tone: 'success' },
    !isGuest && { key: 'recover', iconName: 'check-circle-outline', title: isRecovered ? 'Already Recovered' : 'Mark As Recovered', subtitle: isRecovered ? 'This report is closed.' : 'Close the report once item is returned.', onPress: onRecovered, tone: 'primary', disabled: isRecovered },
    { key: 'save', iconName: saved ? 'bookmark-remove-outline' : 'bookmark-outline', title: saved ? 'Remove Bookmark' : 'Save Item', subtitle: saved ? 'Tap to unsave this report.' : 'Bookmark for quick access.', onPress: onToggleSaved, tone: 'warning' },
    { key: 'share', iconName: 'share-variant-outline', title: 'Share Report', subtitle: 'Spread the word so the owner is found faster.', onPress: onShare, tone: 'neutral' },
  ].filter(Boolean);

  if (loading) return (
    <SafeAreaView style={s.loaderWrap}>
      <ActivityIndicator size="large" color={C.blue} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Blue hero header ── */}
        <View style={s.hero}>
          <Image source={imageSource} style={s.heroImg} resizeMode="cover"
            onError={() => setImgFailed(true)} />
          <View style={s.heroOverlay} />

          {/* Top: back + status + bookmark */}
          <View style={s.heroTop}>
            <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
              <AppIcon name="arrow-left" size={18} color={C.white} />
            </Pressable>
            <View style={[s.statusPill, { backgroundColor: statusVis.bg, borderColor: statusVis.border }]}>
              <AppIcon name={statusVis.icon} size={12} color={statusVis.text} />
              <Text style={[s.statusTxt, { color: statusVis.text }]}>{statusVis.label}</Text>
            </View>
            <Pressable style={s.backBtn} onPress={onToggleSaved}>
              <AppIcon name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={C.white} />
            </Pressable>
          </View>
        </View>

        {/* ── Title block ── */}
        <View style={s.titleBlock}>
          <Text style={s.title}>{item.title || 'Item Details'}</Text>
          <Text style={s.desc}>{item.description || 'No description provided.'}</Text>
        </View>

        {/* ── Details grid ── */}
        <SectionHeader icon="clipboard-list-outline" title="Item Details" />
        <View style={s.detailGrid}>
          {DETAILS.map(d => <InfoChip key={d.key} icon={d.icon} label={d.label} value={d.value} />)}
        </View>

        {/* ── Actions ── */}
        <SectionHeader icon="hand-coin-outline" title="Actions"
          sub="Recommended options for this report." />
        {actions.map(a => (
          <OptionCard key={a.key} iconName={a.iconName} title={a.title}
            subtitle={a.subtitle} onPress={a.onPress} tone={a.tone} disabled={a.disabled} />
        ))}

        {/* ── Claim section ── */}
        {(canRequestClaim || claimStatus === 'pending' || (claimStatus === 'approved' && isClaimRequester)) && (
          <View style={s.panel}>
            <SectionHeader icon="shield-key-outline" title="Claim Verification" />
            <View style={[s.claimStatusBadge, { backgroundColor: claimStatus === 'approved' ? C.greenBg : C.blueSoft }]}>
              <Text style={[s.claimStatusTxt, { color: claimStatus === 'approved' ? C.green : C.blue }]}>
                Status: {claimStatus.toUpperCase()}
              </Text>
            </View>

            {canRequestClaim && showClaimForm && (item.secretQuestions || []).map((q, i) => (
              <View key={i}>
                <Text style={s.qLabel}>{q.question}</Text>
                <TextInput style={s.input} value={claimAnswers[i] || ''} placeholderTextColor={C.textLight}
                  placeholder="Your answer..." onChangeText={t => setClaimAnswers(p => p.map((a, idx) => idx === i ? t : a))} />
              </View>
            ))}
            {canRequestClaim && showClaimForm && (
              <>
                <TextInput style={s.input} value={claimNote} onChangeText={setClaimNote}
                  placeholder="Optional note to finder" placeholderTextColor={C.textLight} />
                <OptionCard iconName="send-outline"
                  title={claimLoading ? 'Submitting…' : 'Submit Claim'}
                  subtitle="Finder will review your answers."
                  onPress={onSubmitClaim} tone="primary" disabled={claimLoading} />
              </>
            )}
            {canReviewClaim && (
              <>
                <OptionCard iconName="check-circle-outline" title={claimLoading ? 'Working…' : 'Approve Claim'}
                  subtitle="Confirm owner and mark as returned." onPress={() => onReviewClaim('approve')}
                  tone="success" disabled={claimLoading} />
                <OptionCard iconName="close-circle-outline" title={claimLoading ? 'Working…' : 'Decline Claim'}
                  subtitle="Reject this claim." onPress={() => onReviewClaim('decline')}
                  tone="danger" disabled={claimLoading} />
              </>
            )}
            {claimStatus === 'approved' && isClaimRequester && (
              <>
                <OptionCard iconName="phone-outline" title={claimLoading ? 'Loading…' : 'Reveal Contact'}
                  subtitle="Shown only after claim approval." onPress={onRevealContact}
                  tone="warning" disabled={claimLoading} />
                {claimContact?.phoneNumber && (
                  <View style={s.contactBox}>
                    <AppIcon name="phone-check-outline" size={16} color={C.green} />
                    <Text style={s.contactTxt}>{claimContact.name || 'Owner'} · {claimContact.phoneNumber}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Moderation ── */}
        {!isGuest && (
          <View style={s.panel}>
            <SectionHeader icon="shield-account-outline" title="Safety & Moderation"
              sub="Flag suspicious posts so admins can review them." />
            <TextInput style={s.input} value={flagReason} onChangeText={setFlagReason}
              placeholder="Reason for flagging" placeholderTextColor={C.textLight} />
            <OptionCard iconName="flag-outline" title="Flag This Report"
              subtitle="Submit to admin moderation." onPress={onFlag} tone="danger" />
            {canManage && (
              <OptionCard iconName="delete-outline" title="Delete Report"
                subtitle="Permanently remove from the feed." onPress={onDelete} tone="danger" />
            )}
          </View>
        )}

        {/* ── Matches ── */}
        <SectionHeader icon="target-account" title="Potential Matches"
          sub={isGuest ? 'Sign in to see match confidence scores.' : 'AI-matched similar reports.'} />

        {matchesLoading ? (
          <View style={s.matchLoader}>
            <ActivityIndicator size="small" color={C.blue} />
            <Text style={s.matchMeta}>Checking similar reports…</Text>
          </View>
        ) : matches.length ? (
          matches.slice(0, MATCH_LIMIT).map((entry, i) => {
            const c = entry.item || entry;
            const ms = getStatus(c?.status);
            const pct = typeof entry.score === 'number' ? Math.round(entry.score * 100) : null;
            return (
              <Pressable key={c?._id || i}
                style={({ pressed }) => [s.matchCard, pressed && { opacity: 0.88 }]}
                onPress={() => navigation.push('ItemDetail', { item: c })}>
                <View style={s.matchTop}>
                  <Text style={s.matchTitle} numberOfLines={1}>{c?.title || 'Untitled'}</Text>
                  <View style={[s.miniPill, { backgroundColor: ms.bg, borderColor: ms.border }]}>
                    <Text style={[s.miniPillTxt, { color: ms.text }]}>{ms.label}</Text>
                  </View>
                </View>
                <View style={s.matchMeta2}>
                  <AppIcon name="map-marker-outline" size={11} color={C.textMid} />
                  <Text style={s.matchMetaTxt} numberOfLines={1}>{c?.locationText || 'No location'}</Text>
                  {pct !== null && (
                    <>
                      <View style={s.dot} />
                      <Text style={s.matchMetaTxt}>Match: {pct}%</Text>
                    </>
                  )}
                </View>
                {pct !== null && (
                  <View style={s.progressBar}>
                    <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: pct > 70 ? C.green : pct > 40 ? C.amber : C.red }]} />
                  </View>
                )}
              </Pressable>
            );
          })
        ) : (
          <View style={s.emptyMatches}>
            <AppIcon name="magnify-close" size={24} color={C.textLight} />
            <Text style={s.emptyMatchesTxt}>No strong matches found yet.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  content: { paddingBottom: 32 },

  /* Hero */
  hero: { height: 240, backgroundColor: C.blue },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  heroTop: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  statusTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  /* Title */
  titleBlock: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: C.textDark, marginBottom: 6 },
  desc: { fontSize: 13, color: C.textMid, lineHeight: 20 },

  /* Section header */
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  secIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 15, fontWeight: '800', color: C.textDark },
  secSub: { fontSize: 11, color: C.textMid, marginTop: 3, paddingHorizontal: 14 },

  /* Detail grid */
  detailGrid: { paddingHorizontal: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoChip: { width: '47.5%', backgroundColor: C.card, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, padding: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoChipIcon: { width: 26, height: 26, borderRadius: 7, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  infoChipLabel: { fontSize: 9, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoChipValue: { fontSize: 12, fontWeight: '600', color: C.textDark },

  /* OptionCard */
  optionCard: { marginHorizontal: 14, marginBottom: 8, borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  optionSub: { fontSize: 11, lineHeight: 15 },

  /* Panel (claim / moderation) */
  panel: { marginHorizontal: 14, marginTop: 4, backgroundColor: C.card, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, paddingBottom: 12 },
  claimStatusBadge: { marginHorizontal: 14, marginBottom: 8, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  claimStatusTxt: { fontSize: 11, fontWeight: '700' },
  qLabel: { fontSize: 12, fontWeight: '600', color: C.textDark, marginHorizontal: 14, marginBottom: 4 },
  input: { marginHorizontal: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.bg, color: C.textDark, fontSize: 13 },
  contactBox: { marginHorizontal: 14, marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.greenBg, borderRadius: 10, padding: 10 },
  contactTxt: { fontSize: 13, fontWeight: '700', color: C.textDark },

  /* Match */
  matchLoader: { marginHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: C.card, borderRadius: 12, borderWidth: 0.5, borderColor: C.border },
  matchMeta: { fontSize: 12, color: C.textMid },
  matchCard: { marginHorizontal: 14, marginBottom: 8, backgroundColor: C.card, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, padding: 12 },
  matchTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  matchTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: C.textDark, paddingRight: 8 },
  miniPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  miniPillTxt: { fontSize: 9, fontWeight: '800' },
  matchMeta2: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  matchMetaTxt: { fontSize: 11, color: C.textMid },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textLight },
  progressBar: { height: 4, backgroundColor: C.borderSoft, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  emptyMatches: { marginHorizontal: 14, alignItems: 'center', gap: 6, paddingVertical: 20 },
  emptyMatchesTxt: { fontSize: 13, color: C.textLight },
});

export default ItemDetailScreen;
