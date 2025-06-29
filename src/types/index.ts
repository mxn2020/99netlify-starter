// TypeScript type definitions for the enhanced app template

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string; // Keep for backward compatibility (computed from firstName + lastName)
  role: 'user' | 'admin' | 'super-admin';
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
  // User tracking fields
  createdBy?: string;
  updatedBy?: string;
  archivedBy?: string;
  deletedBy?: string;
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
  status?: 'draft' | 'scheduled' | 'published'; // Post status
  scheduledFor?: string; // ISO Date string for scheduled publishing
  isPublic?: boolean; // Whether the post is publicly visible
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
  register: (email: string, password: string, username: string, firstName: string, lastName: string) => Promise<void>;
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
