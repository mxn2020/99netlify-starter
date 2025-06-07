/**
 * Comprehensive Account Context Implementation
 * 
 * This file consolidates all account-related functionality into a single, well-structured context.
 * Previously scattered across multiple files (accountContext.ts, accountHelpers.ts), this 
 * implementation provides:
 * 
 * FEATURES:
 * - Complete account management (CRUD operations)
 * - Member management with role-based permissions
 * - Invite system with validation
 * - Enhanced type safety and validation
 * - Comprehensive utility functions and helpers
 * - UI helper functions for consistent rendering
 * 
 * EXPORTS:
 * - AccountProvider: React context provider
 * - useAccount: Hook to access account context
 * - ACCOUNT_TYPE_INFO: Account type metadata
 * - ROLE_INFO: Role definitions and permissions
 * - AccountUIHelpers: UI utility functions
 * - AccountValidationHelpers: Form validation utilities
 * 
 * USAGE:
 * 1. Wrap your app with <AccountProvider>
 * 2. Use useAccount() hook in components
 * 3. Access helper functions via context or direct import
 * 
 * @version 2.0.0 - Consolidated Implementation
 * @author Account System Consolidation
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Account, AccountMember, AccountInvite } from '../types';
import { useAuth } from '../hooks/useAuth';
import { accountsApi } from '../utils/api';

// ==================================================
// TYPES AND CONSTANTS
// ==================================================

// Account type metadata with enhanced information
export const ACCOUNT_TYPE_INFO = {
  personal: {
    name: 'Personal',
    icon: 'Home',
    maxMembers: 1,
    description: 'Individual account for personal use',
    features: ['notes', 'blog'],
    color: 'blue',
  },
  family: {
    name: 'Family',
    icon: 'Users',
    maxMembers: 6,
    description: 'Share content with family members',
    features: ['notes', 'blog', 'sharing'],
    color: 'green',
  },
  team: {
    name: 'Team',
    icon: 'Briefcase',
    maxMembers: 25,
    description: 'Collaborate with your team',
    features: ['notes', 'blog', 'sharing', 'collaboration'],
    color: 'purple',
  },
  enterprise: {
    name: 'Enterprise',
    icon: 'Building2',
    maxMembers: -1, // Unlimited
    description: 'Advanced features for large organizations',
    features: ['notes', 'blog', 'sharing', 'collaboration', 'analytics'],
    color: 'orange',
  },
} as const;

// Role metadata with permissions and UI configuration
export const ROLE_INFO = {
  owner: {
    name: 'Owner',
    permissions: ['all'] as string[],
    badge: 'default' as const,
    icon: 'Crown',
    description: 'Full control over account and all content',
    canInvite: true,
    canManageMembers: true,
    canDelete: true,
  },
  admin: {
    name: 'Admin',
    permissions: ['manage_members', 'manage_content', 'view_analytics'] as string[],
    badge: 'secondary' as const,
    icon: 'Shield',
    description: 'Manage members and content within the account',
    canInvite: true,
    canManageMembers: true,
    canDelete: false,
  },
  editor: {
    name: 'Editor',
    permissions: ['manage_content'] as string[],
    badge: 'outline' as const,
    icon: 'Edit',
    description: 'Create and edit content',
    canInvite: false,
    canManageMembers: false,
    canDelete: false,
  },
  viewer: {
    name: 'Viewer',
    permissions: ['view_content'] as string[],
    badge: 'outline' as const,
    icon: 'Eye',
    description: 'View content only',
    canInvite: false,
    canManageMembers: false,
    canDelete: false,
  },
} as const;

export type AccountType = keyof typeof ACCOUNT_TYPE_INFO;
export type UserRole = keyof typeof ROLE_INFO;

// ==================================================
// UTILITY CLASSES AND HELPERS
// ==================================================

/**
 * Account management class with consistent error handling and state management
 */
class AccountManager {
  private static instance: AccountManager;
  
  static getInstance(): AccountManager {
    if (!AccountManager.instance) {
      AccountManager.instance = new AccountManager();
    }
    return AccountManager.instance;
  }

  /**
   * Get account type information
   */
  getAccountTypeInfo(type: AccountType) {
    return ACCOUNT_TYPE_INFO[type] || ACCOUNT_TYPE_INFO.personal;
  }

  /**
   * Get role information
   */
  getRoleInfo(role: UserRole) {
    return ROLE_INFO[role] || ROLE_INFO.viewer;
  }

  /**
   * Check if user has specific permission in account
   */
  hasPermission(userRole: UserRole, permission: string): boolean {
    const roleInfo = this.getRoleInfo(userRole);
    return roleInfo.permissions.includes('all') || roleInfo.permissions.includes(permission);
  }

  /**
   * Check if user can invite members
   */
  canInviteMembers(userRole: UserRole): boolean {
    return this.getRoleInfo(userRole).canInvite;
  }

  /**
   * Check if user can manage members
   */
  canManageMembers(userRole: UserRole): boolean {
    return this.getRoleInfo(userRole).canManageMembers;
  }

  /**
   * Check if user can delete content/members
   */
  canDelete(userRole: UserRole): boolean {
    return this.getRoleInfo(userRole).canDelete;
  }

  /**
   * Get formatted account display name
   */
  getAccountDisplayName(account: Account): string {
    const typeInfo = this.getAccountTypeInfo(account.type as AccountType);
    return `${account.name} (${typeInfo.name})`;
  }

  /**
   * Get account capacity information
   */
  getAccountCapacity(account: Account, currentMemberCount: number = 0) {
    const typeInfo = this.getAccountTypeInfo(account.type as AccountType);
    const maxMembers = typeInfo.maxMembers;
    
    return {
      current: currentMemberCount,
      max: maxMembers,
      remaining: maxMembers === -1 ? Infinity : maxMembers - currentMemberCount,
      isAtCapacity: maxMembers !== -1 && currentMemberCount >= maxMembers,
      displayMax: maxMembers === -1 ? '∞' : maxMembers.toString(),
    };
  }

  /**
   * Validate account creation data
   */
  validateAccountCreation(data: { name: string; type: string; description?: string }) {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Account name is required');
    }
    
    if (data.name && data.name.length > 100) {
      errors.push('Account name must be less than 100 characters');
    }
    
    if (!ACCOUNT_TYPE_INFO[data.type as AccountType]) {
      errors.push('Invalid account type');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate member invitation data
   */
  validateMemberInvitation(data: { email: string; role: string }) {
    const errors: string[] = [];
    
    if (!data.email || data.email.trim().length === 0) {
      errors.push('Email is required');
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email address is required');
    }
    
    if (!ROLE_INFO[data.role as UserRole]) {
      errors.push('Invalid role');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Utility functions for account-related UI components
 */
export const AccountUIHelpers = {
  /**
   * Get icon component name for account type
   */
  getAccountIcon(type: AccountType): string {
    return ACCOUNT_TYPE_INFO[type]?.icon || 'Home';
  },

  /**
   * Get role icon component name
   */
  getRoleIcon(role: UserRole): string {
    return ROLE_INFO[role]?.icon || 'Eye';
  },

  /**
   * Get badge variant for role
   */
  getRoleBadgeVariant(role: UserRole): 'default' | 'secondary' | 'outline' {
    return ROLE_INFO[role]?.badge || 'outline';
  },

  /**
   * Get account type color
   */
  getAccountTypeColor(type: AccountType): string {
    return ACCOUNT_TYPE_INFO[type]?.color || 'blue';
  },

  /**
   * Format member count display
   */
  formatMemberCount(current: number, max: number): string {
    if (max === -1) return `${current} members`;
    return `${current}/${max} members`;
  },

  /**
   * Get role hierarchy level (for sorting)
   */
  getRoleLevel(role: UserRole): number {
    const levels = { owner: 4, admin: 3, editor: 2, viewer: 1 };
    return levels[role] || 1;
  },

  /**
   * Sort members by role hierarchy
   */
  sortMembersByRole(members: AccountMember[]): AccountMember[] {
    return [...members].sort((a, b) => 
      AccountUIHelpers.getRoleLevel(b.role as UserRole) - AccountUIHelpers.getRoleLevel(a.role as UserRole)
    );
  },
};

// ==================================================
// VALIDATION HELPERS
// ==================================================

export const AccountValidationHelpers = {
  /**
   * Validate account name
   */
  validateAccountName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Account name is required' };
    }
    
    if (name.length > 100) {
      return { isValid: false, error: 'Account name must be less than 100 characters' };
    }
    
    return { isValid: true };
  },

  /**
   * Validate email for invitation
   */
  validateInviteEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { isValid: false, error: 'Valid email address is required' };
    }
    
    return { isValid: true };
  },

  /**
   * Validate role selection
   */
  validateRole(role: string): { isValid: boolean; error?: string } {
    if (!ROLE_INFO[role as UserRole]) {
      return { isValid: false, error: 'Invalid role selected' };
    }
    
    return { isValid: true };
  },
};

// ==================================================
// CONTEXT DEFINITION
// ==================================================

interface AccountContextType {
  // State
  accounts: Account[];
  currentAccount: Account | null;
  accountMembers: AccountMember[];
  accountInvites: AccountInvite[];
  isLoading: boolean;
  error: string | null;
  
  // Account management
  fetchAccounts: () => Promise<void>;
  setCurrentAccount: (account: Account | null) => void;
  createAccount: (data: { name: string; type: string; description?: string }) => Promise<Account>;
  updateAccount: (accountId: string, data: Partial<Account>) => Promise<Account>;
  
  // Member management
  fetchAccountMembers: (accountId: string) => Promise<void>;
  inviteMember: (accountId: string, email: string, role: string) => Promise<AccountInvite>;
  updateMemberRole: (accountId: string, memberId: string, role: string) => Promise<AccountMember>;
  removeMember: (accountId: string, memberId: string) => Promise<void>;
  
  // Invite management
  fetchAccountInvites: (accountId: string) => Promise<void>;
  cancelInvite: (accountId: string, inviteId: string) => Promise<void>;
  
  // Enhanced helper methods
  hasPermission: (permission: string) => boolean;
  canInviteMembers: () => boolean;
  canManageMembers: () => boolean;
  canDelete: () => boolean;
  getAccountCapacity: () => any;
  getAccountTypeInfo: () => any;
  getRoleInfo: () => any;
  isAtCapacity: () => boolean;
  getSortedMembers: () => AccountMember[];
  findMember: (userId: string) => AccountMember | null;
  isMember: (userId: string) => boolean;
  getPendingInvitesCount: () => number;
  isEmailInvited: (email: string) => boolean;
  getAccountDisplayName: (account?: Account) => string;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};

interface AccountProviderProps {
  children: ReactNode;
}

export const AccountProvider: React.FC<AccountProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccount, setCurrentAccountState] = useState<Account | null>(null);
  const [accountMembers, setAccountMembers] = useState<AccountMember[]>([]);
  const [accountInvites, setAccountInvites] = useState<AccountInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated, user } = useAuth();

  // Initialize accounts when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAccounts();
    }
  }, [isAuthenticated, user]);

  // Set initial current account to personal account
  useEffect(() => {
    if (accounts.length > 0 && !currentAccount) {
      const personalAccount = accounts.find(acc => acc.type === 'personal');
      if (personalAccount) {
        setCurrentAccountState(personalAccount);
      }
    }
  }, [accounts, currentAccount]);

  const fetchAccounts = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountsApi.getAccounts();

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch accounts');
      }

      setAccounts(response.data.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentAccount = (account: Account | null) => {
    setCurrentAccountState(account);
    // Clear members and invites when switching accounts
    setAccountMembers([]);
    setAccountInvites([]);
  };

  const createAccount = async (data: { name: string; type: string; description?: string }): Promise<Account> => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountsApi.createAccount(data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create account');
      }

      const newAccount = response.data.account;
      setAccounts(prev => [...prev, newAccount]);
      
      return newAccount;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create account';
      setError(error);
      throw new Error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAccount = async (accountId: string, data: Partial<Account>): Promise<Account> => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountsApi.updateAccount(accountId, data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update account');
      }

      const updatedAccount = response.data.account;
      
      setAccounts(prev => prev.map(acc => acc.id === accountId ? updatedAccount : acc));
      
      if (currentAccount?.id === accountId) {
        setCurrentAccountState(updatedAccount);
      }
      
      return updatedAccount;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update account';
      setError(error);
      throw new Error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccountMembers = async (accountId: string) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountsApi.getMembers(accountId);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch account members');
      }

      setAccountMembers(response.data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account members');
    } finally {
      setIsLoading(false);
    }
  };

  const inviteMember = async (accountId: string, email: string, role: string): Promise<AccountInvite> => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountsApi.inviteMember(accountId, { email, role });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to invite member');
      }

      const invite = response.data.invite;
      setAccountInvites(prev => [...prev, invite]);
      
      return invite;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to invite member';
      setError(error);
      throw new Error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemberRole = async (accountId: string, memberId: string, role: string): Promise<AccountMember> => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountsApi.updateMemberRole(accountId, memberId, role);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update member role');
      }

      const updatedMember = response.data.member;
      
      setAccountMembers(prev => prev.map(member => 
        member.userId === memberId ? updatedMember : member
      ));
      
      return updatedMember;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update member role';
      setError(error);
      throw new Error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (accountId: string, memberId: string) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountsApi.removeMember(accountId, memberId);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to remove member');
      }

      setAccountMembers(prev => prev.filter(member => member.userId !== memberId));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to remove member';
      setError(error);
      throw new Error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccountInvites = async (accountId: string) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountsApi.getInvites(accountId);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch account invites');
      }

      setAccountInvites(response.data.invites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account invites');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelInvite = async (accountId: string, inviteId: string) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await accountsApi.cancelInvite(accountId, inviteId);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to cancel invite');
      }

      setAccountInvites(prev => prev.filter(invite => invite.id !== inviteId));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to cancel invite';
      setError(error);
      throw new Error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the account manager instance
  const accountManager = AccountManager.getInstance();

  // Enhanced helper methods
  const hasPermission = useCallback((permission: string): boolean => {
    if (!currentAccount || !user) return false;
    const member = accountMembers.find(m => m.userId === user.id);
    if (!member) return false;
    return accountManager.hasPermission(member.role as UserRole, permission);
  }, [currentAccount, user, accountMembers, accountManager]);

  const canInviteMembers = useCallback((): boolean => {
    if (!currentAccount || !user) return false;
    const member = accountMembers.find(m => m.userId === user.id);
    if (!member) return false;
    return accountManager.canInviteMembers(member.role as UserRole);
  }, [currentAccount, user, accountMembers, accountManager]);

  const canManageMembers = useCallback((): boolean => {
    if (!currentAccount || !user) return false;
    const member = accountMembers.find(m => m.userId === user.id);
    if (!member) return false;
    return accountManager.canManageMembers(member.role as UserRole);
  }, [currentAccount, user, accountMembers, accountManager]);

  const canDelete = useCallback((): boolean => {
    if (!currentAccount || !user) return false;
    const member = accountMembers.find(m => m.userId === user.id);
    if (!member) return false;
    return accountManager.canDelete(member.role as UserRole);
  }, [currentAccount, user, accountMembers, accountManager]);

  const getAccountCapacity = useCallback(() => {
    if (!currentAccount) return null;
    return accountManager.getAccountCapacity(currentAccount, accountMembers.length);
  }, [currentAccount, accountMembers.length, accountManager]);

  const getAccountTypeInfo = useCallback(() => {
    if (!currentAccount) return null;
    return accountManager.getAccountTypeInfo(currentAccount.type as AccountType);
  }, [currentAccount, accountManager]);

  const getRoleInfo = useCallback(() => {
    if (!currentAccount || !user) return null;
    const member = accountMembers.find(m => m.userId === user.id);
    if (!member) return null;
    return accountManager.getRoleInfo(member.role as UserRole);
  }, [currentAccount, user, accountMembers, accountManager]);

  const isAtCapacity = useCallback((): boolean => {
    const capacity = getAccountCapacity();
    return capacity ? capacity.isAtCapacity : false;
  }, [getAccountCapacity]);

  const getSortedMembers = useCallback((): AccountMember[] => {
    return AccountUIHelpers.sortMembersByRole(accountMembers);
  }, [accountMembers]);

  const findMember = useCallback((userId: string): AccountMember | null => {
    return accountMembers.find(m => m.userId === userId) || null;
  }, [accountMembers]);

  const isMember = useCallback((userId: string): boolean => {
    return accountMembers.some(m => m.userId === userId);
  }, [accountMembers]);

  const getPendingInvitesCount = useCallback((): number => {
    return accountInvites.filter(invite => invite.status === 'pending').length;
  }, [accountInvites]);

  const isEmailInvited = useCallback((email: string): boolean => {
    return accountInvites.some(invite => 
      invite.email.toLowerCase() === email.toLowerCase() && 
      invite.status === 'pending'
    );
  }, [accountInvites]);

  const getAccountDisplayName = useCallback((account?: Account): string => {
    const targetAccount = account || currentAccount;
    if (!targetAccount) return '';
    return accountManager.getAccountDisplayName(targetAccount);
  }, [currentAccount, accountManager]);

  const value: AccountContextType = {
    accounts,
    currentAccount,
    accountMembers,
    accountInvites,
    isLoading,
    error,
    
    fetchAccounts,
    setCurrentAccount,
    createAccount,
    updateAccount,
    
    fetchAccountMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    
    fetchAccountInvites,
    cancelInvite,
    
    // Enhanced helper methods
    hasPermission,
    canInviteMembers,
    canManageMembers,
    canDelete,
    getAccountCapacity,
    getAccountTypeInfo,
    getRoleInfo,
    isAtCapacity,
    getSortedMembers,
    findMember,
    isMember,
    getPendingInvitesCount,
    isEmailInvited,
    getAccountDisplayName,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};
