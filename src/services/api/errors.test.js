import { ApiError } from './errors';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new ApiError('Test error', 'TEST_CODE', 400, { field: 'value' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: 'value' });
      expect(error.name).toBe('ApiError');
      expect(error.timestamp).toBeDefined();
    });

    it('should create error with minimal properties', () => {
      const error = new ApiError('Minimal error', 'MIN_CODE');

      expect(error.message).toBe('Minimal error');
      expect(error.code).toBe('MIN_CODE');
      expect(error.status).toBeNull();
      expect(error.details).toBeNull();
    });

    it('should be instance of Error', () => {
      const error = new ApiError('Test', 'CODE');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new ApiError('JSON test', 'JSON_CODE', 500, { extra: 'data' });
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'ApiError',
        message: 'JSON test',
        code: 'JSON_CODE',
        status: 500,
        details: { extra: 'data' },
        timestamp: error.timestamp,
      });
    });
  });

  describe('fromAxiosError', () => {
    it('should create from axios response error', () => {
      const axiosError = {
        response: {
          status: 404,
          data: {
            message: 'Resource not found',
            code: 'RESOURCE_NOT_FOUND',
            details: { id: '123' },
          },
        },
      };

      const error = ApiError.fromAxiosError(axiosError);

      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.status).toBe(404);
      expect(error.details).toEqual({ id: '123' });
    });

    it('should use default message for status when no message provided', () => {
      const axiosError = {
        response: {
          status: 401,
          data: {},
        },
      };

      const error = ApiError.fromAxiosError(axiosError);

      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.status).toBe(401);
    });

    it('should handle error field instead of message', () => {
      const axiosError = {
        response: {
          status: 400,
          data: { error: 'Bad request error' },
        },
      };

      const error = ApiError.fromAxiosError(axiosError);
      expect(error.message).toBe('Bad request error');
    });

    it('should create from network error (no response)', () => {
      const axiosError = {
        request: {},
        message: 'Network Error',
      };

      const error = ApiError.fromAxiosError(axiosError);

      expect(error.message).toBe('Network error - no response received');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.status).toBeNull();
      expect(error.details).toEqual({ originalMessage: 'Network Error' });
    });

    it('should create from request configuration error', () => {
      const axiosError = {
        message: 'Invalid URL',
      };

      const error = ApiError.fromAxiosError(axiosError);

      expect(error.message).toBe('Invalid URL');
      expect(error.code).toBe('REQUEST_ERROR');
    });

    it('should handle missing message in config error', () => {
      const axiosError = {};

      const error = ApiError.fromAxiosError(axiosError);

      expect(error.message).toBe('Request configuration error');
      expect(error.code).toBe('REQUEST_ERROR');
    });

    it('should map various HTTP status codes', () => {
      const statuses = [
        { status: 400, message: 'Bad request', code: 'BAD_REQUEST' },
        { status: 403, message: 'Forbidden', code: 'FORBIDDEN' },
        { status: 409, message: 'Conflict', code: 'CONFLICT' },
        { status: 422, message: 'Validation error', code: 'VALIDATION_ERROR' },
        { status: 429, message: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 500, message: 'Internal server error', code: 'SERVER_ERROR' },
        { status: 502, message: 'Bad gateway', code: 'BAD_GATEWAY' },
        { status: 503, message: 'Service unavailable', code: 'SERVICE_UNAVAILABLE' },
        { status: 504, message: 'Gateway timeout', code: 'GATEWAY_TIMEOUT' },
        { status: 418, message: 'HTTP error 418', code: 'HTTP_ERROR' },
      ];

      statuses.forEach(({ status, message, code }) => {
        const error = ApiError.fromAxiosError({
          response: { status, data: {} },
        });
        expect(error.message).toBe(message);
        expect(error.code).toBe(code);
      });
    });
  });

  describe('status check methods', () => {
    it('isUnauthorized should return true for 401', () => {
      const error = new ApiError('Unauthorized', 'UNAUTHORIZED', 401);
      expect(error.isUnauthorized()).toBe(true);
      expect(error.isForbidden()).toBe(false);
    });

    it('isForbidden should return true for 403', () => {
      const error = new ApiError('Forbidden', 'FORBIDDEN', 403);
      expect(error.isForbidden()).toBe(true);
      expect(error.isUnauthorized()).toBe(false);
    });

    it('isNotFound should return true for 404', () => {
      const error = new ApiError('Not found', 'NOT_FOUND', 404);
      expect(error.isNotFound()).toBe(true);
    });

    it('isServerError should return true for 5xx', () => {
      const error500 = new ApiError('Server error', 'SERVER_ERROR', 500);
      const error502 = new ApiError('Bad gateway', 'BAD_GATEWAY', 502);
      const error503 = new ApiError('Unavailable', 'SERVICE_UNAVAILABLE', 503);

      expect(error500.isServerError()).toBe(true);
      expect(error502.isServerError()).toBe(true);
      expect(error503.isServerError()).toBe(true);
    });

    it('isServerError should return false for 4xx', () => {
      const error = new ApiError('Not found', 'NOT_FOUND', 404);
      expect(error.isServerError()).toBe(false);
    });

    it('isNetworkError should return true for NETWORK_ERROR code', () => {
      const error = new ApiError('Network error', 'NETWORK_ERROR');
      expect(error.isNetworkError()).toBe(true);
    });

    it('isNetworkError should return false for other codes', () => {
      const error = new ApiError('Server error', 'SERVER_ERROR', 500);
      expect(error.isNetworkError()).toBe(false);
    });
  });
});
