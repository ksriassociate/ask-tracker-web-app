import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are set to prevent errors
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env file or Netlify environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main App Component
function App() {
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('employees'); // State to manage which table is displayed

  // State for form management (for adding/editing)
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  // Function to fetch data from a given table
  const fetchData = async (table, setData) => {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      setData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Real-time listener for all tables
  const setupRealtimeSubscriptions = () => {
    supabase.channel('public:employees').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, payload => {
      fetchData('employees', setEmployees);
    }).subscribe();

    supabase.channel('public:customers').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, payload => {
      fetchData('customers', setCustomers);
    }).subscribe();

    supabase.channel('public:tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
      fetchData('tasks', setTasks);
    }).subscribe();
  };

  useEffect(() => {
    // Initial fetch for all tables
    fetchData('employees', setEmployees);
    fetchData('customers', setCustomers);
    fetchData('tasks', setTasks);
    
    // Set up real-time listeners
    setupRealtimeSubscriptions();

    // Clean up subscriptions on unmount
    return () => {
      supabase.removeAllSubscriptions();
    };
  }, []);

  // Handler for form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // Special handling for foreign keys, converting string value to number
    if (name === 'assigned_to_employee' || name === 'assigned_to_customer') {
      setFormData({ ...formData, [name]: value ? Number(value) : null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handler for form submission (add or update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        // Update existing item
        await supabase.from(activeTab).update(formData).eq('id', selectedItem.id);
        console.log('Update successful!');
      } else {
        // Add new item
        await supabase.from(activeTab).insert([formData]);
        console.log('Insertion successful!');
      }
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Handler for deleting an item
  const handleDelete = async (id) => {
    try {
      await supabase.from(activeTab).delete().eq('id', id);
      console.log('Deletion successful!');
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Function to load an item into the form for editing
  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData(item);
    setIsEditMode(true);
  };

  // Function to reset the form
  const resetForm = () => {
    setSelectedItem(null);
    setFormData({});
    setIsEditMode(false);
  };

  // Render the form based on the active tab
  const renderForm = () => {
    switch (activeTab) {
      case 'employees':
        return (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="text" name="email" value={formData.email || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" name="phone" value={formData.phone || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                {isEditMode ? 'Update' : 'Add'} Employee
              </button>
              {isEditMode && <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancel</button>}
            </div>
          </form>
        );
      case 'customers':
        return (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" name="company_name" value={formData.company_name || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="text" name="email" value={formData.email || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" name="phone" value={formData.phone || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                {isEditMode ? 'Update' : 'Add'} Customer
              </button>
              {isEditMode && <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancel</button>}
            </div>
          </form>
        );
      case 'tasks':
        return (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" name="title" value={formData.title || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleFormChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <input type="text" name="status" value={formData.status || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To Employee</label>
              <select name="assigned_to_employee" value={formData.assigned_to_employee || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" required>
                <option value="">Select an employee</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To Customer (Optional)</label>
              <select name="assigned_to_customer" value={formData.assigned_to_customer || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                {isEditMode ? 'Update' : 'Add'} Task
              </button>
              {isEditMode && <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancel</button>}
            </div>
          </form>
        );
      default:
        return null;
    }
  };

  // Render the list of items
  const renderList = (items) => (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} List</h2>
      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.id} className="py-4 flex justify-between items-center">
            <div>
              {activeTab === 'employees' && <p className="text-lg font-medium text-gray-900">{item.name}</p>}
              {activeTab === 'customers' && <p className="text-lg font-medium text-gray-900">{item.name}</p>}
              {activeTab === 'tasks' && <p className="text-lg font-medium text-gray-900">{item.title}</p>}
              {activeTab === 'tasks' && (
                <p className="text-sm text-gray-500">{item.description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(item)}
                className="text-indigo-600 hover:text-indigo-900 font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-red-600 hover:text-red-900 font-medium"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-6">Supabase CRUD App</h1>

        {/* Tab navigation */}
        <div className="flex justify-center border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'employees' ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'customers' ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'tasks' ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tasks
          </button>
        </div>

        {/* Form and list sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{isEditMode ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}</h2>
            {renderForm()}
          </div>
          <div>
            {activeTab === 'employees' && renderList(employees)}
            {activeTab === 'customers' && renderList(customers)}
            {activeTab === 'tasks' && renderList(tasks)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;