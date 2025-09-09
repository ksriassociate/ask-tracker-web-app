import { z } from "zod";

/* ---------------------- TASK ---------------------- */
export const insertTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  status: z.enum(["To Do", "In Progress", "Completed"]),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  due_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  assign_to_employee: z.number().int().positive("Employee is required"),
  assign_to_customer: z.number().int().optional(),
  description: z.string().optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Task = {
  id: number;
  title: string;
  status: "To Do" | "In Progress" | "Completed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  due_date: string;
  assign_to_employee: number | null;
  assign_to_customer: number | null;
  description?: string;
};

/* ---------------------- EMPLOYEE ---------------------- */
export const insertEmployeeSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  position: z.string().min(1, "Position is required"),
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Employee = {
  id: number;
  full_name: string;
  position: string;
};

/* ---------------------- CUSTOMER ---------------------- */
export const insertCustomerSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  state: z.string().min(1, "State is required"),
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Customer = {
  id: number;
  company_name: string;
  state: string;
};

/* ---------------------- INVOICE ---------------------- */
export const insertInvoiceSchema = z.object({
  customer_id: z.number().int().positive("Customer is required"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  invoice_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  due_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  status: z.enum(["Draft", "Sent", "Paid", "Overdue"]),
  total_amount: z.number().nonnegative(),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Invoice = {
  id: number;
  customer_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  total_amount: number;
};

/* ---------------------- PAYMENT ---------------------- */
export const insertPaymentSchema = z.object({
  invoice_id: z.number().int().positive("Invoice is required"),
  payment_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  amount: z.number().positive("Payment amount must be greater than 0"),
  method: z.enum(["Cash", "Bank Transfer", "UPI", "Card"]),
  reference: z.string().optional(),
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Payment = {
  id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  method: "Cash" | "Bank Transfer" | "UPI" | "Card";
  reference?: string;
};
