import { api, apiWithAccount } from './base';

// Blog API endpoints
export const blogApi = {
  // Get blog posts (public)
  getPosts: () => api.get('/blog'),
  
  // Get specific post (public)
  getPost: (slug: string) => api.get(`/blog/${slug}`),
  
  // Get posts for specific account
  getPostsForAccount: (accountId: string) => 
    apiWithAccount(accountId).get('/blog'),
  
  // Create post
  createPost: (data: any) => api.post('/blog', data),
  
  // Create post in specific account
  createPostInAccount: (accountId: string, data: any) => 
    apiWithAccount(accountId).post('/blog', data),
  
  // Update post
  updatePost: (slug: string, data: any) => api.put(`/blog/${slug}`, data),
  
  // Delete post
  deletePost: (slug: string) => api.delete(`/blog/${slug}`),
};
