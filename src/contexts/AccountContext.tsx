import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, AccountMember, AccountInvite } from '../types';
import { useAuth } from '../hooks/useAuth';
import { accountsApi } from '../utils/api';

interface AccountContextType {
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
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};
