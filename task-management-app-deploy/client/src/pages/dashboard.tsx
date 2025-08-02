import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  PieChart,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle
} from "lucide-react";
import { format, isAfter, differenceInDays } from "date-fns";
import type { Task, Employee } from "@shared/schema";

interface DashboardStats {
  totalEmployees: number;
  activeTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const recentTasks = tasks.slice(0, 4);
  const upcomingDeadlines = tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeadlineColor = (dueDate: Date, status: string) => {
    if (status === 'completed') return 'border-green-500 bg-green-50';
    if (isAfter(new Date(), dueDate)) return 'border-red-500 bg-red-50';
    const daysUntilDue = differenceInDays(dueDate, new Date());
    if (daysUntilDue <= 2) return 'border-yellow-500 bg-yellow-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getDeadlineIcon = (dueDate: Date, status: string) => {
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (isAfter(new Date(), dueDate)) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    const daysUntilDue = differenceInDays(dueDate, new Date());
    if (daysUntilDue <= 2) return <Clock className="h-5 w-5 text-yellow-600" />;
    return <Calendar className="h-5 w-5 text-blue-600" />;
  };

  const getEmployeeInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getEmployeeById = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  const calculateEmployeePerformance = (employeeId: string) => {
    const employeeTasks = tasks.filter(task => task.assignedTo === employeeId);
    if (employeeTasks.length === 0) return 0;
    const completedTasks = employeeTasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / employeeTasks.length) * 100);
  };

  if (statsLoading || tasksLoading || employeesLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow" data-testid="card-total-employees">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalEmployees || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-primary text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow" data-testid="card-active-tasks">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.activeTasks || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium">+5 new today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow" data-testid="card-overdue-tasks">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                <p className="text-3xl font-bold text-red-600">{stats?.overdueTasks || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-red-600 text-sm font-medium">Needs attention</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow" data-testid="card-completion-rate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.completionRate || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PieChart className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-600 text-sm font-medium">+3% this week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <Card className="lg:col-span-2" data-testid="card-recent-tasks">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Tasks</CardTitle>
              <button className="text-primary hover:text-blue-700 text-sm font-medium" data-testid="button-view-all-tasks">
                View All
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tasks available</p>
              ) : (
                recentTasks.map((task) => {
                  const employee = getEmployeeById(task.assignedTo);
                  return (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors" data-testid={`task-item-${task.id}`}>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {employee ? getEmployeeInitials(employee.name) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-500">
                            Assigned to {employee?.name || 'Unknown Employee'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`status-badge ${getTaskStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Due: {format(new Date(task.dueDate), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card data-testid="card-team-performance">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {employees.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No employees available</p>
              ) : (
                employees.slice(0, 4).map((employee) => {
                  const performance = calculateEmployeePerformance(employee.id);
                  return (
                    <div key={employee.id} className="flex items-center justify-between" data-testid={`employee-performance-${employee.id}`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {getEmployeeInitials(employee.name)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{employee.name}</p>
                          <p className="text-sm text-gray-500">{employee.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{performance}%</p>
                        <Progress value={performance} className="w-16 h-2 mt-1" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card data-testid="card-upcoming-deadlines">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingDeadlines.length === 0 ? (
              <div className="col-span-full">
                <p className="text-gray-500 text-center py-8">No upcoming deadlines</p>
              </div>
            ) : (
              upcomingDeadlines.map((task) => {
                const employee = getEmployeeById(task.assignedTo);
                const dueDate = new Date(task.dueDate);
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
