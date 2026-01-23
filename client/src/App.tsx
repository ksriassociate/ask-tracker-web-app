import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Menu, X } from "lucide-react";

import { Dashboard } from "./components/Dashboard";
import { EmployeesPage } from "./components/EmployeesPage";
import { CustomersPage } from "./components/CustomersPage";
import { TasksPage } from "./components/TasksPage";
import { InvoicesPage } from "./components/InvoicesPage";
import { ReportsPage } from "./components/ReportsPage";
import { LegalCasesPage } from "./components/LegalCasesPage";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 bg-gray-100 overflow-auto">
          <button
            className="md:hidden m-2 p-2 bg-gray-800 text-white rounded"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/legal-cases" element={<LegalCasesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
