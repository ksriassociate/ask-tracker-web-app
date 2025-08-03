// This component displays a list of all employees with their details
// and an overview of their task load.

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
import { Trash2, Edit, Mail, User, Phone } from 'lucide-react';
import type { Employee, Task } from './shared-types';

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
const AddEmployeeModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Employee</CardTitle>
          <CardDescription>This is a placeholder modal.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Employee form will go here.</p>
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


export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async () => [
      { id: 'emp1', name: 'Alice Johnson', email: 'alice.j@example.com', phone: '123-456-7890', department: 'Engineering' },
      { id: 'emp2', name: 'Bob Smith', email: 'bob.s@example.com', phone: '098-765-4321', department: 'Marketing' },
      { id: 'emp3', name: 'Charlie Brown', email: 'charlie.b@example.com', phone: '111-222-3333', department: 'Sales' },
    ],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    queryFn: async () => [
      { id: '1', title: 'Website Redesign', description: 'Redesign the company website with a modern look and feel.', dueDate: '2025-08-10', priority: 'high', status: 'in_progress', assignedTo: 'emp1', customer: 'cust1' },
      { id: '2', title: 'Database Migration', description: 'Migrate the old database to a new cloud-based solution.', dueDate: '2025-08-01', priority: 'high', status: 'overdue', assignedTo: 'emp2', customer: 'cust2' },
      { id: '3', title: 'Mobile App Bug Fixes', description: 'Fix reported bugs in the mobile application.', dueDate: '2025-08-25', priority: 'medium', status: 'pending', assignedTo: 'emp1', customer: 'cust1' },
      { id: '4', title: 'New Feature Implementation', description: 'Implement a new user authentication feature.', dueDate: '2025-07-20', priority: 'high', status: 'completed', assignedTo: 'emp3', customer: 'cust3' },
    ],
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
      });
    },
  });

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEmployeeStats = (employeeId: string) => {
    const employeeTasks = tasks.filter(task => task.assignedTo === employeeId);
    const total = employeeTasks.length;
    const completed = employeeTasks.filter(task => task.status === 'completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, progress };
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Employees</CardTitle>
          <Button onClick={() => setShowAddModal(true)}>Add Employee</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isLoading ? (
            <p>Loading employees...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.length === 0 ? (
                <p className="text-muted-foreground">No employees found.</p>
              ) : (
                filteredEmployees.map(employee => {
                  const stats = getEmployeeStats(employee.id);
                  return (
                    <Card key={employee.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                          <User className="h-12 w-12 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold truncate">{employee.name}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 truncate">
                              <Mail className="w-4 h-4" />
                              {employee.email}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 truncate">
                              <Phone className="w-4 h-4" />
                              {employee.phone}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <Badge variant="secondary">
                            {stats.total} task{stats.total !== 1 ? 's' : ''}
                          </Badge>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-edit-${employee.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                              disabled={deleteEmployeeMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-${employee.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
      <AddEmployeeModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}
