// src/types/qstash.ts

export type TaskType = 'welcome_email' | 'scheduled_blog_post' | 'cleanup_task' | 'notification';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QStashTask {
  id: string;
  type: TaskType;
  payload: Record<string, any>;
  scheduledFor: string | null;
  status: TaskStatus;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  qstashMessageId?: string;
  result?: any;
  error?: string;
}

export interface TaskScheduleRequest {
  type: TaskType;
  payload: Record<string, any>;
  scheduledFor?: string;
}

export interface QStashApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TasksResponse extends QStashApiResponse {
  data: QStashTask[];
}

export interface TaskResponse extends QStashApiResponse {
  data: QStashTask;
}

export interface TaskStatistics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}
