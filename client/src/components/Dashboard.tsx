import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  UserCheck,
  ClipboardList,
  CheckCircle,
  FileText,
  TrendingUp,
} from "lucide-react";

export const Dashboard = () => {
  const [customers, setCustomers] = useState(0);
  const [employees, setEmployees] = useState(0);
  const [tasksInProgress, setTasksInProgress] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [invoices, setInvoices] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [paid, setPaid] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { count: custCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });
    setCustomers(custCount || 0);

    const { count: empCount } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true });
    setEmployees(empCount || 0);

    const { data: tasks } = await supabase.from("tasks").select("status");
    if (tasks) {
      setTasksInProgress(tasks.filter((t) => t.status === "In Progress").length);
      setTasksCompleted(tasks.filter((t) => t.status === "Completed").length);
    }

    const { data: inv } = await supabase
      .from("invoices")
      .select("total_amount, paid_amount");
    if (inv) {
      setInvoices(inv.length);
      const totalPaid = inv.reduce((sum, i) => sum + i.paid_amount, 0);
      const balance = inv.reduce(
        (sum, i) => sum + (i.total_amount - i.paid_amount),
        0
      );
      setPaid(totalPaid);
      setOutstanding(balance);
    }
  };

  const taskData = [
    { name: "In Progress", value: Number(tasksInProgress) || 0 },
    { name: "Completed", value: Number(tasksCompleted) || 0 },
  ];
  const COLORS = ["#FF9800", "#4CAF50"];

  const invoiceData = [
    { name: "Paid", value: Number(paid) || 0 },
    { name: "Outstanding", value: Number(outstanding) || 0 },
  ];

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg text-white flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">K Sriram &amp; Associates</h1>
          <p className="text-sm opacity-90 mt-1">
            Your business dashboard at a glance
          </p>
        </div>
        <div className="mt-3 md:mt-0 text-sm font-medium">{today}</div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Tile
          title="Customers"
          value={customers}
          link="/customers"
          icon={<Users className="w-6 h-6 text-blue-500" />}
        />
        <Tile
          title="Employees"
          value={employees}
          link="/employees"
          icon={<UserCheck className="w-6 h-6 text-green-500" />}
        />
        <Tile
          title="Tasks In Progress"
          value={tasksInProgress}
          link="/tasks"
          icon={<ClipboardList className="w-6 h-6 text-orange-500" />}
        />
        <Tile
          title="Tasks Completed"
          value={tasksCompleted}
          link="/tasks"
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
        />
        <Tile
          title="Invoices"
          value={invoices}
          link="/invoices"
          icon={<FileText className="w-6 h-6 text-purple-500" />}
        />
        <Tile
          title="Outstanding Balance"
          value={`₹${outstanding.toFixed(2)}`}
          link="/invoices"
          icon={<TrendingUp className="w-6 h-6 text-red-500" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
          <h3 className="text-gray-700 text-lg font-bold mb-4">Tasks Overview</h3>
          {taskData.every((d) => d.value === 0) ? (
            <div className="text-gray-400 text-center h-[250px] flex items-center justify-center">
              No task data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={taskData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {taskData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Invoices Bar Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
          <h3 className="text-gray-700 text-lg font-bold mb-4">Invoices Overview</h3>
          {invoiceData.every((d) => d.value === 0) ? (
            <div className="text-gray-400 text-center h-[250px] flex items-center justify-center">
              No invoice data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={invoiceData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Bar dataKey="value" fill="#2196F3" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

function Tile({
  title,
  value,
  link,
  icon,
}: {
  title: string;
  value: string | number;
  link: string;
  icon: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-2xl hover:scale-105 transition-all"
      onClick={() => navigate(link)}
    >
      <div className="mb-2">{icon}</div>
      <h3 className="text-gray-500 text-sm font-semibold">{title}</h3>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
