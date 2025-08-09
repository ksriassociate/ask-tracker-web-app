import './styles.css';
import React, { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Home, Users, Briefcase, FileText, Menu, X, Plus, ChevronUp, ChevronDown, Trash2, Edit } from 'lucide-react';

// Assuming these types are defined in a separate file or at the top of this file
interface Employee {
  id: number;
  full_name: string;
  email: string;
  position: string;
  department: string;
}

interface Customer {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone_number?: string;
}

interface Task {
  id: number;
  title: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  description: string;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  // Corrected column names to match the database schema as per user feedback
  assign_to_employee?: number;
  assign_to_customer?: number;
  // Corrected types for employees and customers to match Supabase's return structure as arrays
  employees?: { full_name: string }[]; // Changed to array
  customers?: { company_name: string }[]; // Changed to array
}

interface NavLinkProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface FormInputProps {
  label: string;
  id: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
}

interface FormSelectProps {
  label: string;
  id: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  required?: boolean;
}

interface StatusBadgeProps {
  status: 'To Do' | 'In Progress' | 'Completed';
}

interface PriorityBadgeProps {
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

// Supabase Client Configuration
const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Please check your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).');
}

const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Reusable Navigation Link component
const NavLink: React.FC<NavLinkProps> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 w-full text-left
      ${isActive
        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
  >
    <Icon className="h-5 w-5" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

// Sidebar component
const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen }) => {
  const navItems = [
    { label: 'Dashboard', icon: Home },
    { label: 'Employees', icon: Users },
    { label: 'Customers', icon: Briefcase },
    { label: 'Tasks', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white p-4 shadow-xl transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-purple-400">TaskTracker</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-400 hover:text-white lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              icon={item.icon}
              label={item.label}
              isActive={currentPage === item.label}
              onClick={() => {
                setCurrentPage(item.label);
                setIsSidebarOpen(false);
              }}
            />
          ))}
        </nav>
      </div>
    </>
  );
};

// Generic Modal component
const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform scale-95 transition-transform duration-200">
      <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-6 w-6" />
        </button>
      </div>
      {/* Added max-h and overflow-y-auto for modal content scrolling */}
      <div className="py-2 max-h-[70vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

// Confirmation Modal component
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
};

// Reusable Form Input
const FormInput: React.FC<FormInputProps> = ({ label, id, name, type = 'text', value, onChange, placeholder, required = false }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors text-gray-900"
    />
  </div>
);

// Reusable Form Select
const FormSelect: React.FC<FormSelectProps> = ({ label, id, name, value, onChange, options, required = false }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors text-gray-900"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Status Badge component
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusColors = {
    'To Do': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {status}
    </span>
  );
};

// Priority Badge component
const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const priorityColors = {
    'Low': 'text-green-500',
    'Medium': 'text-yellow-500',
    'High': 'text-orange-500',
    'Urgent': 'text-red-500',
  };

  const icon = {
    'Low': <ChevronDown className="h-4 w-4 mr-1" />,
    'Medium': <></>, // No specific icon for medium, or choose a neutral one
    'High': <ChevronUp className="h-4 w-4 mr-1" />,
    'Urgent': <ChevronUp className="h-4 w-4 mr-1 rotate-180" />, // Can rotate for more urgency
  };

  return (
    <span className={`inline-flex items-center text-xs font-medium ${priorityColors[priority]}`}>
      {icon[priority]}
      {priority}
    </span>
  );
};

const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 bg-white rounded-2xl shadow-lg min-h-[calc(100vh-120px)]">
    {children}
  </div>
);

// Dashboard Page
const DashboardPage: React.FC = () => {
  const [counts, setCounts] = useState<{ employees: number; customers: number; tasks: number } | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!supabase) return;
      try {
        const { count: employeeCount } = await supabase.from('employees').select('*', { count: 'exact' });
        const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact' });
        const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact' });
        setCounts({
          employees: employeeCount || 0,
          customers: customerCount || 0,
          tasks: taskCount || 0,
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };
    fetchCounts();
  }, []);

  const Card: React.FC<{ title: string; count: number | null; icon: React.ElementType }> = ({ title, count, icon: Icon }) => (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-md flex items-center justify-between transition-transform transform hover:scale-105">
      <div>
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <p className="text-3xl font-bold text-blue-600 mt-2">{count !== null ? count : '-'}</p>
      </div>
      <Icon className="h-10 w-10 text-gray-400" />
    </div>
  );

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Total Employees" count={counts?.employees ?? null} icon={Users} />
        <Card title="Total Customers" count={counts?.customers ?? null} icon={Briefcase} />
        <Card title="Total Tasks" count={counts?.tasks ?? null} icon={FileText} />
      </div>
    </PageContainer>
  );
};

// Employees Page
const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !currentEmployee) return;

    try {
      if (currentEmployee.id) {
        // Update employee
        await supabase.from('employees').update(currentEmployee).eq('id', currentEmployee.id);
      } else {
        // Add new employee: Omit id to let Supabase auto-generate
        const { id, ...newEmployeeWithoutId } = currentEmployee; // Destructure to exclude id
        await supabase.from('employees').insert([newEmployeeWithoutId]);
      }
      fetchEmployees();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDelete = async () => {
    if (!supabase || !currentEmployee) return;
    try {
      await supabase.from('employees').delete().eq('id', currentEmployee.id);
      fetchEmployees();
      setIsConfirmationModalOpen(false);
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const openAddModal = () => {
    // For a new employee, do not set the ID. Let Supabase auto-generate.
    setCurrentEmployee({ full_name: '', email: '', position: '', department: '' } as Employee);
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsModalOpen(true);
  };

  const openConfirmationModal = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsConfirmationModalOpen(true);
  };

  return (
    <PageContainer>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-md hover:from-blue-600 hover:to-purple-700 transition-all">
          <Plus className="h-5 w-5 mr-2" />
          Add Employee
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{employee.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{employee.position}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{employee.department}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => openEditModal(employee)} className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-5 w-5 inline" />
                  </button>
                  <button onClick={() => openConfirmationModal(employee)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal
          title={currentEmployee?.id ? 'Edit Employee' : 'Add Employee'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleAddOrUpdate} className="space-y-4">
            <FormInput
              label="Full Name"
              id="full_name"
              name="full_name"
              value={currentEmployee?.full_name || ''}
              onChange={(e) => setCurrentEmployee({ ...currentEmployee!, full_name: e.target.value })}
              required
            />
            <FormInput
              label="Email"
              id="email"
              name="email"
              type="email"
              value={currentEmployee?.email || ''}
              onChange={(e) => setCurrentEmployee({ ...currentEmployee!, email: e.target.value })}
              required
            />
            <FormInput
              label="Position"
              id="position"
              name="position"
              value={currentEmployee?.position || ''}
              onChange={(e) => setCurrentEmployee({ ...currentEmployee!, position: e.target.value })}
              required
            />
            <FormInput
              label="Department"
              id="department"
              name="department"
              value={currentEmployee?.department || ''}
              onChange={(e) => setCurrentEmployee({ ...currentEmployee!, department: e.target.value })}
              required
            />
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition-all">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        title="Delete Employee"
        message={`Are you sure you want to delete ${currentEmployee?.full_name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmationModalOpen(false)}
      />
    </PageContainer>
  );
};

// Customers Page
const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !currentCustomer) return;

    try {
      if (currentCustomer.id) {
        await supabase.from('customers').update(currentCustomer).eq('id', currentCustomer.id);
      } else {
        // Add new customer: Omit id to let Supabase auto-generate
        const { id, ...newCustomerWithoutId } = currentCustomer; // Destructure to exclude id
        await supabase.from('customers').insert([newCustomerWithoutId]);
      }
      fetchCustomers();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleDelete = async () => {
    if (!supabase || !currentCustomer) return;
    try {
      await supabase.from('customers').delete().eq('id', currentCustomer.id);
      fetchCustomers();
      setIsConfirmationModalOpen(false);
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const openAddModal = () => {
    // For a new customer, do not set the ID. Let Supabase auto-generate.
    setCurrentCustomer({ company_name: '', contact_person: '', email: '', phone_number: '' } as Customer);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  const openConfirmationModal = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsConfirmationModalOpen(true);
  };

  return (
    <PageContainer>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-md hover:from-blue-600 hover:to-purple-700 transition-all">
          <Plus className="h-5 w-5 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.company_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.contact_person}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.phone_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => openEditModal(customer)} className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-5 w-5 inline" />
                  </button>
                  <button onClick={() => openConfirmationModal(customer)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal
          title={currentCustomer?.id ? 'Edit Customer' : 'Add Customer'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleAddOrUpdate} className="space-y-4">
            <FormInput
              label="Company Name"
              id="company_name"
              name="company_name"
              value={currentCustomer?.company_name || ''}
              onChange={(e) => setCurrentCustomer({ ...currentCustomer!, company_name: e.target.value })}
              required
            />
            <FormInput
              label="Contact Person"
              id="contact_person"
              name="contact_person"
              value={currentCustomer?.contact_person || ''}
              onChange={(e) => setCurrentCustomer({ ...currentCustomer!, contact_person: e.target.value })}
              required
            />
            <FormInput
              label="Email"
              id="email"
              name="email"
              type="email"
              value={currentCustomer?.email || ''}
              onChange={(e) => setCurrentCustomer({ ...currentCustomer!, email: e.target.value })}
              required
            />
            <FormInput
              label="Phone Number"
              id="phone_number"
              name="phone_number"
              value={currentCustomer?.phone_number || ''}
              onChange={(e) => setCurrentCustomer({ ...currentCustomer!, phone_number: e.target.value })}
            />
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition-all">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete ${currentCustomer?.company_name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmationModalOpen(false)}
      />
    </PageContainer>
  );
};

// Tasks Page
const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    if (!supabase) return;
    try {
      // Corrected select query string to be a single line without comments or newlines inside
      const { data, error } = await supabase
        .from('tasks')
        .select('id,title,status,description,due_date,priority,assign_to_employee,assign_to_customer,employees(full_name),customers(company_name)');
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchEmployeesAndCustomers = async () => {
    if (!supabase) return;
    try {
      const { data: employeeData, error: employeeError } = await supabase.from('employees').select('*');
      if (employeeError) throw employeeError;
      setEmployees(employeeData || []);

      const { data: customerData, error: customerError } = await supabase.from('customers').select('*');
      if (customerError) throw customerError;
      setCustomers(customerData || []);
    } catch (error) {
      console.error('Error fetching employees and customers:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployeesAndCustomers();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !currentTask) return;

    try {
      if (currentTask.id) {
        await supabase.from('tasks').update(currentTask).eq('id', currentTask.id);
      } else {
        // Add new task: Omit id to let Supabase auto-generate
        const { id, ...newTaskWithoutId } = currentTask; // Destructure to exclude id
        await supabase.from('tasks').insert([newTaskWithoutId]);
      }
      fetchTasks();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = async () => {
    if (!supabase || !currentTask) return;
    try {
      await supabase.from('tasks').delete().eq('id', currentTask.id);
      fetchTasks();
      setIsConfirmationModalOpen(false);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const openAddModal = () => {
    // For a new task, do not set the ID. Let Supabase auto-generate.
    setCurrentTask({
      title: '',
      status: 'To Do',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'Medium',
      // Ensure these new properties are initialized correctly
      assign_to_employee: undefined, // Initialize as undefined or null
      assign_to_customer: undefined, // Initialize as undefined or null
    } as Task); // Cast to Task as id is omitted
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setCurrentTask(task);
    setIsModalOpen(true);
  };

  const openConfirmationModal = (task: Task) => {
    setCurrentTask(task);
    setIsConfirmationModalOpen(true);
  };

  return (
    <PageContainer>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tasks</h1>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-md hover:from-blue-600 hover:to-purple-700 transition-all">
          <Plus className="h-5 w-5 mr-2" />
          Add Task
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned to Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned to Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <StatusBadge status={task.status} />
                </td>
                {/* Display full_name from employees or company_name from customers, or 'N/A' */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {task.employees?.[0]?.full_name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {task.customers?.[0]?.company_name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.due_date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => openEditModal(task)} className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-5 w-5 inline" />
                  </button>
                  <button onClick={() => openConfirmationModal(task)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal
          title={currentTask?.id ? 'Edit Task' : 'Add Task'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleAddOrUpdate} className="space-y-4">
            <FormInput
              label="Title"
              id="title"
              name="title"
              value={currentTask?.title || ''}
              onChange={(e) => setCurrentTask({ ...currentTask!, title: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Status"
                id="status"
                name="status"
                value={currentTask?.status || 'To Do'}
                onChange={(e) => setCurrentTask({ ...currentTask!, status: e.target.value as 'To Do' | 'In Progress' | 'Completed' })}
                options={[{ value: 'To Do', label: 'To Do' }, { value: 'In Progress', label: 'In Progress' }, { value: 'Completed', label: 'Completed' }]}
                required
              />
              <FormSelect
                label="Priority"
                id="priority"
                name="priority"
                value={currentTask?.priority || 'Medium'}
                onChange={(e) => setCurrentTask({ ...currentTask!, priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Urgent' })}
                options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, { value: 'Urgent', label: 'Urgent' }]}
                required
              />
            </div>
            <FormInput
              label="Description"
              id="description"
              name="description"
              type="textarea"
              value={currentTask?.description || ''}
              onChange={(e) => setCurrentTask({ ...currentTask!, description: e.target.value })}
            />
            <FormInput
              label="Due Date"
              id="due_date"
              name="due_date"
              type="date"
              value={currentTask?.due_date || new Date().toISOString().split('T')[0]}
              onChange={(e) => setCurrentTask({ ...currentTask!, due_date: e.target.value })}
              required
            />
            {/* Corrected name attribute and onChange handler for employee assignment */}
            <FormSelect
              label="Assign to Employee"
              id="assign_to_employee"
              name="assign_to_employee"
              value={currentTask?.assign_to_employee || ''}
              onChange={(e) => setCurrentTask({ ...currentTask!, assign_to_employee: e.target.value ? Number(e.target.value) : undefined })}
              options={[{ value: '', label: 'Unassigned' }, ...employees.map(e => ({ value: e.id, label: e.full_name }))]}
            />
            {/* Corrected name attribute and onChange handler for customer assignment */}
            <FormSelect
              label="Assign to Customer"
              id="assign_to_customer"
              name="assign_to_customer"
              value={currentTask?.assign_to_customer || ''}
              onChange={(e) => setCurrentTask({ ...currentTask!, assign_to_customer: e.target.value ? Number(e.target.value) : undefined })}
              options={[{ value: '', label: 'Unassigned' }, ...customers.map(c => ({ value: c.id, label: c.company_name }))]}
            />
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition-all">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${currentTask?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmationModalOpen(false)}
      />
    </PageContainer>
  );
};


// Main App component
const App = () => {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Effect to manage body overflow for the mobile sidebar
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);

  const renderPage = () => {
    if (!supabase) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4 text-center bg-white rounded-lg shadow-md">
          <p className="text-red-600 font-medium text-lg">
            Supabase is not configured. Please check your environment variables.
          </p>
        </div>
      );
    }
    switch (currentPage) {
      case 'Dashboard':
        return <DashboardPage />;
      case 'Employees':
        return <EmployeesPage />;
      case 'Customers':
        return <CustomersPage />;
      case 'Tasks':
        return <TasksPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-gray-100 text-gray-900">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-white p-4 flex items-center justify-between shadow-sm border-b border-gray-200 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-blue-600">TaskTracker</h1>
          <div className="w-6"></div> {/* Spacer to balance the layout */}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
