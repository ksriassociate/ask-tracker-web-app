import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Modal } from "./Modal";
import {
  generateInvoicePDF,
  generateIGSTInvoicePDF,
  generateInvoicePDF_Alt,
  generateIGSTInvoicePDF_Alt,
} from "../utils/pdfGenerator";

// ✅ Currency formatter (Indian Rupees)
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchTasks();
  }, []);

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, invoice_date, total_amount, paid_amount, customer_id, customers(company_name), tasks(id, title, billing_amount, paid_amount, invoice_id)"
      )
      .order("created_at", { ascending: false });

    setInvoices(data || []);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("*");
    setCustomers(data || []);
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, billing_amount, paid_amount, assign_to_customer")
      .is("invoice_id", null);
    setTasks(data || []);
  };

  const handleSaveInvoice = async () => {
    if (!selectedTask && !editMode) {
      alert("Please select a task");
      return;
    }

    let invoiceData;
    if (editMode && currentInvoice) {
      invoiceData = {
        invoice_number: currentInvoice.invoice_number,
        invoice_date: currentInvoice.invoice_date,
      };

      const { error } = await supabase
        .from("invoices")
        .update(invoiceData)
        .eq("id", currentInvoice.id);

      if (error) console.error(error);
    } else {
      const task = tasks.find((t) => t.id === selectedTask);

      invoiceData = {
        customer_id: task.assign_to_customer,
        invoice_number: `INV-${Date.now()}`,
        invoice_date: new Date().toISOString().split("T")[0],
        total_amount: task.billing_amount,
        paid_amount: task.paid_amount || 0,
      };

      const { data, error } = await supabase
        .from("invoices")
        .insert([invoiceData])
        .select()
        .single();

      if (!error && data) {
        await supabase.from("tasks").update({ invoice_id: data.id }).eq("id", task.id);
      }
    }

    setShowModal(false);
    setEditMode(false);
    setSelectedTask(null);
    setCurrentInvoice(null);
    fetchInvoices();
    fetchTasks();
  };

  const handleEdit = (invoice: any) => {
    setEditMode(true);
    setCurrentInvoice(invoice);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (!error) {
      setInvoices(invoices.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Invoices</h1>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => {
          setEditMode(false);
          setShowModal(true);
        }}
      >
        Add Invoice
      </button>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Invoice #</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Customer</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Paid</th>
            <th className="border p-2">Balance</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const customer = customers.find((c) => c.id === inv.customer_id);
            const balance = inv.total_amount - inv.paid_amount;

            return (
              <tr key={inv.id}>
                <td className="border p-2">{inv.invoice_number}</td>
                <td className="border p-2">
                  {inv.invoice_date
                    ? new Date(inv.invoice_date).toLocaleDateString()
                    : "-"}
                </td>
                <td className="border p-2">{customer?.company_name || "-"}</td>
                <td className="border p-2">{formatCurrency(inv.total_amount)}</td>
                <td className="border p-2">{formatCurrency(inv.paid_amount)}</td>
                <td className="border p-2">{formatCurrency(balance)}</td>
                <td className="border p-2 space-x-2">
                  <button
                    className="text-blue-600"
                    onClick={() =>
                      generateInvoicePDF(inv, customer, inv.tasks || [])
                    }
                  >
                    PDF (K Sriram & Associates)
                  </button>
                  <button
                    className="text-purple-600"
                    onClick={() =>
                      generateIGSTInvoicePDF(inv, customer, inv.tasks || [])
                    }
                  >
                    PDF (K Sriram & Associates - IGST)
                  </button>
                  <button
                    className="text-orange-600"
                    onClick={() =>
                      generateInvoicePDF_Alt(inv, customer, inv.tasks || [])
                    }
                  >
                    PDF (TRUZLY INDIA)
                  </button>
                  <button
                    className="text-pink-600"
                    onClick={() =>
                      generateIGSTInvoicePDF_Alt(inv, customer, inv.tasks || [])
                    }
                  >
                    PDF (TRUZLY INDIA - IGST)
                  </button>
                  <button
                    className="text-green-600"
                    onClick={() => handleEdit(inv)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600"
                    onClick={() => handleDelete(inv.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2 className="text-lg font-bold mb-4">
            {editMode ? "Edit Invoice" : "Create Invoice"}
          </h2>

          {!editMode && (
            <select
              className="w-full border px-2 py-1 mb-3"
              value={selectedTask || ""}
              onChange={(e) => setSelectedTask(Number(e.target.value))}
            >
              <option value="">Select Task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} - ₹{t.billing_amount}
                </option>
              ))}
            </select>
          )}

          {editMode && (
            <>
              <input
                type="date"
                className="w-full border px-2 py-1 mb-2"
                value={currentInvoice?.invoice_date || ""}
                onChange={(e) =>
                  setCurrentInvoice({
                    ...currentInvoice,
                    invoice_date: e.target.value,
                  })
                }
              />
              <input
                className="w-full border px-2 py-1 mb-2"
                placeholder="Invoice Number"
                value={currentInvoice?.invoice_number || ""}
                onChange={(e) =>
                  setCurrentInvoice({
                    ...currentInvoice,
                    invoice_number: e.target.value,
                  })
                }
              />
            </>
          )}

          <div className="mt-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={handleSaveInvoice}
            >
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
