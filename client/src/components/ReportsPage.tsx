// src/components/ReportsPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { PageContainer } from "./PageContainer";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { User } from "lucide-react";

export const ReportsPage = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchReport();
  }, [fromDate, toDate]);

  const fetchReport = async () => {
    let query = supabase.from("tasks").select(`
      billing_amount, paid_amount, due_date,
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
        };
      }
      grouped[emp.id].totalBilling += t.billing_amount || 0;
      grouped[emp.id].totalPaid += t.paid_amount || 0;
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
            <div className="w-full space-y-2">
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
