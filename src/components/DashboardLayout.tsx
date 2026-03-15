import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, User, CalendarCheck, BookOpen,
  MessageCircleQuestion, Users, LogOut, Menu, X,
  GraduationCap, Calendar, Bell, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem { label: string; href: string; icon: React.ElementType; group?: string; }

const studentNav: NavItem[] = [
  { label: "Dashboard",   href: "/student",            icon: LayoutDashboard,      group: "Main"     },
  { label: "Profile",     href: "/student/profile",    icon: User,                 group: "Main"     },
  { label: "Marks",       href: "/student/marks",      icon: BookOpen,             group: "Academic" },
  { label: "Timetable",   href: "/student/timetable",  icon: Calendar,             group: "Academic" },
  { label: "Attendance",  href: "/student/attendance", icon: CalendarCheck,        group: "Academic" },
  { label: "Doubts",      href: "/student/doubts",     icon: MessageCircleQuestion,group: "More"     },
];

const facultyNav: NavItem[] = [
  { label: "Dashboard",   href: "/faculty",            icon: LayoutDashboard,      group: "Main"     },
  { label: "Profile",     href: "/faculty/profile",    icon: User,                 group: "Main"     },
  { label: "Students",    href: "/faculty/students",   icon: Users,                group: "Academic" },
  { label: "Attendance",  href: "/faculty/attendance", icon: CalendarCheck,        group: "Academic" },
  { label: "Marks",       href: "/faculty/marks",      icon: BookOpen,             group: "Academic" },
  { label: "Timetable",   href: "/faculty/timetable",  icon: Calendar,             group: "Academic" },
  { label: "Doubts",      href: "/faculty/doubts",     icon: MessageCircleQuestion,group: "More"     },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const nav = profile?.role === "faculty" ? facultyNav : studentNav;
  const groups: Record<string, NavItem[]> = {};
  nav.forEach(item => {
    const g = item.group || "Main";
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  });

  const initials = profile?.name
    ? profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const isActive = (href: string) =>
    location.pathname === href ||
    (href === "/faculty/students" && location.pathname.startsWith("/faculty/students"));

  const currentLabel = nav.find(n => isActive(n.href))?.label ?? "Dashboard";

  const SidebarContent = () => (
    <div className="flex flex-col h-full sidebar-clean">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-cyan-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl brand-bg shadow-sm shadow-cyan-200 shrink-0">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-base text-slate-700 tracking-tight">
          Campus<span className="brand-text">Connect</span>
        </span>
        <button className="ml-auto lg:hidden text-slate-400 hover:text-cyan-600 p-1 rounded-lg" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* User pill */}
      <div className="mx-3 mt-3 mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 bg-cyan-50/80 border border-cyan-100">
        <div className="h-8 w-8 shrink-0 rounded-full brand-bg flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-cyan-200">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">{profile?.name || "User"}</p>
          <p className="text-xs text-cyan-600 capitalize truncate">{profile?.role || "user"}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <p className="section-title">{group}</p>
            <div className="space-y-0.5">
              {items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href + item.label}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-cyan-500 text-white shadow-sm shadow-cyan-200"
                        : "text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-cyan-400")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 text-white/70 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 pt-3 border-t border-cyan-100">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen page-bg">
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 fixed top-0 left-0 h-screen z-30 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[260px] max-w-[85vw] flex flex-col transition-transform duration-300 ease-out lg:hidden shadow-2xl",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Topbar — NO search bar */}
        <header className="sticky top-0 z-30 topbar-clean px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-cyan-50 hover:text-cyan-600 transition-colors shrink-0"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title breadcrumb */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-600 truncate">
              <span className="text-slate-400 font-normal">CampusConnect /</span>{" "}
              <span className="text-slate-700">{currentLabel}</span>
            </p>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 border border-cyan-100 text-slate-500 hover:text-cyan-600 hover:bg-cyan-100 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-400" />
            </button>
            <div className="h-9 w-9 rounded-full brand-bg flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-cyan-200 cursor-pointer shrink-0">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 page-enter min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
