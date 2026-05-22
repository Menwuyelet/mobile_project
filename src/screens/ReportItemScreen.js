import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useItems } from '../context/ItemsContext';
import { useAuth } from '../context/AuthContext';
import AppIcon from '../components/AppIcon';
import { imageService } from '../services/imageService';
import { permissionsService } from '../services/permissionsService';
import { storageService } from '../services/storageService';
import { CATEGORIES } from '../utils/constants';
import { generateItemImageUrl } from '../utils/imageFallback';
import { validateReport } from '../utils/validators';

const defaultForm = {
  status: 'lost',
  title: '',
  description: '',
  category: 'Other',
  otherItemName: '',
  locationText: '',
  imageUrl: '',
  lastSeenHint: '',
};

const OTHER_CATEGORY = 'Other';
const TITLE_MAX = 80;
const ITEM_NAME_MAX = 50;
const DESC_MAX = 600;
const LOCATION_MAX = 120;
const LAST_SEEN_OPTIONS = ['Today', 'Yesterday', 'This Week', 'Last Week', 'Not Sure'];
const TEMPLATE_PRESETS = [
  {
    key: 'phone',
    label: 'Phone',
    category: 'Electronics',
    title: '{{status}} phone near {{area}}',
    description: 'Brand/model:\nColor:\nUnique marks:\nExact place:\nOwner proof or contact:',
  },
  {
    key: 'id',
    label: 'ID Card',
    category: 'ID',
    title: '{{status}} ID card in {{area}}',
    description: 'Name initials visible:\nInstitute/faculty:\nCard color:\nWhere found/lost:\nHow to claim:',
  },
  {
    key: 'bag',
    label: 'Bag',
    category: 'Accessories',
    title: '{{status}} bag near {{area}}',
    description: 'Bag color/type:\nBrand/logo:\nItems inside:\nExact place/time:\nSafe contact method:',
  },
  {
    key: 'keys',
    label: 'Keys',
    category: 'Accessories',
    title: '{{status}} keys around {{area}}',
    description: 'Keychain color:\nHow many keys:\nSpecial marks:\nLast known location:\nPickup details:',
  },
  {
    key: 'laptop',
    label: 'Laptop',
    category: 'Electronics',
    title: '{{status}} laptop in {{area}}',
    description: 'Brand/model:\nColor:\nSticker or case:\nLast seen time/location:\nOwnership proof:',
  },
];

const ActionButton = ({
  label,
  iconName,
  loading,
  onPress,
  tone = 'neutral',
  disabled = false,
}) => {
  const toneStyle =
    tone === 'danger'
      ? styles.actionDanger
      : tone === 'primary'
        ? styles.actionPrimary
        : styles.actionNeutral;
  const textColor = tone === 'primary' ? '#ffffff' : tone === 'danger' ? '#9e2f2f' : '#15545f';
  const iconColor = tone === 'primary' ? '#ffffff' : tone === 'danger' ? '#9e2f2f' : '#15545f';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        toneStyle,
        pressed && !disabled && !loading && styles.actionPressed,
        (disabled || loading) && styles.actionDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <View style={styles.actionInner}>
          <AppIcon name={iconName} size={15} color={iconColor} />
          <Text style={[styles.actionText, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

const Chip = ({ label, selected, onPress }) => (
  <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </Pressable>
);

const buildAutoTitle = (status, value) => {
  const statusLabel = status === 'lost' ? 'Lost' : 'Found';
  return `${statusLabel} ${String(value || '').trim()}`.replace(/\s+/g, ' ').trim();
};

const ReportItemScreen = () => {
  const { createReport, items } = useItems();
  const { user } = useAuth();

  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const skipNextDraftPersist = useRef(false);
  const draftReady = useRef(false);

  useEffect(() => {
    const bootstrap = async () => {
      const draft = await storageService.getJSON(storageService.keys.LAST_REPORT_DRAFT, null);
      if (draft) {
        setForm({ ...defaultForm, ...draft });
      }

      draftReady.current = true;
      permissionsService.requestNotificationPermission().catch((error) => {
        console.warn('Notification permission request failed', error);
      });
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!draftReady.current) {
      return;
    }

    if (skipNextDraftPersist.current) {
      skipNextDraftPersist.current = false;
      return;
    }

    const timer = setTimeout(() => {
      storageService.setJSON(storageService.keys.LAST_REPORT_DRAFT, form).catch((error) => {
        console.warn('Draft auto-save failed', error);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [form]);

  const resolvedTitle = useMemo(() => {
    const explicitTitle = form.title.trim();
    if (explicitTitle) {
      return explicitTitle;
    }
    if (form.category === OTHER_CATEGORY && form.otherItemName.trim()) {
      return buildAutoTitle(form.status, form.otherItemName);
    }
    return '';
  }, [form.category, form.otherItemName, form.status, form.title]);

  const qualityChecks = useMemo(() => {
    const hasLocationText = form.locationText.trim().length >= 3;

    const checks = [
      { label: 'Specific title', passed: resolvedTitle.length >= 8 },
      { label: 'Detailed description', passed: form.description.trim().length >= 25 },
      { label: 'Category selected', passed: Boolean(form.category) },
      { label: 'Location added', passed: hasLocationText },
      { label: 'Last-seen time added', passed: Boolean(form.lastSeenHint) },
      { label: 'Photo attached', passed: Boolean(form.imageUrl) },
    ];
    return checks;
  }, [form, resolvedTitle]);

  const qualityPercent = useMemo(() => {
    const passed = qualityChecks.filter((check) => check.passed).length;
    return Math.round((passed / qualityChecks.length) * 100);
  }, [qualityChecks]);

  const isFormValid = useMemo(() => !validateReport({ ...form, title: resolvedTitle }), [form, resolvedTitle]);
  const isBusy = Boolean(busyAction) || submitting;

  const similarReports = useMemo(() => {
    const normalizedTitle = resolvedTitle.toLowerCase();
    const titleTokens = normalizedTitle.split(/\s+/).filter((token) => token.length >= 3);

    const candidates = items
      .map((entry) => {
        let score = 0;
        if ((entry?.category || '').toLowerCase() === (form.category || '').toLowerCase()) {
          score += 2;
        }
        if ((entry?.status || '').toLowerCase() === (form.status || '').toLowerCase()) {
          score += 1;
        }

        const haystack = [entry?.title, entry?.description, entry?.locationText].join(' ').toLowerCase();
        if (titleTokens.length) {
          const tokenMatches = titleTokens.filter((token) => haystack.includes(token)).length;
          score += Math.min(3, tokenMatches);
        }

        return { entry, score };
      })
      .filter((candidate) => candidate.score >= 3)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const aTime = a.entry?.createdAt ? new Date(a.entry.createdAt).getTime() : 0;
        const bTime = b.entry?.createdAt ? new Date(b.entry.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 3)
      .map((candidate) => candidate.entry);

    return candidates;
  }, [form.category, form.status, items, resolvedTitle]);

  const updateForm = (nextPatch) => {
    setForm((prev) => ({ ...prev, ...nextPatch }));
  };

  const onStatusChange = (status) => {
    setForm((prev) => {
      const next = { ...prev, status };
      const previousAutoTitle =
        prev.category === OTHER_CATEGORY
          ? (prev.otherItemName.trim() ? buildAutoTitle(prev.status, prev.otherItemName) : '')
          : buildAutoTitle(prev.status, prev.category);
      const shouldAutoUpdate = !prev.title.trim() || prev.title.trim() === previousAutoTitle;

      if (shouldAutoUpdate) {
        if (prev.category === OTHER_CATEGORY) {
          next.title = prev.otherItemName.trim() ? buildAutoTitle(status, prev.otherItemName) : '';
        } else {
          next.title = buildAutoTitle(status, prev.category);
        }
      }
      return next;
    });
  };

  const onCategoryChange = (category) => {
    setForm((prev) => {
      const next = { ...prev, category };
      const previousAutoTitle =
        prev.category === OTHER_CATEGORY
          ? (prev.otherItemName.trim() ? buildAutoTitle(prev.status, prev.otherItemName) : '')
          : buildAutoTitle(prev.status, prev.category);
      const shouldAutoUpdate = !prev.title.trim() || prev.title.trim() === previousAutoTitle;

      if (shouldAutoUpdate) {
        if (category === OTHER_CATEGORY) {
          next.title = prev.otherItemName.trim() ? buildAutoTitle(prev.status, prev.otherItemName) : '';
        } else {
          next.title = buildAutoTitle(prev.status, category);
        }
      }
      return next;
    });
  };

  const onOtherItemNameChange = (otherItemName) => {
    setForm((prev) => {
      const next = { ...prev, otherItemName };
      if (prev.category !== OTHER_CATEGORY) {
        return next;
      }

      const previousAutoTitle = prev.otherItemName.trim()
        ? buildAutoTitle(prev.status, prev.otherItemName)
        : '';
      const shouldAutoUpdate = !prev.title.trim() || prev.title.trim() === previousAutoTitle;

      if (shouldAutoUpdate) {
        next.title = otherItemName.trim() ? buildAutoTitle(prev.status, otherItemName) : '';
      }
      return next;
    });
  };

  const applyTemplate = (template) => {
    setForm((prev) => {
      const statusWord = prev.status === 'lost' ? 'Lost' : 'Found';
      const area = prev.locationText.trim() || 'the area';
      const templateTitle = template.title
        .replace('{{status}}', statusWord)
        .replace('{{area}}', area);
      const nextDescription = prev.description.trim()
        ? `${prev.description.trim()}\n\n${template.description}`
        : template.description;

      return {
        ...prev,
        category: template.category,
        otherItemName: '',
        title: prev.title.trim() ? prev.title : templateTitle,
        description: nextDescription,
        locationText: prev.locationText || 'Near main gate',
        lastSeenHint: prev.lastSeenHint || 'Today',
      };
    });
  };

  const applyGeneratedImage = async () => {
    setBusyAction('generateImage');
    try {
      updateForm({ imageUrl: generateItemImageUrl(form) });
    } finally {
      setBusyAction('');
    }
  };

  const attachPhoto = async (source) => {
    const loadingKey = source === 'gallery' ? 'galleryPhoto' : 'cameraPhoto';
    setBusyAction(loadingKey);
    try {
      const allowed =
        source === 'gallery'
          ? await permissionsService.requestGalleryPermission()
          : await permissionsService.requestCameraPermission();
      if (!allowed) {
        Alert.alert(
          'Permission',
          source === 'gallery'
            ? 'Gallery permission is required to select photos.'
            : 'Camera permission is required to attach photos.'
        );
        return;
      }

      const asset = source === 'gallery' ? await imageService.openGallery() : await imageService.openCamera();
      if (!asset?.uri) {
        return;
      }

      updateForm({ imageUrl: asset.uri });
    } finally {
      setBusyAction('');
    }
  };


  const clearDraft = async () => {
    Alert.alert('Clear Draft', 'Remove all report fields and reset the form?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setBusyAction('clearDraft');
          try {
            skipNextDraftPersist.current = true;
            setForm(defaultForm);
            await storageService.remove(storageService.keys.LAST_REPORT_DRAFT);
          } finally {
            setBusyAction('');
          }
        },
      },
    ]);
  };

  const saveDraftNow = async () => {
    setBusyAction('saveDraft');
    try {
      await storageService.setJSON(storageService.keys.LAST_REPORT_DRAFT, form);
      Alert.alert('Draft saved', 'Your report draft is saved on this device.');
    } finally {
      setBusyAction('');
    }
  };

  const onSubmit = async () => {
    const computedTitle =
      form.title.trim() ||
      (form.category === OTHER_CATEGORY && form.otherItemName.trim()
        ? buildAutoTitle(form.status, form.otherItemName)
        : '');

    const validationError = validateReport({ ...form, title: computedTitle });
    if (validationError) {
      Alert.alert('Validation', validationError);
      return;
    }

    if (!user?._id) {
      Alert.alert('Session error', 'Please login again.');
      return;
    }

    const descriptionBase = form.description.trim();
    const hasLastSeenText = /last seen:/i.test(descriptionBase);
    const decoratedDescription =
      form.lastSeenHint && !hasLastSeenText
        ? `${descriptionBase}\nLast seen: ${form.lastSeenHint}.`
        : descriptionBase;

    const normalizedForm = {
      ...form,
      title: computedTitle,
      description: decoratedDescription,
      category: form.category.trim(),
      locationText: form.locationText.trim(),
    };

    const { otherItemName, ...payloadForm } = normalizedForm;

    setSubmitting(true);
    setBusyAction('submit');
    try {
      await createReport({
        ...payloadForm,
        imageUrl: payloadForm.imageUrl || generateItemImageUrl(payloadForm),
        reportedBy: user._id,
      });
      skipNextDraftPersist.current = true;
      setForm(defaultForm);
      await storageService.remove(storageService.keys.LAST_REPORT_DRAFT);
      Alert.alert('Success', 'Report posted successfully.');
    } catch (error) {
      Alert.alert('Failed', error?.response?.data?.message || 'Could not create report.');
    } finally {
      setSubmitting(false);
      setBusyAction('');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.titleRow}>
            <AppIcon name="file-document-edit-outline" size={20} color="#12343b" />
            <Text style={styles.title}>Create High-Quality Report</Text>
          </View>
          <Text style={styles.subtitle}>Complete more details to improve match accuracy and faster recovery.</Text>

          <View style={styles.qualityCard}>
            <View style={styles.qualityHeader}>
              <View style={styles.qualityTitleWrap}>
                <AppIcon name="shield-check-outline" size={18} color="#17525e" />
                <Text style={styles.qualityTitle}>Report Quality</Text>
              </View>
              <Text style={styles.qualityScore}>{qualityPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${qualityPercent}%` }]} />
            </View>
            <View style={styles.checksWrap}>
              {qualityChecks.map((check) => (
                <View key={check.label} style={styles.checkRow}>
                  <AppIcon
                    name={check.passed ? 'check-circle-outline' : 'close-circle-outline'}
                    size={14}
                    color={check.passed ? '#1a6a38' : '#9d4f4f'}
                  />
                  <Text style={[styles.checkText, check.passed && styles.checkPassed]}>{check.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Report Type</Text>
          <View style={styles.segmentRow}>
            {['lost', 'found'].map((state) => {
              const active = form.status === state;
              const iconName = state === 'lost' ? 'help-circle-outline' : 'hand-coin-outline';
              return (
                <Pressable
                  key={state}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => onStatusChange(state)}
                >
                  <View style={styles.segmentInner}>
                    <AppIcon name={iconName} size={15} color={active ? '#ffffff' : '#2a4d55'} />
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{state}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Smart Templates</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateRow}
          >
            {TEMPLATE_PRESETS.map((template) => {
              const active = form.category === template.category;
              return (
                <Pressable
                  key={template.key}
                  style={[styles.templateChip, active && styles.templateChipActive]}
                  onPress={() => applyTemplate(template)}
                >
                  <Text style={[styles.templateChipText, active && styles.templateChipTextActive]}>
                    {template.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={styles.templateHint}>Tap once to prefill title and details, then edit as needed.</Text>

          <View style={styles.inputHeader}>
            <Text style={styles.sectionLabel}>Title</Text>
            <Text style={styles.counterText}>{form.title.length}/{TITLE_MAX}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder={
              form.category === OTHER_CATEGORY
                ? 'Auto-filled from Item Name, or type your own title'
                : 'Example: Black Samsung phone near Library'
            }
            placeholderTextColor="#6a7f86"
            value={form.title}
            onChangeText={(title) => updateForm({ title })}
            maxLength={TITLE_MAX}
          />

          <View style={styles.inputHeader}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.counterText}>{form.description.length}/{DESC_MAX}</Text>
          </View>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Describe color, brand, model, unique marks, and when it was lost/found."
            placeholderTextColor="#6a7f86"
            multiline
            value={form.description}
            onChangeText={(description) => updateForm({ description })}
            maxLength={DESC_MAX}
          />

          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                label={category}
                selected={form.category === category}
                onPress={() => onCategoryChange(category)}
              />
            ))}
          </View>

          {form.category === OTHER_CATEGORY && (
            <>
              <View style={styles.inputHeader}>
                <Text style={styles.sectionLabel}>Item Name (Other)</Text>
                <Text style={styles.counterText}>{form.otherItemName.length}/{ITEM_NAME_MAX}</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Example: Water bottle, calculator, jacket"
                placeholderTextColor="#6a7f86"
                value={form.otherItemName}
                onChangeText={onOtherItemNameChange}
                maxLength={ITEM_NAME_MAX}
              />
              <Text style={styles.helperText}>When category is Other, item name auto-fills the title.</Text>
            </>
          )}


          <View style={styles.inputHeader}>
            <Text style={styles.sectionLabel}>Location Description</Text>
            <Text style={styles.counterText}>{form.locationText.length}/{LOCATION_MAX}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Example: Library Block A, 2nd floor"
            placeholderTextColor="#6a7f86"
            value={form.locationText}
            onChangeText={(locationText) => updateForm({ locationText })}
            maxLength={LOCATION_MAX}
          />

          <Text style={styles.sectionLabel}>Last Seen Time</Text>
          <View style={styles.chipsWrap}>
            {LAST_SEEN_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={form.lastSeenHint === option}
                onPress={() => updateForm({ lastSeenHint: option })}
              />
            ))}
          </View>

          <View style={styles.actionRow}>
            <ActionButton
              label="Use Camera"
              iconName="camera-outline"
              loading={busyAction === 'cameraPhoto'}
              onPress={() => attachPhoto('camera')}
              disabled={isBusy && busyAction !== 'cameraPhoto'}
            />
            <ActionButton
              label="From Gallery"
              iconName="image-outline"
              loading={busyAction === 'galleryPhoto'}
              onPress={() => attachPhoto('gallery')}
              disabled={isBusy && busyAction !== 'galleryPhoto'}
            />
          </View>

          <View style={styles.actionRow}>
            <ActionButton
              label="Generate Image"
              iconName="palette-outline"
              loading={busyAction === 'generateImage'}
              onPress={applyGeneratedImage}
              disabled={isBusy && busyAction !== 'generateImage'}
            />
          </View>

          <View style={styles.actionRow}>
            <ActionButton
              label="Clear Draft"
              iconName="delete-outline"
              tone="danger"
              loading={busyAction === 'clearDraft'}
              onPress={clearDraft}
              disabled={isBusy && busyAction !== 'clearDraft'}
            />
            <ActionButton
              label="Save Draft"
              iconName="content-save-outline"
              loading={busyAction === 'saveDraft'}
              onPress={saveDraftNow}
              disabled={isBusy && busyAction !== 'saveDraft'}
            />
          </View>

          <View style={styles.actionRow}>
            {Boolean(form.imageUrl) ? (
              <ActionButton
                label="Remove Photo"
                iconName="image-remove"
                tone="danger"
                loading={false}
                onPress={() => updateForm({ imageUrl: '' })}
                disabled={isBusy}
              />
            ) : (
              <ActionButton
                label="Need Photo"
                iconName="image-off-outline"
                loading={false}
                onPress={() => undefined}
                disabled
              />
            )}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryTitleRow}>
              <AppIcon name="text-box-check-outline" size={15} color="#204a54" />
              <Text style={styles.summaryTitle}>Report Summary</Text>
            </View>
            <Text style={styles.summaryLine}>
              <AppIcon name="clipboard-list-outline" size={13} color="#4d676d" /> Type: {form.status.toUpperCase()}
            </Text>
            <Text style={styles.summaryLine}>
              <AppIcon name="tag-outline" size={13} color="#4d676d" /> Category: {form.category || 'Not selected'}
            </Text>
            {form.category === OTHER_CATEGORY ? (
              <Text style={styles.summaryLine}>
                <AppIcon name="identifier" size={13} color="#4d676d" /> Item name: {form.otherItemName || 'Not added'}
              </Text>
            ) : null}
            <Text style={styles.summaryLine}>
              <AppIcon name="image-outline" size={13} color="#4d676d" /> Photo: {form.imageUrl ? 'Attached' : 'Not attached'}
            </Text>
            <Text style={styles.summaryLine}>
              <AppIcon name="map-marker-outline" size={13} color="#4d676d" /> Location: {form.locationText.trim() ? 'Added' : 'Not added'}
            </Text>
            <Text style={styles.summaryLine}>
              <AppIcon name="clock-time-four-outline" size={13} color="#4d676d" /> Last seen: {form.lastSeenHint || 'Not selected'}
            </Text>
          </View>

          {similarReports.length > 0 && (
            <View style={styles.similarCard}>
              <View style={styles.similarTitleRow}>
                <AppIcon name="timeline-text-outline" size={15} color="#214a54" />
                <Text style={styles.similarTitle}>Potential Similar Reports</Text>
              </View>
              <Text style={styles.similarSubtitle}>
                Review these reports to avoid duplicate posting and improve claim matching.
              </Text>
              {similarReports.map((entry) => (
                <View key={entry._id} style={styles.similarRow}>
                  <Text style={styles.similarRowTitle} numberOfLines={1}>{entry.title || 'Untitled report'}</Text>
                  <Text style={styles.similarRowMeta} numberOfLines={1}>
                    {(entry.status || 'unknown').toUpperCase()} | {entry.category || 'Other'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {Boolean(form.imageUrl) && (
            <View style={styles.previewWrap}>
              <Text style={styles.previewTitle}>Photo Preview</Text>
              <Image source={{ uri: form.imageUrl }} style={styles.previewImage} resizeMode="cover" />
            </View>
          )}

          <Pressable
            style={[styles.submitButton, (!isFormValid || isBusy) && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={!isFormValid || isBusy}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.submitInner}>
                <AppIcon name="check-circle-outline" size={15} color="#ffffff" />
                <Text style={styles.submitText}>Submit Report</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6fafb' },
  content: { padding: 14, paddingBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 22, fontWeight: '800', color: '#12343b', marginBottom: 4 },
  subtitle: { color: '#55727a', marginBottom: 12 },
  qualityCard: {
    borderWidth: 1,
    borderColor: '#cde2e8',
    borderRadius: 12,
    backgroundColor: '#f6fcfe',
    padding: 12,
    marginBottom: 12,
  },
  qualityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qualityTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qualityTitle: { fontWeight: '800', color: '#17525e', fontSize: 14 },
  qualityScore: { color: '#17525e', fontWeight: '900', fontSize: 15 },
  progressTrack: {
    marginTop: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#deedf2',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#2d8b56' },
  checksWrap: { marginTop: 10, gap: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkText: { color: '#5a7177', fontSize: 12, fontWeight: '600' },
  checkPassed: { color: '#2d5c3f' },
  sectionLabel: { fontWeight: '700', color: '#33535a', marginBottom: 6, marginTop: 4 },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: { color: '#678289', fontSize: 11, fontWeight: '600' },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cad9de',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  segmentActive: { backgroundColor: '#0b7285', borderColor: '#0b7285' },
  segmentInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  segmentText: { textTransform: 'uppercase', color: '#2a4d55', fontWeight: '700' },
  segmentTextActive: { color: '#fff' },
  templateRow: { gap: 8, paddingBottom: 2 },
  templateChip: {
    borderWidth: 1,
    borderColor: '#cad9de',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  templateChipActive: {
    borderColor: '#0b7285',
    backgroundColor: '#e0f3f6',
  },
  templateChipText: { color: '#3f5b61', fontWeight: '700' },
  templateChipTextActive: { color: '#095b6a' },
  templateHint: { color: '#5c767d', marginTop: 6, marginBottom: 8, fontSize: 12, fontWeight: '600' },
  helperText: { color: '#5c767d', marginTop: -6, marginBottom: 10, fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#d2dde1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    color: '#12343b',
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    borderWidth: 1,
    borderColor: '#d1dde1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#e0f3f6',
    borderColor: '#0b7285',
  },
  chipText: { color: '#3f5b61', fontWeight: '600' },
  chipTextSelected: { color: '#095b6a' },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  actionInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontWeight: '700', fontSize: 12 },
  actionNeutral: { borderColor: '#97b9c1', backgroundColor: '#fff' },
  actionPrimary: { borderColor: '#0b7285', backgroundColor: '#0b7285' },
  actionDanger: { borderColor: '#d79d9d', backgroundColor: '#fff8f8' },
  actionPressed: { opacity: 0.8 },
  actionDisabled: { opacity: 0.6 },
  summaryCard: {
    borderWidth: 1,
    borderColor: '#d3e2e6',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 10,
  },
  summaryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  summaryTitle: { color: '#204a54', fontWeight: '800' },
  summaryLine: { color: '#4d676d', fontSize: 12, marginBottom: 2 },
  similarCard: {
    borderWidth: 1,
    borderColor: '#d3e2e6',
    borderRadius: 10,
    backgroundColor: '#f8fdff',
    padding: 10,
    marginBottom: 10,
  },
  similarTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  similarTitle: { color: '#204a54', fontWeight: '800' },
  similarSubtitle: { marginTop: 4, marginBottom: 8, color: '#527077', fontSize: 12 },
  similarRow: {
    borderWidth: 1,
    borderColor: '#d2e1e6',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginBottom: 6,
  },
  similarRowTitle: { color: '#173b43', fontWeight: '700', fontSize: 13 },
  similarRowMeta: { color: '#56747c', fontSize: 11, marginTop: 2 },
  previewWrap: {
    borderWidth: 1,
    borderColor: '#d3e2e6',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 8,
  },
  previewTitle: { color: '#204a54', fontWeight: '800', marginBottom: 8 },
  previewImage: {
    width: '100%',
    height: 170,
    borderRadius: 8,
    backgroundColor: '#dfecef',
  },
  meta: { color: '#587479', marginBottom: 8, fontWeight: '600' },
  submitButton: {
    backgroundColor: '#1d7e3f',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 4,
  },
  submitButtonDisabled: { backgroundColor: '#8eb3a1' },
  submitInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  submitText: { color: '#fff', fontWeight: '700' },
});

export default ReportItemScreen;
