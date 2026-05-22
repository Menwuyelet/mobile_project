import { REPORT_VALIDATION_RULES } from './constants';

export const isValidEmail = (email = '') => {
  return /\S+@\S+\.\S+/.test(email.trim());
};

export const validateReport = (report) => {
  if (!report.title || report.title.trim().length < REPORT_VALIDATION_RULES.TITLE_MIN) {
    return `Title should be at least ${REPORT_VALIDATION_RULES.TITLE_MIN} characters.`;
  }

  if (
    !report.description ||
    report.description.trim().length < REPORT_VALIDATION_RULES.DESC_MIN
  ) {
    return `Description should be at least ${REPORT_VALIDATION_RULES.DESC_MIN} characters.`;
  }

  if (!report.category) {
    return 'Please select a category.';
  }


  const hasLocationText =
    typeof report.locationText === 'string' &&
    report.locationText.trim().length >= REPORT_VALIDATION_RULES.LOCATION_MIN;
  if (!hasLocationText) {
    return 'Add location details to improve report quality.';
  }

  if (!report.status) {
    return 'Please choose lost or found.';
  }

  return null;
};
