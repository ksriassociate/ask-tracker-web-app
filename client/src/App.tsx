// This is the main application file. It sets up a simple routing system
// to switch between different pages of the task tracker application.
// In a real project, you would use a library like 'react-router-dom'.

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Briefcase,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import Dashboard from './dashboard.tsx';
import Tasks from './tasks.tsx';
import Employees from './employees.tsx';
import Customers from './customers.tsx';
import Reports from './reports.tsx';
import NotFound from './not-found.tsx';
import './index.css'; // Assuming your Tailwind CSS is here

// Create a client for React Query
const queryClient = new QueryClient();

// The main application component
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // A simple navigation component for the sidebar
  const Navigation = () => {
    const navItems = [
      { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
      { name: 'Tasks', icon: ClipboardList, page: 'tasks' },
      { name: 'Employees', icon: Users, page: 'employees' },
      { name: 'Customers', icon: Briefcase, page: 'customers' },
      { name: 'Reports', icon: BarChart3, page: 'reports' },
    ];

    return (
      <nav className="bg-gray-800 text-white w-64 min-h-screen p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">Task Tracker</h1>
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.page}>
              <button
                onClick={() => setCurrentPage(item.page)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                  ${currentPage === item.page
                    ? 'bg-gray-700 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <Tasks />;
      case 'employees':
        return <Employees />;
      case 'customers':
        return <Customers />;
      case 'reports':
        return <Reports />;
      default:
        return <NotFound />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex bg-gray-100 min-h-screen font-inter">
        <Navigation />
        <main className="flex-1 p-6">
          {renderPage()}
        </main>
      </div>
    </QueryClientProvider>
  );
}