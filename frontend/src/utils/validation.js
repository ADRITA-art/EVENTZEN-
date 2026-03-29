const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s()-]{10,20}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

export const isValidEmail = (value) => EMAIL_REGEX.test(String(value || '').trim());

export const isValidPhone = (value) => PHONE_REGEX.test(String(value || '').trim());

export const isValidPassword = (value) => PASSWORD_REGEX.test(String(value || ''));

export const passwordRuleText =
  'Password must be at least 6 characters and include at least one letter and one number.';

export const toTrimmed = (value) => String(value ?? '').trim();

export const isRequiredText = (value, minLength = 1) => toTrimmed(value).length >= minLength;

export const toNumber = (value) => Number(value);

export const isPositiveInteger = (value) => {
  const parsed = toNumber(value);
  return Number.isInteger(parsed) && parsed > 0;
};

export const isNonNegativeNumber = (value) => {
  const parsed = toNumber(value);
  return Number.isFinite(parsed) && parsed >= 0;
};

export const isPositiveNumber = (value) => {
  const parsed = toNumber(value);
  return Number.isFinite(parsed) && parsed > 0;
};

export const isValidIsoDate = (value) => {
  if (!toTrimmed(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

export const isStartBeforeEndTime = (startTime, endTime) => {
  const start = toTrimmed(startTime);
  const end = toTrimmed(endTime);
  if (!start || !end) {
    return false;
  }
  return start < end;
};
