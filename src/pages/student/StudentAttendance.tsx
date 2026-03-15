import { useEffect, useState } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Check, X, CalendarCheck } from "lucide-react";

interface AttendanceRecord {
  _id: string; subject: string; date: string; status: "present" | "absent";
}

function groupByDate(records: AttendanceRecord[]): Map<string, AttendanceRecord[]> {
  const map = new Map<string, AttendanceRecord[]>();
  [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach(rec => {
      if (!map.has(rec.date)) map.set(rec.date, []);
      map.get(rec.date)!.push(rec);
    });
  return map;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function StudentAttendance() {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [percentage, setPercentage] = useState(0);
  const [present, setPresent] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => { if (profile) load(); }, [profile]);

  const load = async () => {
    try {
      const [recs, pct] = await Promise.all([
        api.get(`/attendance/student/${profile?.user_id}`),
        api.get(`/attendance/percentage/${profile?.user_id}`),
      ]);
      setAttendance(recs.data);
      setPercentage(pct.data.percentage || 0);
      setPresent(pct.data.present || 0);
      setTotal(pct.data.total || 0);
    } catch (e) { console.error(e); }
  };

  const grouped = groupByDate(attendance);
  const color = percentage >= 75 ? "text-green-600" : percentage >= 60 ? "text-amber-500" : "text-red-500";
  const bgRing = percentage >= 75 ? "border-green-400" : percentage >= 60 ? "border-amber-400" : "border-red-400";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-800">My Attendance</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Overall", value: `${percentage}%`, bg: "bg-blue-50", text: "text-blue-600", border: "border-t-blue-500" },
            { label: "Present Days", value: present, bg: "bg-green-50", text: "text-green-600", border: "border-t-green-500" },
            { label: "Absent Days", value: total - present, bg: "bg-red-50", text: "text-red-600", border: "border-t-red-500" },
            { label: "Total Days", value: total, bg: "bg-slate-50", text: "text-slate-700", border: "border-t-slate-400" },
          ].map(c => (
            <div key={c.label} className={`card-clean p-5 border-t-4 ${c.border}`}>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{c.label}</p>
              <p className={`text-3xl font-bold mt-1 ${c.text}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Visual percentage bar */}
        <div className="card-clean p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Attendance Rate</p>
            <span className={`text-sm font-bold ${color}`}>{percentage}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${percentage >= 75 ? "bg-green-500" : percentage >= 60 ? "bg-amber-400" : "bg-red-500"}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {percentage >= 75 ? "✅ Good attendance — keep it up!" : percentage >= 60 ? "⚠️ Attendance is low — try to attend more classes." : "❌ Critical — attendance below minimum requirement."}
          </p>
        </div>

        {/* Day-by-day records */}
        <div className="card-clean p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Day-by-Day Record</h3>
          {grouped.size === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No attendance records yet</p>
          ) : (
            <div className="space-y-5">
              {[...grouped.entries()].map(([date, recs]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{formatDate(date)}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recs.map(r => (
                      <div key={r._id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${r.status === "present" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${r.status === "present" ? "bg-green-100" : "bg-red-100"}`}>
                          {r.status === "present"
                            ? <Check className="h-4 w-4 text-green-600" />
                            : <X className="h-4 w-4 text-red-500" />}
                        </div>
                        <p className="text-sm font-medium text-slate-700 truncate">{r.subject}</p>
                        <span className={`ml-auto text-xs font-semibold ${r.status === "present" ? "text-green-600" : "text-red-500"}`}>
                          {r.status === "present" ? "P" : "A"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
