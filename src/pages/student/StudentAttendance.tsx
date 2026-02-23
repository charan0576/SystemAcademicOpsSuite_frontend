import { useEffect, useState } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Calendar } from "lucide-react";

interface AttendanceRecord {
  _id: string;
  subject: string;
  date: string;
  status: "present" | "absent";
}

// Group records by date, sorted newest-first
function groupByDate(records: AttendanceRecord[]): Map<string, AttendanceRecord[]> {
  const map = new Map<string, AttendanceRecord[]>();
  // Sort newest date first
  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  for (const rec of sorted) {
    if (!map.has(rec.date)) map.set(rec.date, []);
    map.get(rec.date)!.push(rec);
  }
  return map;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

export default function StudentAttendance() {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [percentage, setPercentage] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (profile) loadAttendance();
  }, [profile]);

  const loadAttendance = async () => {
    try {
      const [recordsRes, percentRes] = await Promise.all([
        api.get(`/attendance/student/${profile?.user_id}`),
        api.get(`/attendance/percentage/${profile?.user_id}`),
      ]);
      setAttendance(recordsRes.data);
      setPercentage(percentRes.data.percentage || 0);
      setPresentCount(percentRes.data.present || 0);
      setTotalCount(percentRes.data.total || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const grouped = groupByDate(attendance);
  const percentageColor =
    percentage >= 75 ? "text-green-600" : percentage >= 60 ? "text-amber-500" : "text-red-600";
  const percentageBg =
    percentage >= 75 ? "bg-green-50 border-green-200" : percentage >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">My Attendance</h1>

          {/* Overall Stats */}
          <div className={`flex items-center gap-4 rounded-xl border px-5 py-3 ${percentageBg}`}>
            <div className="text-center">
              <div className={`text-3xl font-bold ${percentageColor}`}>{percentage}%</div>
              <div className="text-xs text-muted-foreground mt-0.5">Overall</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <div className="text-xl font-semibold text-green-600">{presentCount}</div>
              <div className="text-xs text-muted-foreground">Present</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-red-500">{totalCount - presentCount}</div>
              <div className="text-xs text-muted-foreground">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-700">{totalCount}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>

        {/* Records grouped by day */}
        {attendance.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No attendance records yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {Array.from(grouped.entries()).map(([dateStr, records]) => {
              const dayPresent = records.filter((r) => r.status === "present").length;
              const dayTotal = records.length;
              const today = isToday(dateStr);

              return (
                <div key={dateStr} className="space-y-2">
                  {/* Day header — visually separated */}
                  <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${
                    today
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-4 w-4 ${today ? "text-blue-500" : "text-gray-400"}`} />
                      <span className={`font-semibold text-sm ${today ? "text-blue-700" : "text-gray-700"}`}>
                        {formatDate(dateStr)}
                        {today && (
                          <span className="ml-2 text-xs font-medium bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {dayPresent}/{dayTotal} present
                    </span>
                  </div>

                  {/* Records for that day */}
                  <div className="space-y-1.5 pl-2">
                    {records.map((record) => (
                      <div
                        key={record._id}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                          record.status === "present"
                            ? "border-green-200 bg-green-50/60"
                            : "border-red-100 bg-red-50/40"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-sm">{record.subject}</div>
                          <div className="text-xs text-muted-foreground capitalize">{record.date}</div>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 text-sm font-semibold ${
                            record.status === "present"
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {record.status === "present" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          <span className="capitalize">{record.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
