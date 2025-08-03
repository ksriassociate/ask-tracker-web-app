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

const getTaskStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getDeadlineColor = (dueDate: Date, status: string) => {
  if (status === 'completed') {
    return 'border-green-500';
  }
  return isAfter(new Date(), dueDate) ? 'border-red-500' : 'border-blue-500';
};

const getDeadlineIcon = (dueDate: Date, status: string) => {
  if (status === 'completed') {
    return <CheckCircle className="w-6 h-6 text-green-500" />;
  }
  return isAfter(new Date(), dueDate) ? (
    <AlertTriangle className="w-6 h-6 text-red-500" />
  ) : (
    <Clock className="w-6 h-6 text-blue-500" />
  );
};

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

  if (statsLoading || tasksLoading || employeesLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const completionRate = stats?.completionRate ?? 0;
  const overdueTasksCount = stats?.overdueTasks ?? 0;
  const activeTasksCount = stats?.activeTasks ?? 0;
  const totalEmployees = stats?.totalEmployees ?? 0;

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Stats Cards */}
      <Card data-testid="stats-card-employees">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees}</div>
        </CardContent>
      </Card>
      
      <Card data-testid="stats-card-active">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          <ClipboardList className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeTasksCount}</div>
        </CardContent>
      </Card>
      
      <Card data-testid="stats-card-overdue">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overdueTasksCount}</div>
        </CardContent>
      </Card>

      <Card data-testid="stats-card-completion">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <Progress value={completionRate} className="h-2 mt-2" />
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-2" data-testid="card-recent-tasks">
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-gray-500">No recent tasks found.</p>
          ) : (
            <div className="space-y-4">
              {recentTasks.map(task => {
                const employee = employees.find(emp => emp.id === task.assignedTo);
                const dueDate = new Date(task.dueDate);

                return (
                  <div key={task.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 truncate">{task.title}</h4>
                      <Badge className={getTaskStatusColor(task.status)}>
                        {task.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{employee?.name || 'Unknown Employee'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Due: {format(dueDate, 'PPP')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-2" data-testid="card-upcoming-deadlines">
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-gray-500">No upcoming deadlines.</p>
          ) : (
            <div className="space-y-4">
              {upcomingDeadlines.map(task => {
                const employee = employees.find(emp => emp.id === task.assignedTo);
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
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}