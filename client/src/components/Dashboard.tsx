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
  ClipboardList,
  CheckCircle,
  FileText,
  Calendar,
  Briefcase,
  AlertCircle
} from "lucide-react";

export const Dashboard = () => {
  // Stats States
  const [totalCases, setTotalCases] = useState(0);
  const [totalHearings, setTotalHearings] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [tasksInProgress, setTasksInProgress] = useState(0);
  
  // Data Lists
  const [upcomingHearings, setUpcomingHearings] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch KPI Counts
    const { count: caseCount } = await supabase.from("legal_cases").select("*", { count: "exact", head: true });
    const { count: hearingCount } = await supabase.from("legal_hearings").select("*", { count: "exact", head: true });
    const { count: custCount } = await supabase.from("customers").select("*", { count: "exact", head: true });
    
    setTotalCases(caseCount || 0);
    setTotalHearings(hearingCount || 0);
    setCustomers(custCount || 0);

    // 2. Fetch Upcoming Hearings (Joining with Legal Cases table)
    const { data: hearingsData, error: hError } = await supabase
      .from("legal_hearings")
      .select(`
        id,
        hearing_date,
        legal_cases (
          case_number,
          court_name
        )
      `)
      .gte("hearing_date", today)
      .order("hearing_date", { ascending: true })
      .limit(5);

    if (!hError && hearingsData) {
      setUpcomingHearings(hearingsData);
    }
    
    setLoading(false);
  };

  const [loading, setLoading] = useState(true);

  // Chart Data (Mocking for layout, replace with real queries as needed)
  const caseStatusData = [
    { name: "Active", value: totalCases },
    { name: "Hearings", value: totalHearings },
  ];
  const COLORS = ["#4F46E5", "#10B981"];

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Operational Overview</h1>
        <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Tile
          title="Total Cases"
          value={totalCases}
          link="/legal-cases"
          icon={<Briefcase size={24} />}
          color="bg-blue-500"
        />
        <Tile
          title="Total Hearings"
          value={totalHearings}
          link="/legal-cases"
          icon={<Calendar size={24} />}
          color="bg-indigo-500"
        />
        <Tile
          title="Customers"
          value={customers}
          link="/customers"
          icon={<Users size={24} />}
          color="bg-green-500"
        />
        <Tile
          title="Tasks Pending"
          value={tasksInProgress}
          link="/tasks"
          icon={<AlertCircle size={24} />}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Hearings Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <Calendar className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-gray-800">Next 5 Hearings</h3>
          </div>
          
          <div className="space-y-4">
            {upcomingHearings.length > 0 ? (
              upcomingHearings.map((h) => (
                <div key={h.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition border-l-4 border-indigo-500">
                  <div>
                    <p className="font-bold text-gray-900">
                      {h.legal_cases?.case_number || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">{h.legal_cases?.court_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-indigo-700 block">
                      {new Date(h.hearing_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Scheduled</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400">No upcoming hearings found.</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => navigate('/legal-cases')}
            className="w-full mt-6 text-sm text-indigo-600 font-semibold hover:underline"
          >
            View All Cases →
          </button>
        </div>

        {/* Case Distribution Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-4">Case Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {caseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {caseStatusData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span className="text-xs text-gray-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Tile Component
function Tile({ title, value, link, icon, color }: { title: string; value: any; link: string; icon: any; color: string }) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(link)}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  );
}