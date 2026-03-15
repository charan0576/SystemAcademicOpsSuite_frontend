import { useEffect, useState } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Send, CheckCircle, Clock, ChevronDown,
  BookOpen, Building2, HelpCircle,
} from "lucide-react";

const DEPARTMENTS = [
  "Computer Science","Electronics","Mechanical","Civil",
  "Electrical","Information Technology","Biotechnology","Physics","Mathematics",
];

export default function StudentDoubts() {
  const { profile } = useAuth();
  const { toast }   = useToast();

  const [doubts,   setDoubts]   = useState<any[]>([]);
  const [dept,     setDept]     = useState("");
  const [desc,     setDesc]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (profile) {
      // Pre-fill with student's own department
      setDept(profile.department || "");
      load();
    }
  }, [profile]);

  const load = async () => {
    setFetching(true);
    try {
      const r = await api.get(`/doubts/student/${profile?.user_id}`);
      setDoubts(r.data);
    } catch { console.error("Failed to load doubts"); }
    finally { setFetching(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dept) { toast({ title:"Select a department", description:"Choose the branch you want to send your doubt to.", variant:"destructive" }); return; }
    if (desc.trim().length < 5) { toast({ title:"Too short", description:"Please describe your doubt in at least 5 characters.", variant:"destructive" }); return; }
    setLoading(true);
    try {
      await api.post("/doubts", { department: dept, description: desc });
      toast({ title:"Doubt submitted!", description:`Sent to all ${dept} faculty. They'll reply soon.` });
      setDesc("");
      load();
    } catch (err: any) {
      toast({ title:"Error", description: err.response?.data?.detail || "Failed to submit doubt", variant:"destructive" });
    } finally { setLoading(false); }
  };

  const answered = doubts.filter(d => d.reply);
  const pending  = doubts.filter(d => !d.reply);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Doubts</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Select your branch, describe your doubt — it'll be sent to all faculty of that branch.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:"Total",    value:doubts.length,  color:"text-cyan-600",  border:"border-t-cyan-400" },
            { label:"Answered", value:answered.length, color:"text-teal-600",  border:"border-t-teal-400" },
            { label:"Pending",  value:pending.length,  color:"text-amber-500", border:"border-t-amber-400" },
          ].map(c => (
            <div key={c.label} className={`card-clean p-4 border-t-4 ${c.border}`}>
              <p className="text-xs text-slate-400 uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Submit form ── */}
          <div className="lg:col-span-2 card-clean p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                <HelpCircle className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Ask a Doubt</h3>
                <p className="text-xs text-slate-400">Sent to all faculty of selected branch</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Department dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Branch / Department
                </label>
                <div className="relative">
                  <select
                    value={dept}
                    onChange={e => setDept(e.target.value)}
                    required
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-cyan-100 bg-cyan-50/30 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">— Select branch —</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                {dept && (
                  <p className="text-[11px] text-cyan-600 font-medium">
                    ✓ Will be sent to all <span className="font-bold">{dept}</span> faculty
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Your Doubt / Question
                </label>
                <textarea
                  placeholder="Describe your doubt clearly. What are you trying to understand? What did you try? Where are you stuck?"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-cyan-100 bg-cyan-50/30 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all resize-none"
                />
                <p className="text-[10px] text-slate-400 text-right">{desc.length} chars</p>
              </div>

              <button type="submit" disabled={loading || !dept}
                className="w-full h-11 rounded-xl text-white text-sm font-bold brand-bg hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm shadow-cyan-200">
                <Send className="h-4 w-4" />
                {loading ? "Submitting…" : "Submit Doubt"}
              </button>
            </form>
          </div>

          {/* ── Doubts list ── */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-500" />
              My Doubts
              <span className="ml-auto text-xs font-normal text-slate-400">{doubts.length} total</span>
            </h3>

            {fetching ? (
              <div className="card-clean py-12 flex items-center justify-center gap-2 text-slate-400">
                <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            ) : doubts.length === 0 ? (
              <div className="card-clean p-10 text-center">
                <MessageSquare className="h-10 w-10 text-cyan-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No doubts submitted yet</p>
                <p className="text-xs text-slate-300 mt-1">Use the form to submit your first doubt</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doubts.map((d, i) => (
                  <div key={d._id || i} className="card-clean p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge-blue flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {d.department || d.subject || "General"}
                        </span>
                        {d.created_at && (
                          <span className="text-xs text-slate-400">
                            {new Date(d.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                          </span>
                        )}
                      </div>
                      {d.reply
                        ? <span className="badge-green flex items-center gap-1 shrink-0"><CheckCircle className="h-3 w-3" />Answered</span>
                        : <span className="badge-orange flex items-center gap-1 shrink-0"><Clock className="h-3 w-3" />Pending</span>}
                    </div>

                    {/* Question */}
                    <div className="bg-cyan-50/60 rounded-xl p-3 border border-cyan-100">
                      <p className="text-xs font-semibold text-cyan-600 mb-1">Your Question</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{d.description || d.question}</p>
                    </div>

                    {/* Reply */}
                    {d.reply && (
                      <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-teal-600">Faculty Reply</p>
                          {d.replied_by_name && (
                            <span className="text-xs text-teal-500 font-medium">{d.replied_by_name}</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{d.reply}</p>
                        {d.replied_at && (
                          <p className="text-[10px] text-slate-400 mt-1.5">
                            Replied: {new Date(d.replied_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
