import { api, apiWithAccount } from './base';

// Notes API endpoints
export const notesApi = {
  // Get notes for current account
  getNotes: (params?: any) => api.get('/notes', { params }),
  
  // Get notes for specific account
  getNotesForAccount: (accountId: string, params?: any) => 
    apiWithAccount(accountId).get('/notes', { params }),
  
  // Get specific note
  getNote: (noteId: string) => api.get(`/notes/${noteId}`),
  
  // Create note
  createNote: (data: any) => api.post('/notes', data),
  
  // Create note in specific account
  createNoteInAccount: (accountId: string, data: any) => 
    apiWithAccount(accountId).post('/notes', data),
  
  // Update note
  updateNote: (noteId: string, data: any) => api.put(`/notes/${noteId}`, data),
  
  // Delete note
  deleteNote: (noteId: string) => api.delete(`/notes/${noteId}`),
};
