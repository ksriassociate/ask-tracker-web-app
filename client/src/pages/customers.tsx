// This component displays a list of all customers, with their details
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
import { Trash2, Edit, Mail, Phone, Building } from 'lucide-react';
import type { Customer, Task } from './shared-types';

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
const AddCustomerModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Customer</CardTitle>
          <CardDescription>This is a placeholder modal.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Customer form will go here.</p>
          <Button onClick={() => onOpenChange(false)} className="mt-4">Close</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const EditCustomerModal = ({ open, onOpenChange, customer }: { open: boolean; onOpenChange: (open: boolean) => void; customer: Customer | null }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit Customer</CardTitle>
          <CardDescription>Editing: {customer?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Customer form will go here.</p>
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


export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    queryFn: async () => [
      { id: 'cust1', name: 'Acme Corp', email: 'contact@acme.com', phone: '999-888-7777', company: 'Acme Corp' },
      { id: 'cust2', name: 'Globex Inc', email: 'info@globex.com', phone: '777-666-5555', company: 'Globex Inc' },
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

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
      });
    },
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Customers</CardTitle>
          <Button onClick={() => setShowAddModal(true)}>Add Customer</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isLoading ? (
            <p>Loading customers...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.length === 0 ? (
                <p className="text-muted-foreground">No customers found.</p>
              ) : (
                filteredCustomers.map(customer => (
                  <Card key={customer.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-4">
                        <Building className="h-12 w-12 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold truncate">{customer.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 truncate">
                            <Mail className="w-4 h-4" />
                            {customer.email}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 truncate">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant="secondary">
                          {customer.company}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCustomer(customer);
                              setShowEditModal(true);
                            }}
                            data-testid={`button-edit-${customer.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCustomerMutation.mutate(customer.id)}
                            disabled={deleteCustomerMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-${customer.id}`}
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
      <AddCustomerModal open={showAddModal} onOpenChange={setShowAddModal} />
      <EditCustomerModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        customer={editingCustomer}
      />
    </div>
  );
}
