import { VALIDATION, ERROR_MESSAGES } from './constants';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!VALIDATION.EMAIL_REGEX.test(email.trim())) {
    return { isValid: false, error: ERROR_MESSAGES.AUTH_INVALID_EMAIL };
  }

  return { isValid: true };
};

/**
 * Validate password
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.AUTH_WEAK_PASSWORD };
  }

  return { isValid: true };
};

/**
 * Validate display name
 */
export const validateDisplayName = (displayName: string): ValidationResult => {
  if (!displayName.trim()) {
    return { isValid: false, error: 'Display name is required' };
  }

  if (displayName.trim().length > VALIDATION.MAX_DISPLAY_NAME_LENGTH) {
    return {
      isValid: false,
      error: `Display name must be ${VALIDATION.MAX_DISPLAY_NAME_LENGTH} characters or less`,
    };
  }

  return { isValid: true };
};

/**
 * Validate message content
 */
export const validateMessage = (message: string): ValidationResult => {
  if (!message.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  if (message.length > VALIDATION.MAX_MESSAGE_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.MESSAGE_TOO_LONG };
  }

  return { isValid: true };
};

/**
 * Validate registration form
 */
export const validateRegistrationForm = (data: {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}): ValidationResult => {
  const { email, password, confirmPassword, displayName } = data;

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }

  // Validate display name
  const displayNameValidation = validateDisplayName(displayName);
  if (!displayNameValidation.isValid) {
    return displayNameValidation;
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }

  // Validate password confirmation
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

/**
 * Validate login form
 */
export const validateLoginForm = (data: {
  email: string;
  password: string;
}): ValidationResult => {
  const { email, password } = data;

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }

  // Validate password
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  return { isValid: true };
};

/**
 * Sanitize user input by removing potentially harmful characters
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Check if string contains only alphanumeric characters and spaces
 */
export const isAlphanumeric = (str: string): boolean => {
  return /^[a-zA-Z0-9\s]+$/.test(str);
};

/**
 * Check if string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate phone number (basic validation)
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const phoneRegex = /^\+?[\d\s\-()]+$/;

  if (!phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }

  if (!phoneRegex.test(phone.trim())) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }

  return { isValid: true };
};

/**
 * Check password strength
 */
export const getPasswordStrength = (
  password: string,
): {
  score: number;
  feedback: string;
} => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }

  if (/[^a-zA-Z\d]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
  }

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthLabel = strengthLabels[Math.min(score, 4)] || 'Very Weak';

  return {
    score,
    feedback:
      feedback.length > 0
        ? feedback.join(', ')
        : `Password strength: ${strengthLabel}`,
  };
};
