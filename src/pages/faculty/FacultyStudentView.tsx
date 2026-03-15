import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Trash2, Calendar, Clock, AlertTriangle } from "lucide-react";

interface Student { _id: string; name: string; email: string; department: string; year?: string; }
interface AttendanceRecord { _id: string; subject: string; date: string; status: "present"|"absent"; faculty_name?: string; }
interface TimetableSlot { time: string; subject: string; }

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_COLORS = ["bg-cyan-500","bg-teal-500","bg-sky-500","bg-blue-500","bg-violet-500","bg-slate-400"];

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
}
function isToday(d: string) { return d.split("T")[0] === new Date().toISOString().split("T")[0]; }
function groupByDate(recs: AttendanceRecord[]) {
  const m = new Map<string, AttendanceRecord[]>();
  [...recs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach(r => { const k = r.date.split("T")[0]; if (!m.has(k)) m.set(k,[]); m.get(k)!.push(r); });
  return m;
}

function ConfirmModal({ message, onConfirm, onCancel }: { message:string; onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4 border border-cyan-100">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
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

function Spinner() {
  return <div className="py-10 flex justify-center"><div className="h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;
}

function AttendanceTab({ studentId, toast }: { studentId:string; toast:any }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{id:string;label:string}|null>(null);

  useEffect(() => {
    api.get(`/attendance/student/${studentId}`).then(r => setRecords(r.data))
      .catch(() => toast({title:"Error",variant:"destructive"})).finally(() => setLoading(false));
  }, [studentId]);

  const del = async (id: string) => {
    try { await api.delete(`/attendance/${id}`); toast({title:"Deleted"}); setRecords(p=>p.filter(r=>r._id!==id)); }
    catch { toast({title:"Error",variant:"destructive"}); } finally { setConfirm(null); }
  };

  if (loading) return <Spinner />;

  const present = records.filter(r => r.status==="present").length;
  const pct = records.length ? Math.round((present/records.length)*100) : 0;
  const pColor = pct>=75?"text-teal-600":pct>=60?"text-amber-500":"text-red-500";
  const grouped = groupByDate(records);

  return (
    <>
      {confirm && <ConfirmModal message={`Delete: ${confirm.label}?`} onConfirm={()=>del(confirm.id)} onCancel={()=>setConfirm(null)} />}
      {records.length === 0 ? (
        <div className="py-14 text-center text-slate-400"><Calendar className="h-10 w-10 mx-auto mb-3 opacity-30"/><p className="text-sm">No records</p></div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[{label:"Overall",value:`${pct}%`,color:pColor,border:pct>=75?"border-t-teal-400":pct>=60?"border-t-amber-400":"border-t-red-400"},
              {label:"Present",value:present,color:"text-teal-600",border:"border-t-teal-400"},
              {label:"Absent",value:records.length-present,color:"text-red-500",border:"border-t-red-400"},
              {label:"Total",value:records.length,color:"text-slate-600",border:"border-t-slate-300"},
            ].map(c => (
              <div key={c.label} className={`bg-white rounded-xl border border-cyan-100 border-t-4 ${c.border} p-3 text-center shadow-sm`}>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>
          {Array.from(grouped.entries()).map(([date,recs]) => {
            const today = isToday(date);
            return (
              <div key={date} className="space-y-1.5">
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${today?"bg-cyan-50 border-cyan-200":"bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${today?"text-cyan-500":"text-slate-400"}`}/>
                    <span className={`font-semibold text-sm ${today?"text-cyan-700":"text-slate-700"}`}>{fmtDate(date)}</span>
                  </div>
                  <span className="text-xs text-slate-400">{recs.filter(r=>r.status==="present").length}/{recs.length}</span>
                </div>
                <div className="space-y-1.5 pl-2">
                  {recs.map(r => (
                    <div key={r._id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${r.status==="present"?"border-teal-100 bg-teal-50/60":"border-red-100 bg-red-50/40"}`}>
                      <div>
                        <p className="font-medium text-sm text-slate-700">{r.subject}</p>
                        {r.faculty_name && <p className="text-xs text-slate-400">by {r.faculty_name}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 text-sm font-semibold ${r.status==="present"?"text-teal-600":"text-red-500"}`}>
                          {r.status==="present"?<Check className="h-4 w-4"/>:<X className="h-4 w-4"/>}
                          <span className="capitalize hidden sm:block">{r.status}</span>
                        </div>
                        <button onClick={()=>setConfirm({id:r._id,label:`${r.subject} on ${r.date}`})}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5"/>
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

function TimetableTab({ toast }: { toast:any }) {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [selected,   setSelected]   = useState<number|null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    api.get("/timetables").then(r => { setTimetables(r.data); if (r.data.length>0) setSelected(r.data[0].semester); })
      .catch(()=>toast({title:"Error",variant:"destructive"})).finally(()=>setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!timetables.length) return <div className="py-14 text-center text-slate-400"><Clock className="h-10 w-10 mx-auto mb-3 opacity-30"/><p className="text-sm">No timetables</p></div>;

  const active = timetables.find(t => t.semester===selected);
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        {timetables.map(t => (
          <button key={t.semester} onClick={()=>setSelected(t.semester)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border ${selected===t.semester?"bg-cyan-500 text-white border-cyan-500":"bg-white text-slate-600 border-slate-200 hover:border-cyan-300 hover:text-cyan-600"}`}>
            Sem {t.semester}
          </button>
        ))}
      </div>
      {active && (
        <div className="space-y-3">
          {DAYS.map((day,di)=>{
            const slots:TimetableSlot[]=active.schedule?.[day]||[];
            if(!slots.length)return null;
            return (
              <div key={day} className="bg-white rounded-xl border border-cyan-100 overflow-hidden shadow-sm">
                <div className={`px-4 py-2.5 ${DAY_COLORS[di%DAY_COLORS.length]}`}>
                  <span className="font-semibold text-sm text-white">{day}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {slots.map((slot,i)=>(
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 w-36 shrink-0"><Clock className="h-3.5 w-3.5"/>{slot.time}</div>
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

// Only Attendance + Timetable — Marks tab removed
type TabId = "attendance" | "timetable";

export default function FacultyStudentView() {
  const { studentId } = useParams<{ studentId:string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student|null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("attendance");

  useEffect(() => {
    if (!studentId) return;
    api.get("/students").then(r => {
      const found = r.data.find((s:Student) => s._id===studentId);
      if (found) setStudent(found);
    }).catch(()=>toast({title:"Error",variant:"destructive"}));
  }, [studentId]);

  const TABS: {id:TabId;label:string;icon:React.ReactNode}[] = [
    { id:"attendance", label:"Attendance", icon:<Calendar className="h-4 w-4"/> },
    { id:"timetable",  label:"Timetable",  icon:<Clock    className="h-4 w-4"/> },
  ];

  const initials = student?.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() || "?";

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <button onClick={()=>navigate("/faculty/students")}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-cyan-600 transition-colors -ml-1">
          <ArrowLeft className="h-4 w-4"/> Back to Students
        </button>

        {student && (
          <div className="card-clean p-5 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl brand-bg flex items-center justify-center text-2xl font-bold text-white shadow-sm shadow-cyan-200 shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{student.name}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-sm text-slate-400">{student.email}</span>
                <span className="badge-blue">{student.department}</span>
                {student.year && <span className="badge-green">Year {student.year}</span>}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 border-b border-cyan-100">
          {TABS.map(tab => (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab===tab.id ? "border-cyan-500 text-cyan-700" : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="card-clean p-5">
          {activeTab==="attendance" && studentId && <AttendanceTab studentId={studentId} toast={toast} />}
          {activeTab==="timetable"               && <TimetableTab  toast={toast} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
