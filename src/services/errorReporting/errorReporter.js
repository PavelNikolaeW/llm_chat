/**
 * Error Reporting Service
 * Async, non-blocking error reporting with PII sanitization
 */

import { sanitizeErrorData, sanitizeUrl, sanitizeHeaders } from './sanitizer';

// Error severity levels
export const ErrorSeverity = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

// Default configuration
const defaultConfig = {
  endpoint: null,
  enabled: true,
  environment: 'development',
  appVersion: '1.0.0',
  sampleRate: 1.0,
  maxBreadcrumbs: 50,
  beforeSend: null,
  onError: null,
};

let config = { ...defaultConfig };
let breadcrumbs = [];
let initialized = false;

/**
 * Initialize the error reporter
 * @param {Object} options - Configuration options
 */
export function init(options = {}) {
  config = { ...defaultConfig, ...options };
  breadcrumbs = [];
  initialized = true;

  // Set up global error handlers if in browser
  if (typeof window !== 'undefined') {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  }
}

/**
 * Shutdown the error reporter
 */
export function shutdown() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('error', handleGlobalError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }
  initialized = false;
  breadcrumbs = [];
}

/**
 * Handle global errors
 */
function handleGlobalError(event) {
  captureError(event.error || new Error(event.message), {
    source: 'window.onerror',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(event) {
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason));

  captureError(error, {
    source: 'unhandledrejection',
    type: 'promise',
  });
}

/**
 * Add a breadcrumb for context
 * @param {Object} breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb) {
  if (!initialized) return;

  const crumb = {
    timestamp: new Date().toISOString(),
    category: breadcrumb.category || 'default',
    message: breadcrumb.message || '',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data ? sanitizeErrorData(breadcrumb.data) : undefined,
  };

  breadcrumbs.push(crumb);

  // Limit breadcrumbs
  if (breadcrumbs.length > config.maxBreadcrumbs) {
    breadcrumbs.shift();
  }
}

/**
 * Capture and report an error
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 * @param {string} severity - Error severity
 */
export function captureError(error, context = {}, severity = ErrorSeverity.ERROR) {
  if (!initialized || !config.enabled) return;

  // Sample rate check
  if (Math.random() > config.sampleRate) return;

  const errorData = buildErrorPayload(error, context, severity);

  // Apply beforeSend hook
  if (config.beforeSend) {
    const result = config.beforeSend(errorData);
    if (result === null) return; // Dropped by beforeSend
  }

  // Send asynchronously and non-blocking
  sendError(errorData).catch((sendError) => {
    // Log locally but don't throw
    if (config.onError) {
      config.onError(sendError);
    }
  });
}

/**
 * Capture a message (non-error)
 * @param {string} message - The message to capture
 * @param {Object} context - Additional context
 * @param {string} severity - Message severity
 */
export function captureMessage(message, context = {}, severity = ErrorSeverity.INFO) {
  if (!initialized || !config.enabled) return;

  const payload = {
    type: 'message',
    message: sanitizeErrorData({ message }).message,
    severity,
    context: sanitizeErrorData(context),
    breadcrumbs: [...breadcrumbs],
    metadata: getMetadata(),
    timestamp: new Date().toISOString(),
  };

  sendError(payload).catch((sendError) => {
    if (config.onError) {
      config.onError(sendError);
    }
  });
}

/**
 * Build error payload with sanitization
 */
function buildErrorPayload(error, context, severity) {
  const sanitizedContext = sanitizeErrorData(context);

  return {
    type: 'error',
    error: {
      name: error.name,
      message: sanitizeErrorData({ msg: error.message }).msg,
      stack: sanitizeErrorData({ stack: error.stack || '' }).stack,
    },
    severity,
    context: sanitizedContext,
    breadcrumbs: [...breadcrumbs],
    metadata: getMetadata(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get environment metadata
 */
function getMetadata() {
  const metadata = {
    environment: config.environment,
    appVersion: config.appVersion,
    timestamp: new Date().toISOString(),
  };

  // Browser metadata
  if (typeof window !== 'undefined') {
    metadata.url = sanitizeUrl(window.location.href);
    metadata.userAgent = navigator.userAgent;
    metadata.platform = navigator.platform;
    metadata.language = navigator.language;
    metadata.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  return metadata;
}

/**
 * Send error to reporting endpoint
 * @param {Object} payload - Error payload
 */
async function sendError(payload) {
  // If no endpoint configured, just log
  if (!config.endpoint) {
    if (config.environment === 'development') {
      console.group('🔴 Error Report (no endpoint configured)');
      console.log('Severity:', payload.severity);
      console.log('Error:', payload.error || payload.message);
      console.log('Context:', payload.context);
      console.log('Breadcrumbs:', payload.breadcrumbs.length);
      console.groupEnd();
    }
    return;
  }

  // Send to endpoint
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    // Non-blocking - don't wait for response in UI
    keepalive: true,
  });

  if (!response.ok) {
    throw new Error(`Error reporting failed: ${response.status}`);
  }
}

/**
 * Create an error boundary handler
 * @param {Error} error - The error
 * @param {Object} errorInfo - React error info
 */
export function captureReactError(error, errorInfo) {
  captureError(error, {
    componentStack: errorInfo?.componentStack,
    source: 'ErrorBoundary',
  }, ErrorSeverity.ERROR);
}

/**
 * Get current configuration (for testing)
 */
export function getConfig() {
  return { ...config };
}

/**
 * Check if initialized
 */
export function isInitialized() {
  return initialized;
}

/**
 * Get breadcrumbs (for testing)
 */
export function getBreadcrumbs() {
  return [...breadcrumbs];
}

/**
 * Clear breadcrumbs
 */
export function clearBreadcrumbs() {
  breadcrumbs = [];
}

export default {
  init,
  shutdown,
  captureError,
  captureMessage,
  captureReactError,
  addBreadcrumb,
  clearBreadcrumbs,
  getBreadcrumbs,
  getConfig,
  isInitialized,
  ErrorSeverity,
};
