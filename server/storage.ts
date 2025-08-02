import { type Employee, type Customer, type Task, type InsertEmployee, type InsertCustomer, type InsertTask } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

  // Customer methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Task methods
  getTask(id: string): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getTasksByEmployee(employeeId: string): Promise<Task[]>;
  getTasksByCustomer(customerId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  // Statistics methods
  getTaskStats(): Promise<{
    totalEmployees: number;
    activeTasks: number;
    overdueTasks: number;
    completionRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private employees: Map<string, Employee>;
  private customers: Map<string, Customer>;
  private tasks: Map<string, Task>;

  constructor() {
    this.employees = new Map();
    this.customers = new Map();
    this.tasks = new Map();
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = {
      ...insertEmployee,
      id,
      createdAt: new Date(),
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, employeeData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const existing = this.employees.get(id);
    if (!existing) return undefined;
    
    const updated: Employee = { ...existing, ...employeeData };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    
    const updated: Customer = { ...existing, ...customerData };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Task methods
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByEmployee(employeeId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignedTo === employeeId);
  }

  async getTasksByCustomer(customerId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.customerId === customerId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      dueDate: new Date(insertTask.dueDate),
      createdAt: new Date(),
      completedAt: null,
    };
    
    // Auto-set status to overdue if due date has passed
    if (task.dueDate < new Date() && task.status !== 'completed') {
      task.status = 'overdue';
    }
    
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    
    const updated: Task = { ...existing, ...taskData };
    
    // Set completedAt when status changes to completed
    if (updated.status === 'completed' && existing.status !== 'completed') {
      updated.completedAt = new Date();
    }
    
    // Auto-set status to overdue if due date has passed and not completed
    if (updated.dueDate && updated.dueDate < new Date() && updated.status !== 'completed') {
      updated.status = 'overdue';
    }
    
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTaskStats(): Promise<{
    totalEmployees: number;
    activeTasks: number;
    overdueTasks: number;
    completionRate: number;
  }> {
    const allTasks = Array.from(this.tasks.values());
    const activeTasks = allTasks.filter(task => 
      task.status === 'pending' || task.status === 'in_progress'
    ).length;
    const overdueTasks = allTasks.filter(task => task.status === 'overdue').length;
    const completedTasks = allTasks.filter(task => task.status === 'completed').length;
    const completionRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

    return {
      totalEmployees: this.employees.size,
      activeTasks,
      overdueTasks,
      completionRate,
    };
  }
}

export const storage = new MemStorage();
