import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, Edit, Mail, User, Building } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddEmployeeModal from "@/components/modals/add-employee-modal";
import type { Employee, Task } from "@shared/schema";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-6">Loading employees...</div>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Employees</CardTitle>
          <Button onClick={() => setShowAddModal(true)}>Add Employee</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              data-testid="search-input"
            />
          </div>
          {filteredEmployees.length === 0 ? (
            <p className="text-center text-gray-500">No employees found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => {
                const stats = tasks.reduce(
                  (acc, task) => {
                    if (task.employeeId === employee.id) {
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
                  <Card key={employee.id} className="shadow-lg">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-4">
                        <User className="h-10 w-10 text-gray-500" />
                        <div className="flex-1">
                          <h3 className="text-lg font-bold truncate">{employee.name}</h3>
                          <p className="text-sm text-gray-500 truncate">{employee.email}</p>
                          <p className="text-sm text-gray-500 truncate">{employee.phone}</p>
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