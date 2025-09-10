import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Modal } from "./Modal";
import { Plus, Upload, Download } from "lucide-react";

const exportToCSV = (rows: any[], filename: string) => {
  if (!rows || rows.length === 0) return;
  const csv =
    Object.keys(rows[0]).join(",") +
    "\n" +
    rows.map((r) => Object.values(r).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({
    id: null,
    company_name: "",
    contact_person: "",
    email: "",
    phone_number: "",
  });

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching customers:", error);
    else setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddClick = () => {
    setEditMode(false);
    setCurrentCustomer({
      id: null,
      company_name: "",
      contact_person: "",
      email: "",
      phone_number: "",
    });
    setModalOpen(true);
  };

  const handleEditClick = (customer: any) => {
    setEditMode(true);
    setCurrentCustomer(customer);
    setModalOpen(true);
  };

  const saveCustomer = async () => {
    if (editMode) {
      const { error } = await supabase
        .from("customers")
        .update({
          company_name: currentCustomer.company_name,
          contact_person: currentCustomer.contact_person,
          email: currentCustomer.email,
          phone_number: currentCustomer.phone_number,
        })
        .eq("id", currentCustomer.id);
      if (error) console.error("Error updating customer:", error);
    } else {
      const { error } = await supabase.from("customers").insert([
        {
          company_name: currentCustomer.company_name,
          contact_person: currentCustomer.contact_person,
          email: currentCustomer.email,
          phone_number: currentCustomer.phone_number,
        },
      ]);
      if (error) console.error("Error adding customer:", error);
    }
    setModalOpen(false);
    fetchCustomers();
  };

  const deleteCustomer = async (id: number) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) console.error("Error deleting customer:", error);
    else fetchCustomers();
  };

  const handleExport = () => {
    if (customers.length > 0) {
      exportToCSV(customers, "customers.csv");
    } else {
      alert("No customers to export");
    }
  };

  const handleImport = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const [headerLine, ...lines] = text.split("\n");
    const headers = headerLine.split(",").map((h) => h.trim());

    const records = lines
      .filter((l) => l.trim() !== "")
      .map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => (obj[h] = values[i] || ""));
        return obj;
      });

    if (records.length > 0) {
      const { error } = await supabase.from("customers").insert(records);
      if (error) console.error("Error importing customers:", error.message);
      else fetchCustomers();
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="bg-white shadow rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-700">Customers</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <label className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition">
            <Upload className="w-4 h-4" /> Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-2xl">
        {loading ? (
          <p className="p-4">Loading customers…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2">Company</th>
                  <th className="text-left px-4 py-2">Contact</th>
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-left px-4 py-2">Phone</th>
                  <th className="text-left px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-2">{cust.company_name}</td>
                    <td className="px-4 py-2">{cust.contact_person}</td>
                    <td className="px-4 py-2">{cust.email}</td>
                    <td className="px-4 py-2">{cust.phone_number}</td>
                    <td className="px-4 py-2">
                      <button
                        className="text-indigo-600 hover:underline mr-2"
                        onClick={() => handleEditClick(cust)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => deleteCustomer(cust.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={editMode ? "Edit Customer" : "Add Customer"}
          onClose={() => setModalOpen(false)}
          onSave={saveCustomer}
        >
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="Company Name"
            value={currentCustomer.company_name}
            onChange={(e) =>
              setCurrentCustomer({
                ...currentCustomer,
                company_name: e.target.value,
              })
            }
          />
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="Contact Person"
            value={currentCustomer.contact_person}
            onChange={(e) =>
              setCurrentCustomer({
                ...currentCustomer,
                contact_person: e.target.value,
              })
            }
          />
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="Email"
            value={currentCustomer.email}
            onChange={(e) =>
              setCurrentCustomer({ ...currentCustomer, email: e.target.value })
            }
          />
          <input
            className="border p-2 w-full rounded"
            placeholder="Phone Number"
            value={currentCustomer.phone_number}
            onChange={(e) =>
              setCurrentCustomer({
                ...currentCustomer,
                phone_number: e.target.value,
              })
            }
          />
        </Modal>
      )}
    </div>
  );
};
