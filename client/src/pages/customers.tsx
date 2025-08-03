import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, Edit, Mail, Phone, Building } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddCustomerModal from "@/components/modals/add-customer-modal";
import EditCustomerModal from "@/components/modals/edit-customer-modal";
import type { Customer, Task } from "@shared/schema";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-6">Loading customers...</div>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Customers</CardTitle>
          <Button onClick={() => setShowAddModal(true)}>Add Customer</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              data-testid="search-input"
            />
          </div>
          {filteredCustomers.length === 0 ? (
            <p className="text-center text-gray-500">No customers found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => {
                const stats = tasks.reduce(
                  (acc, task) => {
                    if (task.customerId === customer.id) {
                      acc.total++;
                      if (task.status === "completed") {
                        acc.completed++;
                      }
                    }
                    return acc;
                  },
                  { total: 0, completed: 0 }
                );

                return (
                  <Card key={customer.id} className="shadow-lg">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-4">
                        <Building className="h-10 w-10 text-gray-500" />
                        <div className="flex-1">
                          <h3 className="text-lg font-bold truncate">{customer.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{customer.email}</p>
                          <p className="text-sm text-gray-500 truncate">{customer.phone}</p>
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
                );
              })}
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