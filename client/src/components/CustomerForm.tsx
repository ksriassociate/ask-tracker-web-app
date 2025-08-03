// client/src/components/CustomerForm.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Adjust path

function CustomerForm() {
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleAddCustomer = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!contactPerson.trim() || !email.trim()) {
      alert('Contact Person and Email are required!');
      return;
    }

    const { data, error } = await supabase
      .from('customers') // Target the 'customers' table
      .insert([
        {
          company_name: companyName || null,
          contact_person: contactPerson,
          email: email,
          phone_number: phoneNumber || null
        }
      ])
      .select();

    if (error) {
      console.error('Error adding customer:', error.message);
      alert('Failed to add customer: ' + error.message);
    } else {
      console.log('Customer added successfully:', data);
      alert('Customer added successfully!');
      // Clear form fields
      setCompanyName('');
      setContactPerson('');
      setEmail('');
      setPhoneNumber('');
    }
  };

  return (
    <form onSubmit={handleAddCustomer}>
      <h2>Add New Customer</h2>
      <label>Company Name:<input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></label>
      <br/>
      <label>Contact Person:<input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required /></label>
      <br/>
      <label>Email Address:<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <br/>
      <label>Phone Number (Optional):<input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></label>
      <br/>
      <button type="submit">Add Customer</button>
    </form>
  );
}

export default CustomerForm;