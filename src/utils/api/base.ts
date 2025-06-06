import axios from 'axios';
import { isBearerAuthEnabledSync } from '../featureFlags';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/.netlify/functions',
  timeout: 10000,
  withCredentials: true, // Enable cookies for HttpOnly auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get current account ID from localStorage or context
const getCurrentAccountId = (): string | null => {
  try {
    const currentAccount = localStorage.getItem('currentAccount');
    if (currentAccount) {
      const account = JSON.parse(currentAccount);
      return account.id || null;
    }
  } catch (e) {
    console.warn('Failed to parse current account from localStorage:', e);
  }
  return null;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const useBearerAuth = isBearerAuthEnabledSync();

    if (useBearerAuth) {
      // Bearer token mode - get token from localStorage
      const token = localStorage.getItem('authToken');
      if (token && token.trim() !== '' && token !== 'null' && token !== 'undefined') {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // In cookie mode, we rely on withCredentials: true for HttpOnly cookies
    // No additional headers needed

    // Add account context if available and not already present
    if (config.params && !config.params.accountId) {
      const currentAccountId = getCurrentAccountId();
      if (currentAccountId) {
        config.params = { ...config.params, accountId: currentAccountId };
      }
    } else if (!config.params) {
      const currentAccountId = getCurrentAccountId();
      if (currentAccountId) {
        config.params = { accountId: currentAccountId };
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and enhanced security
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      const useBearerAuth = isBearerAuthEnabledSync();
      if (useBearerAuth) {
        localStorage.removeItem('authToken');
      }
      localStorage.removeItem('user');
      // Don't automatically redirect to avoid infinite loops
      // Let the component handle the redirect
      console.warn('Authentication expired or invalid');
    } else if (error.response?.status === 429) {
      // Handle rate limiting
      const retryAfter = error.response.data?.retryAfter || 60;
      console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
    }
    return Promise.reject(error);
  }
);

// Helper function to make API calls with specific account context
export const apiWithAccount = (accountId: string) => {
  return {
    get: (url: string, config?: any) => api.get(url, { ...config, params: { ...config?.params, accountId } }),
    post: (url: string, data?: any, config?: any) => api.post(url, data, { ...config, params: { ...config?.params, accountId } }),
    put: (url: string, data?: any, config?: any) => api.put(url, data, { ...config, params: { ...config?.params, accountId } }),
    delete: (url: string, config?: any) => api.delete(url, { ...config, params: { ...config?.params, accountId } }),
    patch: (url: string, data?: any, config?: any) => api.patch(url, data, { ...config, params: { ...config?.params, accountId } }),
  };
};
