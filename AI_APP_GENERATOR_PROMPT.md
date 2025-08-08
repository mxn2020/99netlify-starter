# AI App Generator Prompt - Modern React Web Application Architecture

This prompt provides a comprehensive guide for AI app generators to create modern, production-ready React web applications following established patterns and best practices. Each section includes detailed implementation guidance, code examples, and both shadcn/ui and vanilla implementations.

## Core Architecture Patterns

### Technology Stack
- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4.x
- **UI Components**: shadcn/ui (Radix UI based)
- **State Management**: Context API + React hooks
- **Routing**: React Router v7
- **HTTP Client**: Axios with interceptors
- **Backend**: Netlify Functions (Node.js)
- **Database**: Upstash Redis
- **Authentication**: JWT + bcrypt
- **Deployment**: Netlify with serverless functions

### Project Structure
```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/               # Layout components
│   ├── auth/                 # Authentication components
│   ├── blog/                 # Blog-specific components
│   ├── shared/               # Reusable components
│   └── examples/             # Example components
├── contexts/                 # React contexts
├── hooks/                    # Custom hooks
├── pages/                    # Page components
├── types/                    # TypeScript interfaces
├── utils/                    # Utility functions
│   └── api/                  # API client modules
└── lib/                      # Library configurations
```

## 1. Landing Page

### Description
A modern, responsive landing page showcasing application features with hero section, feature highlights, tech stack display, and call-to-action sections.

### Implementation Plan
1. Create hero section with TypeWriter animation
2. Implement feature cards with icons and descriptions
3. Add tech stack showcase with logo components
4. Include blog post previews
5. Add sign-up/CTA sections
6. Implement responsive navigation

### Code Snippets

#### With shadcn/ui Components
```tsx
// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from 'next-themes';
import { Sun, Moon, BookOpen, FileText, Users, Shield } from 'lucide-react';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [blogPosts, setBlogPosts] = useState([]);

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="py-4 border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
              <span className="font-semibold text-xl">App Name</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/blog" className="text-sm font-medium hover:text-primary">
                <BookOpen className="h-4 w-4 mr-1 inline" />
                Blog
              </Link>
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="default">Dashboard</Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="default">Sign In</Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-8">
              Modern Web App
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              A modern React application starter with authentication, blog functionality, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                <Button size="lg" className="min-w-40">
                  {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                </Button>
              </Link>
              <Link to="/blog">
                <Button variant="outline" size="lg" className="min-w-40">
                  Read Blog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-accent/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "User Authentication",
                description: "Secure login and registration with JWT authentication"
              },
              {
                icon: FileText,
                title: "Content Management",
                description: "Create and manage content with rich text editing"
              },
              {
                icon: Shield,
                title: "Security First",
                description: "Built with security best practices and protected routes"
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
```

#### Without shadcn/ui Components
```tsx
// src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, FileText, Users, Shield } from 'lucide-react';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="py-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
              <span className="font-semibold text-xl text-gray-900 dark:text-white">App Name</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/blog" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                <BookOpen className="h-4 w-4 mr-1 inline" />
                Blog
              </Link>
              {isAuthenticated ? (
                <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-8">
              Modern Web App
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
              A modern React application starter with authentication, blog functionality, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={isAuthenticated ? "/dashboard" : "/login"} className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              </Link>
              <Link to="/blog" className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Read Blog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "User Authentication",
                description: "Secure login and registration with JWT authentication"
              },
              {
                icon: FileText,
                title: "Content Management",
                description: "Create and manage content with rich text editing"
              },
              {
                icon: Shield,
                title: "Security First",
                description: "Built with security best practices and protected routes"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
```

## 2. Authentication System

### Description
Comprehensive authentication system with JWT tokens, secure password handling, role-based access control, and both cookie and bearer token support.

### Implementation Plan
1. Create AuthContext for state management
2. Implement login/register forms with validation
3. Add JWT token handling (localStorage + httpOnly cookies)
4. Create protected route components
5. Implement password strength validation
6. Add role-based access control

### Code Snippets

#### Auth Context
```tsx
// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../utils/api';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        const response = await authApi.me();
        if (response.data.user) {
          setUser(response.data.user);
          setToken(response.data.token || 'cookie-based');
        }
      } catch (error) {
        console.warn('Auth check failed:', error);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });

      if (response.data.user && response.data.success) {
        const { user: userData, token: authToken } = response.data;
        setUser(userData);
        
        if (authToken) {
          localStorage.setItem('authToken', authToken);
          setToken(authToken);
        } else {
          setToken('cookie-based');
        }
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, username: string, firstName: string, lastName: string) => {
    try {
      const response = await authApi.register({ 
        email, 
        password, 
        username,
        firstName,
        lastName
      });

      if (response.data.user && response.data.success) {
        const { user: userData, token: authToken } = response.data;
        setUser(userData);
        
        if (authToken) {
          localStorage.setItem('authToken', authToken);
          setToken(authToken);
        } else {
          setToken('cookie-based');
        }
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      setToken(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
```

#### Login Page with shadcn/ui
```tsx
// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
```

#### Protected Route Component
```tsx
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

## 3. Blog System

### Description
Complete blog management system with public reading, admin controls, scheduled publishing, and markdown support.

### Implementation Plan
1. Create blog data types and interfaces
2. Implement blog listing and post display components
3. Add blog admin interface with CRUD operations
4. Create blog editor with markdown support
5. Implement scheduled publishing
6. Add tag system and search functionality

### Code Snippets

#### Blog Types
```typescript
// src/types/index.ts
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author?: string;
  authorId?: string;
  accountId?: string;
  publishedDate: string;
  summary: string;
  content: string;
  tags?: string[];
  imageUrl?: string;
  status?: 'draft' | 'scheduled' | 'published';
  scheduledFor?: string;
  isPublic?: boolean;
}
```

#### Blog Card Component with shadcn/ui
```tsx
// src/components/blog/BlogCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Tag } from 'lucide-react';
import dayjs from 'dayjs';

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      {post.imageUrl && (
        <div className="h-48 overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{dayjs(post.publishedDate).format('MMM DD, YYYY')}</span>
          </div>
          {post.author && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
          )}
        </div>
        <CardTitle className="hover:text-primary transition-colors">
          <Link to={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 line-clamp-2">
          {post.summary || 'No summary available.'}
        </p>
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-2 flex-wrap">
              {post.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{post.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
        
        <Link to={`/blog/${post.slug}`} className="text-primary hover:text-primary/80 font-medium text-sm">
          Read More
        </Link>
      </CardContent>
    </Card>
  );
};

export default BlogCard;
```

#### Blog API Client
```typescript
// src/utils/api/blog.ts
import { api } from './base';
import { BlogPost } from '../../types';

export const blogApi = {
  // Public endpoints
  getPosts: () => api.get<{ success: boolean; data: BlogPost[] }>('/blog'),
  getPost: (slug: string) => api.get<{ success: boolean; data: BlogPost }>(`/blog/${slug}`),
  
  // Admin endpoints
  getAdminPosts: () => api.get<{ success: boolean; data: BlogPost[] }>('/blog?admin=true'),
  createPost: (data: Partial<BlogPost>) => api.post<{ success: boolean; data: BlogPost }>('/blog', data),
  updatePost: (slug: string, data: Partial<BlogPost>) => api.put<{ success: boolean; data: BlogPost }>(`/blog/${slug}`, data),
  deletePost: (slug: string) => api.delete<{ success: boolean }>(`/blog/${slug}`),
  
  // Account-specific endpoints
  getPostsForAccount: (accountId: string) => api.get<{ success: boolean; data: BlogPost[] }>(`/blog?accountId=${accountId}`),
};
```

## 4. Dashboard

### Description
User dashboard with quick actions, statistics, feature flags integration, and activity feeds.

### Implementation Plan
1. Create dashboard layout with hero section
2. Add quick action cards for common tasks
3. Implement stats display with feature flags
4. Add recent activity feed
5. Create role-based content display
6. Implement responsive design

### Code Snippets

#### Dashboard Component with shadcn/ui
```tsx
// src/pages/DashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  PlusCircle,
  BookOpen,
  Settings,
  CheckCircle,
  Clock
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Create Note',
      description: 'Start writing a new note',
      icon: PlusCircle,
      href: '/notes/new',
      color: 'bg-blue-500'
    },
    {
      title: 'View Notes',
      description: 'Browse all your notes',
      icon: FileText,
      href: '/notes',
      color: 'bg-green-500'
    },
    {
      title: 'Read Blog',
      description: 'Check out the latest posts',
      icon: BookOpen,
      href: '/blog',
      color: 'bg-purple-500'
    },
    {
      title: 'Settings',
      description: 'Manage your account',
      icon: Settings,
      href: '/settings',
      color: 'bg-orange-500'
    }
  ];

  const stats = [
    { label: 'Total Notes', value: '12', icon: FileText, color: 'text-blue-600' },
    { label: 'Published Posts', value: '3', icon: BookOpen, color: 'text-green-600' },
    { label: 'Active Projects', value: '5', icon: CheckCircle, color: 'text-purple-600' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 md:p-12 border border-border">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Your creative workspace. Manage notes, explore examples, and stay productive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/notes/new">
              <Button size="lg">
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Note
              </Button>
            </Link>
            <Link to="/examples">
              <Button variant="outline" size="lg">
                Explore Examples
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <div className={`p-2 rounded-lg ${action.color} bg-opacity-10`}>
                        <Icon className={`h-5 w-5 ${action.color.replace('bg-', 'text-')}`} />
                      </div>
                    </div>
                    <h3 className="font-semibold hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Created note "Project Ideas"</span>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">Updated "Meeting Notes"</span>
              <span className="text-xs text-muted-foreground">1 day ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-muted-foreground">Read blog post "Getting Started"</span>
              <span className="text-xs text-muted-foreground">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
```

## 5. Theme System

### Description
Comprehensive dark/light theme system with next-themes integration, system preference detection, and smooth transitions.

### Implementation Plan
1. Set up next-themes provider
2. Create theme context and hooks
3. Implement theme toggle components
4. Add theme persistence
5. Configure Tailwind for dark mode
6. Add theme-aware components

### Code Snippets

#### Theme Provider Setup
```tsx
// src/context/ThemeContext.tsx
import React, { createContext, useContext } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

interface ThemeContextProps {
  children: React.ReactNode;
}

const ThemeContext = createContext({});

export const ThemeProvider: React.FC<ThemeContextProps> = ({ children }) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemeProvider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

#### Theme Toggle Component
```tsx
// src/components/ThemeToggle.tsx
import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
};

export default ThemeToggle;
```

## 6. Profile & Account Management

### Description
User profile management with account settings, password changes, and multi-tenant account support.

### Implementation Plan
1. Create profile page with user information
2. Implement account settings form
3. Add password change functionality
4. Create account switching interface
5. Add profile picture upload
6. Implement user preferences

### Code Snippets

#### Profile Page Component
```tsx
// src/pages/ProfilePage.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Shield } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Button 
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar} alt={user?.firstName} />
                <AvatarFallback>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {user?.firstName} {user?.lastName}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user?.email}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{user?.role}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <p className="text-sm text-muted-foreground">{user?.firstName}</p>
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <p className="text-sm text-muted-foreground">{user?.lastName}</p>
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <div>
                  <Label>Username</Label>
                  <p className="text-sm text-muted-foreground">{user?.username}</p>
                </div>
                <div>
                  <Label>Member Since</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user?.createdAt || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
```

## 7. Admin Panel

### Description
Administrative interface for managing users, content, feature flags, and system settings.

### Implementation Plan
1. Create admin layout with navigation
2. Implement user management interface
3. Add content moderation tools
4. Create feature flags management
5. Add system monitoring dashboard
6. Implement bulk operations

### Code Snippets

#### Admin Layout Component
```tsx
// src/components/layout/AdminLayout.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Flag, 
  Settings, 
  BarChart3,
  Shield
} from 'lucide-react';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const adminNavItems = [
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/blog', label: 'Blog', icon: BookOpen },
    { path: '/admin/feature-flags', label: 'Feature Flags', icon: Flag },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <Badge variant="secondary" className="text-xs">
                  {user?.role}
                </Badge>
              </div>
            </div>
            
            <nav className="space-y-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
```

## 8. Team Accounts

### Description
Multi-tenant account system with role-based permissions, team management, and account switching.

### Implementation Plan
1. Create account context and state management
2. Implement account creation and setup
3. Add team member invitation system
4. Create role-based permission system
5. Add account switching interface
6. Implement billing and subscription management

### Code Snippets

#### Account Context
```tsx
// src/contexts/AccountContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { accountApi } from '../utils/api';
import { Account, AccountRole } from '../types';

interface AccountContextType {
  currentAccount: Account | null;
  userAccounts: Account[];
  switchAccount: (accountId: string) => Promise<void>;
  createAccount: (data: Partial<Account>) => Promise<Account>;
  inviteTeamMember: (email: string, role: AccountRole) => Promise<void>;
  updateAccountRole: (userId: string, role: AccountRole) => Promise<void>;
  isLoading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserAccounts();
  }, []);

  const loadUserAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await accountApi.getUserAccounts();
      setUserAccounts(response.data.accounts);
      
      // Set current account from localStorage or default to first account
      const savedAccountId = localStorage.getItem('currentAccountId');
      const account = savedAccountId 
        ? response.data.accounts.find(acc => acc.id === savedAccountId)
        : response.data.accounts[0];
      
      if (account) {
        setCurrentAccount(account);
        localStorage.setItem('currentAccountId', account.id);
      }
    } catch (error) {
      console.error('Failed to load user accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = async (accountId: string) => {
    const account = userAccounts.find(acc => acc.id === accountId);
    if (account) {
      setCurrentAccount(account);
      localStorage.setItem('currentAccountId', accountId);
    }
  };

  const createAccount = async (data: Partial<Account>) => {
    try {
      const response = await accountApi.createAccount(data);
      const newAccount = response.data.account;
      setUserAccounts(prev => [...prev, newAccount]);
      setCurrentAccount(newAccount);
      localStorage.setItem('currentAccountId', newAccount.id);
      return newAccount;
    } catch (error) {
      console.error('Failed to create account:', error);
      throw error;
    }
  };

  const inviteTeamMember = async (email: string, role: AccountRole) => {
    if (!currentAccount) throw new Error('No current account');
    
    try {
      await accountApi.inviteTeamMember(currentAccount.id, { email, role });
      // Refresh account data to get updated team members
      await loadUserAccounts();
    } catch (error) {
      console.error('Failed to invite team member:', error);
      throw error;
    }
  };

  const updateAccountRole = async (userId: string, role: AccountRole) => {
    if (!currentAccount) throw new Error('No current account');
    
    try {
      await accountApi.updateTeamMemberRole(currentAccount.id, userId, role);
      // Refresh account data to get updated roles
      await loadUserAccounts();
    } catch (error) {
      console.error('Failed to update account role:', error);
      throw error;
    }
  };

  const value: AccountContextType = {
    currentAccount,
    userAccounts,
    switchAccount,
    createAccount,
    inviteTeamMember,
    updateAccountRole,
    isLoading,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};
```

## API Patterns

### Base API Configuration
```typescript
// src/utils/api/base.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/.netlify/functions',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Netlify Function Pattern
```javascript
// netlify/functions/api-endpoint/index.js
const { verifyToken } = require('../../shared/auth');
const { createResponse } = require('../../shared/response');

exports.handler = async (event, context) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Extract user from token
    const user = await verifyToken(event.headers.authorization);
    
    // Route based on HTTP method
    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(event, user);
      case 'POST':
        return await handlePost(event, user);
      case 'PUT':
        return await handlePut(event, user);
      case 'DELETE':
        return await handleDelete(event, user);
      default:
        return createResponse(405, { error: 'Method not allowed' }, corsHeaders);
    }
  } catch (error) {
    console.error('API Error:', error);
    return createResponse(500, { error: 'Internal server error' }, corsHeaders);
  }
};

const handleGet = async (event, user) => {
  // Implementation
};

const handlePost = async (event, user) => {
  // Implementation
};
```

## Key Implementation Notes

1. **Security**: Always validate inputs, use parameterized queries, implement rate limiting
2. **Error Handling**: Comprehensive error boundaries and user-friendly error messages
3. **Performance**: Implement lazy loading, code splitting, and proper caching
4. **Accessibility**: Follow WCAG guidelines, proper ARIA labels, keyboard navigation
5. **Testing**: Unit tests for utilities, integration tests for API endpoints
6. **Deployment**: Environment-specific configurations, proper CI/CD pipeline
7. **Monitoring**: Error tracking, performance monitoring, user analytics

This prompt provides a comprehensive foundation for building modern React applications with proper architecture, security, and user experience patterns.