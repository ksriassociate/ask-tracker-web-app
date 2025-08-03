// This component displays the main dashboard with key statistics
// and a summary of recent tasks and upcoming deadlines.

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  ClipboardList,
  AlertTriangle,
  PieChart,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { format, isAfter, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, Employee, DashboardStats } from './shared-types';

// --- SHARED TYPES ---
// These types would be in a shared file in a real project.
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string; // Employee ID
  customer: string; // Customer ID
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeTasks: number;
  overdueTasks: number;
  completionRate: number;
}
// --- END SHARED TYPES ---

export default function Dashboard() {
  // Mock API calls using React Query
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/stats'],
    queryFn: async () => ({
      totalEmployees: 5,
      activeTasks: 12,
      overdueTasks: 3,
      completionRate: 65,
    }),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    queryFn: async () => [
      { id: '1', title: 'Website Redesign', description: 'Redesign the company website with a modern look and feel.', dueDate: '2025-08-10', priority: 'high', status: 'in_progress', assignedTo: 'emp1', customer: 'cust1' },
      { id: '2', title: 'Database Migration', description: 'Migrate the old database to a new cloud-based solution.', dueDate: '2025-08-01', priority: 'high', status: 'overdue', assignedTo: 'emp2', customer: 'cust2' },
      { id: '3', title: 'Mobile App Bug Fixes', description: 'Fix reported bugs in the mobile application.', dueDate: '2025-08-25', priority: 'medium', status: 'pending', assignedTo: 'emp1', customer: 'cust1' },
      { id: '4', title: 'New Feature Implementation', description: 'Implement a new user authentication feature.', dueDate: '2025-07-20', priority: 'high', status: 'completed', assignedTo: 'emp3', customer: 'cust3' },
    ],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async () => [
      { id: 'emp1', name: 'Alice Johnson', email: 'alice.j@example.com', phone: '123-456-7890', department: 'Engineering' },
      { id: 'emp2', name: 'Bob Smith', email: 'bob.s@example.com', phone: '098-765-4321', department: 'Marketing' },
      { id: 'emp3', name: 'Charlie Brown', email: 'charlie.b@example.com', phone: '111-222-3333', department: 'Sales' },
    ],
  });

  const recentTasks = tasks.slice(0, 4);
  const upcomingDeadlines = tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeadlineColor = (dueDate: Date, status: string) => {
    if (status === 'completed') return 'border-green-500';
    if (isAfter(new Date(), dueDate)) return 'border-red-500';
    return 'border-blue-500';
  };

  const getDeadlineIcon = (dueDate: Date, status: string) => {
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (isAfter(new Date(), dueDate)) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-blue-500" />;
  };

  const getEmployee = (id: string) => employees.find(emp => emp.id === id);

  if (statsLoading || tasksLoading || employeesLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Stats Cards */}
      <Card data-testid="card-employees">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalEmployees}</div>
        </CardContent>
      </Card>
      <Card data-testid="card-active-tasks">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeTasks}</div>
        </CardContent>
      </Card>
      <Card data-testid="card-overdue-tasks">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.overdueTasks}</div>
        </CardContent>
      </Card>
      <Card data-testid="card-completion-rate">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.completionRate}%</div>
          <Progress value={stats?.completionRate} className="mt-2 h-2" />
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card className="col-span-1 lg:col-span-2" data-testid="card-recent-tasks">
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTasks.length === 0 ? (
              <p className="text-muted-foreground">No recent tasks found.</p>
            ) : (
              recentTasks.map(task => (
                <div key={task.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{task.title}</h4>
                    <Badge className={getTaskStatusColor(task.status)}>
                      {task.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{getEmployee(task.assignedTo)?.name || 'Unknown Employee'}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card className="col-span-1 lg:col-span-2" data-testid="card-upcoming-deadlines">
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-muted-foreground">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map(task => {
                const dueDate = new Date(task.dueDate);
                const employee = getEmployee(task.assignedTo);
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border-l-4 ${getDeadlineColor(dueDate, task.status)}`}
                    data-testid={`deadline-item-${task.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getDeadlineIcon(dueDate, task.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{task.title}</h4>
                        <p className="text-sm text-gray-600">{employee?.name || 'Unknown Employee'}</p>
                        <p className="text-sm font-medium mt-1">
                          {task.status === 'completed' ? (
                            <span className="text-green-600">Completed</span>
                          ) : isAfter(new Date(), dueDate) ? (
                            <span className="text-red-600">Overdue by {differenceInDays(new Date(), dueDate)} days</span>
                          ) : (
                            <span className="text-blue-600">Due in {differenceInDays(dueDate, new Date())} days</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}