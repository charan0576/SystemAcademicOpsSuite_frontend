import { useEffect, useState } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, MessageSquare, BookOpen, CalendarCheck, TrendingUp, MoreHorizontal, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";

function StatCard({ label, value, icon: Icon, iconBg, iconColor, borderColor, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  iconBg: string; iconColor: string; borderColor: string; sub?: string;
}) {
  return (
    <div className={`card-clean p-5 border-t-4 ${borderColor} flex items-center gap-4`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function FacultyDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, doubts: 0, pending: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [recentDoubts, setRecentDoubts] = useState<any[]>([]);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const [studentsRes, doubtsRes] = await Promise.all([
        api.get("/students").catch(() => ({ data: [] })),
        api.get("/doubts").catch(() => ({ data: [] })),
      ]);
      const allDoubts = doubtsRes.data || [];
      setStats({
        students: studentsRes.data.length,
        doubts: allDoubts.length,
        pending: allDoubts.filter((d: any) => !d.reply).length,
      });
      setStudents(studentsRes.data.slice(0, 5));
      setRecentDoubts(allDoubts.slice(0, 4));
    } catch (e) { console.error(e); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Faculty Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Welcome, {profile?.name} · {profile?.department}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white border border-border/60 rounded-lg px-3 py-2">
            <Clock className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Students"      value={stats.students} icon={Users}         iconBg="bg-blue-50"   iconColor="text-blue-500"   borderColor="border-t-blue-500"   sub="Enrolled" />
          <StatCard label="Total Doubts"  value={stats.doubts}   icon={MessageSquare} iconBg="bg-teal-50"   iconColor="text-teal-500"   borderColor="border-t-teal-500"   sub="Received" />
          <StatCard label="Pending"       value={stats.pending}  icon={BookOpen}      iconBg="bg-orange-50" iconColor="text-orange-500" borderColor="border-t-orange-500" sub="Unanswered" />
          <StatCard label="Answered"      value={stats.doubts - stats.pending} icon={CalendarCheck} iconBg="bg-green-50" iconColor="text-green-500" borderColor="border-t-green-500" sub="Resolved" />
        </div>

        {/* Content rows */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Recent doubts */}
          <div className="lg:col-span-3 card-clean p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Recent Doubts</h3>
                <p className="text-xs text-slate-400">Total — {stats.doubts}</p>
              </div>
              <button className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              {recentDoubts.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No doubts yet</p>
              ) : recentDoubts.map((d, i) => (
                <div key={d._id || i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-border/40">
                  <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${d.reply ? "bg-green-500" : "bg-orange-400"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{d.subject || "General"}</p>
                    <p className="text-xs text-slate-400 truncate">{d.question || "No content"}</p>
                  </div>
                  <span className={d.reply ? "badge-green ml-auto shrink-0" : "badge-orange ml-auto shrink-0"}>
                    {d.reply ? "Answered" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/faculty/doubts" className="mt-4 flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Students list */}
          <div className="lg:col-span-2 card-clean p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Students</h3>
                <p className="text-xs text-slate-400">Total — {stats.students}</p>
              </div>
              <button className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              {students.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No students yet</p>
              ) : students.map((s, i) => {
                const colors = ["bg-blue-500", "bg-teal-500", "bg-orange-400", "bg-purple-500", "bg-red-500"];
                const initials = s.name ? s.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
                return (
                  <div key={s._id || i} className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full ${colors[i % colors.length]} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400 truncate">{s.department} · Year {s.year}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/faculty/students" className="mt-4 flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
              View all students <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
