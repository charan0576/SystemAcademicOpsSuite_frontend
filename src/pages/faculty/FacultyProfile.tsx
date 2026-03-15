import { useState, useEffect } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Pencil, Save, X, Building2, Mail } from "lucide-react";

const DEPARTMENTS = ["Computer Science","Electronics","Mechanical","Civil","Chemical","Biotechnology","Physics","Mathematics","English"];

export default function FacultyProfile() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", department: "" });
  const [original, setOriginal] = useState({ name: "", email: "", department: "" });

  useEffect(() => {
    if (profile) {
      const d = { name: profile.name || "", email: profile.email || "", department: profile.department || "" };
      setForm(d); setOriginal(d);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${profile?.user_id}`, { name: form.name, department: form.department });
      setOriginal(form); setIsEditing(false);
      toast({ title: "Profile updated!" });
    } catch { toast({ title: "Error", description: "Failed to update", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const initials = form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

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
            <h2 className="text-xl font-bold text-slate-800">{form.name || "Faculty"}</h2>
            <p className="text-sm text-slate-400 mt-1">{form.department || "—"}</p>
            <span className="badge-purple mt-2 inline-block">Faculty</span>
          </div>
          <div className="ml-auto">
            {isEditing ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setForm(original); setIsEditing(false); }}>
                  <X className="h-3.5 w-3.5" />Cancel
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5" onClick={handleSave} disabled={saving}>
                  <Save className="h-3.5 w-3.5" />{saving ? "Saving…" : "Save"}
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />Edit
              </Button>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="card-clean divide-y divide-border/60">
          {[
            { icon: User, label: "Full Name", key: "name", type: "text", editable: true },
            { icon: Mail, label: "Email", key: "email", type: "email", editable: false },
            { icon: Building2, label: "Department", key: "department", type: "select", editable: true },
          ].map(f => (
            <div key={f.key} className="flex items-center gap-4 px-5 py-4">
              <div className="h-9 w-9 rounded-xl bg-slate-50 border border-border/60 flex items-center justify-center shrink-0">
                <f.icon className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-400 mb-1">{f.label}</p>
                {isEditing && f.editable ? (
                  f.type === "select" ? (
                    <select value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-border/60 rounded-lg px-2 py-1 outline-none focus:border-blue-400">
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <Input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="h-8 text-sm bg-slate-50 border-border/60 focus:bg-white" />
                  )
                ) : (
                  <p className="text-sm font-semibold text-slate-700">
                    {(form as any)[f.key] || <span className="text-slate-300 font-normal">Not set</span>}
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
