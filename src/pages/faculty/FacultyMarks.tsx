import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, BookOpen, Users, BadgeCheck } from "lucide-react";

const SUBJECTS  = ["Mathematics","Physics","Chemistry","Computer Science","English"];
const SECTIONS  = ["A","B","C","D"];
const EXAM_TYPES = [{ value:"mid",label:"Mid Term" },{ value:"assignment",label:"Assignment" },{ value:"sem",label:"Semester" }];
const EXAM_NAMES: Record<string,string[]> = {
  mid: ["mid1","mid2"],
  assignment: ["assignment1","assignment2","assignment3","assignment4","assignment5"],
  sem: ["sem1","sem2","sem3","sem4","sem5","sem6","sem7","sem8"],
};
const AVATAR_COLORS = ["bg-blue-500","bg-teal-500","bg-purple-500","bg-orange-400","bg-pink-500","bg-indigo-500"];

export default function FacultyMarks() {
  const { toast } = useToast();
  const [students, setStudents]   = useState<any[]>([]);
  const [section,  setSection]    = useState("");
  const [subject,  setSubject]    = useState("");
  const [examType, setExamType]   = useState("");
  const [examName, setExamName]   = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [marks,     setMarks]     = useState<Record<string,string>>({});
  const [existing,  setExisting]  = useState<Record<string,number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (section) { loadStudents(section); setMarks({}); setExisting({}); }
    else setStudents([]);
  }, [section]);

  useEffect(() => { setExamName(""); }, [examType]);

  useEffect(() => {
    if (subject && examName && students.length > 0) loadExistingMarks();
    else setExisting({});
  }, [subject, examName, students]);

  const loadStudents = async (sec: string) => {
    setLoadingStudents(true);
    try { const r = await api.get("/students", { params: { section: sec } }); setStudents(r.data); }
    catch { console.error("Failed"); }
    finally { setLoadingStudents(false); }
  };

  const loadExistingMarks = useCallback(async () => {
    setLoadingExisting(true);
    try {
      const results = await Promise.all(students.map(s =>
        api.get(`/marks/student/${s._id}`, { params: { subject } })
          .then(r => ({ id: s._id, records: r.data as any[] }))
          .catch(() => ({ id: s._id, records: [] }))
      ));
      const em: Record<string,number> = {};
      const prefill: Record<string,string> = {};
      results.forEach(({ id, records }) => {
        const rec = records.find((r: any) => r.exam_name === examName && r.subject === subject);
        if (rec) { em[id] = Math.round(Number(rec.marks_obtained)); prefill[id] = String(Math.round(Number(rec.marks_obtained))); }
      });
      setExisting(em); setMarks(prefill);
    } finally { setLoadingExisting(false); }
  }, [students, subject, examName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!section || !subject || !examType || !examName) {
      toast({ title: "Please fill all fields", variant: "destructive" }); return;
    }
    const entries = Object.entries(marks).filter(([,v]) => v !== "" && !isNaN(parseInt(v)));
    if (!entries.length) { toast({ title: "No marks entered", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      await Promise.all(entries.map(([sid, mark]) =>
        api.post("/marks", { student_id: sid, subject, exam_type: examType, exam_name: examName, marks_obtained: parseInt(mark), total_marks: parseInt(totalMarks) })
      ));
      toast({ title: "Marks Saved", description: `${entries.length} records saved for ${examName.toUpperCase()}` });
      await loadExistingMarks();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to save marks", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const existingCount = Object.keys(existing).length;

  const sel = (label: string, value: string, onChange: (v: string) => void, options: { value: string; label: string }[], disabled?: boolean) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="h-10 w-full rounded-xl border border-border/60 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 disabled:opacity-50">
        <option value="">{disabled ? "Select above first" : `Select ${label}`}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-800">Enter Marks</h1>

        {/* Filters */}
        <div className="card-clean p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Exam Details</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {sel("Section",   section,   v => setSection(v),   SECTIONS.map(s => ({ value: s, label: `Section ${s}` })))}
            {sel("Subject",   subject,   v => setSubject(v),   SUBJECTS.map(s => ({ value: s, label: s })),          !section)}
            {sel("Exam Type", examType,  v => setExamType(v),  EXAM_TYPES,                                            !section)}
            {sel("Exam Name", examName,  v => setExamName(v),  (examType ? EXAM_NAMES[examType] : []).map(n => ({ value: n, label: n.toUpperCase() })), !examType)}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Total Marks</label>
              <Input type="number" min="1" value={totalMarks} onChange={e => setTotalMarks(e.target.value)}
                className="h-10 bg-slate-50 border-border/60" />
            </div>
          </div>

          {section && (
            <div className="mt-4 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm text-blue-700">
              <Users className="h-4 w-4 shrink-0" />
              {loadingStudents ? "Loading students…" : `Section ${section}: ${students.length} student${students.length !== 1 ? "s" : ""}`}
            </div>
          )}
        </div>

        {/* Already saved notice */}
        {existingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            <BadgeCheck className="h-4 w-4 shrink-0" />
            {existingCount} record{existingCount !== 1 ? "s" : ""} already saved — resubmitting will update
          </div>
        )}

        {/* Marks table */}
        {section && subject && examType && examName && !loadingStudents && students.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="card-clean overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3 bg-slate-50 border-b border-border/60 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Section {section} · {subject} · {examName.toUpperCase()} <span className="text-slate-400 font-normal">/ {totalMarks}</span>
                </p>
                <button type="button" onClick={loadExistingMarks} disabled={loadingExisting}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-medium px-2 py-1 rounded-lg border border-border/60 hover:border-blue-300 transition-colors">
                  {loadingExisting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Refresh
                </button>
              </div>

              <div className="divide-y divide-border/40">
                {students.map((s, i) => {
                  const saved  = existing[s._id];
                  const val    = marks[s._id] ?? "";
                  const pct    = val !== "" && parseInt(totalMarks) > 0 ? Math.round((parseInt(val) / parseInt(totalMarks)) * 100) : null;
                  const bar    = pct === null ? "" : pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500";
                  const pctTxt = pct === null ? "" : pct >= 75 ? "text-green-600" : pct >= 50 ? "text-amber-500" : "text-red-500";
                  const initials = s.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "S";
                  return (
                    <div key={s._id} className={`flex items-center gap-4 px-5 py-3 ${saved !== undefined ? "bg-amber-50/40" : ""}`}>
                      <div className={`h-9 w-9 rounded-xl ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate flex items-center gap-2">
                          {s.name}
                          {saved !== undefined && <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">saved: {saved}</span>}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{s.email}</p>
                      </div>
                      {pct !== null && (
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs font-medium w-8 text-right ${pctTxt}`}>{pct}%</span>
                        </div>
                      )}
                      <Input
                        type="number" className="w-28 text-center h-9 bg-slate-50 border-border/60"
                        placeholder={`/ ${totalMarks}`} min="0" max={totalMarks}
                        value={val} onChange={e => setMarks(p => ({ ...p, [s._id]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm shadow-blue-200" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : existingCount > 0 ? "Update Marks" : "Save Marks"}
            </Button>
          </form>
        )}

        {section && subject && examType && examName && !loadingStudents && students.length === 0 && (
          <div className="card-clean py-12 text-center">
            <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No students found in Section {section}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
