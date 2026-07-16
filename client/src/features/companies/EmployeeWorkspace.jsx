import React from 'react';

export default function EmployeeWorkspace() {
  const staffMembers = [
    { id: "EMP-01", name: "Anand Kumar", role: "Senior CS Associate", activeTasks: 14, completedTasks: 142, efficiency: "96%", status: "At Capacity" },
    { id: "EMP-02", name: "Priya Sharma", role: "Junior Corporate Associate", activeTasks: 22, completedTasks: 98, efficiency: "89%", status: "Overloaded" },
    { id: "EMP-03", name: "Dinesh Rayan", role: "Compliance Management Trainee", activeTasks: 5, completedTasks: 12, efficiency: "91%", status: "Available" }
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
      
      {/* MODULE HEADER */}
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employees Workspace</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Manage staff assignments, track utilization, and review internal accountability matrix logs</p>
      </div>

      {/* METRIC ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Office Staff</span>
          <span className="text-2xl font-extrabold text-slate-900 block mt-1">3 Active Members</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Avg Task Completion Rate</span>
          <span className="text-2xl font-extrabold text-emerald-600 block mt-1">92% On-Time</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Workload Imbalances Flagged</span>
          <span className="text-2xl font-extrabold text-amber-600 block mt-1">1 Staff Action Needed</span>
        </div>
      </div>

      {/* STAFF DIRECTORY TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-4">
          <h3 className="text-sm font-bold tracking-wide uppercase">Internal Office Talent Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Associate Name & ID</th>
                <th className="p-4">Practice Designation Role</th>
                <th className="p-4 text-center">Active Load</th>
                <th className="p-4 text-center">Historical Completions</th>
                <th className="p-4">Filing Accuracy Ratio</th>
                <th className="p-4 text-right">Utilization Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffMembers.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{emp.name}</div>
                    <div className="font-mono text-xs text-slate-400 mt-0.5">{emp.id}</div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium text-xs">{emp.role}</td>
                  <td className="p-4 text-center font-semibold text-slate-800">{emp.activeTasks} items</td>
                  <td className="p-4 text-center font-mono text-xs text-slate-500">{emp.completedTasks} files</td>
                  <td className="p-4 font-bold text-slate-700">{emp.efficiency}</td>
                  <td className="p-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                      emp.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' :
                      emp.status === 'At Capacity' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}