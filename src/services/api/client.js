import axios from 'axios';
import { ApiError } from './errors';

const DEFAULT_BASE_URL = '/api';
const DEFAULT_TIMEOUT = 30000;

/**
 * Create configured Axios instance
 */
export function createApiClient(config = {}) {
  const {
    baseURL = DEFAULT_BASE_URL,
    timeout = DEFAULT_TIMEOUT,
    getToken = () => null,
    onUnauthorized = () => {},
  } = config;

  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (requestConfig) => {
      const token = getToken();
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      return requestConfig;
    },
    (error) => Promise.reject(ApiError.fromAxiosError(error))
  );

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const apiError = ApiError.fromAxiosError(error);

      // Handle unauthorized - trigger logout
      if (apiError.isUnauthorized()) {
        onUnauthorized(apiError);
      }

      return Promise.reject(apiError);
    }
  );

  return client;
}

// Singleton instance (configured later via configureClient)
let apiClient = null;
let clientConfig = {};

/**
 * Configure the singleton API client
 */
export function configureClient(config) {
  clientConfig = { ...clientConfig, ...config };
  apiClient = createApiClient(clientConfig);
  return apiClient;
}

/**
 * Get the configured API client
 */
export function getClient() {
  if (!apiClient) {
    apiClient = createApiClient(clientConfig);
  }
  return apiClient;
}

/**
 * Reset client (useful for testing)
 */
export function resetClient() {
  apiClient = null;
  clientConfig = {};
}

export default {
  createApiClient,
  configureClient,
  getClient,
  resetClient,
};
