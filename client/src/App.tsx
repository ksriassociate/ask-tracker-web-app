import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar"; // ✅ Corrected import
import { Menu, X } from "lucide-react"; // ✅ Lucide icons

// ✅ All pages
import { Dashboard } from "./components/Dashboard";
import { CustomersPage } from "./components/CustomersPage";
import { EmployeesPage } from "./components/EmployeesPage";
import { TasksPage } from "./components/TasksPage";
import { InvoicesPage } from "./components/InvoicesPage";
import { ReportsPage } from "./components/ReportsPage";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // for mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // for desktop

  return (
    <Router>
      <div className="flex h-screen relative">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* Dark overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 bg-gray-100 overflow-auto">
          {/* Mobile menu button */}
          <button
            className="md:hidden m-2 p-2 bg-gray-800 text-white rounded shadow"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
