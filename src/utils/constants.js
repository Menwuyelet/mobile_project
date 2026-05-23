// ─── src/utils/constants.js ─────────────────────────────────────

/** Item Statuses */
export const ITEM_STATUSES = ['lost', 'found', 'recovered', 'returned'];

/** Main Categories */
export const CATEGORIES = [
  'Electronics',
  'ID Card',
  'Exam Permit',
  'Books',
  'Bags',
  'Clothes',
  'Keys',
  'Jewelry',
  'Documents',
  'Other',
];

/** Validation Rules */
export const REPORT_VALIDATION_RULES = {
  TITLE_MIN: 3,
  TITLE_MAX: 80,
  DESC_MIN: 10,
  DESC_MAX: 600,
  LOCATION_MIN: 3,
  LOCATION_MAX: 120,
  ITEM_NAME_MAX: 50,
};

/** Default Values */
export const DEFAULT_CAMPUS = 'Main Campus';
export const DEFAULT_STATUS = 'lost';

/** UI Helper Constants */
export const LAST_SEEN_OPTIONS = [
  'Today',
  'Yesterday',
  'This Week',
  'Last Week',
  'Not Sure',
];

/** Status Colors (for consistent UI) */
export const STATUS_COLORS = {
  lost: {
    bg: '#fff0f0',
    text: '#cc2222',
    label: 'LOST',
  },
  found: {
    bg: '#e8f5e9',
    text: '#1b5e20',
    label: 'FOUND',
  },
  recovered: {
    bg: '#eff6ff',
    text: '#1a6edb',
    label: 'RECOVERED',
  },
  returned: {
    bg: '#eff6ff',
    text: '#1a6edb',
    label: 'RETURNED',
  },
};

/** Quick Action Types */
export const QUICK_ACTIONS = {
  REPORT: 'report',
  SEARCH: 'search',
  SAVED: 'saved',
  NOTIFICATIONS: 'notifications',
};

export default {
  ITEM_STATUSES,
  CATEGORIES,
  REPORT_VALIDATION_RULES,
  STATUS_COLORS,
  LAST_SEEN_OPTIONS,
  DEFAULT_CAMPUS,
};