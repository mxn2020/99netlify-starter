import { api, apiWithAccount } from './base';
import { FeatureFlag } from '../../types/featureFlags';

// Feature Flags API endpoints
export const featureFlagsApi = {
  // Get all feature flags (role-filtered: admin sees all, users see non-admin only)
  getFlags: () => api.get('/feature-flags'),
  
  // Get all feature flags for specific account (admin only)
  getFlagsForAccount: (accountId: string) => 
    apiWithAccount(accountId).get('/feature-flags'),
  
  // Get specific feature flag by name
  getFlag: (flagName: string) => api.get(`/feature-flags/${flagName}`),
  
  // Update feature flag (admin only)
  updateFlag: (flagName: string, data: Partial<FeatureFlag>) => 
    api.put(`/feature-flags/${flagName}`, data),
  
  // Reset all feature flags to defaults (admin only)
  resetAllFlags: () => api.post('/feature-flags/reset'),
  
  // Future endpoints (not yet implemented in backend):
  // getPublicFlags: () => api.get('/feature-flags/public'),
  // updateFlags: (flags: Record<string, { enabled: boolean; description?: string }>) => 
  //   api.put('/feature-flags', { flags }),
  // resetFlag: (flagName: string) => api.post(`/feature-flags/${flagName}/reset`),
  // getFlagStats: () => api.get('/feature-flags/stats'),
  // refreshCache: () => api.post('/feature-flags/refresh'),
};
