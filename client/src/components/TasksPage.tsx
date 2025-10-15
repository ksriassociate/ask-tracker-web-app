import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Modal } from "./Modal";
import { Plus, Upload, Download } from "lucide-react";

// --- START: CORRECTED CSV LOGIC (No change from previous step, but included for completeness) ---

const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Check if the value contains a comma, double quote, or newline
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    // Escape internal double quotes by doubling them
    const escapedS = s.replace(/"/g, '""');
    // Wrap the entire field in double quotes
    return `"${escapedS}"`;
  }
  return s;
};

const exportToCSV = (rows: any[], filename: string) => {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  
  // 1. Create the header line
  const headerLine = headers.map(escapeCsvValue).join(",");

  // 2. Create the data lines
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(",")
  );

  const csv = [headerLine, ...dataLines].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// --- END: CORRECTED CSV LOGIC ---

export const TasksPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState({
    id: null,
    title: "",
    description: "",
    due_date: "",
    priority: "",
    status: "",
    assign_to_employee: null,
    assign_to_customer: null,
    billing_amount: "",
    paid_amount: "0",
  });

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setErrorMessage("Failed to fetch tasks.");
    else setTasks(data || []);
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, company_name");
    if (error) setErrorMessage("Failed to fetch customers.");
    else setCustomers(data || []);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name");
    if (error) setErrorMessage("Failed to fetch employees.");
    else setEmployees(data || []);
  };

  useEffect(() => {
    fetchTasks();
    fetchCustomers();
    fetchEmployees();
  }, []);

  const handleAddClick = () => {
    setEditMode(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setCurrentTask({
      id: null,
      title: "",
      description: "",
      due_date: "",
      priority: "",
      status: "",
      assign_to_employee: null,
      assign_to_customer: null,
      billing_amount: "",
      paid_amount: "0",
    });
    setModalOpen(true);
  };

  const handleEditClick = (task: any) => {
    setEditMode(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setCurrentTask(task);
    setModalOpen(true);
  };

  const validateTask = (task: any) => {
    if (!task.title) return "Title is required.";
    if (!task.status) return "Status is required.";
    if (!task.priority) return "Priority is required.";
    if (task.billing_amount && isNaN(parseFloat(task.billing_amount)))
      return "Billing amount must be a number.";
    if (task.paid_amount && isNaN(parseFloat(task.paid_amount)))
      return "Paid amount must be a number.";
    return null;
  };

  const saveTask = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateTask(currentTask);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const taskData: any = {
      title: currentTask.title,
      description: currentTask.description,
      due_date: currentTask.due_date || null,
      priority: currentTask.priority || null,
      status: currentTask.status || null,
      assign_to_customer: currentTask.assign_to_customer
        ? parseInt(currentTask.assign_to_customer, 10)
        : null,
      assign_to_employee: currentTask.assign_to_employee
        ? parseInt(currentTask.assign_to_employee, 10)
        : null,
      billing_amount: currentTask.billing_amount
        ? parseFloat(currentTask.billing_amount)
        : null,
      paid_amount: currentTask.paid_amount
        ? parseFloat(currentTask.paid_amount)
        : 0,
    };

    let error;
    if (editMode) {
      ({ error } = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", currentTask.id));
    } else {
      ({ error } = await supabase.from("tasks").insert([taskData]));
    }

    if (error) {
      setErrorMessage(error.message || "Something went wrong while saving.");
      return;
    }

    setSuccessMessage(
      editMode ? "Task updated successfully!" : "Task added successfully!"
    );
    setModalOpen(false);
    fetchTasks();
  };

  const deleteTask = async (id: number) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) setErrorMessage("Failed to delete task.");
    else setSuccessMessage("Task deleted successfully!");
    fetchTasks();
  };

  const handleExport = () => {
    if (tasks.length > 0) {
      exportToCSV(tasks, "tasks.csv");
      setSuccessMessage("Tasks exported successfully!");
    } else {
      alert("No tasks to export");
    }
  };

  const handleImport = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const text = await file.text();
    const [headerLine, ...lines] = text.split("\n");
    const headers = headerLine.split(",").map((h) => h.trim());

    // Helper functions to map name to ID
    const getEmployeeIdByName = (name: string) => {
        const emp = employees.find(e => e.full_name?.trim().toLowerCase() === name?.trim().toLowerCase());
        return emp ? emp.id : null;
    };

    const getCustomerIdByName = (name: string) => {
        const cust = customers.find(c => c.company_name?.trim().toLowerCase() === name?.trim().toLowerCase());
        return cust ? cust.id : null;
    };

    const records = lines
      .filter((l) => l.trim() !== "")
      .map((line) => {
        // NOTE: This basic split will FAIL if any field contains a comma.
        const values = line.split(",").map((v) => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => (obj[h] = values[i] || null));

        // === START: MAPPING NAME TO ID ===

        // Handle assign_to_employee: Check if value is a string (Name) or a number string (ID)
        const employeeValue = obj.assign_to_employee;
        if (typeof employeeValue === 'string' && isNaN(parseInt(employeeValue, 10))) {
            // It's a string, treat as Name and look up ID
            obj.assign_to_employee = getEmployeeIdByName(employeeValue);
        } else if (employeeValue) {
            // It's a number string, treat as ID and parse it
            obj.assign_to_employee = parseInt(employeeValue, 10);
        } else {
            obj.assign_to_employee = null;
        }

        // Handle assign_to_customer: Check if value is a string (Name) or a number string (ID)
        const customerValue = obj.assign_to_customer;
        if (typeof customerValue === 'string' && isNaN(parseInt(customerValue, 10))) {
            // It's a string, treat as Name and look up ID
            obj.assign_to_customer = getCustomerIdByName(customerValue);
        } else if (customerValue) {
            // It's a number string, treat as ID and parse it
            obj.assign_to_customer = parseInt(customerValue, 10);
        } else {
            obj.assign_to_customer = null;
        }
        
        // === END: MAPPING NAME TO ID ===

        // Type conversion for other fields
        if (obj.billing_amount)
          obj.billing_amount = parseFloat(obj.billing_amount);
        if (obj.paid_amount) obj.paid_amount = parseFloat(obj.paid_amount);

        delete obj.id;
        return obj;
      });

    if (records.length > 0) {
      const { error } = await supabase.from("tasks").insert(records);
      if (error) setErrorMessage("Error importing tasks: " + error.message);
      else setSuccessMessage("Tasks imported successfully!");
      fetchTasks();
    }
  };

  // helpers to display names instead of IDs
  const getEmployeeName = (id: number | null) => {
    if (!id) return "";
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.full_name : id;
  };

  const getCustomerName = (id: number | null) => {
    if (!id) return "";
    const cust = customers.find((c) => c.id === id);
    return cust ? cust.company_name : id;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white shadow rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-700">Tasks</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Task
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

      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-2 rounded">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 text-green-700 p-2 rounded">
          {successMessage}
        </div>
      )}

      <div className="bg-white shadow rounded-2xl">
        {loading ? (
          <p className="p-4">Loading tasks…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2">Title</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Priority</th>
                  <th className="text-left px-4 py-2">Due Date</th>
                  <th className="text-left px-4 py-2">Billing</th>
                  <th className="text-left px-4 py-2">Paid</th>
                  <th className="text-left px-4 py-2">Employee</th>
                  <th className="text-left px-4 py-2">Customer</th>
                  <th className="text-left px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-2">{task.title}</td>
                    <td className="px-4 py-2">{task.status}</td>
                    <td className="px-4 py-2">{task.priority}</td>
                    <td className="px-4 py-2">{task.due_date}</td>
                    <td className="px-4 py-2">{task.billing_amount}</td>
                    <td className="px-4 py-2">{task.paid_amount}</td>
                    <td className="px-4 py-2">
                      {getEmployeeName(task.assign_to_employee)}
                    </td>
                    <td className="px-4 py-2">
                      {getCustomerName(task.assign_to_customer)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="text-indigo-600 hover:underline mr-2"
                        onClick={() => handleEditClick(task)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => deleteTask(task.id)}
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

      {modalOpen && (
        <Modal
          title={editMode ? "Edit Task" : "Add Task"}
          onClose={() => setModalOpen(false)}
          onSave={saveTask}
        >
          {/* Title */}
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="Title"
            value={currentTask.title}
            onChange={(e) =>
              setCurrentTask({ ...currentTask, title: e.target.value })
            }
          />

          {/* Description */}
          <textarea
            className="border p-2 w-full mb-2 rounded"
            placeholder="Description"
            value={currentTask.description}
            onChange={(e) =>
              setCurrentTask({ ...currentTask, description: e.target.value })
            }
          />

          {/* Due Date */}
          <label className="block mb-1 font-medium">Due Date</label>
          <input
            className="border p-2 w-full mb-2 rounded"
            type="date"
            value={currentTask.due_date || ""}
            onChange={(e) =>
              setCurrentTask({ ...currentTask, due_date: e.target.value })
            }
          />

          {/* Billing Amount */}
          <label className="block mb-1 font-medium">Billing Amount</label>
          <input
            className="border p-2 w-full mb-2 rounded"
            type="number"
            placeholder="Billing Amount"
            value={currentTask.billing_amount || ""}
            onChange={(e) =>
              setCurrentTask({ ...currentTask, billing_amount: e.target.value })
            }
          />

          {/* Paid Amount */}
          <label className="block mb-1 font-medium">Paid Amount</label>
          <input
            className="border p-2 w-full mb-2 rounded"
            type="number"
            placeholder="Paid Amount"
            value={currentTask.paid_amount || ""}
            onChange={(e) =>
              setCurrentTask({ ...currentTask, paid_amount: e.target.value })
            }
          />

          {/* Priority */}
          <select
            className="border p-2 w-full mb-2 rounded"
            value={currentTask.priority}
            onChange={(e) =>
              setCurrentTask({ ...currentTask, priority: e.target.value })
            }
          >
            <option value="">Select Priority</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>

          {/* Status */}
          <select
            className="border p-2 w-full mb-2 rounded"
            value={currentTask.status}
            onChange={(e) =>
              setCurrentTask({ ...currentTask, status: e.target.value })
            }
          >
            <option value="">Select Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Assign to Employee */}
          <label className="block mb-1 font-medium">Assign to Employee</label>
          <select
            className="border p-2 w-full mb-2 rounded"
            value={currentTask.assign_to_employee || ""}
            onChange={(e) =>
              setCurrentTask({
                ...currentTask,
                assign_to_employee: e.target.value,
              })
            }
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </select>

          {/* Assign to Customer */}
          <label className="block mb-1 font-medium">Assign to Customer</label>
          <select
            className="border p-2 w-full mb-2 rounded"
            value={currentTask.assign_to_customer || ""}
            onChange={(e) =>
              setCurrentTask({
                ...currentTask,
                assign_to_customer: e.target.value,
              })
            }
          >
            <option value="">Select Customer</option>
            {customers.map((cust) => (
              <option key={cust.id} value={cust.id}>
                {cust.company_name}
              </option>
            ))}
          </select>
        </Modal>
      )}
    </div>
  );
};