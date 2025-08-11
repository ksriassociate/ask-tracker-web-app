import React, { useState, useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Home, Users, Briefcase, FileText, Menu, X, Plus, ChevronUp, ChevronDown, Trash2, Edit, FilePieChart, BriefcaseMedical, Landmark, DollarSign, List, Download, Upload } from 'lucide-react';
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
      onChange={(e) => onChange(e)}
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
      console.error("Please select a file to import.");
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      const workbook = new ExcelJS.Workbook();
      // Explicitly cast data to ArrayBuffer for exceljs.load
      await workbook.xlsx.load(data as ArrayBuffer);
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
    if (!supabase) return;
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
        <Card title="Total Employees" icon={Users} value={employees.length} description="Total number of team members" />
        <Card title="Total Customers" icon={BriefcaseMedical} value={customers.length} description="Total number of clients" />
        <Card title="Total Tasks" icon={FileText} value={tasks.length} description="All tasks in the system" />
        <Card title="Completion Rate" icon={FilePieChart} value={`${completionRate}%`} description="Percentage of tasks completed" />
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
  const [formState, setFormState] = useState<Omit<Employee, 'id'>>({ full_name: '', email: '', position: '', department: '', });
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

  const columns: { key: keyof Employee; header: string }[] = [
    { key: 'full_name', header: 'Full Name' },
    { key: 'email', header: 'Email' },
    { key: 'position', header: 'Position' },
    { key: 'department', header: 'Department' },
  ];

  const handleImport = async (data: any[]) => {
    if (!supabase) return;
    // Removed defaultToNull and ignoreDuplicates as they are not valid options for insert
    const { error } = await supabase.from('employees').insert(data);
    if (error) {
      console.error('Error importing employees:', error);
    } else {
      fetchEmployees();
    }
  };

  const exportEmployees = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employees');
    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: String(col.key),
      width: 20
    }));
    worksheet.addRows(employees);
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'employees.xlsx');
    });
  };

  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <PageContainer
      pageTitle="Employees"
      actionButtonText="Add Employee"
      onActionButtonClick={() => {
        setEditingEmployee(null);
        setFormState({ full_name: '', email: '', position: '', department: '' });
        setShowModal(true);
      }}
      importButtonText="Import Employees"
      onImportButtonClick={() => setShowImportModal(true)}
      exportButtonText="Export Employees"
      onExportButtonClick={exportEmployees}
    >
      <Table<Employee>
        data={employees}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDeleteEmployee}
      />
      {showModal && (
        <Modal title={editingEmployee ? 'Edit Employee' : 'Add Employee'} onClose={() => setShowModal(false)}>
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
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showImportModal && (
        <ImportModal
          title="Import Employees"
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          fields={columns.map(c => String(c.key))}
        />
      )}
    </PageContainer>
  );
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
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

  const columns: { key: keyof Customer; header: string }[] = [
    { key: 'company_name', header: 'Company Name' },
    { key: 'contact_person', header: 'Contact Person' },
    { key: 'email', header: 'Email' },
    { key: 'phone_number', header: 'Phone Number' },
  ];

  const handleImport = async (data: any[]) => {
    if (!supabase) return;
    // Removed defaultToNull and ignoreDuplicates as they are not valid options for insert
    const { error } = await supabase.from('customers').insert(data);
    if (error) {
      console.error('Error importing customers:', error);
    } else {
      fetchCustomers();
    }
  };

  const exportCustomers = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');
    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: String(col.key),
      width: 20
    }));
    worksheet.addRows(customers);
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'customers.xlsx');
    });
  };

  const [showImportModal, setShowImportModal] = useState(false);

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
      onExportButtonClick={exportCustomers}
    >
      <Table<Customer>
        data={customers}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDeleteCustomer}
      />
      {showModal && (
        <Modal title={editingCustomer ? 'Edit Customer' : 'Add Customer'} onClose={() => setShowModal(false)}>
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
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showImportModal && (
        <ImportModal
          title="Import Customers"
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          fields={columns.map(c => String(c.key))}
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
  const [formState, setFormState] = useState<Omit<Task, 'id'>>({
    title: '',
    status: 'To Do',
    description: '',
    due_date: '',
    priority: 'Low',
    assign_to_employee: null,
    assign_to_customer: null,
    billing_amount: undefined,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);

  const GOOGLE_APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzsg3mufJzG2P3PLbO3ZRU6bKkPjyLp6lKIv_Ggd9tVH5l96v-SfrhEq3wwA0ZFPxh4/exec';

  useEffect(() => {
    if (supabase) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const [tasksResponse, employeesResponse, customersResponse] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('customers').select('*')
      ]);

      if (tasksResponse.data) setTasks(tasksResponse.data);
      if (employeesResponse.data) setEmployees(employeesResponse.data);
      if (customersResponse.data) setCustomers(customersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Function to send completion email via Google Apps Script Web App
  const sendCompletionEmail = async (task: Task, customer: Customer) => {
    console.log(`Attempting to send email for task ID: ${task.id} to customer: ${customer.email} using Google Sheets.`);

    // Removed the placeholder check as the URL should now be correctly set
    // if (GOOGLE_APPS_SCRIPT_WEB_APP_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL' || !GOOGLE_APPS_SCRIPT_WEB_APP_URL) {
    //   setEmailStatusMessage('Error: Google Apps Script Web App URL is not configured.');
    //   console.error('Google Apps Script Web App URL is not configured. Please update App.tsx with your deployed URL.');
    //   setTimeout(() => setEmailStatusMessage(null), 5000);
    //   return;
    // }

    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: customer.email,
          natureOfWork: task.title, // You might want to send more task details here
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger email from Google Sheet.');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setEmailStatusMessage(`Email trigger sent to Google Sheet for ${customer.email}`);
        console.log('Email successfully triggered via Google Sheet.');
      } else {
        throw new Error(result.message || 'Failed to trigger email from Google Sheet.');
      }

    } catch (error) {
      console.error('Error sending email via Google Sheet:', error);
      setEmailStatusMessage('Failed to trigger email via Google Sheet.');
    } finally {
      // Clear the message after a few seconds
      setTimeout(() => setEmailStatusMessage(null), 5000);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    // Removed defaultToNull and ignoreDuplicates as they are not valid options for insert
    const { error } = await supabase.from('tasks').insert([{ ...formState, billing_amount: formState.billing_amount || null }]);
    if (error) {
      console.error('Error adding task:', error);
    } else {
      setFormState({
        title: '', status: 'To Do', description: '', due_date: '', priority: 'Low', assign_to_employee: null, assign_to_customer: null, billing_amount: undefined,
      });
      setShowModal(false);
      fetchData();
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !editingTask) return;

    const oldStatus = editingTask.status;

    const { error } = await supabase.from('tasks').update({ ...formState, billing_amount: formState.billing_amount || null }).eq('id', editingTask.id);
    if (error) {
      console.error('Error updating task:', error);
    } else {
      // Check if the status was changed to 'Completed' and if a customer is assigned
      if (formState.status === 'Completed' && oldStatus !== 'Completed' && formState.assign_to_customer) {
        // Find the customer and send the email
        const customer = customers.find(c => c.id === formState.assign_to_customer);
        if (customer) {
          await sendCompletionEmail(editingTask, customer);
        } else {
          console.error(`Customer with ID ${formState.assign_to_customer} not found.`);
          setEmailStatusMessage('Could not find customer to send email.');
          setTimeout(() => setEmailStatusMessage(null), 5000);
        }
      }

      setFormState({
        title: '', status: 'To Do', description: '', due_date: '', priority: 'Low', assign_to_employee: null, assign_to_customer: null, billing_amount: undefined,
      });
      setEditingTask(null);
      setShowModal(false);
      fetchData();
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!supabase) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
    } else {
      fetchData();
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormState({
      title: task.title,
      status: task.status,
      description: task.description,
      due_date: task.due_date,
      priority: task.priority,
      assign_to_employee: task.assign_to_employee,
      assign_to_customer: task.assign_to_customer,
      billing_amount: task.billing_amount,
    });
    setShowModal(true);
  };

  const columns: { key: keyof Task; header: string; render?: (item: Task) => React.ReactNode }[] = [
    { key: 'title', header: 'Title' },
    {
      key: 'status',
      header: 'Status',
      render: (task: Task) => {
        let colorClass = '';
        switch (task.status) {
          case 'To Do':
            colorClass = 'bg-gray-200 text-gray-800';
            break;
          case 'In Progress':
            colorClass = 'bg-yellow-200 text-yellow-800';
            break;
          case 'Completed':
            colorClass = 'bg-green-200 text-green-800';
            break;
        }
        return (
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {task.status}
          </span>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (task: Task) => {
        let colorClass = '';
        switch (task.priority) {
          case 'Low':
            colorClass = 'bg-gray-100 text-gray-700';
            break;
          case 'Medium':
            colorClass = 'bg-blue-100 text-blue-700';
            break;
          case 'High':
            colorClass = 'bg-orange-100 text-orange-700';
            break;
          case 'Urgent':
            colorClass = 'bg-red-100 text-red-700';
            break;
        }
        return (
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {task.priority}
          </span>
        );
      },
    },
    { key: 'due_date', header: 'Due Date' },
    {
      key: 'assign_to_employee',
      header: 'Assigned To',
      render: (task: Task) => {
        const employee = employees.find(e => e.id === task.assign_to_employee);
        return employee ? employee.full_name : 'N/A';
      },
    },
    {
      key: 'assign_to_customer',
      header: 'Customer',
      render: (task: Task) => {
        const customer = customers.find(c => c.id === task.assign_to_customer);
        return customer ? customer.company_name : 'N/A';
      },
    },
  ];

  const handleImport = async (data: any[]) => {
    if (!supabase) return;
    // Removed defaultToNull and ignoreDuplicates as they are not valid options for insert
    const { error } = await supabase.from('tasks').insert(data);
    if (error) {
      console.error('Error importing tasks:', error);
    } else {
      fetchData();
    }
  };

  const exportTasks = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');
    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: String(col.key), // Ensure this matches actual column keys for export
      width: 20
    }));
    worksheet.addRows(tasks.map(task => ({
      ...task,
      assign_to_employee: employees.find(e => e.id === task.assign_to_employee)?.full_name || 'N/A',
      assign_to_customer: customers.find(c => c.id === task.assign_to_customer)?.company_name || 'N/A'
    })));
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'tasks.xlsx');
    });
  };

  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <PageContainer
      pageTitle="Tasks"
      actionButtonText="Add Task"
      onActionButtonClick={() => {
        setEditingTask(null);
        setFormState({
          title: '', status: 'To Do', description: '', due_date: '', priority: 'Low', assign_to_employee: null, assign_to_customer: null, billing_amount: undefined,
        });
        setShowModal(true);
      }}
      importButtonText="Import Tasks"
      onImportButtonClick={() => setShowImportModal(true)}
      exportButtonText="Export Tasks"
      onExportButtonClick={exportTasks}
    >
      {emailStatusMessage && (
        <div className={`p-4 mb-4 text-sm rounded-lg ${emailStatusMessage.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {emailStatusMessage}
        </div>
      )}
      <Table<Task>
        data={tasks}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDeleteTask}
      />
      {showModal && (
        <Modal title={editingTask ? 'Edit Task' : 'Add Task'} onClose={() => setShowModal(false)}>
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
              onChange={(e) => setFormState({ ...formState, status: e.target.value as Task['status'] })}
              options={[
                { value: 'To Do', label: 'To Do' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
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
            <FormSelect
              label="Priority"
              id="priority"
              name="priority"
              value={formState.priority}
              onChange={(e) => setFormState({ ...formState, priority: e.target.value as Task['priority'] })}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Urgent', label: 'Urgent' },
              ]}
              required
            />
            <FormSelect
              label="Assign to Employee"
              id="assign_to_employee"
              name="assign_to_employee"
              value={formState.assign_to_employee}
              onChange={(e) => setFormState({ ...formState, assign_to_employee: e.target.value ? Number(e.target.value) : null })}
              options={employees.map(e => ({ value: e.id, label: e.full_name }))}
            />
            <FormSelect
              label="Assign to Customer"
              id="assign_to_customer"
              name="assign_to_customer"
              value={formState.assign_to_customer}
              onChange={(e) => setFormState({ ...formState, assign_to_customer: e.target.value ? Number(e.target.value) : null })}
              options={customers.map(c => ({ value: c.id, label: c.company_name }))}
            />
            <FormInput
              label="Billing Amount"
              id="billing_amount"
              name="billing_amount"
              type="number"
              value={formState.billing_amount || ''}
              onChange={(e) => setFormState({ ...formState, billing_amount: e.target.value ? Number(e.target.value) : undefined })}
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
                {editingTask ? 'Update Task' : 'Add Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showImportModal && (
        <ImportModal
          title="Import Tasks"
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          fields={columns.map(c => String(c.key))}
        />
      )}
    </PageContainer>
  );
};


const ReportsPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (supabase) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const [tasksResponse, customersResponse] = await Promise.all([ // Removed employeesResponse
        supabase.from('tasks').select('*'),
        // Removed supabase.from('employees').select('*') as it's not used in this component's data
        supabase.from('customers').select('*')
      ]);

      if (tasksResponse.data) setTasks(tasksResponse.data);
      if (customersResponse.data) setCustomers(customersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const tasksByCustomer = customers.map(customer => ({
    ...customer,
    tasks: tasks.filter(task => task.assign_to_customer === customer.id),
  }));

  const totalBilling = tasks.reduce((sum, task) => sum + (task.billing_amount || 0), 0);

  const exportReports = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Task Reports');
    worksheet.columns = [
      { header: 'Customer', key: 'customer', width: 30 },
      { header: 'Total Tasks', key: 'total_tasks', width: 15 },
      { header: 'Completed Tasks', key: 'completed_tasks', width: 20 },
      { header: 'Total Billed Amount', key: 'billed_amount', width: 25 },
    ];
    worksheet.addRows(tasksByCustomer.map(c => ({
      customer: c.company_name,
      total_tasks: c.tasks.length,
      completed_tasks: c.tasks.filter(t => t.status === 'Completed').length,
      billed_amount: c.tasks.reduce((sum, t) => sum + (t.billing_amount || 0), 0),
    })));
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'task_reports.xlsx');
    });
  };

  return (
    <PageContainer pageTitle="Reports" exportButtonText="Export Reports" onExportButtonClick={exportReports}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Overall Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            title="Total Revenue"
            icon={DollarSign}
            value={`$${totalBilling.toFixed(2)}`}
            description="Total billing amount from all completed tasks"
          />
          <Card
            title="Total Tasks"
            icon={List}
            value={tasks.length}
            description="All tasks in the system"
          />
          <Card
            title="Customers with Tasks"
            icon={Landmark}
            value={customers.filter(c => tasks.some(t => t.assign_to_customer === c.id)).length}
            description="Customers with at least one task"
          />
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer-wise Task Report</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Total Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Completed Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Total Billed Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasksByCustomer.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {customer.company_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {customer.tasks.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {customer.tasks.filter(t => t.status === 'Completed').length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    ${customer.tasks.reduce((sum, t) => sum + (t.billing_amount || 0), 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
};


const App = () => {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if Supabase client is configured
  if (!supabase) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="p-8 border bg-white rounded-lg shadow-md">
          <p className="text-red-600 font-medium text-lg">
            Supabase is not configured. Please check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
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
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
