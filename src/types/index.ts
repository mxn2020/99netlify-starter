// TypeScript type definitions for the enhanced app template

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  preferences?: {
    menuLayout: 'sidebar' | 'header';
  };
}

export interface AccountType {
  name: string;
  maxMembers: number;
  features: string[];
}

export interface Account {
  id: string;
  name: string;
  type: 'personal' | 'family' | 'team' | 'enterprise';
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    allowInvites: boolean;
    defaultMemberRole: string;
  };
  typeInfo?: AccountType;
  userRole?: string;
  roleInfo?: MemberRole;
}

export interface MemberRole {
  name: string;
  permissions: string[];
}

export interface AccountMember {
  userId: string;
  accountId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  invitedBy: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  roleInfo?: MemberRole;
}

export interface AccountInvite {
  id: string;
  accountId: string;
  email: string;
  role: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  noteTypeId: string;
  userId: string;
  accountId?: string; // Link to account instead of just user
  category?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isArchived?: boolean;
}

export interface NoteType {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  isSystem: boolean;
  userId?: string;
  accountId?: string; // Link to account
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author?: string;
  authorId?: string;
  accountId?: string; // Link to account
  publishedDate: string; // ISO Date string
  summary: string;
  content: string; // Markdown content
  tags?: string[];
  imageUrl?: string;
}

export interface GuestbookEntry {
  name: string;
  message: string;
  timestamp: string;
}

export interface CounterData {
  count: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<User | undefined>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; requireReauth: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
