import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useAccount } from './AccountContext';
import { blogApi } from '../utils/api';
import { BlogPost } from '../types';

interface BlogAdminContextType {
  createPost: (postData: Omit<BlogPost, 'id' | 'slug' | 'authorId' | 'publishedDate'>) => Promise<BlogPost>;
  updatePost: (slug: string, postData: Partial<Omit<BlogPost, 'id' | 'slug' | 'authorId' | 'publishedDate'>>) => Promise<BlogPost>;
  deletePost: (slug: string) => Promise<void>;
  fetchPosts: () => Promise<BlogPost[]>;
  fetchPost: (slug: string) => Promise<BlogPost>;
}

const BlogAdminContext = createContext<BlogAdminContextType | undefined>(undefined);

export const useBlogAdmin = () => {
  const context = useContext(BlogAdminContext);
  if (context === undefined) {
    throw new Error('useBlogAdmin must be used within a BlogAdminProvider');
  }
  return context;
};

interface BlogAdminProviderProps {
  children: ReactNode;
}

export const BlogAdminProvider: React.FC<BlogAdminProviderProps> = ({ children }) => {
  const { currentAccount } = useAccount();

  const createPost = useCallback(async (postData: Omit<BlogPost, 'id' | 'slug' | 'authorId' | 'publishedDate'>): Promise<BlogPost> => {
    if (!currentAccount) {
      throw new Error('No account selected');
    }
    
    try {
      const response = await blogApi.createPost(postData);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create post');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create post');
    }
  }, [currentAccount]);

  const updatePost = useCallback(async (slug: string, postData: Partial<Omit<BlogPost, 'id' | 'slug' | 'authorId' | 'publishedDate'>>): Promise<BlogPost> => {
    if (!currentAccount) {
      throw new Error('No account selected');
    }
    
    try {
      const response = await blogApi.updatePost(slug, postData);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update post');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update post');
    }
  }, [currentAccount]);

  const deletePost = useCallback(async (slug: string): Promise<void> => {
    if (!currentAccount) {
      throw new Error('No account selected');
    }
    
    try {
      const response = await blogApi.deletePost(slug);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete post');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete post');
    }
  }, [currentAccount]);

  const fetchPosts = useCallback(async (): Promise<BlogPost[]> => {
    try {
      // Admin endpoint - requires authentication and admin permissions
      const response = await blogApi.getAdminPosts();
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch posts');
      }
      return response.data.data || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch posts');
    }
  }, []);

  const fetchPost = useCallback(async (slug: string): Promise<BlogPost> => {
    try {
      // Public endpoint - no authentication required
      const response = await blogApi.getPost(slug);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch post');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch post');
    }
  }, []);

  const value: BlogAdminContextType = {
    createPost,
    updatePost,
    deletePost,
    fetchPosts,
    fetchPost,
  };

  return (
    <BlogAdminContext.Provider value={value}>
      {children}
    </BlogAdminContext.Provider>
  );
};

export default BlogAdminProvider;
