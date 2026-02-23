import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Users, CalendarCheck, Loader2, RefreshCw } from "lucide-react";

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "English",
];

const sections = ["A", "B", "C", "D"];

export default function FacultyAttendance() {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [section, setSection] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [alreadyMarked, setAlreadyMarked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Load students whenever section changes
  useEffect(() => {
    if (section) {
      loadStudents(section);
      setAttendance({});
      setAlreadyMarked({});
    } else {
      setStudents([]);
    }
  }, [section]);

  useEffect(() => {
    if (subject && date && students.length > 0) {
      loadExistingAttendance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, date, students]);

  const loadStudents = async (sec: string) => {
    setLoadingStudents(true);
    try {
      const response = await api.get("/students", { params: { section: sec } });
      setStudents(response.data);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadExistingAttendance = useCallback(async () => {
    setLoadingExisting(true);
    try {
      const results = await Promise.all(
        students.map((s) =>
          api
            .get(`/attendance/student/${s._id}`, { params: { subject } })
            .then((res) => ({ id: s._id, records: res.data as any[] }))
            .catch(() => ({ id: s._id, records: [] }))
        )
      );

      const markedMap: Record<string, boolean> = {};
      const statusMap: Record<string, string> = {};

      results.forEach(({ id, records }) => {
        const todayRecord = records.find((r: any) => r.date === date);
        if (todayRecord) {
          markedMap[id] = true;
          statusMap[id] = todayRecord.status;
        } else {
          markedMap[id] = false;
        }
      });

      setAlreadyMarked(markedMap);
      setAttendance(statusMap);
    } finally {
      setLoadingExisting(false);
    }
  }, [students, subject, date]);

  const handleToggle = (studentId: string, status: string) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const all: Record<string, string> = {};
    students.forEach((s) => (all[s._id] = "present"));
    setAttendance(all);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!section) {
      toast({ title: "Please select a section", variant: "destructive" });
      return;
    }
    if (!subject) {
      toast({ title: "Please select a subject", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await Promise.all(
        students.map((student) =>
          api.post("/attendance", {
            student_id: student._id,
            subject,
            date,
            status: attendance[student._id] || "absent",
          })
        )
      );
      toast({
        title: "Attendance Saved",
        description: `Attendance for Section ${section} — ${subject} on ${date} has been recorded.`,
      });
      await loadExistingAttendance();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = students.filter(
    (s) => (attendance[s._id] || "absent") === "present"
  ).length;

  const alreadyMarkedCount = Object.values(alreadyMarked).filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Mark Attendance</h1>
          {subject && date && alreadyMarkedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <CalendarCheck className="h-4 w-4 shrink-0" />
              <span>
                {alreadyMarkedCount} student{alreadyMarkedCount !== 1 ? "s" : ""} already marked — resubmitting will update their record
              </span>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Section selector — first so students load before anything else */}
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={section} onValueChange={(v) => { setSection(v); setSubject(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => (
                        <SelectItem key={s} value={s}>
                          Section {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={setSubject} disabled={!section}>
                    <SelectTrigger>
                      <SelectValue placeholder={section ? "Select subject" : "Select section first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Section student count badge */}
              {section && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <Users className="h-4 w-4 shrink-0" />
                  {loadingStudents
                    ? "Loading students…"
                    : `Section ${section}: ${students.length} student${students.length !== 1 ? "s" : ""}`}
                </div>
              )}

              {section && subject && students.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-green-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        {presentCount} present
                      </span>
                      <span className="flex items-center gap-1.5 text-red-500 font-medium">
                        <XCircle className="h-4 w-4" />
                        {students.length - presentCount} absent
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {loadingExisting && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadExistingAttendance}
                        disabled={loadingExisting}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Refresh
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllPresent}
                      >
                        All Present
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {students.map((student) => {
                      const status = attendance[student._id] || "absent";
                      const isPresent = status === "present";
                      const wasAlreadyMarked = alreadyMarked[student._id];

                      return (
                        <div
                          key={student._id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isPresent
                              ? "border-green-200 bg-green-50"
                              : "border-red-100 bg-red-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                isPresent
                                  ? "bg-green-200 text-green-800"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {student.name?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <div>
                              <div className="font-medium text-sm flex items-center gap-2">
                                {student.name}
                                {wasAlreadyMarked && (
                                  <span className="text-xs font-normal text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                                    saved
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {student.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex rounded-lg overflow-hidden border border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleToggle(student._id, "present")}
                              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                                isPresent
                                  ? "bg-green-500 text-white"
                                  : "bg-white text-gray-500 hover:bg-green-50"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggle(student._id, "absent")}
                              className={`px-4 py-1.5 text-sm font-medium transition-colors border-l ${
                                !isPresent
                                  ? "bg-red-500 text-white"
                                  : "bg-white text-gray-500 hover:bg-red-50"
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : alreadyMarkedCount > 0 ? (
                      "Update Attendance"
                    ) : (
                      "Save Attendance"
                    )}
                  </Button>
                </div>
              )}

              {section && subject && !loadingStudents && students.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No students found in Section {section} for your department.
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
