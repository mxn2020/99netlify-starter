import { api } from './base';

// QStash API endpoints
export const qstashApi = {
  // Schedule welcome email
  scheduleWelcomeEmail: (data: { email: string; name: string }) => 
    api.post('/qstash/welcome-email', data),
};
