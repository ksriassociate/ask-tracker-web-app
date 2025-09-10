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
    { path: "/reports", label: "Reports", icon: <BarChart3 size={20} /> },
    { path: "/invoices", label: "Invoices", icon: <FileText size={20} /> },
  ];

  return (
    <div
      className={`fixed md:static inset-y-0 left-0 ${
        isCollapsed ? "w-20" : "w-64"
      } bg-gray-800 text-white flex flex-col transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        transition-all duration-300 ease-in-out md:translate-x-0 z-50`}
    >
      {/* Company name (hide text when collapsed) */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-600">
        {!isCollapsed && (
          <span className="text-xl font-bold text-white">
            K Sriram & Associates
          </span>
        )}
        {/* Collapse/Expand button (desktop only) */}
        <button
          className="hidden md:flex items-center justify-center text-white"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 transition-colors relative ${
                  isActive
                    ? "bg-gray-700 font-semibold border-l-4 border-blue-500"
                    : "hover:bg-gray-700"
                }`}
                onClick={() => setIsOpen(false)} // ✅ Close on mobile click
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </Link>

              {/* Tooltip (only when collapsed) */}
              {isCollapsed && (
                <span
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap px-2 py-1 rounded bg-black text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};
