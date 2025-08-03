import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Home, Users, BarChart2, Briefcase, FileText, Menu, X, Plus, Clock, ChevronsUp, ChevronsDown, Loader2, Calendar, Trash2 } from 'lucide-react';

// Supabase Client Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Please check your environment variables.');
}
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Reusable Navigation Link component
const NavLink = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 w-full text-left
      ${isActive
        ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg'
        : 'text-gray-200 hover:bg-gray-700 hover:text-white'
      }`}
  >
    <Icon className="h-5 w-5" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

// Sidebar component for navigation
const Sidebar = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'customers', label: 'Customers', icon: Briefcase },
    { id: 'tasks', label: 'Tasks', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
  ];

  return (
    <>
      {/* Overlay for mobile view when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar main container */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white p-6 transform transition-transform duration-300 ease-in-out z-50
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:w-64`}
      >
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold text-blue-400 drop-shadow-md">TaskTracker</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-400 hover:text-white focus:outline-none lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={currentPage === item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setIsSidebarOpen(false); // Close sidebar on mobile
              }}
            />
          ))}
        </nav>
      </aside>
    </>
  );
};

// --- Modal Component (Reusable) ---
const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full md:w-1/2 lg:w-1/3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2 sticky top-0 bg-white">
                <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>
            {children}
        </div>
    </div>
);

// --- Confirmation Modal (New Component) ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Form Input Component (Reusable) ---
const FormInput = ({ label, id, type = 'text', value, onChange, placeholder, required = false }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
    />
  </div>
);

// --- Form Select Component (Reusable) ---
const FormSelect = ({ label, id, name, value, onChange, options, required = false }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
    >
      <option value="" disabled>{`Select ${label}`}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// --- Status and Priority Badge Components ---
const StatusBadge = ({ status }) => {
  const statusColors = {
    'To Do': 'bg-red-100 text-red-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
      <span className="w-2 h-2 mr-2 rounded-full" style={{ backgroundColor: statusColors[status].split(' ')[0].replace('bg', 'text') }}></span>
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const priorityColors = {
    'Low': 'text-green-500',
    'Medium': 'text-yellow-500',
    'High': 'text-red-500',
    'Urgent': 'text-red-700 font-bold',
  };
  const icon = {
    'Low': <ChevronsDown className="h-4 w-4" />,
    'Medium': <Clock className="h-4 w-4" />,
    'High': <ChevronsUp className="h-4 w-4" />,
    'Urgent': <ChevronsUp className="h-4 w-4" />,
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium ${priorityColors[priority]}`}>
      {icon[priority]}
      <span className="ml-1">{priority}</span>
    </span>
  );
};

// --- Dashboard Page Component (with Supabase Integration) ---
const DashboardPage = () => {
    const [counts, setCounts] = useState({ employees: 0, customers: 0, tasks: 0 });
    const [loading, setLoading] = useState(true);

    const fetchCounts = async () => {
        if (!supabase) {
            console.error("Supabase client is not initialized.");
            setLoading(false);
            return;
        }

        try {
            const { count: employeeCount, error: employeeError } = await supabase.from('employees').select('*', { count: 'exact', head: true });
            if (employeeError) throw employeeError;
            const { count: customerCount, error: customerError } = await supabase.from('customers').select('*', { count: 'exact', head: true });
            if (customerError) throw customerError;
            const { count: taskCount, error: taskError } = await supabase.from('tasks').select('*', { count: 'exact' }).in('status', ['To Do', 'In Progress']);
            if (taskError) throw taskError;

            setCounts({
                employees: employeeCount,
                customers: customerCount,
                tasks: taskCount
            });
        } catch (error) {
            console.error('Error fetching dashboard counts:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();
    }, []);

    if (loading) {
        return (
          <div className="flex justify-center items-center h-full p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        );
    }

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition-transform duration-200 hover:scale-[1.02] text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-1">Total Employees</h3>
          <p className="text-4xl font-bold text-blue-600">{counts.employees}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition-transform duration-200 hover:scale-[1.02] text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Briefcase className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-1">Total Customers</h3>
          <p className="text-4xl font-bold text-yellow-600">{counts.customers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition-transform duration-200 hover:scale-[1.02] text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <FileText className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-1">Active Tasks</h3>
          <p className="text-4xl font-bold text-red-600">{counts.tasks}</p>
        </div>
      </div>
    </div>
  );
};

// --- Employees Page Component (with Supabase Integration) ---
const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [form, setForm] = useState({ full_name: '', email: '', position: '', department: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);

    useEffect(() => {
      if (!supabase) return;
      const channel = supabase.channel('employees_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => fetchEmployees()).subscribe();
      fetchEmployees();
      return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchEmployees = async () => {
      setLoading(true);
      if (!supabase) { setLoading(false); return; }
      const { data, error } = await supabase.from('employees').select('id, full_name, email, position, department');
      if (error) { console.error('Error fetching employees:', error); } else { setEmployees(data); }
      setLoading(false);
    };

    const handleFormChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); };

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      if (!supabase) { setIsSubmitting(false); return; }
      try {
          const { error } = await supabase.from('employees').insert({ full_name: form.full_name, email: form.email, position: form.position, department: form.department });
          if (error) throw error;
          setForm({ full_name: '', email: '', position: '', department: '' });
          setShowEmployeeModal(false);
      } catch (error) { console.error('Error adding employee:', error.message); } finally { setIsSubmitting(false); }
    };

    const handleDeleteClick = (employee) => {
        setEmployeeToDelete(employee);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!supabase || !employeeToDelete) return;
        try {
            const { error } = await supabase.from('employees').delete().eq('id', employeeToDelete.id);
            if (error) throw error;
            setShowDeleteModal(false);
            setEmployeeToDelete(null);
        } catch (error) {
            console.error('Error deleting employee:', error.message);
        }
    };
  
    if (loading) { return (<div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>); }

    return (
      <>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-800">Employees</h2>
              <button
                  onClick={() => setShowEmployeeModal(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-800 transition-colors"
              >
                  <Plus className="h-4 w-4" />
                  <span>Add Employee</span>
              </button>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {employee.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.department || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                            onClick={() => handleDeleteClick(employee)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            aria-label={`Delete employee ${employee.full_name}`}
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {showEmployeeModal && (
          <Modal title="Add New Employee" onClose={() => setShowEmployeeModal(false)}>
              <form onSubmit={handleFormSubmit}>
                  <FormInput label="Full Name" id="full_name" name="full_name" value={form.full_name} onChange={handleFormChange} required />
                  <FormInput label="Email Address" id="email" name="email" type="email" value={form.email} onChange={handleFormChange} required />
                  <FormInput label="Position" id="position" name="position" value={form.position} onChange={handleFormChange} required />
                  <FormInput label="Department" id="department" name="department" value={form.department} onChange={handleFormChange} required />
                  <div className="mt-6">
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                        {isSubmitting ? 'Adding...' : 'Add Employee'}
                    </button>
                  </div>
              </form>
          </Modal>
        )}
        <ConfirmationModal
            isOpen={showDeleteModal}
            title="Confirm Deletion"
            message={`Are you sure you want to delete employee "${employeeToDelete?.full_name}"? This action cannot be undone.`}
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteModal(false)}
        />
      </>
    );
};

// --- Customers Page Component (with Supabase Integration) ---
const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [form, setForm] = useState({ company_name: '', contact_person: '', email: '', phone_number: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);

    useEffect(() => {
      if (!supabase) return;
      const channel = supabase.channel('customers_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchCustomers()).subscribe();
      fetchCustomers();
      return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchCustomers = async () => {
      setLoading(true);
      if (!supabase) { setLoading(false); return; }
      const { data, error } = await supabase.from('customers').select('id, company_name, contact_person, email, phone_number');
      if (error) { console.error('Error fetching customers:', error); } else { setCustomers(data); }
      setLoading(false);
    };

    const handleFormChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); };

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      if (!supabase) { setIsSubmitting(false); return; }
      try {
          const { error } = await supabase.from('customers').insert({ company_name: form.company_name, contact_person: form.contact_person, email: form.email, phone_number: form.phone_number || null });
          if (error) throw error;
          setForm({ company_name: '', contact_person: '', email: '', phone_number: '' });
          setShowCustomerModal(false);
      } catch (error) { console.error('Error adding customer:', error.message); } finally { setIsSubmitting(false); }
    };

    const handleDeleteClick = (customer) => {
        setCustomerToDelete(customer);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!supabase || !customerToDelete) return;
        try {
            const { error } = await supabase.from('customers').delete().eq('id', customerToDelete.id);
            if (error) throw error;
            setShowDeleteModal(false);
            setCustomerToDelete(null);
        } catch (error) {
            console.error('Error deleting customer:', error.message);
        }
    };

    if (loading) { return (<div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>); }

  return (
    <>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">Customers</h2>
          <button onClick={() => setShowCustomerModal(true)} className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-800 transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add Customer</span>
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.company_name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.contact_person}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.phone_number || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                            onClick={() => handleDeleteClick(customer)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            aria-label={`Delete customer ${customer.company_name}`}
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showCustomerModal && (
        <Modal title="Add New Customer" onClose={() => setShowCustomerModal(false)}>
            <form onSubmit={handleFormSubmit}>
                <FormInput label="Company Name" id="company_name" name="company_name" value={form.company_name} onChange={handleFormChange} required />
                <FormInput label="Contact Person" id="contact_person" name="contact_person" value={form.contact_person} onChange={handleFormChange} required />
                <FormInput label="Email Address" id="email" name="email" type="email" value={form.email} onChange={handleFormChange} required />
                <FormInput label="Phone Number (Optional)" id="phone_number" name="phone_number" type="tel" value={form.phone_number} onChange={handleFormChange} />
                <div className="mt-6">
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                        {isSubmitting ? 'Adding...' : 'Add Customer'}
                    </button>
                </div>
            </form>
        </Modal>
      )}
      <ConfirmationModal
          isOpen={showDeleteModal}
          title="Confirm Deletion"
          message={`Are you sure you want to delete customer "${customerToDelete?.company_name}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

// --- Tasks Page Component (with Supabase Integration) ---
const TasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'Low',
        status: 'To Do',
        assigned_to_employee_id: '',
        customer_id: ''
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    useEffect(() => {
      if (!supabase) return;
      const channel = supabase.channel('tasks_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks()).subscribe();
      fetchTasks();
      fetchEmployees();
      fetchCustomers();
      return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        if (!supabase) { setLoading(false); return; }
        const { data, error } = await supabase.from('tasks').select('*, employees(full_name), customers(company_name)');
        if (error) { console.error('Error fetching tasks:', error); } else { setTasks(data); }
        setLoading(false);
    };

    const fetchEmployees = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('employees').select('id, full_name');
      if (error) { console.error('Error fetching employees for dropdown:', error); } else { setEmployees(data); }
    };

    const fetchCustomers = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('customers').select('id, company_name');
      if (error) { console.error('Error fetching customers for dropdown:', error); } else { setCustomers(data); }
    };

    const handleFormChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!supabase) { setIsSubmitting(false); return; }
        try {
            const { error } = await supabase.from('tasks').insert({
                title: form.title, description: form.description, due_date: form.due_date, priority: form.priority, status: form.status,
                assigned_to_employee_id: form.assigned_to_employee_id || null, customer_id: form.customer_id || null,
            });
            if (error) throw error;
            setForm({ title: '', description: '', due_date: '', priority: 'Low', status: 'To Do', assigned_to_employee_id: '', customer_id: '' });
            setShowTaskModal(false);
        } catch (error) { console.error('Error adding task:', error.message); } finally { setIsSubmitting(false); }
    };

    const handleDeleteClick = (task) => {
        setTaskToDelete(task);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!supabase || !taskToDelete) return;
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', taskToDelete.id);
            if (error) throw error;
            setShowDeleteModal(false);
            setTaskToDelete(null);
        } catch (error) {
            console.error('Error deleting task:', error.message);
        }
    };

    if (loading) { return (<div className="flex justify-center items-center h-full p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>); }

  return (
    <>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">Tasks</h2>
          <button onClick={() => setShowTaskModal(true)} className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-800 transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col space-y-4 hover:shadow-2xl transition-all duration-300">
              <div className="flex justify-between items-center">
                <p className="text-xl font-semibold text-gray-800">{task.title}</p>
                <StatusBadge status={task.status} />
              </div>
              <p className="text-sm text-gray-600 flex-grow">{task.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{task.employees?.full_name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span>{task.customers?.company_name || 'No Customer'}</span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                    onClick={() => handleDeleteClick(task)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                    aria-label={`Delete task ${task.title}`}
                >
                    <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showTaskModal && (
        <Modal title="Add New Task" onClose={() => setShowTaskModal(false)}>
            <form onSubmit={handleFormSubmit}>
                <FormInput label="Task Title" id="title" name="title" value={form.title} onChange={handleFormChange} required />
                <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" name="description" value={form.description} onChange={handleFormChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"></textarea>
                </div>
                <FormInput label="Due Date" id="due_date" name="due_date" type="date" value={form.due_date} onChange={handleFormChange} required />
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <div className="flex space-x-4">
                        {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                            <label key={p} className="flex items-center">
                                <input type="radio" name="priority" value={p} checked={form.priority === p} onChange={handleFormChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                <span className="ml-2 text-sm text-gray-700">{p}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex space-x-4">
                        {['To Do', 'In Progress', 'Completed'].map(s => (
                            <label key={s} className="flex items-center">
                                <input type="radio" name="status" value={s} checked={form.status === s} onChange={handleFormChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                <span className="ml-2 text-sm text-gray-700">{s}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <FormSelect label="Assign to Employee" id="assigned_to" name="assigned_to_employee_id" value={form.assigned_to_employee_id} onChange={handleFormChange} options={[{ value: '', label: 'None' }, ...employees.map(e => ({ value: e.id, label: e.full_name }))]} />
                <FormSelect label="Customer" id="customer_id" name="customer_id" value={form.customer_id} onChange={handleFormChange} options={[{ value: '', label: 'None' }, ...customers.map(c => ({ value: c.id, label: c.company_name }))]} />
                <div className="mt-6">
                    <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-800 transition-colors disabled:bg-gray-400">
                        {isSubmitting ? 'Adding...' : 'Add Task'}
                    </button>
                </div>
            </form>
        </Modal>
      )}
      <ConfirmationModal
          isOpen={showDeleteModal}
          title="Confirm Deletion"
          message={`Are you sure you want to delete task "${taskToDelete?.title}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

const ReportsPage = () => (
    <div className="p-8 space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Reports</h2>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <p className="text-gray-600">This section will contain various reports and analytics. This is a placeholder for now.</p>
      </div>
    </div>
);

// Main content area, which renders the current page
const MainContent = ({ currentPage }) => {
    let PageComponent;
    switch (currentPage) {
      case 'dashboard': PageComponent = DashboardPage; break;
      case 'employees': PageComponent = EmployeesPage; break;
      case 'customers': PageComponent = CustomersPage; break;
      case 'tasks': PageComponent = TasksPage; break;
      case 'reports': PageComponent = ReportsPage; break;
      default: PageComponent = DashboardPage;
    }
    return (
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <PageComponent />
      </main>
    );
};

// Main App component
const App = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    useEffect(() => {
      if (isSidebarOpen) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = 'auto'; }
      return () => { document.body.style.overflow = 'auto'; };
    }, [isSidebarOpen]);

    return (
      <div className="flex min-h-screen font-sans bg-gray-100 text-gray-900">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <header className="bg-white p-4 flex items-center justify-between shadow-sm border-b lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 hover:text-gray-900 focus:outline-none">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-blue-600">TaskTracker</h1>
            <div className="w-6 h-6"></div>
          </header>
          <MainContent currentPage={currentPage} />
        </div>
      </div>
    );
};

export default App;
