import { Search, Bell, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import AddTaskModal from "@/components/modals/add-task-modal";
import AddEmployeeModal from "@/components/modals/add-employee-modal";
import AddCustomerModal from "@/components/modals/add-customer-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  return (
    <>
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
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
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
            
            {/* Add New Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary text-white hover:bg-blue-700" data-testid="button-add-new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowTaskModal(true)} data-testid="menu-add-task">
                  Add Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEmployeeModal(true)} data-testid="menu-add-employee">
                  Add Employee
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCustomerModal(true)} data-testid="menu-add-customer">
                  Add Customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <AddTaskModal open={showTaskModal} onOpenChange={setShowTaskModal} />
      <AddEmployeeModal open={showEmployeeModal} onOpenChange={setShowEmployeeModal} />
      <AddCustomerModal open={showCustomerModal} onOpenChange={setShowCustomerModal} />
    </>
  );
}
