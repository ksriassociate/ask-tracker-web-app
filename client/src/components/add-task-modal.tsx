import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { supabase } from "../supabaseClient";

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
}

export default function AddTaskModal({ open, onOpenChange, task }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Pending");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDueDate(task.due_date || "");
      setPriority(task.priority || "Medium");
      setStatus(task.status || "Pending");
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("Medium");
      setStatus("Pending");
    }
  }, [task]);

  const handleSubmit = async () => {
    const payload = {
      title,
      description,
      due_date: dueDate,
      priority,
      status,
    };

    let result;
    if (task?.id) {
      result = await supabase.from("tasks").update(payload).eq("id", task.id);
    } else {
      result = await supabase.from("tasks").insert([payload]);
    }

    if (result.error) {
      alert("Error: " + result.error.message);
    } else {
      onOpenChange(false); // Close modal after success
    }
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white p-6 rounded shadow-lg">
          <Dialog.Title className="text-lg font-bold mb-4">
            {task ? "Edit Task" : "Add Task"}
          </Dialog.Title>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                className="w-full border px-3 py-2 rounded"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                className="w-full border px-3 py-2 rounded"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Due Date</label>
              <input
                type="date"
                className="w-full border px-3 py-2 rounded"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Priority</label>
              <select
                className="w-full border px-3 py-2 rounded"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                className="w-full border px-3 py-2 rounded"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {task ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
