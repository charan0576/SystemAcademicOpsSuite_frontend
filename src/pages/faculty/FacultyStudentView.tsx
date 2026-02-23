import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Check, X, Trash2, Calendar, BookOpen,
  Clock, User, AlertTriangle, Pencil, Save,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Student { _id: string; name: string; email: string; department: string; year?: string; }
interface AttendanceRecord { _id: string; subject: string; date: string; status: "present"|"absent"; faculty_name?: string; }
interface MarkRecord { _id: string; subject: string; exam_type: string; exam_name: string; marks_obtained: number; total_marks: number; }
interface TimetableSlot { time: string; subject: string; }

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const EXAM_TYPE_LABEL: Record<string,string> = { mid:"Mid Term", assignment:"Assignment", sem:"Semester" };

// ─── Helpers ────────────────────────────────────────────────────────────────
function groupAttByDate(records: AttendanceRecord[]) {
  const map = new Map<string, AttendanceRecord[]>();
  [...records]
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach(r => { if (!map.has(r.date)) map.set(r.date, []); map.get(r.date)!.push(r); });
  return map;
}
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}
function isToday(d: string) { return d === new Date().toISOString().split("T")[0]; }
function toNum(v: any): number { return Math.round(Number(v)); }

// ─── Confirm Delete Modal ────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }: { message:string; onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Marks Modal ────────────────────────────────────────────────────────
function EditMarkModal({
  mark, onSave, onCancel,
}: {
  mark: MarkRecord;
  onSave: (id: string, obtained: number, total: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [obtained, setObtained] = useState(String(toNum(mark.marks_obtained)));
  const [total, setTotal]       = useState(String(toNum(mark.total_marks)));
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    const o = parseInt(obtained), t = parseInt(total);
    if (isNaN(o) || isNaN(t) || o < 0 || t < 1 || o > t) return;
    setSaving(true);
    await onSave(mark._id, o, t);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Pencil className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Edit Mark</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {mark.exam_name.toUpperCase()} · {mark.subject}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Marks Obtained</Label>
            <Input type="number" min="0" value={obtained}
              onChange={e => setObtained(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Total Marks</Label>
            <Input type="number" min="1" value={total}
              onChange={e => setTotal(e.target.value)} />
          </div>
        </div>
        {parseInt(obtained) > parseInt(total) && (
          <p className="text-xs text-red-500">Obtained marks cannot exceed total marks</p>
        )}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || parseInt(obtained) > parseInt(total)}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Attendance ─────────────────────────────────────────────────────────
function AttendanceTab({ studentId, toast }: { studentId:string; toast: ReturnType<typeof useToast>["toast"] }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{id:string;label:string}|null>(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/attendance/student/${studentId}`)
      .then(r => setRecords(r.data))
      .catch(() => toast({ title:"Error", description:"Could not load attendance", variant:"destructive" }))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/attendance/${id}`);
      toast({ title:"Deleted", description:"Attendance record removed." });
      setRecords(prev => prev.filter(r => r._id !== id));
    } catch {
      toast({ title:"Error", description:"Failed to delete record", variant:"destructive" });
    } finally { setConfirm(null); }
  };

  if (loading) return <p className="py-10 text-center text-muted-foreground">Loading…</p>;

  const grouped = groupAttByDate(records);
  const presentCount = records.filter(r => r.status === "present").length;
  const pct = records.length ? Math.round((presentCount / records.length) * 100) : 0;
  const pctColor = pct>=75?"text-green-600":pct>=60?"text-amber-500":"text-red-600";
  const pctBg   = pct>=75?"bg-green-50 border-green-200":pct>=60?"bg-amber-50 border-amber-200":"bg-red-50 border-red-200";

  return (
    <>
      {confirm && <ConfirmModal message={`Delete attendance for ${confirm.label}?`} onConfirm={()=>handleDelete(confirm.id)} onCancel={()=>setConfirm(null)} />}
      {records.length === 0 ? (
        <div className="py-14 text-center text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-25" /><p>No attendance records found</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary */}
          <div className={`flex flex-wrap items-center gap-5 rounded-xl border px-5 py-3 ${pctBg}`}>
            <div className="text-center"><div className={`text-2xl font-bold ${pctColor}`}>{pct}%</div><div className="text-xs text-muted-foreground">Overall</div></div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center"><div className="text-lg font-semibold text-green-600">{presentCount}</div><div className="text-xs text-muted-foreground">Present</div></div>
            <div className="text-center"><div className="text-lg font-semibold text-red-500">{records.length - presentCount}</div><div className="text-xs text-muted-foreground">Absent</div></div>
            <div className="text-center"><div className="text-lg font-semibold text-gray-700">{records.length}</div><div className="text-xs text-muted-foreground">Total</div></div>
          </div>
          {Array.from(grouped.entries()).map(([dateStr, dayRecords]) => {
            const today = isToday(dateStr);
            const dayPresent = dayRecords.filter(r => r.status==="present").length;
            return (
              <div key={dateStr} className="space-y-1.5">
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${today?"bg-blue-50 border-blue-200":"bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${today?"text-blue-500":"text-gray-400"}`} />
                    <span className={`font-semibold text-sm ${today?"text-blue-700":"text-gray-700"}`}>
                      {fmtDate(dateStr)}
                      {today && <span className="ml-2 text-xs font-medium bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">Today</span>}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{dayPresent}/{dayRecords.length} present</span>
                </div>
                <div className="space-y-1.5 pl-2">
                  {dayRecords.map(record => (
                    <div key={record._id} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${record.status==="present"?"border-green-200 bg-green-50/60":"border-red-100 bg-red-50/40"}`}>
                      <div>
                        <div className="font-medium text-sm">{record.subject}</div>
                        {record.faculty_name && <div className="text-xs text-muted-foreground">by {record.faculty_name}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 text-sm font-semibold ${record.status==="present"?"text-green-600":"text-red-500"}`}>
                          {record.status==="present"?<Check className="h-4 w-4"/>:<X className="h-4 w-4"/>}
                          <span className="capitalize">{record.status}</span>
                        </div>
                        <button onClick={()=>setConfirm({id:record._id, label:`${record.subject} on ${record.date}`})}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
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

// ─── Tab: Marks ──────────────────────────────────────────────────────────────
function MarksTab({ studentId, toast }: { studentId:string; toast: ReturnType<typeof useToast>["toast"] }) {
  const [marks, setMarks]   = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{id:string;label:string}|null>(null);
  const [editing, setEditing] = useState<MarkRecord|null>(null);

  const loadMarks = () => {
    setLoading(true);
    api.get(`/marks/student/${studentId}`)
      .then(r => {
        // Normalise numbers — MongoDB may return floats
        const normalised = r.data.map((m: any) => ({
          ...m,
          marks_obtained: toNum(m.marks_obtained),
          total_marks: toNum(m.total_marks),
        }));
        setMarks(normalised);
      })
      .catch(() => toast({ title:"Error", description:"Could not load marks", variant:"destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMarks(); }, [studentId]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/marks/${id}`);
      toast({ title:"Deleted", description:"Mark record removed." });
      setMarks(prev => prev.filter(m => m._id !== id));
    } catch {
      toast({ title:"Error", description:"Failed to delete mark", variant:"destructive" });
    } finally { setConfirm(null); }
  };

  const handleEdit = async (id: string, obtained: number, total: number) => {
    // Find the mark to get its details for re-posting via upsert endpoint
    const m = marks.find(x => x._id === id);
    if (!m) return;
    try {
      await api.post("/marks", {
        student_id: studentId,
        subject: m.subject,
        exam_type: m.exam_type,
        exam_name: m.exam_name,
        marks_obtained: obtained,
        total_marks: total,
      });
      toast({ title:"Updated", description:"Marks updated successfully." });
      loadMarks(); // re-fetch to get latest
    } catch {
      toast({ title:"Error", description:"Failed to update marks", variant:"destructive" });
    } finally { setEditing(null); }
  };

  if (loading) return <p className="py-10 text-center text-muted-foreground">Loading…</p>;

  // Group by subject
  const bySubject = marks.reduce<Record<string,MarkRecord[]>>((acc,m) => {
    (acc[m.subject] = acc[m.subject]||[]).push(m);
    return acc;
  }, {});

  return (
    <>
      {confirm && <ConfirmModal message={`Delete mark for ${confirm.label}?`} onConfirm={()=>handleDelete(confirm.id)} onCancel={()=>setConfirm(null)} />}
      {editing && <EditMarkModal mark={editing} onSave={handleEdit} onCancel={()=>setEditing(null)} />}

      {marks.length === 0 ? (
        <div className="py-14 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-25" /><p>No marks records found</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(bySubject).map(([subject, subMarks]) => {
            const avg = Math.round(
              subMarks.reduce((s,m) => s + (m.marks_obtained / m.total_marks)*100, 0) / subMarks.length
            );
            const avgColor = avg>=75?"text-green-600":avg>=50?"text-amber-500":"text-red-600";
            return (
              <div key={subject} className="space-y-1.5">
                {/* Subject header */}
                <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border bg-indigo-50 border-indigo-200">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                    <span className="font-semibold text-sm text-indigo-800">{subject}</span>
                  </div>
                  <span className={`text-sm font-bold ${avgColor}`}>Avg {avg}%</span>
                </div>
                {/* Mark rows */}
                <div className="space-y-1.5 pl-2">
                  {subMarks.map(mark => {
                    const pct = mark.total_marks > 0 ? Math.round((mark.marks_obtained / mark.total_marks)*100) : 0;
                    const rowCls = pct>=75?"text-green-700 bg-green-50 border-green-200":pct>=50?"text-amber-700 bg-amber-50 border-amber-200":"text-red-700 bg-red-50 border-red-200";
                    const barCls = pct>=75?"bg-green-500":pct>=50?"bg-amber-400":"bg-red-500";
                    return (
                      <div key={mark._id} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${rowCls}`}>
                        <div>
                          <div className="font-medium text-sm">{mark.exam_name.toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground capitalize">{EXAM_TYPE_LABEL[mark.exam_type]||mark.exam_type}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold text-sm">{mark.marks_obtained}/{mark.total_marks}</div>
                            <div className="text-xs text-muted-foreground">{pct}%</div>
                          </div>
                          <div className="w-20 h-2 rounded-full bg-gray-200 overflow-hidden hidden sm:block">
                            <div className={`h-full rounded-full ${barCls}`} style={{width:`${pct}%`}} />
                          </div>
                          {/* Edit */}
                          <button onClick={()=>setEditing(mark)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          {/* Delete */}
                          <button onClick={()=>setConfirm({id:mark._id, label:`${mark.exam_name.toUpperCase()} (${subject})`})}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Tab: Timetable ──────────────────────────────────────────────────────────
function TimetableTab({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [selected, setSelected]     = useState<number|null>(null);
  const [loading, setLoading]       = useState(true);
  const [delConfirm, setDelConfirm] = useState<number|null>(null);

  useEffect(() => {
    api.get("/timetables")
      .then(r => { setTimetables(r.data); if (r.data.length>0) setSelected(r.data[0].semester); })
      .catch(() => toast({ title:"Error", description:"Could not load timetables", variant:"destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (semester: number) => {
    try {
      await api.delete(`/timetable/${semester}`);
      toast({ title:"Deleted", description:`Semester ${semester} timetable removed.` });
      const updated = timetables.filter(t => t.semester !== semester);
      setTimetables(updated);
      setSelected(updated.length>0 ? updated[0].semester : null);
    } catch {
      toast({ title:"Error", description:"Failed to delete timetable", variant:"destructive" });
    } finally { setDelConfirm(null); }
  };

  if (loading) return <p className="py-10 text-center text-muted-foreground">Loading…</p>;
  if (timetables.length===0) return (
    <div className="py-14 text-center text-muted-foreground">
      <Clock className="h-10 w-10 mx-auto mb-3 opacity-25" /><p>No timetables created yet</p>
    </div>
  );

  const active = timetables.find(t => t.semester===selected);
  return (
    <>
      {delConfirm!==null && <ConfirmModal message={`Delete Semester ${delConfirm} timetable?`} onConfirm={()=>handleDelete(delConfirm)} onCancel={()=>setDelConfirm(null)} />}
      <div className="flex flex-wrap gap-2 mb-5">
        {timetables.map(t => (
          <div key={t.semester} className="flex items-center rounded-lg overflow-hidden border">
            <button onClick={()=>setSelected(t.semester)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${selected===t.semester?"bg-indigo-600 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
              Sem {t.semester}
            </button>
            <button onClick={()=>setDelConfirm(t.semester)}
              className="px-2 py-1.5 bg-white border-l text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title={`Delete Sem ${t.semester}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      {active && (
        <div className="space-y-3">
          {DAYS.map(day => {
            const slots: TimetableSlot[] = active.schedule?.[day]||[];
            if (!slots.length) return null;
            return (
              <div key={day} className="rounded-xl border overflow-hidden">
                <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100">
                  <span className="font-semibold text-sm text-indigo-800">{day}</span>
                </div>
                <div className="divide-y">
                  {slots.map((slot,i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-40 shrink-0">
                        <Clock className="h-3.5 w-3.5" />{slot.time}
                      </div>
                      <div className="font-medium text-sm">{slot.subject}</div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
type TabId = "attendance"|"marks"|"timetable";

export default function FacultyStudentView() {
  const { studentId } = useParams<{ studentId:string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student|null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("attendance");

  useEffect(() => {
    if (!studentId) return;
    api.get("/students")
      .then(r => { const found = r.data.find((s:Student) => s._id===studentId); if (found) setStudent(found); })
      .catch(() => toast({ title:"Error", description:"Could not load student", variant:"destructive" }));
  }, [studentId]);

  const tabs: {id:TabId; label:string; icon:React.ReactNode}[] = [
    { id:"attendance", label:"Attendance", icon:<Calendar className="h-4 w-4"/> },
    { id:"marks",      label:"Marks",      icon:<BookOpen className="h-4 w-4"/> },
    { id:"timetable",  label:"Timetable",  icon:<Clock className="h-4 w-4"/> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back + header */}
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={()=>navigate("/faculty/students")} className="gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back to Students
          </Button>
          {student && (
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <User className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{student.name}</h1>
                <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                  <span>{student.email}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{student.department}</span>
                  {student.year && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span>Year {student.year}</span></>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b">
          {tabs.map(tab => (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab===tab.id ? "border-indigo-600 text-indigo-700" : "border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300"
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card>
          <CardContent className="pt-6">
            {activeTab==="attendance" && studentId && <AttendanceTab studentId={studentId} toast={toast} />}
            {activeTab==="marks"      && studentId && <MarksTab studentId={studentId} toast={toast} />}
            {activeTab==="timetable"              && <TimetableTab toast={toast} />}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
