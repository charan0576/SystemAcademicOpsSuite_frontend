import { useEffect, useState } from "react";
import { api, useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface TimeSlot {
  time: string;
  subject: string;
}

interface Schedule {
  [day: string]: TimeSlot[];
}

export default function StudentTimetable() {
  const { profile } = useAuth();
  const [semester, setSemester] = useState<number>(1);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set semester from user profile if available
    if (profile?.year) {
      const semesterNum = parseInt(profile.year);
      if (!isNaN(semesterNum) && semesterNum >= 1 && semesterNum <= 8) {
        setSemester(semesterNum);
      }
    }
  }, [profile]);

  useEffect(() => {
    loadTimetable(semester);
  }, [semester]);

  const loadTimetable = async (sem: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/timetable/${sem}`);
      setSchedule(response.data.schedule || {});
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError(`No timetable available for Semester ${sem} in ${profile?.department}`);
        setSchedule(null);
      } else {
        setError("Failed to load timetable");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-muted-foreground">
            Department: {profile?.department} | Your Semester: {profile?.year || "Not set"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              View Timetable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="w-48">
                <Label>Select Semester</Label>
                <Select
                  value={semester.toString()}
                  onValueChange={(val) => setSemester(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Loading timetable...
                </div>
              )}

              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!loading && !error && schedule && (
                <div className="space-y-4">
                  {DAYS.map((day) => {
                    const daySlots = schedule[day] || [];
                    if (daySlots.length === 0) return null;

                    return (
                      <Card key={day}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {day}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {daySlots.map((slot, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-4 p-3 border rounded-lg bg-muted/50"
                              >
                                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[180px]">
                                  <Clock className="h-4 w-4" />
                                  {slot.time}
                                </div>
                                <div className="flex items-center gap-2 font-medium">
                                  <BookOpen className="h-4 w-4" />
                                  {slot.subject}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
