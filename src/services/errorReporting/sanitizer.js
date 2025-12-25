/**
 * PII and sensitive data sanitizer for error reporting
 * Ensures no sensitive information is sent to monitoring tools
 */

// Patterns to detect sensitive data
const SENSITIVE_PATTERNS = {
  // JWT tokens
  jwt: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.]*/g,

  // Bearer tokens
  bearerToken: /Bearer\s+[A-Za-z0-9-_.]+/gi,

  // API keys (common patterns)
  apiKey: /(?:api[_-]?key|apikey|api_secret)[=:\s]["']?[A-Za-z0-9-_.]{16,}["']?/gi,

  // Authorization headers
  authHeader: /Authorization[:\s]+["']?[A-Za-z0-9-_.]+["']?/gi,

  // Email addresses
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // Phone numbers (various formats)
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,

  // Credit card numbers (basic pattern)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,

  // SSN (US Social Security Numbers)
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,

  // Password fields in JSON/objects
  password: /(?:password|passwd|pwd|secret)[=:\s]["']?[^"'\s,}]+["']?/gi,

  // IP addresses
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,

  // URLs with credentials
  urlCredentials: /(?:https?:\/\/)([^:]+):([^@]+)@/g,
};

// Keys that should be redacted in objects
const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'apikey',
  'authorization',
  'auth',
  'credentials',
  'cookie',
  'session',
  'sessionId',
  'session_id',
  'ssn',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'pin',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'privateKey',
  'private_key',
];

const REDACTED = '[REDACTED]';

/**
 * Sanitize a string by replacing sensitive patterns
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') {
    return str;
  }

  let result = str;

  // Replace all sensitive patterns
  for (const pattern of Object.values(SENSITIVE_PATTERNS)) {
    result = result.replace(pattern, REDACTED);
  }

  return result;
}

/**
 * Check if a key is sensitive
 * @param {string} key - Key to check
 * @returns {boolean} True if sensitive
 */
export function isSensitiveKey(key) {
  if (typeof key !== 'string') {
    return false;
  }

  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitiveKey =>
    lowerKey.includes(sensitiveKey.toLowerCase())
  );
}

/**
 * Recursively sanitize an object
 * @param {any} obj - Object to sanitize
 * @param {number} depth - Current recursion depth
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {any} Sanitized object
 */
export function sanitizeObject(obj, depth = 0, maxDepth = 10) {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle strings
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1, maxDepth));
  }

  // Handle Error objects
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitizeString(obj.message),
      stack: sanitizeString(obj.stack || ''),
    };
  }

  // Handle regular objects
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = REDACTED;
    } else {
      sanitized[key] = sanitizeObject(value, depth + 1, maxDepth);
    }
  }

  return sanitized;
}

/**
 * Sanitize error data for reporting
 * @param {Object} errorData - Error data object
 * @returns {Object} Sanitized error data
 */
export function sanitizeErrorData(errorData) {
  return sanitizeObject(errorData);
}

/**
 * Sanitize URL by removing credentials and sensitive params
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return url;
  }

  try {
    const urlObj = new URL(url);

    // Remove username and password from URL
    urlObj.username = '';
    urlObj.password = '';

    // Redact sensitive query parameters
    const sensitiveParams = ['token', 'key', 'api_key', 'apikey', 'secret', 'password', 'auth'];
    for (const param of sensitiveParams) {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, REDACTED);
      }
    }

    return urlObj.toString();
  } catch {
    // If URL parsing fails, just use string sanitization
    return sanitizeString(url);
  }
}

/**
 * Sanitize HTTP headers
 * @param {Object} headers - Headers object
 * @returns {Object} Sanitized headers
 */
export function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return headers;
  }

  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
  ];

  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = REDACTED;
    } else {
      sanitized[key] = sanitizeString(String(value));
    }
  }

  return sanitized;
}

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeErrorData,
  sanitizeUrl,
  sanitizeHeaders,
  isSensitiveKey,
  REDACTED,
};
