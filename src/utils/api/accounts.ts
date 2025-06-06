import { api, apiWithAccount } from './base';

// Account-specific API endpoints
export const accountsApi = {
  // Get user's accounts
  getAccounts: () => api.get('/accounts'),
  
  // Get specific account
  getAccount: (accountId: string) => api.get(`/accounts/${accountId}`),
  
  // Create account
  createAccount: (data: { name: string; type: string; description?: string }) => 
    api.post('/accounts', data),
  
  // Update account
  updateAccount: (accountId: string, data: any) => 
    api.put(`/accounts/${accountId}`, data),
  
  // Delete account
  deleteAccount: (accountId: string) => 
    api.delete(`/accounts/${accountId}`),
  
  // Get account members
  getMembers: (accountId: string) => 
    api.get(`/accounts/${accountId}/members`),
  
  // Invite member
  inviteMember: (accountId: string, data: { email: string; role: string }) => 
    api.post(`/accounts/${accountId}/invite`, data),
  
  // Update member role
  updateMemberRole: (accountId: string, userId: string, role: string) => 
    api.put(`/accounts/${accountId}/members/${userId}`, { role }),
  
  // Remove member
  removeMember: (accountId: string, userId: string) => 
    api.delete(`/accounts/${accountId}/members/${userId}`),
  
  // Get account invites
  getInvites: (accountId: string) => 
    api.get(`/accounts/${accountId}/invites`),
  
  // Cancel invite
  cancelInvite: (accountId: string, inviteId: string) => 
    api.delete(`/accounts/${accountId}/invites/${inviteId}`),
  
  // Accept invite
  acceptInvite: (inviteId: string) => 
    api.post(`/accounts/invites/${inviteId}/accept`),
  
  // Decline invite
  declineInvite: (inviteId: string) => 
    api.post(`/accounts/invites/${inviteId}/decline`),
};
