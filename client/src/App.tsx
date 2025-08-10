import React, { useState, useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Home, Users, Briefcase, FileText, Menu, X, Plus, ChevronUp, ChevronDown, Trash2, Edit, FilePieChart, User, BriefcaseMedical, Landmark, DollarSign, List, Download, Upload, File } from 'lucide-react';
import './index.css';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Supabase Client Configuration
const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Please check your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).');
}

const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Interfaces
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
  assign_to_employee: number | null;
  assign_to_customer: number | null;
  billing_amount?: number;
}

// =========================================================
// Reusable Components
// =========================================================

// Modal Component - Corrected to handle scrolling
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 transform transition-all duration-200">
      <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
        <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="py-2 overflow-y-auto max-h-[70vh]">{children}</div>
    </div>
  </div>
);

// Form Input Component
interface FormInputProps {
  label: string;
  id: string;
  name: string;
  type?: 'text' | 'email' | 'date' | 'number' | 'tel';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({ label, id, name, type = 'text', value, onChange, placeholder, required = false }) => (
  <div className="mb-4">
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

// Form Select Component
interface FormSelectProps {
  label: string;
  id: string;
  name: string;
  value: string | number | null;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  required?: boolean;
}

const FormSelect: React.FC<FormSelectProps> = ({ label, id, name, value, onChange, options, required = false }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={id}
      name={name}
      value={value || ''}
      onChange={onChange}
      required={required}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors text-gray-900"
    >
      <option value="" disabled>Select an option</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Form Textarea Component
interface FormTextareaProps {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
}

const FormTextarea: React.FC<FormTextareaProps> = ({ label, id, name, value, onChange, placeholder, required = false }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={4}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors text-gray-900"
    />
  </div>
);

// Import Modal Component
interface ImportModalProps {
  title: string;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  fields: string[];
}

const ImportModal: React.FC<ImportModalProps> = ({ title, onClose, onImport, fields }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImportClick = async () => {
    if (!file) {
      alert("Please select a file to import.");
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      const worksheet = workbook.worksheets[0];
      const json: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = worksheet.getRow(1).getCell(colNumber).value as string;
            rowData[header.toLowerCase().replace(/\s/g, '_')] = cell.value;
          });
          json.push(rowData);
        }
      });
      await onImport(json);
      setLoading(false);
      onClose();
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex flex-col items-center p-4">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 w-full text-center cursor-pointer hover:border-blue-500 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <p className="text-gray-800 font-medium">{file.name}</p>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400 mx-auto" />
              <p className="mt-2 text-sm text-gray-600">
                Drag & drop your file here, or click to select
              </p>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Supported fields: {fields.join(', ')}
        </p>
        <div className="flex justify-end mt-6 w-full">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 px-6 py-2 rounded-full text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            disabled={!file || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
    </Modal>
  );
};


// Sidebar Component
interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen }) => {
  const pages = [
    { name: 'Dashboard', icon: Home },
    { name: 'Employees', icon: Users },
    { name: 'Customers', icon: Briefcase },
    { name: 'Tasks', icon: FileText },
    { name: 'Reports', icon: FilePieChart }
  ];

  const handlePageClick = (pageName: string) => {
    setCurrentPage(pageName);
    setIsSidebarOpen(false); // Add this line to collapse the sidebar
  };

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between p-4 bg-secondary-600 text-white shadow-md">
          <h1 className="text-2xl font-bold">TaskTracker</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          {pages.map((page) => (
            <button
              key={page.name}
              onClick={() => {
                handlePageClick(page.name);
              }}
              className={`flex items-center w-full p-3 rounded-lg my-2 transition-all duration-200 ${currentPage === page.name
                ? 'bg-secondary-100 text-secondary-700 font-semibold shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <page.icon className="h-6 w-6 mr-3" />
              <span>{page.name}</span>
            </button>
          ))}
        </nav>
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </>
  );
};

// PageContainer Component
interface PageContainerProps {
  children: React.ReactNode;
  pageTitle: string;
  actionButtonText?: string;
  onActionButtonClick?: () => void;
  importButtonText?: string;
  onImportButtonClick?: () => void;
  exportButtonText?: string;
  onExportButtonClick?: () => void;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  pageTitle,
  actionButtonText,
  onActionButtonClick,
  importButtonText,
  onImportButtonClick,
  exportButtonText,
  onExportButtonClick,
}) => (
  <div className="p-6 md:p-8 flex-1 w-full overflow-y-auto">
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
      <h1 className="text-3xl font-extrabold text-gray-900">{pageTitle}</h1>
      <div className="flex space-x-4">
        {exportButtonText && onExportButtonClick && (
          <button
            onClick={onExportButtonClick}
            className="bg-gray-200 text-gray-700 rounded-full px-5 py-2 flex items-center shadow-lg hover:bg-gray-300 transition-colors font-medium transform hover:scale-105"
          >
            <Download className="h-5 w-5 mr-2" />
            <span>{exportButtonText}</span>
          </button>
        )}
        {importButtonText && onImportButtonClick && (
          <button
            onClick={onImportButtonClick}
            className="bg-gray-200 text-gray-700 rounded-full px-5 py-2 flex items-center shadow-lg hover:bg-gray-300 transition-colors font-medium transform hover:scale-105"
          >
            <Upload className="h-5 w-5 mr-2" />
            <span>{importButtonText}</span>
          </button>
        )}
        {actionButtonText && onActionButtonClick && (
          <button
            onClick={onActionButtonClick}
            className="bg-blue-600 text-white rounded-full px-5 py-2 flex items-center shadow-lg hover:bg-blue-700 transition-colors font-medium transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>{actionButtonText}</span>
          </button>
        )}
      </div>
    </div>
    {children}
  </div>
);

// Card Component
interface CardProps {
  title: string;
  icon: React.ElementType;
  value: string | number;
  description: string;
}

const Card: React.FC<CardProps> = ({ title, icon: Icon, value, description }) => (
  <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center justify-between transition-transform transform hover:scale-105">
    <div className="flex items-center">
      <div className="bg-blue-100 p-3 rounded-full text-blue-600 mr-4">
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </div>
    <div className="text-4xl font-extrabold text-blue-600">{value}</div>
  </div>
);

// Table Component
interface TableProps<T> {
  data: T[];
  columns: { key: keyof T; header: string; render?: (item: T) => React.ReactNode }[];
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
}

const Table = <T extends { id: number; }>({ data, columns, onEdit, onDelete }: TableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'ascending' | 'descending' } | null>(null);

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof T) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-xl">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                onClick={() => requestSort(column.key)}
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none"
              >
                <div className="flex items-center">
                  {column.header}
                  {getSortIcon(column.key)}
                </div>
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-800"
                >
                  {column.render ? column.render(item) : String(item[column.key])}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


// =========================================================
// Page Components
// =========================================================

const DashboardPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (supabase) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [employeesResponse, customersResponse, tasksResponse] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('tasks').select('*')
      ]);

      if (employeesResponse.data) setEmployees(employeesResponse.data);
      if (customersResponse.data) setCustomers(customersResponse.data);
      if (tasksResponse.data) setTasks(tasksResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0;

  return (
    <PageContainer pageTitle="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Total Employees"
          icon={Users}
          value={employees.length}
          description="Total number of team members"
        />
        <Card
          title="Total Customers"
          icon={BriefcaseMedical}
          value={customers.length}
          description="Total number of clients"
        />
        <Card
          title="Total Tasks"
          icon={FileText}
          value={tasks.length}
          description="All tasks in the system"
        />
        <Card
          title="Completion Rate"
          icon={FilePieChart}
          value={`${completionRate}%`}
          description="Percentage of tasks completed"
        />
      </div>
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Task Overview</h2>
        <div className="flex justify-around items-center">
          <div className="text-center">
            <p className="text-5xl font-extrabold text-green-500">{completedTasks}</p>
            <p className="text-lg text-gray-600">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-extrabold text-yellow-500">{inProgressTasks}</p>
            <p className="text-lg text-gray-600">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-extrabold text-blue-500">{totalTasks - completedTasks - inProgressTasks}</p>
            <p className="text-lg text-gray-600">To Do</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState<Omit<Employee, 'id'>>({
    full_name: '',
    email: '',
    position: '',
    department: '',
  });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (supabase) {
      fetchEmployees();
    }
  }, []);

  const fetchEmployees = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('employees').select('*');
    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.from('employees').insert([formState]);
    if (error) {
      console.error('Error adding employee:', error);
    } else {
      setFormState({ full_name: '', email: '', position: '', department: '' });
      setShowModal(false);
      fetchEmployees();
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !editingEmployee) return;
    const { error } = await supabase.from('employees').update(formState).eq('id', editingEmployee.id);
    if (error) {
      console.error('Error updating employee:', error);
    } else {
      setFormState({ full_name: '', email: '', position: '', department: '' });
      setEditingEmployee(null);
      setShowModal(false);
      fetchEmployees();
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!supabase) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      console.error('Error deleting employee:', error);
    } else {
      fetchEmployees();
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormState(employee);
    setShowModal(true);
  };

  const columns = [
    { key: 'full_name', header: 'Full Name' },
    { key: 'email', header: 'Email' },
    { key: 'position', header: 'Position' },
    { key: 'department', header: 'Department' },
  ];

  return (
    <PageContainer
      pageTitle="Employees"
      actionButtonText="Add Employee"
      onActionButtonClick={() => {
        setEditingEmployee(null);
        setFormState({ full_name: '', email: '', position: '', department: '' });
        setShowModal(true);
      }}
    >
      <Table data={employees} columns={columns} onEdit={handleEdit} onDelete={handleDeleteEmployee} />
      {showModal && (
        <Modal title={editingEmployee ? "Edit Employee" : "Add Employee"} onClose={() => setShowModal(false)}>
          <form onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee}>
            <FormInput
              label="Full Name"
              id="full_name"
              name="full_name"
              value={formState.full_name}
              onChange={(e) => setFormState({ ...formState, full_name: e.target.value })}
              required
            />
            <FormInput
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              required
            />
            <FormInput
              label="Position"
              id="position"
              name="position"
              value={formState.position}
              onChange={(e) => setFormState({ ...formState, position: e.target.value })}
              required
            />
            <FormInput
              label="Department"
              id="department"
              name="department"
              value={formState.department}
              onChange={(e) => setFormState({ ...formState, department: e.target.value })}
              required
            />
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="mr-3 px-6 py-2 rounded-full text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-blue-700 transition-colors"
              >
                {editingEmployee ? 'Save Changes' : 'Add Employee'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formState, setFormState] = useState<Omit<Customer, 'id'>>({
    company_name: '',
    contact_person: '',
    email: '',
    phone_number: '',
  });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (supabase) {
      fetchCustomers();
    }
  }, []);

  const fetchCustomers = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('customers').select('*');
    if (error) {
      console.error('Error fetching customers:', error);
    } else {
      setCustomers(data);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.from('customers').insert([formState]);
    if (error) {
      console.error('Error adding customer:', error);
    } else {
      setFormState({ company_name: '', contact_person: '', email: '', phone_number: '' });
      setShowModal(false);
      fetchCustomers();
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !editingCustomer) return;
    const { error } = await supabase.from('customers').update(formState).eq('id', editingCustomer.id);
    if (error) {
      console.error('Error updating customer:', error);
    } else {
      setFormState({ company_name: '', contact_person: '', email: '', phone_number: '' });
      setEditingCustomer(null);
      setShowModal(false);
      fetchCustomers();
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!supabase) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting customer:', error);
    } else {
      fetchCustomers();
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormState(customer);
    setShowModal(true);
  };

  const handleImportCustomers = async (data: any[]) => {
    if (!supabase) return;
    // Map data to match Supabase schema, handling potential case differences
    const customersToInsert = data.map(item => ({
      company_name: item['company_name'] || item['Company Name'],
      contact_person: item['contact_person'] || item['Contact Person'],
      email: item['email'] || item['Email'],
      phone_number: item['phone_number'] || item['Phone Number'],
    }));
    const { error } = await supabase.from('customers').insert(customersToInsert);
    if (error) {
      console.error('Error importing customers:', error);
    } else {
      fetchCustomers();
    }
  };

  const handleExportCustomers = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    // Define columns
    worksheet.columns = [
      { header: 'company_name', key: 'company_name', width: 30 },
      { header: 'contact_person', key: 'contact_person', width: 30 },
      { header: 'email', key: 'email', width: 40 },
      { header: 'phone_number', key: 'phone_number', width: 20 },
    ];

    // Add rows
    worksheet.addRows(customers);

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'customers.xlsx');
  };

  const columns = [
    { key: 'company_name', header: 'Company Name' },
    { key: 'contact_person', header: 'Contact Person' },
    { key: 'email', header: 'Email' },
    { key: 'phone_number', header: 'Phone Number' },
  ];

  return (
    <PageContainer
      pageTitle="Customers"
      actionButtonText="Add Customer"
      onActionButtonClick={() => {
        setEditingCustomer(null);
        setFormState({ company_name: '', contact_person: '', email: '', phone_number: '' });
        setShowModal(true);
      }}
      importButtonText="Import Customers"
      onImportButtonClick={() => setShowImportModal(true)}
      exportButtonText="Export Customers"
      onExportButtonClick={handleExportCustomers}
    >
      <Table data={customers} columns={columns} onEdit={handleEdit} onDelete={handleDeleteCustomer} />
      {showModal && (
        <Modal title={editingCustomer ? "Edit Customer" : "Add Customer"} onClose={() => setShowModal(false)}>
          <form onSubmit={editingCustomer ? handleUpdateCustomer : handleAddCustomer}>
            <FormInput
              label="Company Name"
              id="company_name"
              name="company_name"
              value={formState.company_name}
              onChange={(e) => setFormState({ ...formState, company_name: e.target.value })}
              required
            />
            <FormInput
              label="Contact Person"
              id="contact_person"
              name="contact_person"
              value={formState.contact_person}
              onChange={(e) => setFormState({ ...formState, contact_person: e.target.value })}
              required
            />
            <FormInput
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              required
            />
            <FormInput
              label="Phone Number"
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formState.phone_number || ''}
              onChange={(e) => setFormState({ ...formState, phone_number: e.target.value })}
            />
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="mr-3 px-6 py-2 rounded-full text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-blue-700 transition-colors"
              >
                {editingCustomer ? 'Save Changes' : 'Add Customer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showImportModal && (
        <ImportModal
          title="Import Customers from Excel"
          onClose={() => setShowImportModal(false)}
          onImport={handleImportCustomers}
          fields={['company_name', 'contact_person', 'email', 'phone_number']}
        />
      )}
    </PageContainer>
  );
};

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formState, setFormState] = useState<Omit<Task, 'id'>>({
    title: '',
    status: 'To Do',
    description: '',
    due_date: '',
    priority: 'Medium',
    assign_to_employee: null,
    assign_to_customer: null,
    billing_amount: 0,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (supabase) {
      fetchTasks();
      fetchEmployees();
      fetchCustomers();
    }
  }, []);

  const fetchTasks = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data);
    }
  };

  const fetchEmployees = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('employees').select('id, full_name, email');
    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data);
    }
  };

  const fetchCustomers = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('customers').select('id, company_name');
    if (error) {
      console.error('Error fetching customers:', error);
    } else {
      setCustomers(data);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.from('tasks').insert([formState]);
    if (error) {
      console.error('Error adding task:', error);
    } else {
      setFormState({
        title: '',
        status: 'To Do',
        description: '',
        due_date: '',
        priority: 'Medium',
        assign_to_employee: null,
        assign_to_customer: null,
        billing_amount: 0,
      });
      setShowModal(false);
      fetchTasks();
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !editingTask) return;
    const { error } = await supabase.from('tasks').update(formState).eq('id', editingTask.id);
    if (error) {
      console.error('Error updating task:', error);
    } else {
      setFormState({
        title: '',
        status: 'To Do',
        description: '',
        due_date: '',
        priority: 'Medium',
        assign_to_employee: null,
        assign_to_customer: null,
        billing_amount: 0,
      });
      setEditingTask(null);
      setShowModal(false);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!supabase) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
    } else {
      fetchTasks();
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormState(task);
    setShowModal(true);
  };

  const handleImportTasks = async (data: any[]) => {
    if (!supabase) return;
    // Map data to match Supabase schema
    const tasksToInsert = data.map(item => ({
      title: item['title'] || item['Title'],
      status: item['status'] || item['Status'],
      description: item['description'] || item['Description'],
      due_date: item['due_date'] || item['Due Date'],
      priority: item['priority'] || item['Priority'],
      billing_amount: item['billing_amount'] || item['Billing Amount'],
      // Assuming 'Employee Email' and 'Customer Company Name' for import, needing lookup
      assign_to_employee: employees.find(e => e.email === (item['employee_email'] || item['Employee Email']))?.id || null,
      assign_to_customer: customers.find(c => c.company_name === (item['customer_company_name'] || item['Customer Company Name']))?.id || null,
    }));
    const { error } = await supabase.from('tasks').insert(tasksToInsert);
    if (error) {
      console.error('Error importing tasks:', error);
    } else {
      fetchTasks();
    }
  };

  const handleExportTasks = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');

    // Define columns
    worksheet.columns = [
      { header: 'title', key: 'title', width: 30 },
      { header: 'status', key: 'status', width: 15 },
      { header: 'description', key: 'description', width: 50 },
      { header: 'due_date', key: 'due_date', width: 15 },
      { header: 'priority', key: 'priority', width: 15 },
      { header: 'billing_amount', key: 'billing_amount', width: 20 },
      { header: 'assign_to_employee', key: 'assign_to_employee', width: 30 },
      { header: 'assign_to_customer', key: 'assign_to_customer', width: 30 },
    ];

    // Map data to include names instead of IDs for clarity in the export
    const tasksWithNames = tasks.map(task => ({
      ...task,
      assign_to_employee: getEmployeeName(task.assign_to_employee),
      assign_to_customer: getCustomerName(task.assign_to_customer),
    }));

    // Add rows
    worksheet.addRows(tasksWithNames);

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'tasks.xlsx');
  };

  const getEmployeeName = (employeeId: number | null) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.full_name : 'Unassigned';
  };

  const getCustomerName = (customerId: number | null) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.company_name : 'Unassigned';
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status' },
    { key: 'priority', header: 'Priority' },
    { key: 'due_date', header: 'Due Date' },
    {
      key: 'billing_amount',
      header: 'Billing Amount',
      render: (item: Task) => (item.billing_amount ? `${item.billing_amount}` : 'N/A')
    },
    {
      key: 'assign_to_employee',
      header: 'Assigned To (Employee)',
      render: (item: Task) => getEmployeeName(item.assign_to_employee)
    },
    {
      key: 'assign_to_customer',
      header: 'Assigned To (Customer)',
      render: (item: Task) => getCustomerName(item.assign_to_customer)
    }
  ];

  return (
    <PageContainer
      pageTitle="Tasks"
      actionButtonText="Add Task"
      onActionButtonClick={() => {
        setEditingTask(null);
        setFormState({
          title: '',
          status: 'To Do',
          description: '',
          due_date: '',
          priority: 'Medium',
          assign_to_employee: null,
          assign_to_customer: null,
          billing_amount: 0,
        });
        setShowModal(true);
      }}
      importButtonText="Import Tasks"
      onImportButtonClick={() => setShowImportModal(true)}
      exportButtonText="Export Tasks"
      onExportButtonClick={handleExportTasks}
    >
      <Table data={tasks} columns={columns} onEdit={handleEdit} onDelete={handleDeleteTask} />
      {showModal && (
        <Modal title={editingTask ? "Edit Task" : "Add Task"} onClose={() => setShowModal(false)}>
          <form onSubmit={editingTask ? handleUpdateTask : handleAddTask}>
            <FormInput
              label="Title"
              id="title"
              name="title"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              required
            />
            <FormSelect
              label="Status"
              id="status"
              name="status"
              value={formState.status}
              onChange={(e) => setFormState({ ...formState, status: e.target.value as 'To Do' | 'In Progress' | 'Completed' })}
              options={[
                { value: 'To Do', label: 'To Do' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
              ]}
              required
            />
            <FormSelect
              label="Priority"
              id="priority"
              name="priority"
              value={formState.priority}
              onChange={(e) => setFormState({ ...formState, priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Urgent' })}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Urgent', label: 'Urgent' },
              ]}
              required
            />
            <FormTextarea
              label="Description"
              id="description"
              name="description"
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              required
            />
            <FormInput
              label="Due Date"
              id="due_date"
              name="due_date"
              type="date"
              value={formState.due_date}
              onChange={(e) => setFormState({ ...formState, due_date: e.target.value })}
              required
            />
            <FormInput
              label="Billing Amount"
              id="billing_amount"
              name="billing_amount"
              type="number"
              value={formState.billing_amount || ''}
              onChange={(e) => setFormState({ ...formState, billing_amount: parseFloat(e.target.value) || 0 })}
            />
            <FormSelect
              label="Assign to Employee"
              id="assign_to_employee"
              name="assign_to_employee"
              value={formState.assign_to_employee}
              onChange={(e) => setFormState({ ...formState, assign_to_employee: parseInt(e.target.value) })}
              options={[{ value: 0, label: 'Unassigned' }, ...employees.map(e => ({ value: e.id, label: e.full_name }))]}
            />
            <FormSelect
              label="Assign to Customer"
              id="assign_to_customer"
              name="assign_to_customer"
              value={formState.assign_to_customer}
              onChange={(e) => setFormState({ ...formState, assign_to_customer: parseInt(e.target.value) })}
              options={[{ value: 0, label: 'Unassigned' }, ...customers.map(c => ({ value: c.id, label: c.company_name }))]}
            />
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="mr-3 px-6 py-2 rounded-full text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-blue-700 transition-colors"
              >
                {editingTask ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showImportModal && (
        <ImportModal
          title="Import Tasks from Excel"
          onClose={() => setShowImportModal(false)}
          onImport={handleImportTasks}
          fields={['title', 'status', 'description', 'due_date', 'priority', 'billing_amount', 'employee_email', 'customer_company_name']}
        />
      )}
    </PageContainer>
  );
};


const ReportsPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (supabase) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    if (!supabase) return;
    const [employeesResponse, tasksResponse] = await Promise.all([
      supabase.from('employees').select('id, full_name'),
      supabase.from('tasks').select('*')
    ]);

    if (employeesResponse.data) setEmployees(employeesResponse.data);
    if (tasksResponse.data) setTasks(tasksResponse.data);
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [
    { value: 2023, label: '2023' },
    { value: 2024, label: '2024' },
    { value: 2025, label: '2025' },
  ];

  const handleGenerateReport = () => {
    if (!selectedEmployeeId || !selectedMonth || !selectedYear) {
      setReportData(null);
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployeeId);
    if (!employee) {
      setReportData(null);
      return;
    }

    const employeeTasks = tasks.filter(task => {
      const taskDueDate = new Date(task.due_date);
      return (
        task.assign_to_employee === selectedEmployeeId &&
        taskDueDate.getFullYear() === selectedYear &&
        (taskDueDate.getMonth() + 1) === selectedMonth
      );
    });

    const completedTasks = employeeTasks.filter(task => task.status === 'Completed').length;
    const totalTasks = employeeTasks.length;
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;
    const totalBillingAmount = employeeTasks.reduce((sum, task) => sum + (task.billing_amount || 0), 0);

    setReportData({
      employeeName: employee.full_name,
      totalTasks,
      completedTasks,
      inProgressTasks: employeeTasks.filter(task => task.status === 'In Progress').length,
      toDoTasks: employeeTasks.filter(task => task.status === 'To Do').length,
      completionRate,
      totalBillingAmount,
      tasks: employeeTasks,
      month: months.find(m => m.value === selectedMonth)?.label,
      year: selectedYear
    });
  };

  return (
    <PageContainer pageTitle="Reports">
      <div className="bg-white p-6 rounded-2xl shadow-xl mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate Employee Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormSelect
            label="Select Employee"
            id="employee-select-report"
            name="employee"
            value={selectedEmployeeId || ''}
            onChange={(e) => setSelectedEmployeeId(parseInt(e.target.value))}
            options={employees.map(e => ({ value: e.id, label: e.full_name }))}
            required
          />
          <FormSelect
            label="Select Month"
            id="month-select-report"
            name="month"
            value={selectedMonth || ''}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            options={months}
            required
          />
          <FormSelect
            label="Select Year"
            id="year-select-report"
            name="year"
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            options={years}
            required
          />
        </div>
        <button
          onClick={handleGenerateReport}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-blue-700 transition-colors transform hover:scale-105"
        >
          Generate Report
        </button>
      </div>

      {reportData && (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Report for {reportData.employeeName}</h2>
          <p className="text-gray-500 mb-4 text-lg">For the period: {reportData.month}, {reportData.year}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card
              title="Total Tasks"
              icon={List}
              value={reportData.totalTasks}
              description="Total tasks assigned"
            />
            <Card
              title="Completed"
              icon={FileText}
              value={reportData.completedTasks}
              description="Tasks successfully completed"
            />
            <Card
              title="Completion Rate"
              icon={FilePieChart}
              value={`${reportData.completionRate}%`}
              description="Percentage of tasks completed"
            />
            <Card
              title="Total Billed"
              icon={DollarSign}
              value={`${reportData.totalBillingAmount}`}
              description="Total amount from all tasks"
            />
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-4">Task Details</h3>
          {reportData.tasks.length > 0 ? (
            <Table
              data={reportData.tasks}
              columns={[
                { key: 'title', header: 'Title' },
                { key: 'status', header: 'Status' },
                { key: 'due_date', header: 'Due Date' },
                { key: 'priority', header: 'Priority' },
                { key: 'billing_amount', header: 'Billing Amount' }
              ]}
            />
          ) : (
            <p className="text-gray-500">No tasks assigned to this employee in the selected period.</p>
          )}

        </div>
      )}
    </PageContainer>
  );
};


const App = () => {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    if (supabase) {
      setIsSupabaseConfigured(true);
    }
  }, []);

  const renderPage = () => {
    if (!isSupabaseConfigured) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-100px)] p-4 text-center bg-white rounded-lg shadow-md">
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
      case 'Reports':
        return <ReportsPage />;
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
        <header className="bg-white p-4 flex items-center justify-between shadow-sm border-b border-gray-200">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-blue-600">TaskTracker</h1>
          <div className="w-6"></div>
        </header>
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;