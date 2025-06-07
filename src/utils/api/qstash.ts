import { api } from './base';
import { TaskScheduleRequest, TasksResponse, TaskResponse } from '../../types/qstash';

// QStash API endpoints
export const qstashApi = {
  // Schedule welcome email
  scheduleWelcomeEmail: (data: { email: string; name: string }) => 
    api.post('/qstash/welcome-email', data),

  // Get user tasks
  getTasks: (): Promise<{ data: TasksResponse }> => 
    api.get('/qstash/tasks'),

  // Schedule a custom task
  scheduleTask: (taskData: TaskScheduleRequest): Promise<{ data: TaskResponse }> => 
    api.post('/qstash/schedule', taskData),
};
