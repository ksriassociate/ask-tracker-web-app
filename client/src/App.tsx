import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: The app now gets these values from Netlify's environment variables.
// You must have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set in your Netlify dashboard.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single Supabase client for your app.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The main application component.
export default function App() {
  const [employees, setEmployees] = useState([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');

  const [tasks, setTasks] = useState([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const [customers, setCustomers] = useState([]);
  const [newCustomerName, setNewCustomerName] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to fetch all data from Supabase.
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase.from('employees').select('*');
      if (employeesError) throw employeesError;
      setEmployees(employeesData);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
      if (tasksError) throw tasksError;
      setTasks(tasksData);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase.from('customers').select('*');
      if (customersError) throw customersError;
      setCustomers(customersData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please check your Supabase connection.');
    } finally {
      setLoading(false);
    }
  };

  // Authenticate and fetch data on component mount.
  useEffect(() => {
    const signInAndFetch = async () => {
      // Sign in anonymously to get a session for RLS.
      const { error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        console.error('Anonymous sign-in failed:', authError);
        setError('Failed to authenticate. Check Supabase auth settings.');
      } else {
        setIsAuthenticated(true);
      }
    };
    signInAndFetch();
  }, []);

  // Use a separate effect to fetch data once authenticated.
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Function to handle adding a new employee.
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (newEmployeeName.trim() === '') return;

    try {
      // Using { returning: 'minimal' } to suppress the implicit SELECT
      const { error } = await supabase
        .from('employees')
        .insert([{ name: newEmployeeName }], { returning: 'minimal' });

      if (error) {
        console.error('Supabase insert error:', error);
        setError(`Failed to add employee: ${error.message}`);
        return;
      }
      
      // Since we are not returning data, we'll re-fetch the list to update the UI
      fetchData();
      setNewEmployeeName('');
    } catch (err) {
      console.error('Error adding employee:', err);
      setError('An unexpected error occurred while adding an employee.');
    }
  };

  // Function to handle deleting an employee.
  const handleDeleteEmployee = async (id) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        setError(`Failed to delete employee: ${error.message}`);
        return;
      }
      setEmployees(employees.filter(employee => employee.id !== id));
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('An unexpected error occurred while deleting an employee.');
    }
  };

  // Function to handle adding a new task.
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTaskDescription.trim() === '') return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{ description: newTaskDescription }], { returning: 'minimal' });

      if (error) {
        console.error('Supabase insert error:', error);
        setError(`Failed to add task: ${error.message}`);
        return;
      }

      fetchData();
      setNewTaskDescription('');
    } catch (err) {
      console.error('Error adding task:', err);
      setError('An unexpected error occurred while adding a task.');
    }
  };

  // Function to handle deleting a task.
  const handleDeleteTask = async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        setError(`Failed to delete task: ${error.message}`);
        return;
      }
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('An unexpected error occurred while deleting a task.');
    }
  };

  // Function to handle adding a new customer.
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (newCustomerName.trim() === '') return;

    try {
      const { error } = await supabase
        .from('customers')
        .insert([{ name: newCustomerName }], { returning: 'minimal' });

      if (error) {
        console.error('Supabase insert error:', error);
        setError(`Failed to add customer: ${error.message}`);
        return;
      }

      fetchData();
      setNewCustomerName('');
    } catch (err) {
      console.error('Error adding customer:', err);
      setError('An unexpected error occurred while adding a customer.');
    }
  };

  // Function to handle deleting a customer.
  const handleDeleteCustomer = async (id) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        setError(`Failed to delete customer: ${error.message}`);
        return;
      }
      setCustomers(customers.filter(customer => customer.id !== id));
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('An unexpected error occurred while deleting a customer.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 font-inter">
      <div className="container mx-auto p-4">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">Task Tracker</h1>

        {loading && <p className="text-center text-lg text-blue-500">Loading data...</p>}
        {error && <p className="text-center text-lg text-red-500">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Employee Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-center">Employees</h2>
            <form onSubmit={handleAddEmployee} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="New Employee Name"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors"
              >
                Add
              </button>
            </form>
            <ul className="space-y-4 overflow-y-auto flex-grow">
              {employees.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No employees yet.</p>
              ) : (
                employees.map((employee) => (
                  <li key={employee.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                    <span className="text-lg">{employee.name}</span>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      aria-label="Delete employee"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Task Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-center">Tasks</h2>
            <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="New Task Description"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition-colors"
              >
                Add
              </button>
            </form>
            <ul className="space-y-4 overflow-y-auto flex-grow">
              {tasks.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No tasks yet.</p>
              ) : (
                tasks.map((task) => (
                  <li key={task.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                    <span className="text-lg">{task.description}</span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      aria-label="Delete task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Customer Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-center">Customers</h2>
            <form onSubmit={handleAddCustomer} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="New Customer Name"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md transition-colors"
              >
                Add
              </button>
            </form>
            <ul className="space-y-4 overflow-y-auto flex-grow">
              {customers.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No customers yet.</p>
              ) : (
                customers.map((customer) => (
                  <li key={customer.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                    <span className="text-lg">{customer.name}</span>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      aria-label="Delete customer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
