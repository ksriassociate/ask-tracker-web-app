// client/src/components/EmployeeForm.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Adjust path based on EmployeeForm.tsx location

function EmployeeForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');

  const handleAddEmployee = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      alert('Full Name and Email are required!');
      return;
    }

    const { data, error } = await supabase
      .from('employees') // Target the 'employees' table
      .insert([
        {
          full_name: fullName,
          email: email,
          position: position || null, // Set to null if empty
          department: department || null // Set to null if empty
        }
      ])
      .select(); // Returns the inserted row data

    if (error) {
      console.error('Error adding employee:', error.message);
      alert('Failed to add employee: ' + error.message);
    } else {
      console.log('Employee added successfully:', data);
      alert('Employee added successfully!');
      // Clear form fields
      setFullName('');
      setEmail('');
      setPosition('');
      setDepartment('');
    }
  };

  return (
    <form onSubmit={handleAddEmployee}>
      <h2>Add New Employee</h2>
      <label>Full Name:<input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label>
      <br/>
      <label>Email Address:<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <br/>
      <label>Position:<input type="text" value={position} onChange={(e) => setPosition(e.target.value)} /></label>
      <br/>
      <label>Department:<input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} /></label>
      <br/>
      <button type="submit">Add Employee</button>
    </form>
  );
}

export default EmployeeForm;