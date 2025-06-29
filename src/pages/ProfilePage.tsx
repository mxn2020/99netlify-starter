import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User as UserIcon, Mail, Calendar, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  
  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user?.username, user?.firstName, user?.lastName, user?.email]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Call the updateUser function which now makes an API call
      await updateUser({
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });
      
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update profile. Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-center text-gray-600">Loading profile information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Your Profile</h1>
        <p className="text-gray-600 mt-2">View and edit your account information</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-blue-100 text-blue-600 rounded-full p-3 mr-4">
              <UserIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-600">@{user.username}</p>
              <p className="text-gray-600 text-sm">{user.email}</p>
            </div>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-start">
              <UserIcon className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">@{user.username}</p>
              </div>
            </div>
            <div className="flex items-start">
              <UserIcon className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{user.firstName} {user.lastName}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Account Created</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Changing your email will require verification.
              </p>
            </div>
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
