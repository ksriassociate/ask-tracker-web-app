import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

interface TopBarProps {
  onMenuClick: () => void;
}

const getPageTitle = (path: string) => {
  switch (path) {
    case '/': return 'Dashboard';
    case '/employees': return 'Employees';
    case '/tasks': return 'Tasks';
    case '/customers': return 'Customers';
    case '/reports': return 'Reports';
    default: return 'Dashboard';
  }
};

const getPageDescription = (path: string) => {
  switch (path) {
    case '/': return "Welcome back! Here's what's happening today.";
    case '/employees': return 'Manage your team members and their information';
    case '/tasks': return 'Manage and track all tasks across your organization';
    case '/customers': return 'Manage your client database and track their projects';
    case '/reports': return 'Comprehensive insights into your team\'s productivity';
    default: return "Welcome back! Here's what's happening today.";
  }
};

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={onMenuClick}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getPageTitle(location)}</h2>
            <p className="text-sm text-gray-500">{getPageDescription(location)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search tasks, employees..." 
              className="w-80 pl-10"
              data-testid="input-search"
            />
          </div>
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
