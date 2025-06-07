// src/pages/admin/QStashPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { qstashApi } from '../../utils/api/qstash';
import { useBlogAdmin } from '../../contexts/BlogAdminContext';
import { QStashTask, TaskType, TaskStatus, TaskScheduleRequest, TaskStatistics } from '../../types/qstash';
import { BlogPost } from '../../types';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Mail,
  FileText,
  Trash2,
  Bell,
  Plus,
  Activity,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const QStashPage: React.FC = () => {
  const { user } = useAuth();
  const { fetchPosts } = useBlogAdmin();
  const [tasks, setTasks] = useState<QStashTask[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isBlogScheduleDialogOpen, setIsBlogScheduleDialogOpen] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState<TaskScheduleRequest>({
    type: 'welcome_email',
    payload: {},
    scheduledFor: undefined,
  });
  const [payloadText, setPayloadText] = useState('{}');
  
  // Blog scheduling state
  const [selectedPost, setSelectedPost] = useState<string>('');
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');

  // Server time state
  const [serverTime, setServerTime] = useState<{
    serverTime: string;
    timestamp: number;
    timezone: string;
    formattedTime: string;
  } | null>(null);
  const [serverTimeLoading, setServerTimeLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await qstashApi.getTasks();
      if (response.data.success && response.data.data) {
        setTasks(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch tasks');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBlogPosts = async () => {
    try {
      const posts = await fetchPosts();
      // Filter for draft and scheduled posts that can be scheduled for publication
      const schedulablePosts = posts.filter(post => 
        post.status === 'draft' || 
        (post.status === 'scheduled' && (!post.scheduledFor || new Date(post.scheduledFor) > new Date()))
      );
      setBlogPosts(schedulablePosts);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
    }
  };

  const handleScheduleBlogPost = async () => {
    try {
      if (!selectedPost || !scheduleDateTime) {
        setError('Please select a blog post and schedule date/time');
        return;
      }

      setScheduling(true);
      setError(null);
      setSuccessMessage(null);

      const taskData: TaskScheduleRequest = {
        type: 'scheduled_blog_post',
        payload: {
          postId: selectedPost,
          action: 'publish'
        },
        scheduledFor: scheduleDateTime,
      };

      const response = await qstashApi.scheduleTask(taskData);

      if (response.data.success) {
        setSuccessMessage(`Blog post scheduled for publication`);
        setIsBlogScheduleDialogOpen(false);
        setSelectedPost('');
        setScheduleDateTime('');
        fetchTasks(); // Refresh the task list
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.data.error || 'Failed to schedule blog post');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule blog post');
      console.error('Error scheduling blog post:', err);
    } finally {
      setScheduling(false);
    }
  };

  const fetchServerTime = async () => {
    setServerTimeLoading(true);
    try {
      const response = await qstashApi.getServerTime();
      if (response.data.success && response.data.data) {
        setServerTime(response.data.data);
      } else {
        console.error('Failed to fetch server time:', response.data.error);
      }
    } catch (err: any) {
      console.error('Error fetching server time:', err);
    } finally {
      setServerTimeLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    loadBlogPosts();
    fetchServerTime();
  }, []);

  // Check if user is super-admin
  if (user?.role !== 'super-admin') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need super admin privileges to access the task queue.</p>
        </div>
      </div>
    );
  }

  const handleScheduleTask = async () => {
    try {
      setScheduling(true);
      setError(null);
      setSuccessMessage(null);

      // Parse payload JSON
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (parseError) {
        setError('Invalid JSON in payload field');
        return;
      }

      const taskData: TaskScheduleRequest = {
        ...newTask,
        payload,
      };

      const response = await qstashApi.scheduleTask(taskData);

      if (response.data.success) {
        setSuccessMessage(`Task "${taskData.type}" scheduled successfully`);
        setIsNewTaskDialogOpen(false);
        setNewTask({ type: 'welcome_email', payload: {}, scheduledFor: undefined });
        setPayloadText('{}');
        fetchTasks(); // Refresh the task list
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.data.error || 'Failed to schedule task');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule task');
      console.error('Error scheduling task:', err);
    } finally {
      setScheduling(false);
    }
  };

  // Calculate statistics
  const statistics: TaskStatistics = tasks.reduce(
    (stats, task) => {
      stats.total++;
      stats[task.status]++;
      return stats;
    },
    { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 }
  );

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const typeMatch = filterType === 'all' || task.type === filterType;
    return statusMatch && typeMatch;
  });

  // Get scheduled blog posts
  const scheduledBlogTasks = tasks.filter(task => task.type === 'scheduled_blog_post');

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case 'welcome_email':
        return <Mail className="h-4 w-4" />;
      case 'scheduled_blog_post':
        return <FileText className="h-4 w-4" />;
      case 'cleanup_task':
        return <Trash2 className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDefaultPayload = (type: TaskType) => {
    switch (type) {
      case 'welcome_email':
        return JSON.stringify({ email: 'user@example.com', name: 'John Doe' }, null, 2);
      case 'scheduled_blog_post':
        return JSON.stringify({ postId: 'hello-ai-world', action: 'publish' }, null, 2);
      case 'cleanup_task':
        return JSON.stringify({ target: 'old_sessions', olderThan: '7d' }, null, 2);
      case 'notification':
        return JSON.stringify({ message: 'Hello, World!', userId: 'user123' }, null, 2);
      default:
        return '{}';
    }
  };

  // Helper function to get relative time
  const getRelativeTime = (date: string, scheduledFor?: string | null): string => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = targetDate.getTime() - now.getTime();
    const diffAbsMs = Math.abs(diffMs);
    
    // For scheduled tasks, check if they should show "posting in X" or "posted X ago"
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      const scheduledDiffMs = scheduledDate.getTime() - now.getTime();
      
      if (scheduledDiffMs > 0) {
        // Future scheduled task
        return getTimeString(scheduledDiffMs, 'posting in');
      } else {
        // Past scheduled task (should have been processed)
        return getTimeString(Math.abs(scheduledDiffMs), 'was scheduled') + ' ago';
      }
    }
    
    // For non-scheduled tasks, show when they were created/completed
    if (diffMs > 0) {
      // Future date (shouldn't happen for createdAt, but handle gracefully)
      return getTimeString(diffAbsMs, 'in');
    } else {
      // Past date
      return getTimeString(diffAbsMs, '') + ' ago';
    }
  };

  const getTimeString = (diffMs: number, prefix: string): string => {
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    if (months > 0) {
      return `${prefix} ${months} month${months !== 1 ? 's' : ''}`.trim();
    } else if (weeks > 0) {
      return `${prefix} ${weeks} week${weeks !== 1 ? 's' : ''}`.trim();
    } else if (days > 0) {
      return `${prefix} ${days} day${days !== 1 ? 's' : ''}`.trim();
    } else if (hours > 0) {
      return `${prefix} ${hours} hour${hours !== 1 ? 's' : ''}`.trim();
    } else if (minutes > 0) {
      return `${prefix} ${minutes} minute${minutes !== 1 ? 's' : ''}`.trim();
    } else {
      return `${prefix} ${seconds} second${seconds !== 1 ? 's' : ''}`.trim();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Task Queue Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage background tasks powered by Upstash QStash
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchTasks}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isBlogScheduleDialogOpen} onOpenChange={setIsBlogScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Blog Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Blog Post</DialogTitle>
                <DialogDescription>
                  Schedule a draft or existing blog post for publication
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="blog-post">Select Blog Post</Label>
                  <Select value={selectedPost} onValueChange={setSelectedPost}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a blog post..." />
                    </SelectTrigger>
                    <SelectContent>
                      {blogPosts.map((post) => (
                        <SelectItem key={post.id} value={post.id}>
                          {post.title} ({post.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="schedule-time">Publication Date & Time</Label>
                  <Input
                    id="schedule-time"
                    type="datetime-local"
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsBlogScheduleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleScheduleBlogPost}
                    disabled={scheduling || !selectedPost || !scheduleDateTime}
                    className="flex items-center gap-2"
                  >
                    {scheduling && <RefreshCw className="h-4 w-4 animate-spin" />}
                    Schedule Publication
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Schedule Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Task</DialogTitle>
                <DialogDescription>
                  Create a new background task to be processed by QStash
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="task-type">Task Type</Label>
                  <Select
                    value={newTask.type}
                    onValueChange={(value: TaskType) => {
                      setNewTask({ ...newTask, type: value });
                      setPayloadText(getDefaultPayload(value));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome_email">Welcome Email</SelectItem>
                      <SelectItem value="scheduled_blog_post">Scheduled Blog Post</SelectItem>
                      <SelectItem value="cleanup_task">Cleanup Task</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduled-for">Scheduled For (Optional)</Label>
                  <Input
                    id="scheduled-for"
                    type="datetime-local"
                    value={newTask.scheduledFor || ''}
                    onChange={(e) => setNewTask({ ...newTask, scheduledFor: e.target.value || undefined })}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div>
                  <Label htmlFor="payload">Task Payload (JSON)</Label>
                  <Textarea
                    id="payload"
                    value={payloadText}
                    onChange={(e) => setPayloadText(e.target.value)}
                    placeholder="Enter JSON payload for the task"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsNewTaskDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleScheduleTask}
                    disabled={scheduling}
                    className="flex items-center gap-2"
                  >
                    {scheduling && <RefreshCw className="h-4 w-4 animate-spin" />}
                    Schedule Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="blog-schedule" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blog Schedule
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            All Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{statistics.processing}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{statistics.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{statistics.failed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Server Time Card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Server Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {serverTimeLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : serverTime ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {serverTime.formattedTime}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {serverTime.timezone} • {new Date(serverTime.serverTime).toLocaleDateString()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchServerTime}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Unable to load server time</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchServerTime}
                    className="flex items-center gap-1 ml-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>
                Latest 10 tasks across all types and statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks found. Schedule your first task to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(task.type)}
                        <div>
                          <div className="font-medium">{task.type.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {getRelativeTime(task.createdAt, task.scheduledFor)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1">{task.status}</span>
                        </Badge>
                        {task.retryCount > 0 && (
                          <Badge variant="outline">
                            {task.retryCount} retries
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog-schedule">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scheduled Blog Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Blog Posts</CardTitle>
                <CardDescription>
                  Blog posts scheduled for future publication ({scheduledBlogTasks.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledBlogTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No scheduled blog posts found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scheduledBlogTasks.map((task) => (
                      <div key={task.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            Post ID: {task.payload?.postId || 'Unknown'}
                          </div>
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusIcon(task.status)}
                            <span className="ml-1">{task.status}</span>
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {task.scheduledFor ? (
                            <>
                              Scheduled: {new Date(task.scheduledFor).toLocaleString()}
                              <div className="text-xs text-muted-foreground font-medium mt-1">
                                {getRelativeTime(task.scheduledFor, task.scheduledFor)}
                              </div>
                            </>
                          ) : (
                            'No schedule set'
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(task.createdAt).toLocaleString()}
                          <div className="text-xs text-muted-foreground font-medium">
                            {getRelativeTime(task.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Draft Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Available Draft Posts</CardTitle>
                <CardDescription>
                  Draft posts that can be scheduled for publication ({blogPosts.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blogPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No draft posts available for scheduling.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blogPosts.map((post) => (
                      <div key={post.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium truncate">{post.title}</div>
                          <Badge variant="outline">
                            {post.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          ID: {post.id}
                        </div>
                        {post.scheduledFor && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Currently scheduled: {new Date(post.scheduledFor).toLocaleString()}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPost(post.id);
                            setIsBlogScheduleDialogOpen(true);
                          }}
                          className="w-full"
                        >
                          Schedule Publication
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={(value: TaskStatus | 'all') => setFilterStatus(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={filterType} onValueChange={(value: TaskType | 'all') => setFilterType(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="welcome_email">Welcome Email</SelectItem>
                      <SelectItem value="scheduled_blog_post">Scheduled Blog Post</SelectItem>
                      <SelectItem value="cleanup_task">Cleanup Task</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
              <CardDescription>
                Complete list of tasks with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks match the current filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Scheduled For</TableHead>
                        <TableHead>Retries</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(task.type)}
                              <span className="capitalize">{task.type.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusIcon(task.status)}
                              <span className="ml-1">{task.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(task.createdAt).toLocaleDateString()}
                              <div className="text-muted-foreground">
                                {new Date(task.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(task.updatedAt).toLocaleDateString()}
                              <div className="text-muted-foreground">
                                {new Date(task.updatedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.scheduledFor ? (
                              <div className="text-sm">
                                {new Date(task.scheduledFor).toLocaleDateString()}
                                <div className="text-muted-foreground">
                                  {new Date(task.scheduledFor).toLocaleTimeString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Immediate</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.retryCount > 0 ? (
                              <Badge variant="outline">{task.retryCount}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Task Details</DialogTitle>
                                  <DialogDescription>
                                    Complete information for task {task.id}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Task ID</Label>
                                      <Input value={task.id} readOnly />
                                    </div>
                                    <div>
                                      <Label>QStash Message ID</Label>
                                      <Input value={task.qstashMessageId || 'N/A'} readOnly />
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Payload</Label>
                                    <Textarea
                                      value={JSON.stringify(task.payload, null, 2)}
                                      readOnly
                                      rows={6}
                                      className="font-mono text-sm"
                                    />
                                  </div>
                                  {task.result && (
                                    <div>
                                      <Label>Result</Label>
                                      <Textarea
                                        value={JSON.stringify(task.result, null, 2)}
                                        readOnly
                                        rows={4}
                                        className="font-mono text-sm"
                                      />
                                    </div>
                                  )}
                                  {task.error && (
                                    <div>
                                      <Label>Error</Label>
                                      <Textarea
                                        value={task.error}
                                        readOnly
                                        rows={3}
                                        className="font-mono text-sm text-red-600"
                                      />
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QStashPage;
