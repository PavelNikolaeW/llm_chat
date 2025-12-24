import axios from 'axios';
import {
  createApiClient,
  configureClient,
  getClient,
  resetClient,
} from './client';
import { ApiError } from './errors';

// Mock axios
jest.mock('axios');

describe('API Client', () => {
  let mockAxiosInstance;
  let requestInterceptor;
  let responseInterceptor;

  beforeEach(() => {
    jest.clearAllMocks();
    resetClient();

    // Create mock interceptors storage
    const interceptors = {
      request: { handlers: [] },
      response: { handlers: [] },
    };

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn((onFulfilled, onRejected) => {
            interceptors.request.handlers.push({ onFulfilled, onRejected });
            requestInterceptor = { onFulfilled, onRejected };
          }),
        },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            interceptors.response.handlers.push({ onFulfilled, onRejected });
            responseInterceptor = { onFulfilled, onRejected };
          }),
        },
      },
    };

    axios.create.mockReturnValue(mockAxiosInstance);
  });

  describe('createApiClient', () => {
    it('should create axios instance with default config', () => {
      createApiClient();

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: '/api',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should create axios instance with custom config', () => {
      createApiClient({
        baseURL: 'https://api.example.com',
        timeout: 60000,
      });

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should setup request and response interceptors', () => {
      createApiClient();

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('request interceptor', () => {
    it('should add Authorization header when token is available', () => {
      const getToken = jest.fn().mockReturnValue('test-token');
      createApiClient({ getToken });

      const config = { headers: {} };
      const result = requestInterceptor.onFulfilled(config);

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should not add Authorization header when token is null', () => {
      const getToken = jest.fn().mockReturnValue(null);
      createApiClient({ getToken });

      const config = { headers: {} };
      const result = requestInterceptor.onFulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should convert request error to ApiError', async () => {
      createApiClient();

      const error = { message: 'Request failed' };

      await expect(requestInterceptor.onRejected(error)).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe('response interceptor', () => {
    it('should pass through successful responses', () => {
      createApiClient();

      const response = { data: { success: true } };
      const result = responseInterceptor.onFulfilled(response);

      expect(result).toBe(response);
    });

    it('should convert response error to ApiError', async () => {
      createApiClient();

      const error = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
      };

      await expect(responseInterceptor.onRejected(error)).rejects.toBeInstanceOf(ApiError);
    });

    it('should call onUnauthorized for 401 errors', async () => {
      const onUnauthorized = jest.fn();
      createApiClient({ onUnauthorized });

      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      try {
        await responseInterceptor.onRejected(error);
      } catch (e) {
        // Expected
      }

      expect(onUnauthorized).toHaveBeenCalled();
      expect(onUnauthorized).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should not call onUnauthorized for non-401 errors', async () => {
      const onUnauthorized = jest.fn();
      createApiClient({ onUnauthorized });

      const error = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      };

      try {
        await responseInterceptor.onRejected(error);
      } catch (e) {
        // Expected
      }

      expect(onUnauthorized).not.toHaveBeenCalled();
    });
  });

  describe('configureClient', () => {
    it('should configure and return client', () => {
      const client = configureClient({ baseURL: 'https://test.com' });

      expect(client).toBe(mockAxiosInstance);
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: 'https://test.com' })
      );
    });

    it('should merge configuration on subsequent calls', () => {
      configureClient({ baseURL: 'https://test.com' });
      configureClient({ timeout: 60000 });

      expect(axios.create).toHaveBeenLastCalledWith(
        expect.objectContaining({
          baseURL: 'https://test.com',
          timeout: 60000,
        })
      );
    });
  });

  describe('getClient', () => {
    it('should create client on first call', () => {
      const client = getClient();

      expect(client).toBe(mockAxiosInstance);
      expect(axios.create).toHaveBeenCalled();
    });

    it('should return same client on subsequent calls', () => {
      const client1 = getClient();
      const client2 = getClient();

      expect(client1).toBe(client2);
      expect(axios.create).toHaveBeenCalledTimes(1);
    });

    it('should use configured settings', () => {
      configureClient({ baseURL: 'https://configured.com' });
      resetClient();

      // After reset, getClient should create new instance
      getClient();

      // But config was also reset, so it uses defaults
      expect(axios.create).toHaveBeenLastCalledWith(
        expect.objectContaining({ baseURL: '/api' })
      );
    });
  });

  describe('resetClient', () => {
    it('should reset client singleton', () => {
      getClient(); // Create first instance
      resetClient();
      getClient(); // Create second instance

      expect(axios.create).toHaveBeenCalledTimes(2);
    });

    it('should reset configuration', () => {
      configureClient({ baseURL: 'https://test.com' });
      resetClient();
      getClient();

      expect(axios.create).toHaveBeenLastCalledWith(
        expect.objectContaining({ baseURL: '/api' })
      );
    });
  });
});
