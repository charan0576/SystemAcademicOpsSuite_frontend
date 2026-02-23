import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, ChevronRight, Search, GraduationCap } from "lucide-react";

interface Student {
  _id: string;
  name: string;
  email: string;
  department: string;
  year?: string;
}

export default function FacultyStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/students")
      .then((res) => setStudents(res.data))
      .catch(console.error);
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.year && s.year.includes(search))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Students</h1>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-sm text-indigo-700 font-medium">
            <Users className="h-4 w-4" />
            {students.length} student{students.length !== 1 ? "s" : ""}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-indigo-500" />
              All Students
            </CardTitle>
            {/* Search */}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or year…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-25" />
                <p>{search ? "No students match your search" : "No students found"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((student) => (
                  <button
                    key={student._id}
                    onClick={() => navigate(`/faculty/students/${student._id}`)}
                    className="w-full flex items-center justify-between p-3 border rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                        <span className="text-indigo-700 font-bold text-sm">
                          {student.name?.charAt(0)?.toUpperCase() || "S"}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-gray-600">{student.department}</div>
                        {student.year && (
                          <div className="text-xs text-muted-foreground">Year {student.year}</div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
