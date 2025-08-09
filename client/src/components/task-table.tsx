import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  priority: string;
  status: string;
  assign_to_employee?: {
    full_name: string;
  } | null;
  assign_to_customer?: {
    company_name: string;
  } | null;
}

export default function TaskTable() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          description,
          due_date,
          priority,
          status,
          assign_to_employee:employees!tasks_assign_to_employee_fkey(full_name),
          assign_to_customer:customers!tasks_customer_assign_fkey(company_name)
        `);

      if (error) {
        console.error("Error fetching tasks:", error.message);
      } else {
        const formattedTasks: Task[] = (data || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          due_date: t.due_date,
          priority: t.priority,
          status: t.status,
          assign_to_employee: Array.isArray(t.assign_to_employee)
            ? t.assign_to_employee[0]
            : t.assign_to_employee || null,
          assign_to_customer: Array.isArray(t.assign_to_customer)
            ? t.assign_to_customer[0]
            : t.assign_to_customer || null,
        }));
        setTasks(formattedTasks);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">Task List</h2>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Title</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Priority</th>
            <th className="border p-2">Due Date</th>
            <th className="border p-2">Assigned To</th>
            <th className="border p-2">Customer</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t">
              <td className="border p-2">{task.title}</td>
              <td className="border p-2">{task.description || "—"}</td>
              <td className="border p-2">{task.status}</td>
              <td className="border p-2">{task.priority}</td>
              <td className="border p-2">{task.due_date}</td>
              <td className="border p-2">
                {task.assign_to_employee?.full_name || "Unassigned"}
              </td>
              <td className="border p-2">
                {task.assign_to_customer?.company_name || "N/A"}
              </td>
              <td className="border p-2">
                <button className="text-blue-600 hover:underline">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
