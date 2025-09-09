// Sidebar.tsx
import { Link, useLocation } from "react-router-dom";

export const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/employees", label: "Employees" },
    { path: "/customers", label: "Customers" },
    { path: "/tasks", label: "Tasks" },
    { path: "/reports", label: "Reports" },
    { path: "/invoices", label: "Invoices" },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      {/* Company name */}
      <div className="p-4 text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 rounded text-white">
        K Sriram &amp; Associates
      </div>

      <nav className="flex-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-2 hover:bg-gray-700 ${
              location.pathname === item.path ? "bg-gray-700" : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
