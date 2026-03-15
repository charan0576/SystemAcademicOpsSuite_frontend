import { useState, useEffect } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Pencil, Save, X, Building2, Mail, GraduationCap, CalendarDays, LayoutGrid } from "lucide-react";

const DEPARTMENTS = ["Computer Science","Electronics","Mechanical","Civil","Chemical","Biotechnology","Physics","Mathematics","English"];
const YEARS = ["1","2","3","4"];
const SECTIONS = ["A","B","C","D"];

export default function StudentProfile() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", department:"", year:"", section:"" });
  const [original, setOriginal] = useState({ name:"", email:"", department:"", year:"", section:"" });

  useEffect(() => {
    if (profile) {
      const d = { name: profile.name||"", email: profile.email||"", department: profile.department||"", year: profile.year||"", section: (profile as any).section||"" };
      setForm(d); setOriginal(d);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${profile?.user_id}`, { name: form.name, department: form.department, year: form.year, section: form.section });
      setOriginal(form); setIsEditing(false);
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
    } catch { toast({ title: "Error", description: "Failed to update profile", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const initials = form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const fields = [
    { icon: User, label: "Full Name", key: "name", type: "text", editable: true },
    { icon: Mail, label: "Email", key: "email", type: "email", editable: false },
    { icon: Building2, label: "Department", key: "department", type: "select", options: DEPARTMENTS, editable: true },
    { icon: CalendarDays, label: "Year", key: "year", type: "select", options: YEARS, editable: true },
    { icon: LayoutGrid, label: "Section", key: "section", type: "select", options: SECTIONS, editable: true },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-xl font-bold text-slate-800">My Profile</h1>

        {/* Avatar card */}
        <div className="card-clean p-6 flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-sm shadow-blue-200 shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{form.name || "Student"}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {form.department && <span className="mr-2">{form.department}</span>}
              {form.year && <span className="mr-2">Year {form.year}</span>}
              {form.section && <span>Section {form.section}</span>}
            </p>
            <span className="badge-blue mt-2 inline-block">Student</span>
          </div>
          <div className="ml-auto">
            {isEditing ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { setForm(original); setIsEditing(false); }} variant="outline" className="gap-1.5">
                  <X className="h-3.5 w-3.5" />Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
                  <Save className="h-3.5 w-3.5" />{saving ? "Saving…" : "Save"}
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setIsEditing(true)} variant="outline" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />Edit
              </Button>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="card-clean divide-y divide-border/60">
          {fields.map(f => (
            <div key={f.key} className="flex items-center gap-4 px-5 py-4">
              <div className="h-9 w-9 rounded-xl bg-slate-50 border border-border/60 flex items-center justify-center shrink-0">
                <f.icon className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-400 mb-1">{f.label}</p>
                {isEditing && f.editable ? (
                  f.type === "select" ? (
                    <select
                      value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="text-sm font-medium text-slate-700 bg-slate-50 border border-border/60 rounded-lg px-2 py-1 w-full focus:outline-none focus:border-blue-400"
                    >
                      <option value="">Select {f.label}</option>
                      {f.options?.map(o => <option key={o} value={o}>{f.key === "year" ? `Year ${o}` : f.key === "section" ? `Section ${o}` : o}</option>)}
                    </select>
                  ) : (
                    <Input
                      type={f.type} value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="h-8 text-sm bg-slate-50 border-border/60 focus:bg-white"
                    />
                  )
                ) : (
                  <p className="text-sm font-semibold text-slate-700">
                    {(form as any)[f.key] ? (f.key === "year" ? `Year ${(form as any)[f.key]}` : f.key === "section" ? `Section ${(form as any)[f.key]}` : (form as any)[f.key]) : <span className="text-slate-300 font-normal">Not set</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
