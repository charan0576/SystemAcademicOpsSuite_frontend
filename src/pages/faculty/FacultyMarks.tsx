import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, BookOpen, BadgeCheck, Users } from "lucide-react";

const subjects = ["Mathematics", "Physics", "Chemistry", "Computer Science", "English"];
const sections = ["A", "B", "C", "D"];
const examTypes = [
  { value: "mid",        label: "Mid Term" },
  { value: "assignment", label: "Assignment" },
  { value: "sem",        label: "Semester" },
];
const examNames: Record<string, string[]> = {
  mid:        ["mid1","mid2"],
  assignment: ["assignment1","assignment2","assignment3","assignment4","assignment5"],
  sem:        ["sem1","sem2","sem3","sem4","sem5","sem6","sem7","sem8"],
};

export default function FacultyMarks() {
  const { toast } = useToast();
  const [students, setStudents]         = useState<any[]>([]);
  const [section, setSection]           = useState("");
  const [subject, setSubject]           = useState("");
  const [examType, setExamType]         = useState("");
  const [examName, setExamName]         = useState("");
  const [totalMarks, setTotalMarks]     = useState("100");
  const [marks, setMarks]               = useState<Record<string, string>>({});
  const [existingMarks, setExistingMarks] = useState<Record<string, number>>({});
  const [submitting, setSubmitting]     = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Load students when section changes
  useEffect(() => {
    if (section) {
      loadStudents(section);
      setMarks({});
      setExistingMarks({});
    } else {
      setStudents([]);
    }
  }, [section]);

  useEffect(() => { setExamName(""); }, [examType]);

  useEffect(() => {
    if (subject && examName && students.length > 0) loadExistingMarks();
    else setExistingMarks({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, examName, students]);

  const loadStudents = async (sec: string) => {
    setLoadingStudents(true);
    try {
      const r = await api.get("/students", { params: { section: sec } });
      setStudents(r.data);
    } catch { console.error("Failed to load students"); }
    finally { setLoadingStudents(false); }
  };

  const loadExistingMarks = useCallback(async () => {
    setLoadingExisting(true);
    try {
      const results = await Promise.all(
        students.map(s =>
          api.get(`/marks/student/${s._id}`, { params: { subject } })
             .then(r => ({ id: s._id, records: r.data as any[] }))
             .catch(() => ({ id: s._id, records: [] }))
        )
      );
      const em: Record<string, number> = {};
      const prefill: Record<string, string> = {};
      results.forEach(({ id, records }) => {
        const rec = records.find((r: any) => r.exam_name === examName && r.subject === subject);
        if (rec) {
          em[id] = Math.round(Number(rec.marks_obtained));
          prefill[id] = String(Math.round(Number(rec.marks_obtained)));
        }
      });
      setExistingMarks(em);
      setMarks(prefill);
    } finally { setLoadingExisting(false); }
  }, [students, subject, examName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!section) {
      toast({ title: "Missing section", description: "Please select a section.", variant: "destructive" });
      return;
    }
    if (!subject || !examType || !examName) {
      toast({ title: "Missing fields", description: "Please select subject, exam type and exam name.", variant: "destructive" });
      return;
    }
    const entries = Object.entries(marks).filter(([, v]) => v !== "" && !isNaN(parseInt(v)));
    if (entries.length === 0) {
      toast({ title: "No marks entered", description: "Enter at least one student's mark.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await Promise.all(
        entries.map(([studentId, mark]) =>
          api.post("/marks", {
            student_id: studentId,
            subject,
            exam_type: examType,
            exam_name: examName,
            marks_obtained: parseInt(mark),
            total_marks: parseInt(totalMarks),
          })
        )
      );
      toast({ title: "Marks Saved", description: `${entries.length} mark${entries.length!==1?"s":""} saved for Section ${section} — ${examName.toUpperCase()}.` });
      await loadExistingMarks();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.detail || "Failed to save marks", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const existingCount = Object.keys(existingMarks).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Enter Marks</h1>

        <Card>
          <CardHeader><CardTitle>Exam Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Selectors row */}
              <div className="grid gap-4 md:grid-cols-5">
                {/* Section */}
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={section} onValueChange={v => { setSection(v); setMarks({}); }}>
                    <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                    <SelectContent>
                      {sections.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={v => { setSubject(v); setMarks({}); }} disabled={!section}>
                    <SelectTrigger><SelectValue placeholder={section ? "Select subject" : "Select section first"} /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exam Type</Label>
                  <Select value={examType} onValueChange={v => { setExamType(v); setMarks({}); }} disabled={!section}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{examTypes.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exam Name</Label>
                  <Select value={examName} onValueChange={setExamName} disabled={!examType}>
                    <SelectTrigger><SelectValue placeholder="Select name" /></SelectTrigger>
                    <SelectContent>
                      {examType && examNames[examType]?.map(n => <SelectItem key={n} value={n}>{n.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input type="number" min="1" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} />
                </div>
              </div>

              {/* Section student count */}
              {section && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <Users className="h-4 w-4 shrink-0" />
                  {loadingStudents
                    ? "Loading students…"
                    : `Section ${section}: ${students.length} student${students.length !== 1 ? "s" : ""}`}
                </div>
              )}

              {/* Students list */}
              {section && subject && examType && examName && students.length > 0 && (
                <div className="space-y-4">
                  {/* Info bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>Section {section} — {subject} — {examName.toUpperCase()} (/{totalMarks})</span>
                      </div>
                      {existingCount > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {existingCount} already saved — resubmitting will update
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={loadExistingMarks} disabled={loadingExisting}>
                      {loadingExisting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      <span className="ml-1.5">Refresh</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {students.map(student => {
                      const saved = existingMarks[student._id];
                      const inputVal = marks[student._id] ?? "";
                      const pct = inputVal !== "" && parseInt(totalMarks) > 0
                        ? Math.round((parseInt(inputVal) / parseInt(totalMarks)) * 100) : null;
                      const barColor = pct===null?"":pct>=75?"bg-green-500":pct>=50?"bg-amber-400":"bg-red-500";

                      return (
                        <div key={student._id} className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${saved!==undefined?"border-amber-200 bg-amber-50/40":"border-gray-200"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${saved!==undefined?"bg-amber-100 text-amber-800":"bg-gray-100 text-gray-600"}`}>
                              {student.name?.charAt(0)?.toUpperCase()||"S"}
                            </div>
                            <div>
                              <div className="font-medium text-sm flex items-center gap-2">
                                {student.name}
                                {saved !== undefined && (
                                  <span className="text-xs font-normal text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                                    saved: {saved}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{student.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {pct !== null && (
                              <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden hidden sm:block">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                              </div>
                            )}
                            {pct !== null && (
                              <span className={`text-xs font-medium w-8 text-right ${pct>=75?"text-green-600":pct>=50?"text-amber-500":"text-red-500"}`}>{pct}%</span>
                            )}
                            <Input
                              type="number"
                              className="w-28 text-center"
                              placeholder={`/ ${totalMarks}`}
                              min="0"
                              max={totalMarks}
                              value={inputVal}
                              onChange={e => setMarks({ ...marks, [student._id]: e.target.value })}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                    ) : existingCount > 0 ? "Update Marks" : "Save Marks"}
                  </Button>
                </div>
              )}

              {section && subject && examType && examName && !loadingStudents && students.length === 0 && (
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
