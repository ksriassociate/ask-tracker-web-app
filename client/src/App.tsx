// client/src/App.tsx
import React from 'react';
import EmployeeForm from './components/EmployeeForm';
import CustomerForm from './components/CustomerForm';
import TaskForm from './components/TaskForm';
import './index.css'; // Ensure your Tailwind CSS import is here

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Task Tracker Application</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
        <div>
          <EmployeeForm />
        </div>
        <div>
          <CustomerForm />
        </div>
      </div>

      <hr style={{ margin: '40px 0', borderTop: '1px solid #ccc' }} />

      <TaskForm />
    </div>
  );
}

export default App;