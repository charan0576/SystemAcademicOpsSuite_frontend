import { useEffect, useState } from "react";
import { api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Search, Calendar, Clock, Check, X,
  Trash2, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────
interface Student { _id: string; name: string; email: string; department: string; year?: string; section?: string; }
interface AttendanceRecord { _id: string; subject: string; date: string; status: "present"|"absent"; faculty_name?: string; }
interface TimetableSlot  { time: string; subject: string; }
type TabId = "attendance" | "timetable";

const DAYS         = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_COLORS   = ["bg-cyan-500","bg-teal-500","bg-sky-500","bg-blue-500","bg-violet-500","bg-slate-400"];
const AVATAR_COLORS= ["bg-cyan-500","bg-teal-500","bg-sky-500","bg-blue-500","bg-violet-500","bg-pink-400"];

function toISODate(d: string) { return d.split("T")[0]; }
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
}
function isToday(d: string) { return toISODate(d) === new Date().toISOString().split("T")[0]; }
function groupByDate(recs: AttendanceRecord[]) {
  const m = new Map<string, AttendanceRecord[]>();
  [...recs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach(r => { const k = toISODate(r.date); if (!m.has(k)) m.set(k,[]); m.get(k)!.push(r); });
  return m;
}

// ── Confirm delete modal ──────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }: { message:string; onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4 border border-cyan-100">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Confirm Delete</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="py-10 flex justify-center">
      <div className="h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── ATTENDANCE TAB ────────────────────────────────────────────────────────
function AttendanceTab({ studentId, toast }: { studentId: string; toast: any }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ id:string; label:string }|null>(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/attendance/student/${studentId}`)
      .then(r => setRecords(r.data))
      .catch(() => toast({ title:"Error", description:"Could not load attendance", variant:"destructive" }))
      .finally(() => setLoading(false));
  }, [studentId]);

  const del = async (id: string) => {
    try {
      await api.delete(`/attendance/${id}`);
      toast({ title:"Deleted" });
      setRecords(p => p.filter(r => r._id !== id));
    } catch { toast({ title:"Error", description:"Failed to delete", variant:"destructive" }); }
    finally { setConfirm(null); }
  };

  if (loading) return <Spinner />;

  const present = records.filter(r => r.status === "present").length;
  const pct = records.length ? Math.round((present / records.length) * 100) : 0;
  const pColor = pct >= 75 ? "text-teal-600" : pct >= 60 ? "text-amber-500" : "text-red-500";
  const pBorder = pct >= 75 ? "border-t-teal-400" : pct >= 60 ? "border-t-amber-400" : "border-t-red-400";
  const grouped = groupByDate(records);

  return (
    <>
      {confirm && <ConfirmModal message={`Delete: ${confirm.label}?`} onConfirm={() => del(confirm.id)} onCancel={() => setConfirm(null)} />}

      {records.length === 0 ? (
        <div className="py-14 text-center text-slate-400">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No attendance records yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:"Overall",  value:`${pct}%`,                   color:pColor,       border:pBorder },
              { label:"Present",  value:present,                     color:"text-teal-600", border:"border-t-teal-400" },
              { label:"Absent",   value:records.length - present,    color:"text-red-500",  border:"border-t-red-400"  },
              { label:"Total",    value:records.length,              color:"text-slate-600",border:"border-t-slate-300" },
            ].map(c => (
              <div key={c.label} className={`bg-white rounded-xl border border-cyan-100 border-t-4 ${c.border} p-3 text-center shadow-sm`}>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-xl border border-cyan-100 p-4 shadow-sm">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Attendance Rate</span>
              <span className={`font-bold ${pColor}`}>{pct}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${pct>=75?"bg-teal-400":pct>=60?"bg-amber-400":"bg-red-400"}`} style={{width:`${pct}%`}} />
            </div>
          </div>

          {/* Date groups */}
          {Array.from(grouped.entries()).map(([date, recs]) => {
            const today = isToday(date);
            const dp = recs.filter(r => r.status === "present").length;
            return (
              <div key={date} className="space-y-1.5">
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${today ? "bg-cyan-50 border-cyan-200" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 shrink-0 ${today ? "text-cyan-500" : "text-slate-400"}`} />
                    <span className={`font-semibold text-sm ${today ? "text-cyan-700" : "text-slate-700"}`}>
                      {fmtDate(date)}
                      {today && <span className="ml-2 text-[10px] bg-cyan-200 text-cyan-700 px-1.5 py-0.5 rounded-full">Today</span>}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{dp}/{recs.length}</span>
                </div>
                <div className="space-y-1.5 pl-2">
                  {recs.map(r => (
                    <div key={r._id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${r.status === "present" ? "border-teal-100 bg-teal-50/60" : "border-red-100 bg-red-50/40"}`}>
                      <div>
                        <p className="font-medium text-sm text-slate-700">{r.subject}</p>
                        {r.faculty_name && <p className="text-xs text-slate-400">by {r.faculty_name}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 text-sm font-semibold ${r.status === "present" ? "text-teal-600" : "text-red-500"}`}>
                          {r.status === "present" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          <span className="capitalize hidden sm:block">{r.status}</span>
                        </div>
                        <button onClick={() => setConfirm({ id:r._id, label:`${r.subject} on ${r.date}` })}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── TIMETABLE TAB ─────────────────────────────────────────────────────────
function TimetableTab({ toast }: { toast: any }) {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [selected,   setSelected]   = useState<number|null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    api.get("/timetables")
      .then(r => { setTimetables(r.data); if (r.data.length > 0) setSelected(r.data[0].semester); })
      .catch(() => toast({ title:"Error", description:"Could not load timetables", variant:"destructive" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!timetables.length) return (
    <div className="py-14 text-center text-slate-400">
      <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No timetables created yet</p>
    </div>
  );

  const active = timetables.find(t => t.semester === selected);
  return (
    <>
      {/* Semester pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {timetables.map(t => (
          <button key={t.semester} onClick={() => setSelected(t.semester)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border ${selected === t.semester ? "bg-cyan-500 text-white border-cyan-500 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-cyan-300 hover:text-cyan-600"}`}>
            Sem {t.semester}
          </button>
        ))}
      </div>

      {active && (
        <div className="space-y-3">
          {DAYS.map((day, di) => {
            const slots: TimetableSlot[] = active.schedule?.[day] || [];
            if (!slots.length) return null;
            return (
              <div key={day} className="bg-white rounded-xl border border-cyan-100 overflow-hidden shadow-sm">
                <div className={`px-4 py-2.5 ${DAY_COLORS[di % DAY_COLORS.length]}`}>
                  <span className="font-semibold text-sm text-white">{day}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {slots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 w-36 shrink-0">
                        <Clock className="h-3.5 w-3.5 shrink-0" />{slot.time}
                      </div>
                      <p className="font-medium text-sm text-slate-700">{slot.subject}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── STUDENT PANEL (inline) ────────────────────────────────────────────────
function StudentPanel({ student, onClose }: { student: Student; onClose: () => void }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>("attendance");
  const initials = student.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const TABS: [TabId, string, React.ReactNode][] = [
    ["attendance", "Attendance", <Calendar className="h-4 w-4" />],
    ["timetable",  "Timetable",  <Clock    className="h-4 w-4" />],
  ];

  return (
    <div className="card-clean overflow-hidden">
      {/* Panel header — cyan gradient */}
      <div className="flex items-center gap-4 px-5 py-4" style={{ background:"linear-gradient(90deg,#0ea5c9,#06b6d4,#22d3ee)" }}>
        <div className="h-12 w-12 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-lg font-black text-white shrink-0 border border-white/30">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-white truncate">{student.name}</h2>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-xs text-cyan-100 truncate">{student.email}</span>
            {student.department && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{student.department}</span>}
            {student.year       && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Yr {student.year}</span>}
            {student.section    && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Sec {student.section}</span>}
          </div>
        </div>
        <button onClick={onClose}
          className="h-8 w-8 rounded-xl bg-white/20 hover:bg-white/35 flex items-center justify-center text-white transition-colors shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-cyan-100 bg-cyan-50/40">
        {TABS.map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === id
                ? "border-cyan-500 text-cyan-700 bg-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        {tab === "attendance" && <AttendanceTab studentId={student._id} toast={toast} />}
        {tab === "timetable"  && <TimetableTab  toast={toast} />}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function FacultyStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Student|null>(null);

  useEffect(() => {
    api.get("/students").then(r => setStudents(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.department || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.year || "").includes(search) ||
    (s.section || "").toLowerCase().includes(search.toLowerCase())
  );

  const initials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Students</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {students.length} enrolled · click to view details
            </p>
          </div>
          <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2 text-sm text-cyan-700 font-semibold">
            <Users className="h-4 w-4" />{students.length}
          </div>
        </div>

        {/* Two-column layout on desktop */}
        <div className={`grid gap-5 ${selected ? "lg:grid-cols-5" : "grid-cols-1"}`}>

          {/* Student list */}
          <div className={selected ? "lg:col-span-2" : "col-span-1"}>
            <div className="card-clean overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-cyan-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text" placeholder="Search students…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-cyan-100 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* List */}
              {loading ? (
                <div className="py-14 text-center text-slate-400 flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-14 text-center">
                  <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">{search ? "No matches" : "No students yet"}</p>
                </div>
              ) : (
                <div className="divide-y divide-cyan-50 max-h-[72vh] overflow-y-auto">
                  {filtered.map((s, i) => {
                    const active = selected?._id === s._id;
                    return (
                      <button
                        key={s._id}
                        onClick={() => setSelected(active ? null : s)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
                          active
                            ? "bg-cyan-50 border-l-4 border-l-cyan-500"
                            : "hover:bg-slate-50 border-l-4 border-l-transparent"
                        }`}
                      >
                        <div className={`h-9 w-9 rounded-xl ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                          {initials(s.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${active ? "text-cyan-700" : "text-slate-800"}`}>{s.name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {s.department}{s.year ? ` · Yr ${s.year}` : ""}{s.section ? ` · Sec ${s.section}` : ""}
                          </p>
                        </div>
                        {active
                          ? <ChevronUp className="h-4 w-4 text-cyan-500 shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-slate-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Desktop: panel right side */}
          {selected && (
            <div className="hidden lg:block lg:col-span-3">
              <StudentPanel student={selected} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>

        {/* Mobile: panel below list */}
        {selected && (
          <div className="lg:hidden">
            <StudentPanel student={selected} onClose={() => setSelected(null)} />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
