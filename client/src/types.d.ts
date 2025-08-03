// src/types.d.ts

// Define the types for your data models
export interface Employee {
    id: number;
    full_name: string;
    email: string;
    position: string;
    department: string;
}

export interface Customer {
    id: number;
    company_name: string;
    contact_person: string;
    email: string;
    phone_number?: string;
}

export interface Task {
    id: number;
    title: string;
    status: 'To Do' | 'In Progress' | 'Completed';
    description: string;
    due_date: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    assigned_to_employee_id?: number;
    assigned_to_customer_id?: number;
    employees?: Employee; // Supabase joins
    customers?: Customer; // Supabase joins
}

// Define types for component props
export interface NavLinkProps {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export interface SidebarProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

export interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export interface FormInputProps {
    label: string;
    id: string;
    name: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    placeholder?: string;
    required?: boolean;
}

export interface FormSelectProps {
    label: string;
    id: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string | number; label: string }[];
    required?: boolean;
}

export interface StatusBadgeProps {
    status: 'To Do' | 'In Progress' | 'Completed';
}

export interface PriorityBadgeProps {
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}