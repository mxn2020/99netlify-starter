import { api } from './base';

// Authentication API endpoints
export const authApi = {
  // Check current user authentication status
  me: () => api.get('/auth/me'),
  
  // User login
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  
  // User registration
  register: (userData: { email: string; password: string; username: string }) => 
    api.post('/auth/register', userData),
  
  // User logout
  logout: () => api.delete('/auth/logout'),
  
  // Update user profile
  updateProfile: (userData: any) => api.put('/auth/profile', userData),
  
  // Change password
  changePassword: (passwordData: { currentPassword: string; newPassword: string }) => 
    api.put('/auth/password', passwordData),
};
