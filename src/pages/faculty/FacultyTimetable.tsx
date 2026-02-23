import { useEffect, useState } from "react";
import { api, useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Trash2, Save, Edit } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface TimeSlot {
  time: string;
  subject: string;
}

interface Schedule {
  [day: string]: TimeSlot[];
}

export default function FacultyTimetable() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [semester, setSemester] = useState<number>(1);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [existingTimetables, setExistingTimetables] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasExistingTimetable, setHasExistingTimetable] = useState(false);

  useEffect(() => {
    loadExistingTimetables();
  }, []);

  useEffect(() => {
    loadTimetableForSemester(semester);
  }, [semester]);

  const loadExistingTimetables = async () => {
    try {
      const response = await api.get("/timetables");
      setExistingTimetables(response.data);
    } catch (error) {
      console.error("Error loading timetables:", error);
    }
  };

  const loadTimetableForSemester = async (sem: number) => {
    try {
      const response = await api.get(`/timetable/${sem}`);
      setSchedule(response.data.schedule || {});
      setHasExistingTimetable(true);
      setIsEditing(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No timetable exists, create empty schedule
        const emptySchedule: Schedule = {};
        DAYS.forEach(day => {
          emptySchedule[day] = [{ time: "", subject: "" }];
        });
        setSchedule(emptySchedule);
        setHasExistingTimetable(false);
        setIsEditing(true);
      }
    }
  };

  const addTimeSlot = (day: string) => {
    setSchedule({
      ...schedule,
      [day]: [...(schedule[day] || []), { time: "", subject: "" }]
    });
  };

  const removeTimeSlot = (day: string, index: number) => {
    const updatedSlots = schedule[day].filter((_, i) => i !== index);
    setSchedule({
      ...schedule,
      [day]: updatedSlots.length > 0 ? updatedSlots : [{ time: "", subject: "" }]
    });
  };

  const updateTimeSlot = (day: string, index: number, field: "time" | "subject", value: string) => {
    const updatedSlots = [...schedule[day]];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setSchedule({
      ...schedule,
      [day]: updatedSlots
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all slots have both time and subject
    let isValid = true;
    for (const day of DAYS) {
      const slots = schedule[day] || [];
      for (const slot of slots) {
        if ((slot.time && !slot.subject) || (!slot.time && slot.subject)) {
          toast({
            title: "Validation Error",
            description: `Please fill both time and subject for all slots in ${day}`,
            variant: "destructive"
          });
          isValid = false;
          break;
        }
      }
      if (!isValid) break;
    }

    if (!isValid) return;

    // Filter out empty slots
    const cleanSchedule: Schedule = {};
    DAYS.forEach(day => {
      const slots = schedule[day] || [];
      cleanSchedule[day] = slots.filter(slot => slot.time && slot.subject);
    });

    try {
      if (hasExistingTimetable) {
        await api.put(`/timetable/${semester}`, { schedule: cleanSchedule });
        toast({ title: "Success", description: "Timetable updated successfully" });
      } else {
        await api.post("/timetable", { semester, schedule: cleanSchedule });
        toast({ title: "Success", description: "Timetable created successfully" });
      }
      loadExistingTimetables();
      loadTimetableForSemester(semester);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save timetable",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the timetable for Semester ${semester}?`)) {
      return;
    }

    try {
      await api.delete(`/timetable/${semester}`);
      toast({ title: "Success", description: "Timetable deleted successfully" });
      loadExistingTimetables();
      loadTimetableForSemester(semester);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete timetable",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Timetable</h1>
            <p className="text-muted-foreground">
              Department: {profile?.department}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timetable Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
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

                {existingTimetables.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Existing timetables: {existingTimetables.map(t => `Sem ${t.semester}`).join(", ")}
                  </div>
                )}
              </div>

              {hasExistingTimetable && !isEditing && (
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Timetable
                  </Button>
                  <Button onClick={handleDelete} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Timetable
                  </Button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {DAYS.map((day) => (
                  <Card key={day}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(schedule[day] || [{ time: "", subject: "" }]).map((slot, index) => (
                        <div key={index} className="flex gap-3 items-end">
                          <div className="flex-1">
                            <Label className="text-xs">Time</Label>
                            <Input
                              type="text"
                              placeholder="9:00 AM - 10:00 AM"
                              value={slot.time}
                              onChange={(e) => updateTimeSlot(day, index, "time", e.target.value)}
                              disabled={hasExistingTimetable && !isEditing}
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Subject</Label>
                            <Input
                              type="text"
                              placeholder="Mathematics"
                              value={slot.subject}
                              onChange={(e) => updateTimeSlot(day, index, "subject", e.target.value)}
                              disabled={hasExistingTimetable && !isEditing}
                            />
                          </div>
                          {(isEditing || !hasExistingTimetable) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTimeSlot(day, index)}
                              disabled={schedule[day]?.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {(isEditing || !hasExistingTimetable) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(day)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Time Slot
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {(isEditing || !hasExistingTimetable) && (
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {hasExistingTimetable ? "Update Timetable" : "Create Timetable"}
                    </Button>
                    {hasExistingTimetable && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          loadTimetableForSemester(semester);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
