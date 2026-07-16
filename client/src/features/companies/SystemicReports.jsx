import React from 'react';

export default function SystemicReports() {
  // Mock metrics mirroring the real-world threshold targets
  const metrics = [
    { title: "Active Corporate Clients", count: "48", trend: "+4 this month", color: "border-indigo-500" },
    { title: "Pending MCA Filings (AOC-4/MGT-7)", count: "14", trend: "Due in 15 days", color: "border-amber-500" },
    { title: "Active NCLT Litigation Cases", count: "6", trend: "2 hearings scheduled", color: "border-rose-500" },
    { title: "Task Completion Rate", count: "92%", trend: "Avg 3.2 days per task", color: "border-emerald-500" }
  ];

  const recentActivities = [
    { id: 1, company: "ABC Tech Pvt Ltd", action: "Updated Director KYC", user: "Associate Team", time: "2 hours ago" },
    { id: 2, company: "Murugan Logistics", action: "Uploaded Incorporation Certificate", user: "Associate Team", time: "4 hours ago" },
    { id: 3, company: "Srinivasa Enterprises", action: "Drafted Board Resolution", user: "System Admin", time: "Yesterday" }
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
      
      {/* MODULE HEADER */}
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">📊 System Analytics & Reports</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Firm-wide operational health matrices and workflow statistics</p>
      </div>

      {/* METRICS METERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className={`bg-white p-5 rounded-xl border-l-4 shadow-sm border-t border-r border-b border-slate-200 ${metric.color}`}>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{metric.title}</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{metric.count}</div>
            <div className="text-[10px] font-medium text-slate-500 mt-1 italic">{metric.trend}</div>
          </div>
        ))}
      </div>

      {/* LOWER DATA MATRIX BLOCKS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TASK DISTRIBUTION TRACKER */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Filing Status Pipeline Breakdown</h3>
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>With transitions Completed (MCA Annual Filings)</span>
                <span className="text-slate-500">75%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Under Review by Principal Admins</span>
                <span className="text-slate-500">15%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Draft Status (Awaiting Associate Inputs)</span>
                <span className="text-slate-500">10%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-300 h-full rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT OPERATIONAL AUDIT FEED */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Firm Live Activity Feed</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-6">
                    {activityIdx !== recentActivities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                          {activity.user === 'System Admin' ? '👑' : '👥'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {activity.action} <span className="font-normal text-slate-500">for</span> {activity.company}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">By {activity.user}</p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-slate-400 font-medium italic">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}