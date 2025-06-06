// src/utils/featureFlags.ts

// Cache for feature flags to avoid repeated API calls
let featureFlagsCache: Record<string, any> | null = null;
let featureFlagsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get feature flags from the API with caching
 * This utility function can be used when feature flags context is not available
 * Note: This function imports axios directly to avoid circular dependency with api.ts
 */
export const getFeatureFlags = async (): Promise<Record<string, any>> => {
  const now = Date.now();
  
  // Return cached flags if they're fresh
  if (featureFlagsCache && now - featureFlagsCacheTime < CACHE_DURATION) {
    return featureFlagsCache;
  }

  try {
    // Import axios directly to avoid circular dependency
    const axios = (await import('axios')).default;
    
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/.netlify/functions';
    const response = await axios.get(`${baseURL}/feature-flags`, {
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.data.success) {
      const flags = response.data.data || [];
      const flagsMap: Record<string, any> = {};
      
      flags.forEach((flag: any) => {
        flagsMap[flag.id] = flag;
      });
      
      featureFlagsCache = flagsMap;
      featureFlagsCacheTime = now;
      
      return flagsMap;
    }
  } catch (error) {
    console.warn('Failed to fetch feature flags:', error);
  }
  
  return {};
};

/**
 * Check if a specific feature flag is enabled
 * This utility function can be used when feature flags context is not available
 */
export const isFeatureEnabled = async (flagId: string): Promise<boolean> => {
  try {
    const flags = await getFeatureFlags();
    return flags[flagId]?.enabled || false;
  } catch (error) {
    console.warn(`Failed to check feature flag ${flagId}:`, error);
    return false;
  }
};

/**
 * Check if Bearer token authentication is enabled
 * This is a synchronous version that checks localStorage first,
 * but should be used as a fallback only
 */
export const isBearerAuthEnabledSync = (): boolean => {
  try {
    const featureFlags = localStorage.getItem('featureFlags');
    if (featureFlags) {
      const flags = JSON.parse(featureFlags);
      return flags.bearer_token_auth?.enabled === true;
    }
  } catch (error) {
    console.warn('Failed to parse localStorage feature flags:', error);
  }
  return false;
};

/**
 * Clear the feature flags cache
 * Should be called when feature flags are updated
 */
export const clearFeatureFlagsCache = (): void => {
  featureFlagsCache = null;
  featureFlagsCacheTime = 0;
};
