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
    if (error) console.error(error);
    else setEmployees(data || []);
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
      if (error) console.error(error);
    } else {
      const { error } = await supabase.from("employees").insert([
        {
          full_name: currentEmployee.full_name,
          email: currentEmployee.email,
          position: currentEmployee.position,
          department: currentEmployee.department,
        },
      ]);
      if (error) console.error(error);
    }
    setModalOpen(false);
    fetchEmployees();
  };

  const deleteEmployee = async (id: number) => {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) console.error(error);
    else fetchEmployees();
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
      if (error) console.error("Error importing employees:", error);
      else fetchEmployees();
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
