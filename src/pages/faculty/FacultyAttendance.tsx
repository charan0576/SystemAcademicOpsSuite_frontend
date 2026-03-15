import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Users, Loader2, RefreshCw, CalendarCheck } from "lucide-react";

const SUBJECTS = ["Mathematics","Physics","Chemistry","Computer Science","English"];
const SECTIONS = ["A","B","C","D"];

export default function FacultyAttendance() {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [section, setSection] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [alreadyMarked, setAlreadyMarked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (section) { loadStudents(section); setAttendance({}); setAlreadyMarked({}); }
    else setStudents([]);
  }, [section]);

  useEffect(() => {
    if (subject && date && students.length > 0) loadExisting();
  }, [subject, date, students]);

  const loadStudents = async (sec: string) => {
    setLoadingStudents(true);
    try { const r = await api.get("/students", { params: { section: sec } }); setStudents(r.data); }
    catch { console.error("Failed loading students"); }
    finally { setLoadingStudents(false); }
  };

  const loadExisting = useCallback(async () => {
    setLoadingExisting(true);
    try {
      const results = await Promise.all(students.map(s =>
        api.get(`/attendance/student/${s._id}`, { params: { subject } })
          .then(r => ({ id: s._id, records: r.data as any[] }))
          .catch(() => ({ id: s._id, records: [] }))
      ));
      const marked: Record<string, boolean> = {};
      const status: Record<string, string> = {};
      results.forEach(({ id, records }) => {
        const rec = records.find((r: any) => r.date === date);
        if (rec) { marked[id] = true; status[id] = rec.status; }
        else marked[id] = false;
      });
      setAlreadyMarked(marked); setAttendance(status);
    } finally { setLoadingExisting(false); }
  }, [students, subject, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!section) { toast({ title: "Select a section", variant: "destructive" }); return; }
    if (!subject) { toast({ title: "Select a subject", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      await Promise.all(students.map(s =>
        api.post("/attendance", { student_id: s._id, subject, date, status: attendance[s._id] || "absent" })
      ));
      toast({ title: "Attendance Saved", description: `Section ${section} — ${subject} — ${date}` });
      await loadExisting();
    } catch { toast({ title: "Error", description: "Failed to save attendance", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const presentCount = students.filter(s => (attendance[s._id] || "absent") === "present").length;
  const alreadyCount = Object.values(alreadyMarked).filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-800">Mark Attendance</h1>

        {/* Filter row */}
        <div className="card-clean p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Attendance Details</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Section</label>
              <select
                value={section}
                onChange={e => { setSection(e.target.value); setSubject(""); }}
                className="h-10 w-full rounded-xl border border-border/60 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400"
              >
                <option value="">Select section</option>
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Subject</label>
              <select
                value={subject} onChange={e => setSubject(e.target.value)} disabled={!section}
                className="h-10 w-full rounded-xl border border-border/60 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 disabled:opacity-50"
              >
                <option value="">{section ? "Select subject" : "Select section first"}</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Date</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="h-10 bg-slate-50 border-border/60" />
            </div>
          </div>
        </div>

        {/* Already marked notice */}
        {alreadyCount > 0 && subject && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            <CalendarCheck className="h-4 w-4 shrink-0" />
            {alreadyCount} student{alreadyCount !== 1 ? "s" : ""} already marked — resubmitting will update their record
          </div>
        )}

        {/* Students */}
        {section && loadingStudents && (
          <div className="card-clean py-10 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500 mx-auto" />
          </div>
        )}

        {section && subject && !loadingStudents && students.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="card-clean overflow-hidden">
              {/* List header */}
              <div className="px-5 py-3 bg-slate-50 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />{presentCount} present
                  </span>
                  <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                    <XCircle className="h-4 w-4" />{students.length - presentCount} absent
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {loadingExisting && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                  <button type="button" onClick={loadExisting} disabled={loadingExisting}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-medium px-2 py-1 rounded-lg border border-border/60 hover:border-blue-300 transition-colors">
                    <RefreshCw className="h-3.5 w-3.5" />Refresh
                  </button>
                  <button type="button" onClick={() => { const a: Record<string,string>={}; students.forEach(s => a[s._id]="present"); setAttendance(a); }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                    All Present
                  </button>
                </div>
              </div>

              {/* Student rows */}
              <div className="divide-y divide-border/40">
                {students.map((s, i) => {
                  const isPresent = (attendance[s._id] || "absent") === "present";
                  const wasSaved = alreadyMarked[s._id];
                  const colors = ["bg-blue-500","bg-teal-500","bg-purple-500","bg-orange-400","bg-pink-500","bg-indigo-500"];
                  const initials = s.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "S";
                  return (
                    <div key={s._id} className={`flex items-center gap-4 px-5 py-3 transition-colors ${isPresent ? "bg-green-50/50" : "bg-red-50/30"}`}>
                      <div className={`h-9 w-9 rounded-xl ${colors[i % colors.length]} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate flex items-center gap-2">
                          {s.name}
                          {wasSaved && <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">saved</span>}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{s.email}</p>
                      </div>
                      <div className="flex rounded-lg overflow-hidden border border-border/60 shrink-0">
                        <button type="button" onClick={() => setAttendance(p => ({ ...p, [s._id]: "present" }))}
                          className={`px-4 py-1.5 text-sm font-semibold transition-colors ${isPresent ? "bg-green-500 text-white" : "bg-white text-slate-400 hover:bg-green-50"}`}>
                          P
                        </button>
                        <button type="button" onClick={() => setAttendance(p => ({ ...p, [s._id]: "absent" }))}
                          className={`px-4 py-1.5 text-sm font-semibold transition-colors border-l border-border/60 ${!isPresent ? "bg-red-500 text-white" : "bg-white text-slate-400 hover:bg-red-50"}`}>
                          A
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm shadow-blue-200" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : alreadyCount > 0 ? "Update Attendance" : "Save Attendance"}
            </Button>
          </form>
        )}

        {section && subject && !loadingStudents && students.length === 0 && (
          <div className="card-clean py-12 text-center">
            <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No students found in Section {section}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
