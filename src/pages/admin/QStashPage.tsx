// src/pages/admin/QStashPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { qstashApi } from '../../utils/api/qstash';
import { QStashTask, TaskType, TaskStatus, TaskScheduleRequest, TaskStatistics } from '../../types/qstash';
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
  BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const QStashPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<QStashTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState<TaskScheduleRequest>({
    type: 'welcome_email',
    payload: {},
    scheduledFor: undefined,
  });
  const [payloadText, setPayloadText] = useState('{}');

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

  useEffect(() => {
    fetchTasks();
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
        return JSON.stringify({ title: 'New Blog Post', content: 'Post content...', publishAt: new Date().toISOString() }, null, 2);
      case 'cleanup_task':
        return JSON.stringify({ target: 'old_sessions', olderThan: '7d' }, null, 2);
      case 'notification':
        return JSON.stringify({ message: 'Hello, World!', userId: 'user123' }, null, 2);
      default:
        return '{}';
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
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Tasks
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
                            {new Date(task.createdAt).toLocaleString()}
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
