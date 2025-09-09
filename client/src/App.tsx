import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// ✅ All pages as named exports
import { Dashboard } from "./components/Dashboard";
import { CustomersPage } from "./components/CustomersPage";
import { EmployeesPage } from "./components/EmployeesPage";
import { TasksPage } from "./components/TasksPage";
import { InvoicesPage } from "./components/InvoicesPage";
import { ReportsPage } from "./components/ReportsPage";

export default function App() {
  return (
    <Router>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
          <div className="p-4 text-xl font-bold border-b border-gray-700">
            K Sriram & Associates
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link className="block p-2 rounded hover:bg-gray-700" to="/">
              Dashboard
            </Link>
            <Link className="block p-2 rounded hover:bg-gray-700" to="/customers">
              Customers
            </Link>
            <Link className="block p-2 rounded hover:bg-gray-700" to="/employees">
              Employees
            </Link>
            <Link className="block p-2 rounded hover:bg-gray-700" to="/tasks">
              Tasks
            </Link>
            <Link className="block p-2 rounded hover:bg-gray-700" to="/invoices">
              Invoices
            </Link>
            <Link className="block p-2 rounded hover:bg-gray-700" to="/reports">
              Reports
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-100 overflow-auto">
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
