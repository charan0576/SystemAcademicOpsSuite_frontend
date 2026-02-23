import { useEffect, useState } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Calendar, MessageSquare } from "lucide-react";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ attendance: 0, subjects: 0, doubts: 0 });

  useEffect(() => {
    if (profile) loadStats();
  }, [profile]);

  const loadStats = async () => {
    try {
      const [attendanceRes, marksRes, doubtsRes] = await Promise.all([
        api.get(`/attendance/percentage/${profile?.user_id}`).catch(() => ({ data: { percentage: 0 } })),
        api.get(`/marks/student/${profile?.user_id}`).catch(() => ({ data: [] })),
        api.get(`/doubts/student/${profile?.user_id}`).catch(() => ({ data: [] }))
      ]);
      setStats({
        attendance: attendanceRes.data.percentage || 0,
        subjects: new Set(marksRes.data.map((m: any) => m.subject)).size || 0,
        doubts: doubtsRes.data.length || 0
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile?.name}!</h1>
          <p className="text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
            Your academic overview
            {profile?.department && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full border">{profile.department}</span>
            )}
            {profile?.year && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full border">Year {profile.year}</span>
            )}
            {(profile as any)?.section && (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                Section {(profile as any).section}
              </span>
            )}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendance}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subjects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Doubts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.doubts}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
