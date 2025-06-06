// src/contexts/FeatureFlagsContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { featureFlagsApi } from '../utils/api';
import { FeatureFlag } from '../types/featureFlags';
import { clearFeatureFlagsCache } from '../utils/featureFlags';

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  isLoading: boolean;
  error: string | null;
  isFeatureEnabled: (flagId: string) => boolean;
  getFeature: (flagId: string) => FeatureFlag | undefined;
  refetchFlags: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};

// Convenience hook for checking a single feature
export const useFeatureFlag = (flagId: string): boolean => {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(flagId);
};

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear the utility cache to ensure fresh data
      clearFeatureFlagsCache();

      const response = await featureFlagsApi.getFlags();

      if (response.data.success) {
        setFlags(response.data.data || []);
      } else {
        setError(response.data.error || 'Failed to fetch feature flags');
      }
    } catch (err: any) {
      // Don't set error for auth failures - just use empty flags
      if (err.response?.status === 401) {
        setFlags([]);
      } else {
        setError(err.response?.data?.error || 'Failed to fetch feature flags');
      }
      console.warn('Feature flags fetch failed:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isFeatureEnabled = useCallback((flagId: string): boolean => {
    const flag = flags.find(f => f.id === flagId);
    return flag?.enabled || false;
  }, [flags]);

  const getFeature = useCallback((flagId: string): FeatureFlag | undefined => {
    return flags.find(f => f.id === flagId);
  }, [flags]);

  const refetchFlags = useCallback(async () => {
    await fetchFlags();
  }, [fetchFlags]);

  const value: FeatureFlagsContextType = {
    flags,
    isLoading,
    error,
    isFeatureEnabled,
    getFeature,
    refetchFlags
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};
