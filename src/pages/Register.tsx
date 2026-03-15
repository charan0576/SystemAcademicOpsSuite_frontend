import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEPARTMENTS = [
  "Computer Science","Electronics","Mechanical","Civil",
  "Electrical","Information Technology","Biotechnology","Physics","Mathematics",
];
const SECTIONS = ["A","B","C","D"];

export default function Register() {
  const [form, setForm] = useState({
    name:"", email:"", password:"",
    role:"student" as "student"|"faculty",
    department:"", year:"1", section:"",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.department) {
      toast({ title:"Missing fields", description:"Please fill all required fields.", variant:"destructive" }); return;
    }
    if (form.role === "student" && !form.section) {
      toast({ title:"Missing section", description:"Please select your section.", variant:"destructive" }); return;
    }
    setLoading(true);
    try {
      await signUp(form);
      toast({ title:"Account created!", description:"Welcome to CampusConnect" });
      setTimeout(() => navigate(form.role === "faculty" ? "/faculty" : "/student"), 100);
    } catch (err: any) {
      toast({ title:"Registration failed", description:err.message || "Please try again", variant:"destructive" });
    } finally { setLoading(false); }
  };

  const inputCls = "w-full h-11 px-4 rounded-xl border border-cyan-100 bg-cyan-50/30 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all";
  const selectCls = "w-full h-11 px-4 rounded-xl border border-cyan-100 bg-cyan-50/30 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all";
  const labelCls = "text-xs font-semibold text-slate-600 uppercase tracking-wide";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 page-bg">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-7">
          <div className="h-11 w-11 rounded-2xl brand-bg flex items-center justify-center shadow-sm shadow-cyan-200">
            <GraduationCap className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-700">Campus<span className="brand-text">Connect</span></p>
            <p className="text-[11px] text-slate-400">Academic Management System</p>
          </div>
        </div>

        {/* Role toggle */}
        <div className="card-clean p-1.5 flex gap-1.5 mb-5">
          {(["student","faculty"] as const).map(role => (
            <button key={role} type="button" onClick={() => f("role", role)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                form.role === role
                  ? "brand-bg text-white shadow-sm shadow-cyan-200"
                  : "text-slate-500 hover:text-cyan-600 hover:bg-cyan-50"
              }`}>
              {role === "student" ? "🎓 Student" : "👨‍🏫 Faculty"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="card-clean p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Full Name</label>
              <input type="text" placeholder="John Doe" value={form.name} onChange={e => f("name",e.target.value)} required className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Email</label>
              <input type="email" placeholder="you@college.edu" value={form.email} onChange={e => f("email",e.target.value)} required className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input type={showPass?"text":"password"} placeholder="Min 6 characters" value={form.password}
                onChange={e=>f("password",e.target.value)} required className={`${inputCls} pr-10`} />
              <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600">
                {showPass?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Department</label>
            <select value={form.department} onChange={e=>f("department",e.target.value)} required className={selectCls}>
              <option value="">Select department…</option>
              {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {form.role === "student" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Year</label>
                <select value={form.year} onChange={e=>f("year",e.target.value)} className={selectCls}>
                  {["1","2","3","4"].map(y=><option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Section</label>
                <select value={form.section} onChange={e=>f("section",e.target.value)} required className={selectCls}>
                  <option value="">Select…</option>
                  {SECTIONS.map(s=><option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-11 rounded-xl text-white text-sm font-bold tracking-wide brand-bg hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm shadow-cyan-200 mt-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-cyan-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
