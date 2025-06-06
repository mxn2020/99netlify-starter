import { api } from './base';

// Guestbook API endpoints
export const guestbookApi = {
  // Get all guestbook entries
  getEntries: () => api.get('/guestbook'),
  
  // Add new guestbook entry
  addEntry: (data: { name: string; message: string }) => api.post('/guestbook', data),
};
