import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { PageContainer } from "./PageContainer";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { User, ClipboardList, Clock } from "lucide-react";

export const ReportsPage = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate]);

  const fetchReport = async () => {
    // Fetching the tasks with the join on employees
    let query = supabase.from("tasks").select(`
      billing_amount, 
      paid_amount, 
      due_date, 
      status,
      employees:assign_to_employee ( id, full_name )
    `);

    if (fromDate) query = query.gte("due_date", fromDate);
    if (toDate) query = query.lte("due_date", toDate);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching report:", error);
      return;
    }

    const grouped: Record<string, any> = {};

    (data || []).forEach((t) => {
      const emp = t.employees;
      if (!emp) return;

      if (!grouped[emp.id]) {
        grouped[emp.id] = {
          employee: emp.full_name,
          totalBilling: 0,
          totalPaid: 0,
          completedTasks: 0,
          pendingTasks: 0,
        };
      }

      grouped[emp.id].totalBilling += t.billing_amount || 0;
      grouped[emp.id].totalPaid += t.paid_amount || 0;

      // FIX: Standardize status to lowercase to match "Completed" or "completed"
      const status = t.status ? t.status.toLowerCase() : "";

      if (status === "completed") {
        grouped[emp.id].completedTasks += 1;
      } else {
        // This catches "Open", "In Progress", or any null/empty status
        grouped[emp.id].pendingTasks += 1;
      }
    });

    setReportData(Object.values(grouped));
  };

  return (
    <PageContainer title="Employee Reports">
      {/* Filters */}
      <div className="bg-white shadow rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">From</label>
          <input
            type="date"
            className="border p-2 rounded-md w-full"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">To</label>
          <input
            type="date"
            className="border p-2 rounded-md w-full"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {reportData.map((r, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 flex flex-col items-center text-center border border-gray-100"
          >
            <div className="bg-blue-50 p-3 rounded-full mb-3">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{r.employee}</h3>
            <p className="text-sm text-gray-400 mb-4">Performance Overview</p>
            
            {/* Task Stats */}
            <div className="flex w-full gap-3 mb-6">
               <div className="flex-1 bg-green-50 p-3 rounded-xl border border-green-100">
                  <div className="flex items-center justify-center gap-1 text-green-700 font-bold text-lg">
                    <ClipboardList size={18}/> {r.completedTasks}
                  </div>
                  <div className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Done</div>
               </div>
               <div className="flex-1 bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <div className="flex items-center justify-center gap-1 text-orange-700 font-bold text-lg">
                    <Clock size={18}/> {r.pendingTasks}
                  </div>
                  <div className="text-[10px] text-orange-600 uppercase tracking-wider font-bold">Pending</div>
               </div>
            </div>

            {/* Financial Stats */}
            <div className="w-full space-y-3 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Billed</span>
                <span className="font-bold text-gray-800">₹{r.totalBilling.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Paid</span>
                <span className="font-bold text-green-600">₹{r.totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                <span className="font-medium text-gray-600">Balance Due</span>
                <span className="font-bold text-red-500">
                  ₹{(r.totalBilling - r.totalPaid).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      {reportData.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-gray-800 text-lg font-bold mb-6">Financial Comparison</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={reportData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="employee" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#f3f4f6'}} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="totalBilling" fill="#3B82F6" name="Billed Amount" radius={[6, 6, 0, 0]} barSize={40} />
              <Bar dataKey="totalPaid" fill="#10B981" name="Paid Amount" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-20 text-center border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">No data found for the selected date range</p>
        </div>
      )}
    </PageContainer>
  );
};