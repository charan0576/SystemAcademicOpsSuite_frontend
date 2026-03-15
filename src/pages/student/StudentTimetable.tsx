import { useEffect, useState } from "react";
import { api, useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar, Clock, BookOpen, AlertCircle } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_COLORS = ["bg-blue-500", "bg-teal-500", "bg-purple-500", "bg-orange-400", "bg-pink-500", "bg-slate-400"];

interface TimeSlot { time: string; subject: string; }
interface Schedule { [day: string]: TimeSlot[]; }

export default function StudentTimetable() {
  const { profile } = useAuth();
  const [semester, setSemester] = useState(1);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.year) { const s = parseInt(profile.year); if (s >= 1 && s <= 8) setSemester(s); }
  }, [profile]);

  useEffect(() => { load(semester); }, [semester]);

  const load = async (sem: number) => {
    setLoading(true); setError(null);
    try {
      const r = await api.get(`/timetable/${sem}`);
      setSchedule(r.data.schedule || {});
    } catch (e: any) {
      setError(e.response?.status === 404 ? `No timetable for Semester ${sem}` : "Failed to load timetable");
      setSchedule(null);
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-800">Timetable</h1>
          <div className="flex items-center gap-2 bg-white border border-border/60 rounded-xl px-3 py-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <label className="text-sm text-slate-500 font-medium">Semester</label>
            <select
              value={semester}
              onChange={e => setSemester(Number(e.target.value))}
              className="text-sm font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              {Array.from({ length: 8 }, (_, i) => i + 1).map(s => (
                <option key={s} value={s}>Sem {s}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="card-clean p-12 text-center">
            <div className="inline-flex items-center gap-2 text-slate-400">
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading timetable…
            </div>
          </div>
        )}

        {error && (
          <div className="card-clean p-6 flex items-center gap-3 border-l-4 border-l-amber-400 bg-amber-50">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">{error}</p>
          </div>
        )}

        {!loading && !error && schedule && (
          <div className="space-y-4">
            {DAYS.map((day, di) => {
              const slots = schedule[day] || [];
              if (slots.length === 0) return null;
              return (
                <div key={day} className="card-clean overflow-hidden">
                  <div className={`px-5 py-3 ${DAY_COLORS[di % DAY_COLORS.length]} flex items-center gap-3`}>
                    <Calendar className="h-4 w-4 text-white" />
                    <h3 className="font-semibold text-white">{day}</h3>
                    <span className="ml-auto text-xs text-white/70">{slots.length} class{slots.length !== 1 ? "es" : ""}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                    {slots.map((slot, si) => (
                      <div key={si} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-3 border border-border/40">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-border/60 shrink-0">
                          <Clock className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 font-medium">{slot.time}</p>
                          <p className="text-sm font-semibold text-slate-700 truncate">{slot.subject}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {DAYS.every(d => !schedule[d] || schedule[d].length === 0) && (
              <div className="card-clean p-12 text-center">
                <BookOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400">No schedule available for this semester</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
