import { useEffect, useState } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, CalendarCheck, MessageSquare, GraduationCap, TrendingUp, Clock, MoreHorizontal, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// ── Mini stat card ────────────────────────────────────────────────────────────
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

// ── Donut chart (pure CSS/SVG) ────────────────────────────────────────────────
function DonutChart({ percentage }: { percentage: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (percentage / 100) * circ;
  const gap = circ - dash;
  return (
    <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="#22c55e" strokeWidth="12"
        strokeDasharray={`${dash} ${gap}`} strokeLinecap="round" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f97316" strokeWidth="12"
        strokeDasharray={`${(100 - percentage) / 100 * circ * 0.5} ${circ}`}
        strokeDashoffset={-dash} strokeLinecap="round" />
    </svg>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = "bg-blue-500" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ attendance: 0, subjects: 0, doubts: 0, present: 0, total: 0 });
  const [marks, setMarks] = useState<any[]>([]);
  const [recentActivity] = useState([
    { text: "New course is added", date: "Date 5/25/2025", dot: "bg-blue-500" },
    { text: "New course is added", date: "Date 5/23/2025", dot: "bg-emerald-500" },
    { text: "New course is added", date: "Date 5/20/2025", dot: "bg-orange-400" },
  ]);

  useEffect(() => { if (profile) loadStats(); }, [profile]);

  const loadStats = async () => {
    try {
      const [attendanceRes, marksRes, doubtsRes, percentRes] = await Promise.all([
        api.get(`/attendance/percentage/${profile?.user_id}`).catch(() => ({ data: { percentage: 0, present: 0, total: 0 } })),
        api.get(`/marks/student/${profile?.user_id}`).catch(() => ({ data: [] })),
        api.get(`/doubts/student/${profile?.user_id}`).catch(() => ({ data: [] })),
        api.get(`/attendance/percentage/${profile?.user_id}`).catch(() => ({ data: { percentage: 0 } })),
      ]);
      setStats({
        attendance: attendanceRes.data.percentage || 0,
        subjects: new Set(marksRes.data.map((m: any) => m.subject)).size || 0,
        doubts: doubtsRes.data.length || 0,
        present: attendanceRes.data.present || 0,
        total: attendanceRes.data.total || 0,
      });
      setMarks(marksRes.data.slice(0, 4));
    } catch (e) { console.error(e); }
  };

  const absPercent = 100 - stats.attendance;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Page heading */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Welcome back, {profile?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {profile?.department && <span className="mr-2">{profile.department}</span>}
              {profile?.year && <span className="mr-2">Year {profile.year}</span>}
              {(profile as any)?.section && <span>Section {(profile as any).section}</span>}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white border border-border/60 rounded-lg px-3 py-2">
            <Clock className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="My Courses"    value={stats.subjects}    icon={BookOpen}       iconBg="bg-teal-50"   iconColor="text-teal-500"   borderColor="border-t-teal-500"   sub="Enrolled" />
          <StatCard label="Assignments"   value={stats.doubts}      icon={GraduationCap}  iconBg="bg-blue-50"   iconColor="text-blue-500"   borderColor="border-t-blue-500"   sub="Total" />
          <StatCard label="Attendance"    value={`${stats.attendance}%`} icon={CalendarCheck} iconBg="bg-green-50" iconColor="text-green-500" borderColor="border-t-green-500" sub="Overall" />
          <StatCard label="Activities"    value={stats.doubts}      icon={MessageSquare}  iconBg="bg-red-50"    iconColor="text-red-500"    borderColor="border-t-red-500"    sub="Doubts" />
        </div>

        {/* ── Middle row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Assignments / Marks */}
          <div className="lg:col-span-3 card-clean p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">My Assignment</h3>
                <p className="text-xs text-slate-400">Total assignments — {marks.length}</p>
              </div>
              <button className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              {marks.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No marks records yet</p>
              ) : marks.map((m, i) => {
                const pct = m.max_marks > 0 ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0;
                const colors = ["bg-blue-500", "bg-teal-500", "bg-orange-400", "bg-purple-500"];
                const statuses = ["Completed", "In Progress", "Completed", "Pending"];
                const statusColors = ["badge-green", "badge-blue", "badge-green", "badge-orange"];
                return (
                  <div key={m._id || i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{m.subject || "Subject"}</p>
                        <p className="text-xs text-slate-400">
                          {m.exam_type ? m.exam_type.toUpperCase() : "Exam"} — {m.marks_obtained}/{m.max_marks}
                        </p>
                      </div>
                      <span className={statusColors[i % statusColors.length]}>{statuses[i % statuses.length]}</span>
                    </div>
                    <ProgressBar pct={pct} color={colors[i % colors.length]} />
                  </div>
                );
              })}
            </div>
            <Link to="/student/marks" className="mt-4 flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* My Courses quick list */}
          <div className="lg:col-span-2 card-clean p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">My Courses</h3>
                <p className="text-xs text-slate-400">Total Courses — {stats.subjects}</p>
              </div>
              <button className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              {marks.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No courses yet</p>
              ) : [...new Map(marks.map(m => [m.subject, m])).values()].slice(0, 4).map((m, i) => {
                const colors = ["bg-teal-500", "bg-blue-500", "bg-orange-400", "bg-purple-500"];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colors[i % colors.length]} flex items-center justify-center shrink-0`}>
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{m.subject}</p>
                      <p className="text-xs text-slate-400">
                        Start: {m.created_at ? new Date(m.created_at).toLocaleDateString("en-IN") : "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Attendance donut */}
          <div className="lg:col-span-2 card-clean p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Attendance</h3>
              <button className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative">
                <DonutChart percentage={stats.attendance} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-800">{stats.attendance}%</span>
                  <span className="text-xs text-slate-400">Present</span>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                  <span className="text-slate-500">Absent</span>
                  <span className="font-semibold text-slate-700">{stats.total - stats.present}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-slate-500">Present</span>
                  <span className="font-semibold text-slate-700">{stats.present}</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-400">Total Days <strong className="text-slate-700">{stats.total}</strong></p>
              <div className="w-full mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-orange-50 rounded-lg p-2 text-center">
                  <p className="text-orange-600 font-semibold">{stats.total - stats.present}</p>
                  <p className="text-slate-400">Absent Days</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-green-600 font-semibold">{stats.present}</p>
                  <p className="text-slate-400">Present Days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent activities */}
          <div className="lg:col-span-3 card-clean p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Recent Activities</h3>
              <button className="text-slate-300 hover:text-slate-500"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${a.dot}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{a.text}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/student/doubts" className="mt-4 flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
              View all activities <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
