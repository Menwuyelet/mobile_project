import { REPORT_VALIDATION_RULES } from './constants';

/**
 * Validates email format
 */
export const isValidEmail = (email = '') => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates a report before submission
 * Returns error message string or null if valid
 */
export const validateReport = (report = {}) => {
  const {
    title = '',
    description = '',
    category,
    locationText = '',
    status,
    secretQuestions = [],
  } = report;

  // Title validation
  if (!title.trim() || title.trim().length < REPORT_VALIDATION_RULES.TITLE_MIN) {
    return `Title must be at least ${REPORT_VALIDATION_RULES.TITLE_MIN} characters long.`;
  }

  if (title.trim().length > REPORT_VALIDATION_RULES.TITLE_MAX) {
    return `Title cannot exceed ${REPORT_VALIDATION_RULES.TITLE_MAX} characters.`;
  }

  // Description validation
  if (!description.trim() || description.trim().length < REPORT_VALIDATION_RULES.DESC_MIN) {
    return `Description must be at least ${REPORT_VALIDATION_RULES.DESC_MIN} characters long.`;
  }

  if (description.trim().length > REPORT_VALIDATION_RULES.DESC_MAX) {
    return `Description cannot exceed ${REPORT_VALIDATION_RULES.DESC_MAX} characters.`;
  }

  // Category validation
  if (!category || category === 'Other' && !report.otherItemName?.trim()) {
    return 'Please select a valid category.';
  }

  // Location validation
  if (!locationText.trim() || locationText.trim().length < REPORT_VALIDATION_RULES.LOCATION_MIN) {
    return 'Please provide location details (minimum 3 characters).';
  }

  // Status validation
  if (!status || !['lost', 'found'].includes(status.toLowerCase())) {
    return 'Please select whether the item is Lost or Found.';
  }

  // Secret Questions for Found Items
  if (status.toLowerCase() === 'found') {
    const validQuestions = secretQuestions.filter(
      q => q.question?.trim() && q.answer?.trim()
    );

    if (validQuestions.length === 0) {
      return 'Found items must have at least one secret question and answer for verification.';
    }
  }

  return null; // No errors
};

/**
 * Quick helper for password strength
 */
export const isStrongPassword = (password = '') => {
  return password.length >= 6;
};

/**
 * Validates registration payload
 * Returns error message string or null if valid
 */
export const validateRegistration = (payload = {}) => {
  const {
    name = '',
    email = '',
    password = '',
    confirmPassword = '',
  } = payload;

  if (!name.trim()) {
    return 'Please enter your full name.';
  }

  if (!isValidEmail(email)) {
    return 'Please enter a valid email address.';
  }

  if (!isStrongPassword(password)) {
    return 'Password must be at least 6 characters long.';
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return 'Password and confirm password do not match.';
  }

  return null;
};

export default {
  isValidEmail,
  validateReport,
  isStrongPassword,
  validateRegistration,
};
