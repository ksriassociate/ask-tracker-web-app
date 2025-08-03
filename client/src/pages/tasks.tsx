import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Calendar, User, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { format, isAfter } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddTaskModal from "@/components/modals/add-task-modal";
import type { Task, Employee, Customer } from "@shared/schema";

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: string }) =>
      apiRequest("PATCH", `/api/tasks/${taskId}`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task status updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading) {
    return <div className="p-6">Loading tasks...</div>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Tasks</CardTitle>
          <Button onClick={() => setShowAddModal(true)}>Add Task</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              data-testid="search-input"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredTasks.length === 0 ? (
            <p className="text-center text-gray-500">No tasks found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTasks.map((task) => {
                const employee = employees.find(emp => emp.id === task.employeeId);
                const customer = customers.find(cust => cust.id === task.customerId);
                const isOverdue = isAfter(new Date(), new Date(task.dueDate)) && task.status !== "completed";

                return (
                  <Card key={task.id} className="shadow-lg">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold">{task.title}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {format(new Date(task.dueDate), "PPP")}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <User className="w-4 h-4" />
                            <span>Assigned to: {employee?.name || "Unassigned"}</span>
                          </div>
                          {customer && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                              <Building className="w-4 h-4" />
                              <span>Customer: {customer.name}</span>
                            </div>
                          )}
                          <div className="mt-2 flex items-center space-x-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority} Priority
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Select
                            value={task.status}
                            onValueChange={(newStatus) => updateTaskStatusMutation.mutate({ taskId: task.id, newStatus })}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddTaskModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}