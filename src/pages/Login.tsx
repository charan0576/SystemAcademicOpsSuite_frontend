import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { GraduationCap, Loader2, Eye, EyeOff, BookOpen, Users, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast({ title: "Signed in successfully!" });
      setTimeout(() => navigate("/"), 100);
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message || "Invalid credentials", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: "linear-gradient(135deg,#f0f4ff 0%,#e4f8fc 50%,#cef3fb 100%)" }}>

      {/* ── Left panel ── */}
      <div
        className="lg:w-[52%] flex flex-col items-center justify-center p-8 sm:p-12 relative overflow-hidden min-h-[260px] lg:min-h-screen"
        style={{ background: "linear-gradient(145deg,#e0f7fb 0%,#b8eefc 40%,#7dd9f0 100%)" }}
      >
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/25" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 text-center space-y-7 max-w-sm w-full">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 backdrop-blur shadow-lg shadow-cyan-200 shrink-0">
              <GraduationCap className="h-7 w-7 text-cyan-600" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-slate-700">Campus<span className="text-cyan-600">Connect</span></h1>
              <p className="text-xs text-cyan-700/70 font-medium">Academic Management System</p>
            </div>
          </div>

          {/* SVG Academic illustration */}
          <div className="flex justify-center">
            <svg viewBox="0 0 280 200" className="w-full max-w-xs drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
              {/* Background card */}
              <rect x="10" y="20" width="260" height="160" rx="16" fill="white" opacity="0.55"/>
              {/* Top bar */}
              <rect x="10" y="20" width="260" height="36" rx="16" fill="white" opacity="0.7"/>
              <rect x="10" y="44" width="260" height="12" fill="white" opacity="0.7"/>
              <circle cx="32" cy="38" r="8" fill="#0ea5c9" opacity="0.7"/>
              <rect x="48" y="32" width="70" height="6" rx="3" fill="#0ea5c9" opacity="0.4"/>
              <rect x="230" y="30" width="30" height="16" rx="6" fill="#0ea5c9" opacity="0.3"/>
              {/* Stat cards */}
              {[0,1,2].map(i => {
                const x = 22 + i*86;
                const colors = ["#0ea5c9","#14b8a6","#6366f1"];
                return (
                  <g key={i}>
                    <rect x={x} y="70" width="72" height="48" rx="10" fill="white" opacity="0.6"/>
                    <rect x={x} y="70" width="72" height="4" rx="2" fill={colors[i]} opacity="0.8"/>
                    <rect x={x+8} y="82" width="36" height="7" rx="3" fill={colors[i]} opacity="0.35"/>
                    <rect x={x+8} y="95" width="24" height="14" rx="3" fill={colors[i]} opacity="0.7"/>
                  </g>
                );
              })}
              {/* Progress bars */}
              {[{y:134,w:160,c:"#0ea5c9"},{y:148,w:110,c:"#14b8a6"},{y:162,w:140,c:"#6366f1"}].map((b,i)=>(
                <g key={i}>
                  <rect x="22" y={b.y} width="236" height="8" rx="4" fill="white" opacity="0.4"/>
                  <rect x="22" y={b.y} width={b.w} height="8" rx="4" fill={b.c} opacity="0.65"/>
                </g>
              ))}
            </svg>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            Your complete academic hub — manage courses, attendance, timetables, and doubts in one place.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: BookOpen,      label: "Courses",    val: "50+"   },
              { icon: Users,         label: "Students",   val: "200+"  },
              { icon: CalendarCheck, label: "Attendance", val: "Daily" },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="bg-white/50 backdrop-blur rounded-2xl p-3 text-center border border-white/60 shadow-sm">
                <Icon className="h-4 w-4 text-cyan-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-700">{val}</p>
                <p className="text-[10px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-bg shadow-sm shadow-cyan-200">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-700">
              Campus<span className="brand-text">Connect</span>
            </span>
          </div>

          <div className="card-clean p-8">
            {/* Header */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-800">Login / Sign Up</h2>
              <p className="text-sm text-slate-400 mt-1">Enter your credentials to access your portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email address</label>
                <input
                  type="email" placeholder="you@college.edu"
                  value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full h-11 px-4 rounded-xl border border-cyan-100 bg-cyan-50/30 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-cyan-100 bg-cyan-50/30 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl text-white text-sm font-bold brand-bg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-cyan-200">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <Link to="/register"
              className="flex items-center justify-center w-full h-11 rounded-xl border-2 border-cyan-300 text-cyan-700 text-sm font-bold hover:bg-cyan-50 active:scale-[0.98] transition-all">
              Create a New Account
            </Link>

            <p className="mt-4 text-center text-xs text-slate-400">
              Students and faculty use the same portal — your role is set by your account type.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
