// This component displays various reports and charts about tasks and progress.

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  ClipboardList,
  AlertTriangle,
  Award,
} from 'lucide-react';
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


export default function Reports() {
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

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => [
      { id: 'cust1', name: 'Acme Corp', email: 'contact@acme.com', phone: '999-888-7777', company: 'Acme Corp' },
      { id: 'cust2', name: 'Globex Inc', email: 'info@globex.com', phone: '777-666-5555', company: 'Globex Inc' },
    ],
  });

  if (tasksLoading || employeesLoading || customersLoading) {
    return <div className="p-6">Loading reports...</div>;
  }

  // Calculate overall statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const overdueTasks = tasks.filter(task => task.status === 'overdue').length;
  const activeTasks = tasks.filter(task =>
    task.status === 'pending' || task.status === 'in_progress'
  ).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate employee task stats
  const employeeTaskStats = employees.map(employee => {
    const employeeTasks = tasks.filter(task => task.assignedTo === employee.id);
    const total = employeeTasks.length;
    const completed = employeeTasks.filter(task => task.status === 'completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: employee.name, totalTasks: total, completedTasks: completed, progress };
  });

  // Calculate customer task stats
  const customerTaskStats = customers.map(customer => {
    const customerTasks = tasks.filter(task => task.customer === customer.id);
    const total = customerTasks.length;
    const completed = customerTasks.filter(task => task.status === 'completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: customer.name, totalTasks: total, completedTasks: completed, progress };
  });

  return (
    <div className="p-6 space-y-6">
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-total-tasks">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-completed-tasks">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-active-tasks">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-overdue-tasks">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Progress Report */}
      <Card data-testid="card-employee-progress">
        <CardHeader>
          <CardTitle>Employee Task Progress</CardTitle>
          <CardDescription>View the progress of tasks assigned to each employee.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employeeTaskStats.map((employee, index) => (
              <div key={index} className="p-4 border rounded-md">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{employee.name}</h4>
                  <span className="text-sm font-medium">{employee.progress}%</span>
                </div>
                <Progress value={employee.progress} className="mt-2" />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{employee.completedTasks} completed</span>
                  <span>{employee.totalTasks - employee.completedTasks} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Progress Report */}
      <Card data-testid="card-customer-progress">
        <CardHeader>
          <CardTitle>Customer Task Progress</CardTitle>
          <CardDescription>Monitor the completion rate for each customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerTaskStats.map((customer, index) => (
              <div key={index} className="p-4 border rounded-md">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{customer.name}</h4>
                  <span className="text-sm font-medium">{customer.progress}%</span>
                </div>
                <Progress value={customer.progress} className="mt-2" />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{customer.completedTasks} completed</span>
                  <span>{customer.totalTasks - customer.completedTasks} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overall Completion Rate */}
      <Card data-testid="card-overall-completion">
        <CardHeader>
          <CardTitle>Overall Task Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-2xl font-bold text-gray-900">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-4" />
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>{completedTasks} completed tasks</span>
                <span>{totalTasks} total tasks</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}