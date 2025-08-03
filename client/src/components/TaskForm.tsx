// client/src/components/TaskForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Adjust path if needed

// Define simple TypeScript interfaces for better type safety (optional but good practice)
interface Employee {
  id: number; // Use 'string' if your IDs are UUIDs
  full_name: string;
}

interface Customer {
  id: number; // Use 'string' if your Supabase IDs are UUIDs
  company_name: string;
  contact_person: string;
}

function TaskForm() {
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('To Do'); // Initial status for new tasks

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignedToEmployeeId, setAssignedToEmployeeId] = useState<number | null>(null); // State for selected Employee ID
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null); // State for selected Customer ID

  // useEffect to fetch data when the component mounts
  useEffect(() => {
    async function fetchData() {
      // Fetch Employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees') // Your Supabase table name
        .select('id, full_name'); // Select only the columns you need for the dropdown

      if (employeesError) {
        console.error('Error fetching employees:', employeesError.message);
      } else {
        setEmployees(employeesData || []);
      }

      // Fetch Customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers') // Your Supabase table name
        .select('id, company_name, contact_person'); // Select relevant columns

      if (customersError) {
        console.error('Error fetching customers:', customersError.message);
      } else {
        setCustomers(customersData || []);
      }
    }

    fetchData();
  }, []); // Empty dependency array means this effect runs once after the initial render

  // --- Task Submission Logic ---
  const handleAddTask = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default browser form submission

    if (!taskTitle.trim()) {
      alert('Task Title is required!');
      return;
    }

    // Prepare the data to insert
    const newTask = {
      title: taskTitle,
      description: description || null, // Set to null if empty string for optional fields
      due_date: dueDate || null,
      priority: priority,
      status: status,
      assigned_to_employee_id: assignedToEmployeeId, // This will be null if nothing selected in dropdown
      customer_id: selectedCustomerId // This will be null if nothing selected in dropdown
    };

    const { data, error } = await supabase
      .from('tasks') // Your 'tasks' table name
      .insert([newTask])
      .select(); // Use .select() to get the inserted row data back (useful for immediate UI updates)

    if (error) {
      console.error('Error adding task:', error.message);
      alert('Failed to add task: ' + error.message);
    } else {
      console.log('Task added successfully:', data);
      alert('Task added successfully!');
      // Reset form fields after successful submission
      setTaskTitle('');
      setDescription('');
      setDueDate('');
      setPriority('Medium');
      setStatus('To Do');
      setAssignedToEmployeeId(null);
      setSelectedCustomerId(null);
      // Optional: If you have a list of tasks displayed, you might re-fetch them here
    }
  };

  return (
    <form onSubmit={handleAddTask}>
      <h2>Add New Task</h2>
      <label>
        Task Title:
        <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
      </label>
      <br/>
      <label>
        Description:
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
      </label>
      <br/>
      <label>
        Due Date:
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </label>
      <br/>
      <label>
        Priority:
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </label>
      <br/>
      <label>
        Status:
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </label>
      <br/>
      <label>
        Assign to Employee:
        <select
          value={assignedToEmployeeId === null ? '' : assignedToEmployeeId}
          onChange={(e) => setAssignedToEmployeeId(e.target.value ? Number(e.target.value) : null)} // Convert to Number if ID is int8
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name}
            </option>
          ))}
        </select>
      </label>
      <br/>
      <label>
        Customer (Optional):
        <select
          value={selectedCustomerId === null ? '' : selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)} // Convert to Number if ID is int8
        >
          <option value="">Select Customer</option>
          {customers.map((cust) => (
            <option key={cust.id} value={cust.id}>
              {cust.company_name} ({cust.contact_person})
            </option>
          ))}
        </select>
      </label>
      <br/>
      <button type="submit">Add Task</button>
    </form>
  );
}

export default TaskForm;