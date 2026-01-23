// src/components/ReportsPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { PageContainer } from "./PageContainer";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { User, ClipboardList, Clock } from "lucide-react"; // Added icons for tasks

export const ReportsPage = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate]);

  const fetchReport = async () => {
    // UPDATED: Added 'status' to the query to track completed/pending tasks
    let query = supabase.from("tasks").select(`
      billing_amount, paid_amount, due_date, status,
      employees:assign_to_employee ( id, full_name )
    `);

    if (fromDate) query = query.gte("due_date", fromDate);
    if (toDate) query = query.lte("due_date", toDate);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching report:", error);
      return;
    }

    const grouped: any = {};
    (data || []).forEach((t) => {
      const emp = t.employees;
      if (!emp) return;
      if (!grouped[emp.id]) {
        grouped[emp.id] = {
          employee: emp.full_name,
          totalBilling: 0,
          totalPaid: 0,
          completedTasks: 0, // New field
          pendingTasks: 0,   // New field
        };
      }
      grouped[emp.id].totalBilling += t.billing_amount || 0;
      grouped[emp.id].totalPaid += t.paid_amount || 0;

      // UPDATED: Logic to count tasks based on status
      if (t.status === "completed") {
        grouped[emp.id].completedTasks += 1;
      } else {
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
            className="border p-2 rounded-md"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">To</label>
          <input
            type="date"
            className="border p-2 rounded-md"
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
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 flex flex-col items-center text-center"
          >
            <User className="w-8 h-8 text-blue-500 mb-2" />
            <h3 className="text-lg font-bold text-gray-700">{r.employee}</h3>
            <p className="text-sm text-gray-500 mb-4">Employee Report</p>
            
            {/* UPDATED: Task Count Display Section */}
            <div className="flex w-full gap-2 mb-4">
               <div className="flex-1 bg-green-50 p-2 rounded-lg border border-green-100">
                  <div className="flex items-center justify-center gap-1 text-green-700 font-bold">
                    <ClipboardList size={14}/> {r.completedTasks}
                  </div>
                  <div className="text-[10px] text-green-600 uppercase font-bold">Done</div>
               </div>
               <div className="flex-1 bg-orange-50 p-2 rounded-lg border border-orange-100">
                  <div className="flex items-center justify-center gap-1 text-orange-700 font-bold">
                    <Clock size={14}/> {r.pendingTasks}
                  </div>
                  <div className="text-[10px] text-orange-600 uppercase font-bold">Pending</div>
               </div>
            </div>

            <div className="w-full space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Billing:</span>
                <span className="font-semibold">₹{r.totalBilling}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Paid:</span>
                <span className="font-semibold text-green-600">₹{r.totalPaid}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Balance:</span>
                <span className="font-semibold text-red-500">
                  ₹{r.totalBilling - r.totalPaid}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Combined Chart */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
          <h3 className="text-gray-700 text-lg font-bold mb-4">Billed vs Paid by Employee</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData}>
              <XAxis dataKey="employee" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalBilling" fill="#3B82F6" name="Billed" radius={[8, 8, 0, 0]} />
              <Bar dataKey="totalPaid" fill="#10B981" name="Paid" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {reportData.length === 0 && (
        <div className="text-center text-gray-400 mt-6">No data for the selected date range</div>
      )}
    </PageContainer>
  );
};