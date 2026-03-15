import { useEffect, useState } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, TrendingUp } from "lucide-react";

export default function StudentMarks() {
  const { profile } = useAuth();
  const [marks, setMarks] = useState<any[]>([]);

  useEffect(() => { if (profile) api.get(`/marks/student/${profile?.user_id}`).then(r => setMarks(r.data)).catch(() => {}); }, [profile]);

  const grouped = marks.reduce((acc, m) => {
    const t = m.exam_type || "other";
    if (!acc[t]) acc[t] = [];
    acc[t].push(m);
    return acc;
  }, {} as Record<string, any[]>);

  const labels: Record<string, string> = { mid: "Mid Term", assignment: "Assignments", sem: "Semester" };
  const typeColors: Record<string, { badge: string; bar: string }> = {
    mid: { badge: "badge-blue", bar: "bg-blue-500" },
    assignment: { badge: "badge-green", bar: "bg-emerald-500" },
    sem: { badge: "badge-purple", bar: "bg-purple-500" },
    other: { badge: "badge-orange", bar: "bg-orange-400" },
  };

  const totalSubjects = new Set(marks.map(m => m.subject)).size;
  const avgScore = marks.length > 0 ? Math.round(marks.reduce((s, m) => s + (m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0), 0) / marks.length) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-800">My Marks</h1>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Subjects", value: totalSubjects, bg: "bg-teal-50", text: "text-teal-600", border: "border-t-teal-500", icon: BookOpen },
            { label: "Total Records", value: marks.length, bg: "bg-blue-50", text: "text-blue-600", border: "border-t-blue-500", icon: BookOpen },
            { label: "Avg Score", value: `${avgScore}%`, bg: "bg-purple-50", text: "text-purple-600", border: "border-t-purple-500", icon: TrendingUp },
          ].map(c => (
            <div key={c.label} className={`card-clean p-5 border-t-4 ${c.border} flex items-center gap-4`}>
              <div className={`h-12 w-12 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                <c.icon className={`h-6 w-6 ${c.text}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">{c.label}</p>
                <p className={`text-2xl font-bold ${c.text}`}>{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Marks by exam type */}
        {marks.length === 0 ? (
          <div className="card-clean p-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">No marks records yet</p>
          </div>
        ) : Object.entries(grouped).map(([type, items]) => {
          const c = typeColors[type] || typeColors.other;
          return (
            <div key={type} className="card-clean overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
                <h3 className="font-semibold text-slate-800">{labels[type] || type}</h3>
                <span className={c.badge}>{(items as any[]).length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Subject</th>
                      <th className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Obtained</th>
                      <th className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Max</th>
                      <th className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide w-40">Progress</th>
                      <th className="px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items as any[]).map((m, i) => {
                      const pct = m.max_marks > 0 ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0;
                      const grade = pct >= 90 ? "O" : pct >= 80 ? "A+" : pct >= 70 ? "A" : pct >= 60 ? "B" : pct >= 50 ? "C" : "F";
                      const gradeColor = pct >= 70 ? "badge-green" : pct >= 50 ? "badge-orange" : "badge-red";
                      return (
                        <tr key={m._id || i} className="border-t border-border/40 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-slate-700">{m.subject}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-800">{m.marks_obtained}</td>
                          <td className="px-5 py-3.5 text-slate-400">{m.max_marks}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-slate-500 w-8">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5"><span className={gradeColor}>{grade}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
