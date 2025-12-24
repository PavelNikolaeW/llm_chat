/**
 * Unified API Error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(message, code, status = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  static fromAxiosError(error) {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || getStatusMessage(status);
      const code = data?.code || getErrorCode(status);
      return new ApiError(message, code, status, data?.details);
    }

    if (error.request) {
      return new ApiError(
        'Network error - no response received',
        'NETWORK_ERROR',
        null,
        { originalMessage: error.message }
      );
    }

    return new ApiError(
      error.message || 'Request configuration error',
      'REQUEST_ERROR',
      null,
      null
    );
  }

  isUnauthorized() {
    return this.status === 401;
  }

  isForbidden() {
    return this.status === 403;
  }

  isNotFound() {
    return this.status === 404;
  }

  isServerError() {
    return this.status >= 500;
  }

  isNetworkError() {
    return this.code === 'NETWORK_ERROR';
  }
}

function getStatusMessage(status) {
  const messages = {
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not found',
    409: 'Conflict',
    422: 'Validation error',
    429: 'Too many requests',
    500: 'Internal server error',
    502: 'Bad gateway',
    503: 'Service unavailable',
    504: 'Gateway timeout',
  };
  return messages[status] || `HTTP error ${status}`;
}

function getErrorCode(status) {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMITED',
    500: 'SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
  };
  return codes[status] || 'HTTP_ERROR';
}

export default ApiError;
