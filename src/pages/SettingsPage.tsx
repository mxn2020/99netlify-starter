import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlag, useFeatureFlags } from '../hooks/useFeatureFlags';
import { Bell, Moon, Sun, Monitor, Shield, Key, Eye, EyeOff, Save, Mail, Lock, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import PasswordStrength from '../components/auth/PasswordStrength';
import { featureFlagsApi } from '../utils/api';

const SettingsPage: React.FC = () => {
  const { user, updateUser, changePassword } = useAuth();
  const { refetchFlags } = useFeatureFlags();
  const bearerAuthEnabled = useFeatureFlag('bearer_token_auth');
  const [activeTab, setActiveTab] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    theme: 'system',
    notifications: true,
    emailNotifications: true,
    menuLayout: user?.preferences?.menuLayout || 'sidebar',
  });

  // Sync form state with user preferences when user changes
  useEffect(() => {
    if (user) {
      setGeneralSettings(prev => ({
        ...prev,
        menuLayout: user.preferences?.menuLayout || 'sidebar',
      }));
    }
  }, [user?.preferences?.menuLayout]);

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Authentication mode settings
  const [authMode, setAuthMode] = useState<'cookie' | 'bearer'>('cookie');
  const [isUpdatingAuthMode, setIsUpdatingAuthMode] = useState(false);

  // Sync auth mode with feature flag
  useEffect(() => {
    setAuthMode(bearerAuthEnabled ? 'bearer' : 'cookie');
  }, [bearerAuthEnabled]);

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: value,
    });
  };

  const handleAuthModeChange = async (newMode: 'cookie' | 'bearer') => {
    if (newMode === authMode) return;

    setIsUpdatingAuthMode(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Update the backend feature flag via API
      await featureFlagsApi.updateFlag('bearer_token_auth', {
        enabled: newMode === 'bearer'
      });

      // Refetch flags to get the latest state
      await refetchFlags();

      setSuccessMessage(
        `Authentication mode changed to ${newMode === 'bearer' ? 'Bearer Token' : 'HTTP-only Cookie'}. ` +
        'You may need to log out and back in for the change to take full effect.'
      );

    } catch (error) {
      console.error('Error updating auth mode:', error);
      setErrorMessage('Failed to update authentication mode. Please try again.');
    } finally {
      setIsUpdatingAuthMode(false);
    }
  };

  const saveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Update theme in application
      if (generalSettings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (generalSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        // System theme detection would go here
      }

      // Update user preferences
      await updateUser({
        preferences: {
          ...user?.preferences,
          menuLayout: generalSettings.menuLayout
        }
      });

      setSuccessMessage('Settings saved successfully!');

      // If layout was changed, reload the page after a short delay to apply changes
      const currentLayout = user?.preferences?.menuLayout || 'sidebar';
      if (currentLayout !== generalSettings.menuLayout) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setErrorMessage('Failed to save settings. Please try again.');
      console.error('Error saving settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const changePasswordHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const { currentPassword, newPassword, confirmPassword } = securitySettings;

    // Client-side validation
    if (!currentPassword) {
      setErrorMessage('Current password is required');
      setIsSubmitting(false);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMessage('New password and confirmation are required');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      setIsSubmitting(false);
      return;
    }

    // Password strength validation (using same rules as backend)
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      setIsSubmitting(false);
      return;
    }

    if (!/(?=.*[a-z])/.test(newPassword)) {
      setErrorMessage('Password must contain at least one lowercase letter');
      setIsSubmitting(false);
      return;
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      setErrorMessage('Password must contain at least one uppercase letter');
      setIsSubmitting(false);
      return;
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      setErrorMessage('Password must contain at least one number');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        setSuccessMessage(result.message);
        setSecuritySettings({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        if (result.requireReauth) {
          // Show additional message about re-authentication
          setTimeout(() => {
            setSuccessMessage(result.message + ' You will be redirected to login.');
          }, 2000);
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message);
      console.error('Error changing password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account settings and preferences</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <form onSubmit={saveGeneralSettings} className="space-y-6">
                <div>
                  <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Theme</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Choose how the application appearance should be displayed</p>
                  <RadioGroup
                    value={generalSettings.theme}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, theme: value })}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="theme-system" />
                      <Label htmlFor="theme-system" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Monitor className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        System Default
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="theme-light" />
                      <Label htmlFor="theme-light" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Sun className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        Light
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="theme-dark" />
                      <Label htmlFor="theme-dark" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Moon className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        Dark
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Menu Layout</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Choose your preferred navigation layout</p>
                  <RadioGroup
                    value={generalSettings.menuLayout}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, menuLayout: value as "sidebar" | "header" })}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sidebar" id="menu-sidebar" />
                      <Label htmlFor="menu-sidebar" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sidebar Menu
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="header" id="menu-header" />
                      <Label htmlFor="menu-header" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Header Menu
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Manage how you receive notifications</p>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="notifications"
                        checked={generalSettings.notifications}
                        onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, notifications: !!checked })}
                      />
                      <div className="text-sm">
                        <Label htmlFor="notifications" className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <Bell className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                          In-app notifications
                        </Label>
                        <p className="text-gray-500 dark:text-gray-400">Receive notifications within the application</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="emailNotifications"
                        checked={generalSettings.emailNotifications}
                        onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, emailNotifications: !!checked })}
                      />
                      <div className="text-sm">
                        <Label htmlFor="emailNotifications" className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <Mail className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                          Email notifications
                        </Label>
                        <p className="text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSubmitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={changePasswordHandler} className="space-y-6">
                <div>
                  <Label className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    Password Settings
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Change your password</p>

                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={securitySettings.currentPassword}
                          onChange={handleSecurityChange}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={securitySettings.newPassword}
                        onChange={handleSecurityChange}
                      />
                      <PasswordStrength password={securitySettings.newPassword} />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={securitySettings.confirmPassword}
                        onChange={handleSecurityChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSubmitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <Label className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <Lock className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    Authentication Mode
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how you authenticate with the application</p>

                  <RadioGroup
                    value={authMode}
                    onValueChange={(value) => handleAuthModeChange(value as 'cookie' | 'bearer')}
                    className="space-y-4"
                  >
                    <div className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <RadioGroupItem value="cookie" id="auth-cookie" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="auth-cookie" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <Cookie className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          HTTP-only Cookie Authentication
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Secure authentication using HTTP-only cookies. More secure against XSS attacks but less flexible for API integrations.
                          Cookies are automatically managed by your browser.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <RadioGroupItem value="bearer" id="auth-bearer" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="auth-bearer" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <Key className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          Bearer Token Authentication
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Authentication using Bearer tokens in request headers. More flexible for API integrations and third-party apps but requires careful token management.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> Changing authentication mode may require you to log out and back in for the change to take full effect.
                      Your current session may continue to work until it expires.
                    </p>
                  </div>

                  {isUpdatingAuthMode && (
                    <div className="mt-3 flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Updating authentication mode...
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
