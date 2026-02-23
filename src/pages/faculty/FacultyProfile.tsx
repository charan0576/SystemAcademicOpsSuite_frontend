import { useState, useEffect } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Pencil, Save, X, Building2, Mail, BadgeCheck } from "lucide-react";

const DEPARTMENTS = [
  "Computer Science", "Electronics", "Mechanical", "Civil",
  "Chemical", "Biotechnology", "Physics", "Mathematics", "English",
];

export default function FacultyProfile() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", department: "" });
  const [original, setOriginal] = useState({ name: "", email: "", department: "" });

  useEffect(() => {
    if (profile) {
      const data = {
        name: profile.name || "",
        email: profile.email || "",
        department: profile.department || "",
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
      });
      // Update local profile context values via page refresh approach
      if (res.data.profile) {
        const p = res.data.profile;
        setForm({ name: p.name, email: p.email, department: p.department });
        setOriginal({ name: p.name, email: p.email, department: p.department });
      }
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
      setIsEditing(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const initials = form.name ? form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "F";

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

        {/* Avatar card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-indigo-700 text-2xl font-bold">{initials}</span>
              </div>
              <div>
                <div className="text-xl font-bold">{form.name || "—"}</div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <BadgeCheck className="h-4 w-4 text-indigo-500" />
                  <span>Faculty</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Building2 className="h-4 w-4" />
                  <span>{form.department || "—"}</span>
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
              {isEditing && <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-2">Editing</span>}
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
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-sm">{form.name || "—"}</div>
                )}
              </div>

              {/* Email — always read-only */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                  <span className="text-xs text-muted-foreground font-normal">(cannot change)</span>
                </Label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-sm text-muted-foreground">{form.email || "—"}</div>
              </div>

              {/* Department */}
              <div className="space-y-1.5 md:col-span-2">
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
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-sm">{form.department || "—"}</div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                ⚠️ Changing your department will affect which students you can see and manage.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
