import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Modal } from "./Modal";
import { Plus, Download, Filter, AlertTriangle, Brain, Sparkles, Send } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- START: SYSTEM CSV EXPORT INTEGRITY UTILITIES ---
const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    const escapedS = s.replace(/"/g, '""');
    return `"${escapedS}"`;
  }
  return s;
};

const exportToCSV = (rows: any[], filename: string) => {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeCsvValue).join(",");
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
// --- END: SYSTEM CSV EXPORT INTEGRITY UTILITIES ---

export const TasksPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dynamic Range Notification State
  const [dueReminders, setDueReminders] = useState<string[]>([]);

  // Operations Logging & AI Engine Vectors
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [rawUpdateText, setRawUpdateText] = useState("");
  const [nextActionText, setNextActionText] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

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
    const { data, error } = await supabase.from("customers").select("id, company_name");
    if (error) setErrorMessage("Failed to fetch customers.");
    else setCustomers(data || []);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("id, full_name");
    if (error) setErrorMessage("Failed to fetch employees.");
    else setEmployees(data || []);
  };

  useEffect(() => {
    fetchTasks();
    fetchCustomers();
    fetchEmployees();
  }, []);

  const getEmployeeName = (id: number | null) => {
    if (!id) return "Unassigned";
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.full_name : id;
  };

  const getCustomerName = (id: number | null) => {
    if (!id) return "Unknown Customer";
    const cust = customers.find((c) => c.id === id);
    return cust ? cust.company_name : id;
  };

  // --- AUTOMATED OVERDUE & RADAR DUE NOTIFICATION ENGINE ---
  useEffect(() => {
    if (tasks.length === 0 || employees.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const urgentNotifications: string[] = [];

    tasks.forEach((task) => {
      if (task.status !== "Completed" && task.due_date) {
        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        const empName = getEmployeeName(task.assign_to_employee);

        if (taskDueDate.getTime() === tomorrow.getTime()) {
          urgentNotifications.push(`⏳ Alert for [${empName}]: "${task.title}" is due tomorrow!`);
        } else if (taskDueDate.getTime() <= today.getTime()) {
          urgentNotifications.push(`🚨 Urgent for [${empName}]: "${task.title}" is due TODAY or Overdue!`);
        }
      }
    });

    setDueReminders(urgentNotifications);
  }, [tasks, employees]);

  // --- CHRONOLOGICAL TIMELINE LEDGER SYNC ---
  const fetchProgressLogs = async (taskId: number) => {
    setLogsLoading(true);
    setAiSummary(null);
    const { data, error } = await supabase
      .from("task_progress_logs")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (!error) setProgressLogs(data || []);
    setLogsLoading(false);
  };

  // --- PERSIST TRANSACTIONAL FIELD UPDATE TO BACKEND ---
  const handleSaveProgressLog = async () => {
    if (!rawUpdateText.trim() || !currentTask.id) return;

    const { error } = await supabase.from("task_progress_logs").insert([
      {
        task_id: currentTask.id,
        employee_id: currentTask.assign_to_employee,
        progress_update: rawUpdateText.trim(),
        next_action: nextActionText.trim() || "No future action recorded yet."
      }
    ]);

    if (error) {
      alert("Error saving log matrix: " + error.message);
    } else {
      setRawUpdateText("");
      setNextActionText("");
      fetchProgressLogs(currentTask.id);
    }
  };

  // --- CORE SYSTEM AI LOGIC MATRIX CONSOLE ---
  const handleGenerateAISummary = async () => {
    setAiLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini Token vector credentials missing inside system environment config maps.");
      }

      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

      const customerName = getCustomerName(currentTask.assign_to_customer);
      const assigneeName = getEmployeeName(currentTask.assign_to_employee);

      const formattedHistory = progressLogs.length > 0 
        ? progressLogs.map((log, i) => `[Entry #${i + 1} - ${new Date(log.created_at).toLocaleDateString()}]\n- Completed: ${log.progress_update}\n- Next Step Planned: ${log.next_action}`).join("\n\n")
        : "No operations updates recorded by the field personnel yet.";

      const prompt = `
        You are an advanced operations assistant summarizing an active client project.
        
        CUSTOMER DETAILS:
        - Customer Name: ${customerName}
        
        TASK SPECIFIC DETAILS:
        - Task Title: ${currentTask.title}
        - Description/Requirements: ${currentTask.description || "None provided"}
        - Current Status: ${currentTask.status || "Not Set"}
        - Priority Level: ${currentTask.priority || "Normal"}
        - Target Deadline: ${currentTask.due_date || "No deadline assigned"}
        - Advance Payment Received: ${currentTask.billing_amount || "0"}
        - MCA/Government Fees Filed: ${currentTask.paid_amount || "0"}
        - Assigned Employee: ${assigneeName}

        CHRONOLOGICAL WORK TIMELINE RECORDED BY EMPLOYEE:
        ${formattedHistory}
        
        Please synthesize ALL the information above and write a beautifully clear summary specifically for ${customerName}.
        Format your response cleanly in Markdown with these exact sections:
        
        ### 📊 Master Progress Report for ${customerName}
        (Provide a clear, professional summary combining the main task details, financial status, and the work history. Explain exactly where this task stands right now.)

        ### 🎯 Recommended Strategic Next Steps
        (List actionable, bulleted recommendations detailing exactly what the assigned employee or manager should do next to drive this task to complete success.)
      `;

      const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
      setAiSummary(result.response.text());
    } catch (err: any) {
      alert("AI Diagnostics Matrix Failure: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchEmp = filterEmployee === "" || String(task.assign_to_employee) === filterEmployee;
    const matchCust = filterCustomer === "" || String(task.assign_to_customer) === filterCustomer;
    const matchStat = filterStatus === "" || task.status === filterStatus;
    return matchEmp && matchCust && matchStat;
  });

  const handleAddClick = () => {
    setEditMode(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressLogs([]);
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
    fetchProgressLogs(task.id);
  };

  const saveTask = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentTask.assign_to_customer) {
      setErrorMessage("Cannot save task: Tasks must be explicitly assigned to an existing customer.");
      return; 
    }
    if (!currentTask.assign_to_employee) {
      setErrorMessage("Cannot save task: Tasks must be explicitly assigned to an employee to monitor schedules.");
      return; 
    }

    const taskData: any = {
      title: currentTask.title,
      description: currentTask.description,
      due_date: currentTask.due_date || null,
      priority: currentTask.priority || null,
      status: currentTask.status || null,
      assign_to_customer: parseInt(currentTask.assign_to_customer as any, 10),
      assign_to_employee: parseInt(currentTask.assign_to_employee as any, 10),
      billing_amount: currentTask.billing_amount ? parseFloat(currentTask.billing_amount as any) : null,
      paid_amount: currentTask.paid_amount ? parseFloat(currentTask.paid_amount as any) : 0,
    };

    let error;
    if (editMode) {
      ({ error } = await supabase.from("tasks").update(taskData).eq("id", currentTask.id));
    } else {
      ({ error } = await supabase.from("tasks").insert([taskData]));
    }
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setSuccessMessage(editMode ? "Task updated!" : "Task added!");
    setModalOpen(false);
    fetchTasks();
  };

  const handleExport = () => {
    if (filteredTasks.length > 0) {
      exportToCSV(filteredTasks, "tasks.csv");
    } else {
      alert("No tasks to export");
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* ALERTS TICKER */}
      {dueReminders.length > 0 && (
        <div className="space-y-2">
          {dueReminders.map((reminder, idx) => (
            <div key={idx} className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-4 rounded-r-xl shadow-sm flex items-center gap-3 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm font-semibold">{reminder}</p>
            </div>
          ))}
        </div>
      )}

      {/* DASHBOARD HEADER & WORKSPACE CONTROL TILES */}
      <div className="bg-white shadow rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-700">Tasks Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleAddClick} className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
              <Plus className="w-4 h-4" /> Add Task
            </button>
            <button onClick={handleExport} className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* METRICS FILTER SELECTOR */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <Filter size={16} /> Filter by:
            </div>
            <select className="border p-2 rounded-lg text-sm bg-gray-50 text-gray-700" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
            <select className="border p-2 rounded-lg text-sm bg-gray-50 text-gray-700" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}>
              <option value="">All Customers</option>
              {customers.map(cust => (
                <option key={cust.id} value={cust.id}>{cust.company_name}</option>
              ))}
            </select>
            <select className="border p-2 rounded-lg text-sm bg-gray-50 text-gray-700" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
        </div>
      </div>

      {errorMessage && <div className="bg-red-100 text-red-700 p-2 rounded">{errorMessage}</div>}
      {successMessage && <div className="bg-green-100 text-green-700 p-2 rounded">{successMessage}</div>}

      {/* RENDER TABLE COMPONENT MAP */}
      <div className="bg-white shadow rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Syncing database assets...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Priority</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Target Deadline</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Assignee</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Customer Matrix</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/70 transition">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{task.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.priority}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.due_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getEmployeeName(task.assign_to_employee)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getCustomerName(task.assign_to_customer)}</td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-indigo-600 font-semibold hover:underline" onClick={() => handleEditClick(task)}>Edit & Log</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONTROL DESK EXPANDED MODAL CONTAINER */}
      {modalOpen && (
        <Modal title={editMode ? "Edit Task" : "Create New Task Profile"} onClose={() => setModalOpen(false)} onSave={saveTask}>
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            
            {/* 100% PRESERVED INITIAL HEADERS & FIELDS FROM SCREENSHOT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input className="border p-2 w-full rounded-md text-sm bg-white" value={currentTask.title || ""} onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={3} className="border p-2 w-full rounded-md text-sm bg-white" value={currentTask.description || ""} onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date/Completed Date</label>
                <input type="date" className="border p-2 w-full rounded-md text-sm bg-white" value={currentTask.due_date || ""} onChange={(e) => setCurrentTask({ ...currentTask, due_date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select className="border p-2 w-full rounded-md text-sm bg-white" value={currentTask.priority || ""} onChange={(e) => setCurrentTask({ ...currentTask, priority: e.target.value })}>
                  <option value="">Select</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Received</label>
                <input type="number" className="border p-2 w-full rounded-md text-sm bg-white" value={currentTask.billing_amount || ""} onChange={(e) => setCurrentTask({ ...currentTask, billing_amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MCA Fees</label>
                <input type="number" className="border p-2 w-full rounded-md text-sm bg-white" value={currentTask.paid_amount || ""} onChange={(e) => setCurrentTask({ ...currentTask, paid_amount: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="border p-2 w-full rounded-md text-sm bg-white" value={currentTask.status || ""} onChange={(e) => setCurrentTask({ ...currentTask, status: e.target.value })}>
                <option value="">Select Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Employee <span className="text-red-500">* Required</span></label>
                <select className="border p-2 w-full rounded-md text-sm bg-white border-red-200" value={currentTask.assign_to_employee || ""} onChange={(e) => setCurrentTask({ ...currentTask, assign_to_employee: e.target.value ? parseInt(e.target.value, 10) : null })}>
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Customer <span className="text-red-500">* Required</span></label>
                <select className="border p-2 w-full rounded-md text-sm bg-white border-red-200" value={currentTask.assign_to_customer || ""} onChange={(e) => setCurrentTask({ ...currentTask, assign_to_customer: e.target.value ? parseInt(e.target.value, 10) : null })}>
                  <option value="">-- Select Existing Customer --</option>
                  {customers.map(cust => <option key={cust.id} value={cust.id}>{cust.company_name}</option>)}
                </select>
              </div>
            </div>

            {/* --- NEW TIMELINE APPENDED DIRECTLY AT THE BOTTOM WITHOUT CHANGING EXSITING FIELDS --- */}
            {editMode && currentTask.id && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-5">
                
                {/* AI CUSTOMER STRATEGY HIGHLIGHT DECK */}
                <div className="bg-black text-white p-4 rounded-xl space-y-3 shadow-md border border-slate-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h3 className="text-xs font-bold tracking-wide uppercase text-slate-400">Customer Strategy Engine</h3>
                        <p className="text-[10px] text-slate-500">Analyzes overall task metrics + history for {getCustomerName(currentTask.assign_to_customer)}</p>
                      </div>
                    </div>
                    <button type="button" onClick={handleGenerateAISummary} disabled={aiLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold transition disabled:bg-slate-800 disabled:text-slate-600">
                      <Sparkles className="w-3.5 h-3.5" /> {aiLoading ? "Analyzing Data..." : "Run AI Analysis"}
                    </button>
                  </div>
                  {aiSummary && (
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-[250px] overflow-y-auto whitespace-pre-wrap">
                      {aiSummary}
                    </div>
                  )}
                </div>

                {/* THE HUMAN LOGGING INPUT PANEL */}
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">Step 1: Record Your Progress today</h4>
                    <p className="text-[11px] text-blue-700">Type what you finished today so the team and AI know what's done.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">What exactly did you do for this task today?</label>
                      <input 
                        type="text" 
                        placeholder="Example: Submitted document drafts to portal, pending physical review..." 
                        className="border border-gray-300 p-2.5 w-full rounded-md text-sm bg-white outline-none focus:border-indigo-500" 
                        value={rawUpdateText} 
                        onChange={(e) => setRawUpdateText(e.target.value)} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">What is the very next action step required?</label>
                      <input 
                        type="text" 
                        placeholder="Example: Call client tomorrow morning to collect signature documents..." 
                        className="border border-gray-300 p-2.5 w-full rounded-md text-sm bg-white outline-none focus:border-indigo-500" 
                        value={nextActionText} 
                        onChange={(e) => setNextActionText(e.target.value)} 
                      />
                    </div>
                  </div>

                  <button type="button" onClick={handleSaveProgressLog} className="w-full bg-slate-900 hover:bg-black text-white py-2.5 rounded-md text-xs font-bold transition flex items-center justify-center gap-1">
                    <Send className="w-3.5 h-3.5" /> Save Today's Entry to Timeline
                  </button>
                </div>

                {/* HISTORICAL WORK RECORD DISPLAY TIMELINE */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 px-1">Historical Activity Timeline Ledger</h4>
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {logsLoading ? (
                      <p className="text-xs text-gray-400 italic">Syncing timeline logs...</p>
                    ) : progressLogs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-4 text-center border-2 border-dashed rounded-md bg-gray-50">No activity recorded for this project yet. Use the fields above to save your first update.</p>
                    ) : (
                      <div className="border-l-2 border-slate-200 ml-2.5 pl-4 space-y-3">
                        {progressLogs.map((log) => (
                          <div key={log.id} className="bg-white border rounded-md p-3 text-xs shadow-xs hover:border-gray-300 transition">
                            <div className="flex justify-between text-gray-400 font-semibold text-[10px] uppercase mb-1">
                              <span>Logged By: {getEmployeeName(log.employee_id)}</span>
                              <span>{new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-gray-800"><span className="font-bold text-gray-400">What Was Done:</span> {log.progress_update}</p>
                            <p className="text-indigo-600 mt-1"><span className="font-bold text-gray-400">Next Planned Step:</span> {log.next_action}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};