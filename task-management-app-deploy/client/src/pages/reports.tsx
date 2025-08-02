import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ClipboardList, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Award
} from "lucide-react";
import type { Task, Employee, Customer } from "@shared/schema";

export default function Reports() {
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
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

  // Employee performance analysis
  const employeePerformance = employees.map(employee => {
    const employeeTasks = tasks.filter(task => task.assignedTo === employee.id);
    const completed = employeeTasks.filter(task => task.status === 'completed').length;
    const overdue = employeeTasks.filter(task => task.status === 'overdue').length;
    const performance = employeeTasks.length > 0 ? Math.round((completed / employeeTasks.length) * 100) : 0;
    
    return {
      ...employee,
      totalTasks: employeeTasks.length,
      completedTasks: completed,
      overdueTasks: overdue,
      performance,
    };
  }).sort((a, b) => b.performance - a.performance);

  // Task distribution by priority
  const priorityDistribution = {
    urgent: tasks.filter(task => task.priority === 'urgent').length,
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length,
  };

  // Customer project analysis
  const customerProjects = customers.map(customer => {
    const customerTasks = tasks.filter(task => task.customerId === customer.id);
    const completed = customerTasks.filter(task => task.status === 'completed').length;
    const progress = customerTasks.length > 0 ? Math.round((completed / customerTasks.length) * 100) : 0;
    
    return {
      ...customer,
      totalTasks: customerTasks.length,
      completedTasks: completed,
      progress,
    };
  }).filter(customer => customer.totalTasks > 0)
    .sort((a, b) => b.totalTasks - a.totalTasks);

  const getEmployeeInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 90) return 'bg-green-100 text-green-800';
    if (performance >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow" data-testid="card-total-tasks">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{totalTasks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow" data-testid="card-completed-tasks">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow" data-testid="card-active-tasks">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-3xl font-bold text-yellow-600">{activeTasks}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow" data-testid="card-overdue-tasks">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{overdueTasks}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Performance */}
        <Card data-testid="card-employee-performance">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Employee Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employeePerformance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No employee performance data available</p>
            ) : (
              <div className="space-y-4">
                {employeePerformance.map((employee, index) => (
                  <div key={employee.id} className="flex items-center space-x-4" data-testid={`employee-performance-${employee.id}`}>
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {getEmployeeInitials(employee.name)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{employee.name}</p>
                          {index < 3 && (
                            <Badge className={getPerformanceBadge(employee.performance)}>
                              Top {index + 1}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                          <span>{employee.totalTasks} tasks</span>
                          <span>{employee.completedTasks} completed</span>
                          <span>{employee.overdueTasks} overdue</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${getPerformanceColor(employee.performance)}`}>
                        {employee.performance}%
                      </p>
                      <Progress value={employee.performance} className="w-20 h-2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Priority Distribution */}
        <Card data-testid="card-priority-distribution">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Task Priority Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Urgent</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32">
                    <Progress 
                      value={totalTasks > 0 ? (priorityDistribution.urgent / totalTasks) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm font-semibold w-8">{priorityDistribution.urgent}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium">High</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32">
                    <Progress 
                      value={totalTasks > 0 ? (priorityDistribution.high / totalTasks) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm font-semibold w-8">{priorityDistribution.high}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Medium</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32">
                    <Progress 
                      value={totalTasks > 0 ? (priorityDistribution.medium / totalTasks) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm font-semibold w-8">{priorityDistribution.medium}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Low</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32">
                    <Progress 
                      value={totalTasks > 0 ? (priorityDistribution.low / totalTasks) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm font-semibold w-8">{priorityDistribution.low}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Projects Overview */}
      <Card data-testid="card-customer-projects">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Customer Projects Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customerProjects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No customer projects available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerProjects.map((customer) => (
                <div key={customer.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors" data-testid={`customer-project-${customer.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{customer.company}</h4>
                    <Badge variant="secondary">
                      {customer.totalTasks} task{customer.totalTasks !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{customer.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Progress</span>
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
          )}
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
