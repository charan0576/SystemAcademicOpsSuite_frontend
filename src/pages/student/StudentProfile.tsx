import { useState, useEffect } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Pencil, Save, X, Building2, Mail, GraduationCap, CalendarDays, LayoutGrid } from "lucide-react";

const DEPARTMENTS = [
  "Computer Science", "Electronics", "Mechanical", "Civil",
  "Chemical", "Biotechnology", "Physics", "Mathematics", "English",
];
const YEARS = ["1", "2", "3", "4"];
const SECTIONS = ["A", "B", "C", "D"];

export default function StudentProfile() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", department: "", year: "", section: "" });
  const [original, setOriginal] = useState({ name: "", email: "", department: "", year: "", section: "" });

  useEffect(() => {
    if (profile) {
      const data = {
        name: profile.name || "",
        email: profile.email || "",
        department: profile.department || "",
        year: profile.year || "",
        section: (profile as any).section || "",
      };
      setForm(data);
      setOriginal(data);
    }
  }, [profile]);

  const handleEdit = () => {
    setOriginal({ ...form });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setForm({ ...original });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast({ title: "Validation Error", description: "Name must be at least 2 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch("/auth/profile", {
        name: form.name.trim(),
        department: form.department,
        year: form.year,
        section: form.section,
      });
      if (res.data.profile) {
        const p = res.data.profile;
        const updated = {
          name: p.name,
          email: p.email,
          department: p.department,
          year: p.year || "",
          section: p.section || "",
        };
        setForm(updated);
        setOriginal(updated);
      }
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
      setIsEditing(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const initials = form.name
    ? form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "S";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Profile</h1>
          {!isEditing ? (
            <Button variant="outline" onClick={handleEdit} className="gap-2">
              <Pencil className="h-4 w-4" /> Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={saving} className="gap-2">
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        {/* Avatar / summary card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-emerald-700 text-2xl font-bold">{initials}</span>
              </div>
              <div>
                <div className="text-xl font-bold">{form.name || "—"}</div>

                {/* Role badge */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <GraduationCap className="h-4 w-4 text-emerald-500" />
                  <span>Student</span>
                </div>

                {/* Department · Year · Section chips */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                  {form.department && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {form.department}
                    </span>
                  )}
                  {form.year && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      Year {form.year}
                    </span>
                  )}
                  {form.section && (
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <LayoutGrid className="h-4 w-4" />
                      Section {form.section}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" /> Personal Information
              {isEditing && (
                <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-2">
                  Editing
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">

              {/* Name */}
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                {isEditing ? (
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">{form.name || "—"}</div>
                )}
              </div>

              {/* Email — always read-only */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                  <span className="text-xs text-muted-foreground font-normal">(cannot change)</span>
                </Label>
                <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                  {form.email || "—"}
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <Label>Department</Label>
                {isEditing ? (
                  <select
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">{form.department || "—"}</div>
                )}
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <Label>Year</Label>
                {isEditing ? (
                  <select
                    value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                    {form.year ? `Year ${form.year}` : "—"}
                  </div>
                )}
              </div>

              {/* Section — full width on mobile, half on md+ */}
              <div className="space-y-1.5 md:col-span-2 md:w-1/2">
                <Label className="flex items-center gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5" /> Section
                </Label>
                {isEditing ? (
                  <select
                    value={form.section}
                    onChange={e => setForm({ ...form, section: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select section</option>
                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-sm">
                    {form.section ? (
                      <>
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                          {form.section}
                        </span>
                        <span>Section {form.section}</span>
                      </>
                    ) : "—"}
                  </div>
                )}
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
