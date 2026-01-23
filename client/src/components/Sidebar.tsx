import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Briefcase,
  ClipboardList,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Gavel,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export const Sidebar = ({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: <Home size={20} /> },
    { path: "/employees", label: "Employees", icon: <Briefcase size={20} /> },
    { path: "/customers", label: "Customers", icon: <Users size={20} /> },
    { path: "/tasks", label: "Tasks", icon: <ClipboardList size={20} /> },
    { path: "/legal-cases", label: "Legal Cases", icon: <Gavel size={20} /> },
    { path: "/reports", label: "Reports", icon: <BarChart3 size={20} /> },
    { path: "/invoices", label: "Invoices", icon: <FileText size={20} /> },
  ];

  return (
    <div
      className={`fixed md:static inset-y-0 left-0 ${
        isCollapsed ? "w-20" : "w-64"
      } bg-gray-800 text-white flex flex-col transform
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      transition-all duration-300 md:translate-x-0 z-50`}
    >
      <div className="flex justify-between items-center p-4 bg-indigo-600">
        {!isCollapsed && <h1 className="font-bold">K Sriram & Associates</h1>}
        <button
          className="hidden md:block"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <nav className="mt-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-700
            ${
              location.pathname === item.path
                ? "bg-gray-700 border-l-4 border-blue-500"
                : ""
            }`}
          >
            {item.icon}
            {!isCollapsed && item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
