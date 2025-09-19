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

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [currentEmployee, setCurrentEmployee] = useState({
    id: null,
    full_name: "",
    email: "",
    position: "",
    department: "",
  });

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setErrorMessage("Failed to fetch employees.");
    } else {
      setEmployees(data || []);
      setErrorMessage(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddClick = () => {
    setEditMode(false);
    setCurrentEmployee({
      id: null,
      full_name: "",
      email: "",
      position: "",
      department: "",
    });
    setModalOpen(true);
  };

  const handleEditClick = (emp: any) => {
    setEditMode(true);
    setCurrentEmployee(emp);
    setModalOpen(true);
  };

  const saveEmployee = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (editMode) {
      const { error } = await supabase
        .from("employees")
        .update({
          full_name: currentEmployee.full_name,
          email: currentEmployee.email,
          position: currentEmployee.position,
          department: currentEmployee.department,
        })
        .eq("id", currentEmployee.id);
      if (error) {
        console.error(error);
        setErrorMessage(error.message || "Failed to update employee.");
      } else {
        setSuccessMessage("Employee updated");
      }
    } else {
      const { error } = await supabase.from("employees").insert([
        {
          full_name: currentEmployee.full_name,
          email: currentEmployee.email,
          position: currentEmployee.position,
          department: currentEmployee.department,
        },
      ]);
      if (error) {
        console.error(error);
        setErrorMessage(error.message || "Failed to add employee.");
      } else {
        setSuccessMessage("Employee added");
      }
    }
    setModalOpen(false);
    fetchEmployees();
  };

  const deleteEmployee = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );
    if (!confirmed) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // check if any tasks reference this employee
      const { data: linkedTasks, error: linkedErr } = await supabase
        .from("tasks")
        .select("id")
        .eq("assign_to_employee", id);

      if (linkedErr) throw linkedErr;

      if (linkedTasks && linkedTasks.length > 0) {
        const wantUnassign = window.confirm(
          `This employee is assigned to ${linkedTasks.length} task(s).\n` +
            "Press OK to unassign those tasks and delete the employee, or Cancel to abort."
        );
        if (!wantUnassign) {
          setErrorMessage("Delete cancelled. Unassign tasks first.");
          return;
        }

        // unassign tasks first
        const { error: updateErr } = await supabase
          .from("tasks")
          .update({ assign_to_employee: null })
          .eq("assign_to_employee", id);

        if (updateErr) throw updateErr;
      }

      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;

      // optimistic update of UI
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setSuccessMessage("Employee deleted successfully.");
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Failed to delete employee.");
      // refresh to keep UI consistent
      fetchEmployees();
    }
  };

  const handleExport = () => {
    if (employees.length > 0) {
      exportToCSV(employees, "employees.csv");
    } else {
      alert("No employees to export");
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
        headers.forEach((h, i) => (obj[h] = values[i]));
        return obj;
      });
    if (records.length > 0) {
      const { error } = await supabase.from("employees").insert(records);
      if (error) {
        console.error("Error importing employees:", error);
        setErrorMessage("Error importing employees: " + error.message);
      } else {
        setSuccessMessage("Employees imported successfully.");
        fetchEmployees();
      }
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white shadow rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-700">Employees</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Employee
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
        <div className="bg-red-100 text-red-700 p-2 rounded">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="bg-green-100 text-green-700 p-2 rounded">
          {successMessage}
        </div>
      )}

      <div className="bg-white shadow rounded-2xl">
        {loading ? (
          <p className="p-4">Loading employees…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2">Full Name</th>
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-left px-4 py-2">Position</th>
                  <th className="text-left px-4 py-2">Department</th>
                  <th className="text-left px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-2">{emp.full_name}</td>
                    <td className="px-4 py-2">{emp.email}</td>
                    <td className="px-4 py-2">{emp.position}</td>
                    <td className="px-4 py-2">{emp.department}</td>
                    <td className="px-4 py-2">
                      <button
                        className="text-indigo-600 hover:underline mr-2"
                        onClick={() => handleEditClick(emp)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => deleteEmployee(emp.id)}
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
          title={editMode ? "Edit Employee" : "Add Employee"}
          onClose={() => setModalOpen(false)}
          onSave={saveEmployee}
        >
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="Full Name"
            value={currentEmployee.full_name}
            onChange={(e) =>
              setCurrentEmployee({
                ...currentEmployee,
                full_name: e.target.value,
              })
            }
          />
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="Email"
            value={currentEmployee.email}
            onChange={(e) =>
              setCurrentEmployee({
                ...currentEmployee,
                email: e.target.value,
              })
            }
          />
          <input
            className="border p-2 w-full mb-2 rounded"
            placeholder="Position"
            value={currentEmployee.position}
            onChange={(e) =>
              setCurrentEmployee({
                ...currentEmployee,
                position: e.target.value,
              })
            }
          />
          <input
            className="border p-2 w-full rounded"
            placeholder="Department"
            value={currentEmployee.department}
            onChange={(e) =>
              setCurrentEmployee({
                ...currentEmployee,
                department: e.target.value,
              })
            }
          />
        </Modal>
      )}
    </div>
  );
};
