import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { PageContainer } from "./PageContainer";
import { Table } from "./Table";

export const CustomerReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchCustomers();
    fetchReport();
  }, [fromDate, toDate]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from("customers").select("id, company_name");
    if (error) console.error("Error fetching customers:", error);
    else setCustomers(data || []);
  };

  const fetchReport = async () => {
    let query = supabase.from("tasks").select(`
      id,
      billing_amount,
      paid_amount,
      due_date,
      customers:assign_to_customer ( id, company_name )
    `);

    if (fromDate) query = query.gte("due_date", fromDate);
    if (toDate) query = query.lte("due_date", toDate);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching tasks for report:", error);
      return;
    }

    // Aggregate by customer
    const grouped: { [key: string]: any } = {};
    (data || []).forEach((task) => {
      const cust = task.customers;
      if (!cust) return;
      if (!grouped[cust.id]) {
        grouped[cust.id] = {
          customer: cust.company_name,
          totalBilling: 0,
          totalPaid: 0,
        };
      }
      grouped[cust.id].totalBilling += task.billing_amount || 0;
      grouped[cust.id].totalPaid += task.paid_amount || 0;
    });

    setReportData(Object.values(grouped));
  };

  return (
    <PageContainer title="Customer Reports">
      {/* Filters */}
      <div className="mb-6 flex gap-6 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <input
            type="date"
            className="border rounded p-2"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <input
            type="date"
            className="border rounded p-2"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Table */}
      <Table
        headers={["Customer", "Total Billing", "Total Paid", "Balance Due"]}
        rows={reportData.map((r) => [
          r.customer,
          `₹${r.totalBilling}`,
          `₹${r.totalPaid}`,
          `₹${r.totalBilling - r.totalPaid}`,
        ])}
      />
    </PageContainer>
  );
};
