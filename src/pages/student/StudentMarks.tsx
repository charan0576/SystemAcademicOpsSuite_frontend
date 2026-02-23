import { useEffect, useState } from "react";
import { useAuth, api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StudentMarks() {
  const { profile } = useAuth();
  const [marks, setMarks] = useState<any[]>([]);

  useEffect(() => {
    if (profile) loadMarks();
  }, [profile]);

  const loadMarks = async () => {
    try {
      const response = await api.get(`/marks/student/${profile?.user_id}`);
      setMarks(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Group marks by exam type
  const groupedMarks = marks.reduce((acc, mark) => {
    const type = mark.exam_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(mark);
    return acc;
  }, {} as Record<string, any[]>);

  const examTypeLabels: Record<string, string> = {
    mid: "Mid Term Exams",
    assignment: "Assignments",
    sem: "Semester Exams"
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Marks</h1>
        
        {marks.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No marks records yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMarks).map(([examType, examMarks]) => (
              <Card key={examType}>
                <CardHeader>
                  <CardTitle>{examTypeLabels[examType] || examType}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Exam</th>
                          <th className="text-left p-3">Subject</th>
                          <th className="text-left p-3">Marks Obtained</th>
                          <th className="text-left p-3">Total Marks</th>
                          <th className="text-left p-3">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examMarks.map((mark) => {
                          const percentage = (mark.marks_obtained / mark.total_marks) * 100;
                          return (
                            <tr key={mark._id} className="border-b hover:bg-muted/50">
                              <td className="p-3">
                                <Badge variant="outline" className="uppercase">
                                  {mark.exam_name}
                                </Badge>
                              </td>
                              <td className="p-3">{mark.subject}</td>
                              <td className="p-3 font-medium">{mark.marks_obtained}</td>
                              <td className="p-3">{mark.total_marks}</td>
                              <td className="p-3">
                                <span className={`font-bold ${percentage >= 60 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {percentage.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
