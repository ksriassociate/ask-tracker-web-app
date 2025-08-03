// This component provides a list of all tasks, with filtering, searching,
// and actions to manage them.

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trash2,
  Edit,
  Calendar,
  User,
  Building,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, Employee, Customer } from './shared-types';

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

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}
// --- END SHARED TYPES ---

// --- FAKE TOAST HOOK ---
// A mock `useToast` hook to prevent runtime errors.
const useToast = () => {
  const toast = ({ title, description }: { title: string; description: string }) => {
    console.log('Toast:', title, description);
  };
  return { toast };
};
// --- END FAKE TOAST HOOK ---

// --- PLACEHOLDER MODAL COMPONENTS ---
const AddTaskModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Task</CardTitle>
          <CardDescription>This is a placeholder modal.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Task form will go here.</p>
          <Button onClick={() => onOpenChange(false)} className="mt-4">Close</Button>
        </CardContent>
      </Card>
    </div>
  );
};
// --- END PLACEHOLDER MODAL COMPONENTS ---


// --- API CLIENT SETUP ---
// This is a placeholder; it does not make actual network requests.
const apiRequest = async (method: string, url: string, data?: any) => {
  console.log(`API Request: ${method} ${url}`, data);
  return Promise.resolve();
};

const queryClient = {
  invalidateQueries: (options: { queryKey: string[] }) => {
    console.log('Invalidating queries:', options.queryKey);
  }
};
// --- END API CLIENT SETUP ---


export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    queryFn: async () => [
      { id: '1', title: 'Website Redesign', description: 'Redesign the company website with a modern look and feel.', dueDate: '2025-08-10', priority: 'high', status: 'in_progress', assignedTo: 'emp1', customer: 'cust1' },
      { id: '2', title: 'Database Migration', description: 'Migrate the old database to a new cloud-based solution.', dueDate: '2025-08-01', priority: 'high', status: 'overdue', assignedTo: 'emp2', customer: 'cust2' },
      { id: '3', title: 'Mobile App Bug Fixes', description: 'Fix reported bugs in the mobile application.', dueDate: '2025-08-25', priority: 'medium', status: 'pending', assignedTo: 'emp1', customer: 'cust1' },
      { id: '4', title: 'New Feature Implementation', description: 'Implement a new user authentication feature.', dueDate: '2025-07-20', priority: 'high', status: 'completed', assignedTo: 'emp3', customer: 'cust3' },
    ],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async () => [
      { id: 'emp1', name: 'Alice Johnson', email: 'alice.j@example.com', phone: '123-456-7890', department: 'Engineering' },
      { id: 'emp2', name: 'Bob Smith', email: 'bob.s@example.com', phone: '098-765-4321', department: 'Marketing' },
      { id: 'emp3', name: 'Charlie Brown', email: 'charlie.b@example.com', phone: '111-222-3333', department: 'Sales' },
    ],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => [
      { id: 'cust1', name: 'Acme Corp', email: 'contact@acme.com', phone: '999-888-7777', company: 'Acme Corp' },
      { id: 'cust2', name: 'Globex Inc', email: 'info@globex.com', phone: '777-666-5555', company: 'Globex Inc' },
    ],
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
      });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      apiRequest('PUT', `/api/tasks/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: 'Success',
        description: 'Task status updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
      });
    },
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getEmployeeName = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? employee.name : 'Unknown';
  };

  const getCustomerName = (id: string) => {
    const customer = customers.find(cust => cust.id === id);
    return customer ? customer.name : 'Unknown';
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Tasks</CardTitle>
          <Button onClick={() => setShowAddModal(true)}>Add Task</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setPriorityFilter} value={priorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <p>Loading tasks...</p>
          ) : (
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <p className="text-muted-foreground">No tasks found matching your criteria.</p>
              ) : (
                filteredTasks.map(task => (
                  <Card key={task.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <h3 className="text-lg font-semibold">{task.title}</h3>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge className={cn('capitalize', getPriorityColor(task.priority))}>{task.priority}</Badge>
                            <Badge className={cn('capitalize', getTaskStatusColor(task.status))}>{task.status.replace(/_/g, ' ')}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                          <div className="mt-2 text-sm text-gray-500 flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {format(new Date(task.dueDate), 'PPP')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{getEmployeeName(task.assignedTo)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              <span>{getCustomerName(task.customer)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2 items-start flex-wrap-reverse gap-2">
                          <Select
                            value={task.status}
                            onValueChange={(status) => updateTaskStatusMutation.mutate({ id: task.id, status: status as TaskStatus })}
                          >
                            <SelectTrigger className="w-[180px] h-9">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-edit-${task.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            disabled={deleteTaskMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-${task.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
      <AddTaskModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}