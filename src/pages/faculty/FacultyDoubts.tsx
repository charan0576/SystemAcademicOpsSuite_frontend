import { useEffect, useState } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Send, CheckCircle, Clock,
  User, Building2, RefreshCw,
} from "lucide-react";

export default function FacultyDoubts() {
  const { profile } = useAuth();
  const { toast }   = useToast();

  const [doubts,    setDoubts]    = useState<any[]>([]);
  const [replies,   setReplies]   = useState<Record<string, string>>({});
  const [sending,   setSending]   = useState<Record<string, boolean>>({});
  const [fetching,  setFetching]  = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setFetching(true);
    try {
      const r = await api.get("/doubts");
      setDoubts(r.data);
    } catch { console.error("Failed to load doubts"); }
    finally { setFetching(false); }
  };

  const handleReply = async (id: string) => {
    const reply = replies[id]?.trim();
    if (!reply) { toast({ title:"Please enter a reply", variant:"destructive" }); return; }
    setSending(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/doubts/${id}/reply`, { reply });
      toast({ title:"Reply sent!", description:"The student will see your reply." });
      setReplies(p => { const n = { ...p }; delete n[id]; return n; });
      load();
    } catch (err: any) {
      toast({ title:"Error", description: err.response?.data?.detail || "Failed to send reply", variant:"destructive" });
    } finally {
      setSending(p => ({ ...p, [id]: false }));
    }
  };

  const pending  = doubts.filter(d => !d.reply);
  const answered = doubts.filter(d =>  d.reply);

  const DoubCard = ({ d }: { d: any }) => (
    <div className="card-clean p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Student name */}
          {d.student_name && (
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <User className="h-3 w-3 text-slate-400" />
              {d.student_name}
            </span>
          )}
          {/* Department badge */}
          <span className="badge-blue flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {d.department || d.subject || "General"}
          </span>
          {/* Date */}
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
        <p className="text-xs font-semibold text-cyan-600 mb-1">Student's Question</p>
        <p className="text-sm text-slate-700 leading-relaxed">{d.description || d.question}</p>
      </div>

      {/* Reply area */}
      {d.reply ? (
        <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-teal-600">Your Reply</p>
            {d.replied_at && (
              <p className="text-[10px] text-slate-400">
                {new Date(d.replied_at).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
              </p>
            )}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{d.reply}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Your Reply</label>
          <textarea
            placeholder="Type your reply to the student…"
            rows={3}
            value={replies[d._id] || ""}
            onChange={e => setReplies(p => ({ ...p, [d._id]: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-cyan-100 bg-cyan-50/30 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all resize-none"
          />
          <button
            onClick={() => handleReply(d._id)}
            disabled={sending[d._id] || !(replies[d._id]?.trim())}
            className="flex items-center gap-2 h-9 px-5 rounded-xl text-white text-sm font-semibold brand-bg hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm shadow-cyan-200"
          >
            <Send className="h-3.5 w-3.5" />
            {sending[d._id] ? "Sending…" : "Send Reply"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Student Doubts</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Showing doubts sent to <span className="font-semibold text-cyan-600">{profile?.department}</span> faculty
            </p>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-cyan-600 transition-colors px-3 py-2 rounded-xl hover:bg-cyan-50 border border-transparent hover:border-cyan-100">
            <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:"Total",    value:doubts.length,  color:"text-cyan-600",  border:"border-t-cyan-400" },
            { label:"Pending",  value:pending.length,  color:"text-amber-500", border:"border-t-amber-400" },
            { label:"Answered", value:answered.length, color:"text-teal-600",  border:"border-t-teal-400" },
          ].map(c => (
            <div key={c.label} className={`card-clean p-4 border-t-4 ${c.border}`}>
              <p className="text-xs text-slate-400 uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {fetching ? (
          <div className="card-clean py-14 flex items-center justify-center gap-2 text-slate-400">
            <div className="h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            Loading doubts…
          </div>
        ) : doubts.length === 0 ? (
          <div className="card-clean py-14 text-center">
            <MessageSquare className="h-10 w-10 text-cyan-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No doubts from students yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Students from <span className="font-semibold">{profile?.department}</span> will see their doubts here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending section */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
                  Pending Replies
                  <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                </h3>
                {pending.map(d => <DoubCard key={d._id} d={d} />)}
              </div>
            )}

            {/* Answered section */}
            {answered.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500 shrink-0" />
                  Answered
                  <span className="ml-auto bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {answered.length}
                  </span>
                </h3>
                {answered.map(d => <DoubCard key={d._id} d={d} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
