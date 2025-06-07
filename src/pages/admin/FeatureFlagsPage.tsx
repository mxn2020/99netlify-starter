// src/pages/admin/FeatureFlagsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { featureFlagsApi } from '../../utils/api';
import { FeatureFlag } from '../../types/featureFlags';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
  Settings,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Rocket,
  Brain,
  Plug,
  Beaker
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const FeatureFlagsPage: React.FC = () => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await featureFlagsApi.getFlags();
      if (response.data.success) {
        setFlags(response.data.data || []);
      } else {
        setError(response.data.error || 'Failed to fetch feature flags');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch feature flags');
      console.error('Error fetching feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  // Check if user is super-admin
  if (user?.role !== 'super-admin') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need super admin privileges to access feature flags.</p>
        </div>
      </div>
    );
  }

  const updateFlag = async (flagId: string, updates: Partial<FeatureFlag>) => {
    try {
      setUpdating(flagId);
      setError(null);
      setSuccessMessage(null);

      const response = await featureFlagsApi.updateFlag(flagId, updates);

      if (response.data.success) {
        setFlags(prevFlags =>
          prevFlags.map(flag =>
            flag.id === flagId ? response.data.data : flag
          )
        );
        setSuccessMessage(`Feature flag "${response.data.data.name}" updated successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.data.error || 'Failed to update feature flag');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update feature flag');
      console.error('Error updating feature flag:', err);
    } finally {
      setUpdating(null);
    }
  };

  const resetFlags = async () => {
    if (!confirm('Are you sure you want to reset all feature flags to their default values?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await featureFlagsApi.resetAllFlags();

      if (response.data.success) {
        setFlags(response.data.data || []);
        setSuccessMessage('Feature flags reset to defaults successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.data.error || 'Failed to reset feature flags');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset feature flags');
      console.error('Error resetting feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: FeatureFlag['category']) => {
    switch (category) {
      case 'core': return <Zap className="h-4 w-4" />;
      case 'ai': return <Brain className="h-4 w-4" />;
      case 'integration': return <Plug className="h-4 w-4" />;
      case 'experimental': return <Beaker className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: FeatureFlag['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'shipping_soon':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Shipping Soon</Badge>;
      case 'deprecated':
        return <Badge variant="destructive"><Trash2 className="h-3 w-3 mr-1" />Deprecated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const categorizedFlags = flags.reduce((acc, flag) => {
    if (!acc[flag.category]) acc[flag.category] = [];
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Feature Flags</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage feature toggles and control feature rollouts across the application
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchFlags} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={resetFlags} variant="outline" size="sm" className="text-orange-600">
            <Settings className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Feature Flags Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Features</p>
                <p className="text-2xl font-bold">{flags.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {flags.filter(f => f.enabled && f.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shipping Soon</p>
                <p className="text-2xl font-bold text-blue-600">
                  {flags.filter(f => f.status === 'shipping_soon').length}
                </p>
              </div>
              <Rocket className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disabled</p>
                <p className="text-2xl font-bold text-gray-600">
                  {flags.filter(f => !f.enabled).length}
                </p>
              </div>
              <EyeOff className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Features</TabsTrigger>
          <TabsTrigger value="core">Core</TabsTrigger>
          <TabsTrigger value="ai">AI Features</TabsTrigger>
          <TabsTrigger value="integration">Integrations</TabsTrigger>
          <TabsTrigger value="experimental">Experimental</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {flags.map((flag) => (
              <FeatureFlagCard
                key={flag.id}
                flag={flag}
                onUpdate={updateFlag}
                isUpdating={updating === flag.id}
                getCategoryIcon={getCategoryIcon}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </TabsContent>

        {(['core', 'ai', 'integration', 'experimental'] as const).map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(categorizedFlags[category] || []).map((flag) => (
                <FeatureFlagCard
                  key={flag.id}
                  flag={flag}
                  onUpdate={updateFlag}
                  isUpdating={updating === flag.id}
                  getCategoryIcon={getCategoryIcon}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

interface FeatureFlagCardProps {
  flag: FeatureFlag;
  onUpdate: (flagId: string, updates: Partial<FeatureFlag>) => void;
  isUpdating: boolean;
  getCategoryIcon: (category: FeatureFlag['category']) => JSX.Element;
  getStatusBadge: (status: FeatureFlag['status']) => JSX.Element;
}

const FeatureFlagCard: React.FC<FeatureFlagCardProps> = ({
  flag,
  onUpdate,
  isUpdating,
  getCategoryIcon,
  getStatusBadge
}) => {
  return (
    <Card className={`transition-all duration-200 ${flag.enabled ? 'ring-2 ring-green-200 dark:ring-green-800' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(flag.category)}
            <div>
              <CardTitle className="text-lg">{flag.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(flag.status)}
                <Badge variant="outline" className="text-xs">
                  {flag.category}
                </Badge>
                {flag.adminOnly && (
                  <Badge variant="secondary" className="text-xs">
                    Admin Only
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {flag.enabled ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
            <Switch
              checked={flag.enabled}
              onCheckedChange={(enabled) => onUpdate(flag.id, { enabled })}
              disabled={isUpdating}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {flag.description}
        </CardDescription>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Last updated: {new Date(flag.updatedAt).toLocaleDateString()}</p>
        </div>
        {isUpdating && (
          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
            <LoadingSpinner size="sm" />
            Updating...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureFlagsPage;