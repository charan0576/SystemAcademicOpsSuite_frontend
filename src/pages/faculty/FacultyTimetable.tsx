import { useEffect, useState } from "react";
import { api, useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Trash2, Save, Pencil } from "lucide-react";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_COLORS = ["bg-blue-500","bg-teal-500","bg-purple-500","bg-orange-400","bg-pink-500","bg-slate-400"];

interface TimeSlot { time: string; subject: string; }
interface Schedule { [day: string]: TimeSlot[]; }

export default function FacultyTimetable() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [semester, setSemester] = useState(1);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [existingTimetables, setExistingTimetables] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => { api.get("/timetables").then(r => setExistingTimetables(r.data)).catch(() => {}); }, []);
  useEffect(() => { loadSemester(semester); }, [semester]);

  const loadSemester = async (sem: number) => {
    try {
      const r = await api.get(`/timetable/${sem}`);
      setSchedule(r.data.schedule || {}); setHasExisting(true); setIsEditing(false);
    } catch (e: any) {
      if (e.response?.status === 404) {
        const empty: Schedule = {}; DAYS.forEach(d => { empty[d] = [{ time: "", subject: "" }]; });
        setSchedule(empty); setHasExisting(false); setIsEditing(true);
      }
    }
  };

  const add    = (day: string) => setSchedule(p => ({ ...p, [day]: [...(p[day]||[]), { time:"", subject:"" }] }));
  const remove = (day: string, i: number) => setSchedule(p => { const s = p[day].filter((_,j) => j!==i); return { ...p, [day]: s.length ? s : [{ time:"", subject:"" }] }; });
  const update = (day: string, i: number, f: "time"|"subject", v: string) =>
    setSchedule(p => { const s = [...p[day]]; s[i] = { ...s[i], [f]: v }; return { ...p, [day]: s }; });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const day of DAYS) {
      for (const slot of (schedule[day]||[])) {
        if ((slot.time && !slot.subject)||(!slot.time && slot.subject)) {
          toast({ title: "Fill both time and subject for every slot", variant: "destructive" }); return;
        }
      }
    }
    const clean: Schedule = {};
    DAYS.forEach(d => { clean[d] = (schedule[d]||[]).filter(s => s.time && s.subject); });
    try {
      await api.post("/timetable", { semester, schedule: clean, department: profile?.department });
      toast({ title: hasExisting ? "Timetable updated!" : "Timetable created!" });
      setHasExisting(true); setIsEditing(false); setExistingTimetables(prev => { const n = prev.filter(t => t.semester !== semester); return [...n, { semester }]; });
    } catch (err: any) { toast({ title: "Error", description: err.response?.data?.detail || "Failed", variant: "destructive" }); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/timetable/${semester}`);
      toast({ title: "Deleted" }); loadSemester(semester);
      setExistingTimetables(prev => prev.filter(t => t.semester !== semester));
    } catch { toast({ title: "Error deleting timetable", variant: "destructive" }); }
  };

  const canEdit = isEditing || !hasExisting;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Manage Timetable</h1>
            <p className="text-sm text-slate-400">{profile?.department}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-border/60 rounded-xl px-3 py-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <label className="text-sm text-slate-500 font-medium">Semester</label>
              <select value={semester} onChange={e => setSemester(Number(e.target.value))}
                className="text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer">
                {Array.from({length:8},(_,i)=>i+1).map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            {hasExisting && !isEditing && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" />Edit
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleDelete}>
                  <Trash2 className="h-3.5 w-3.5" />Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {existingTimetables.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existingTimetables.map(t => (
              <span key={t.semester} className={t.semester === semester ? "badge-blue" : "text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full"}>
                Sem {t.semester}
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {DAYS.map((day, di) => (
            <div key={day} className="card-clean overflow-hidden">
              <div className={`px-5 py-3 ${DAY_COLORS[di % DAY_COLORS.length]} flex items-center justify-between`}>
                <span className="font-semibold text-white">{day}</span>
                {canEdit && (
                  <button type="button" onClick={() => add(day)}
                    className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white font-medium">
                    <Plus className="h-3.5 w-3.5" />Add Slot
                  </button>
                )}
              </div>
              <div className="p-4 space-y-2">
                {(schedule[day]||[{time:"",subject:""}]).map((slot, si) => (
                  <div key={si} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Time</label>
                      <Input placeholder="9:00 AM – 10:00 AM" value={slot.time}
                        onChange={e => update(day, si, "time", e.target.value)}
                        disabled={!canEdit} className="h-9 bg-slate-50 border-border/60 text-sm" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Subject</label>
                      <Input placeholder="e.g. Mathematics" value={slot.subject}
                        onChange={e => update(day, si, "subject", e.target.value)}
                        disabled={!canEdit} className="h-9 bg-slate-50 border-border/60 text-sm" />
                    </div>
                    {canEdit && (
                      <button type="button" onClick={() => remove(day, si)} disabled={(schedule[day]||[]).length <= 1}
                        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-border/60 text-slate-400 hover:text-red-500 hover:border-red-200 disabled:opacity-30 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {canEdit && (
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 font-semibold gap-2 shadow-sm shadow-blue-200">
                <Save className="h-4 w-4" />{hasExisting ? "Update Timetable" : "Create Timetable"}
              </Button>
              {hasExisting && (
                <Button type="button" variant="outline" className="h-11 px-5" onClick={() => { setIsEditing(false); loadSemester(semester); }}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}
