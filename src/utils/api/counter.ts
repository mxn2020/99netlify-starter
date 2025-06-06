import { api } from './base';

// Counter API endpoints
export const counterApi = {
  // Get current counter value
  getCounter: () => api.get('/counter'),
  
  // Increment counter
  increment: () => api.post('/counter'),
  
  // Reset counter (if this endpoint exists)
  reset: () => api.post('/counter/reset'),
};
