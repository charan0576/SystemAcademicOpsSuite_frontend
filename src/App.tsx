import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentMarks from "./pages/student/StudentMarks";
import StudentDoubts from "./pages/student/StudentDoubts";
import StudentTimetable from "./pages/student/StudentTimetable";

import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import FacultyProfile from "./pages/faculty/FacultyProfile";
import FacultyStudents from "./pages/faculty/FacultyStudents";
import FacultyAttendance from "./pages/faculty/FacultyAttendance";
import FacultyMarks from "./pages/faculty/FacultyMarks";
import FacultyDoubts from "./pages/faculty/FacultyDoubts";
import FacultyTimetable from "./pages/faculty/FacultyTimetable";
import FacultyStudentView from "./pages/faculty/FacultyStudentView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/student" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute requiredRole="student"><StudentAttendance /></ProtectedRoute>} />
            <Route path="/student/marks" element={<ProtectedRoute requiredRole="student"><StudentMarks /></ProtectedRoute>} />
            <Route path="/student/doubts" element={<ProtectedRoute requiredRole="student"><StudentDoubts /></ProtectedRoute>} />
            <Route path="/student/timetable" element={<ProtectedRoute requiredRole="student"><StudentTimetable /></ProtectedRoute>} />

            <Route path="/faculty" element={<ProtectedRoute requiredRole="faculty"><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/profile" element={<ProtectedRoute requiredRole="faculty"><FacultyProfile /></ProtectedRoute>} />
            <Route path="/faculty/students" element={<ProtectedRoute requiredRole="faculty"><FacultyStudents /></ProtectedRoute>} />
            <Route path="/faculty/attendance" element={<ProtectedRoute requiredRole="faculty"><FacultyAttendance /></ProtectedRoute>} />
            <Route path="/faculty/marks" element={<ProtectedRoute requiredRole="faculty"><FacultyMarks /></ProtectedRoute>} />
            <Route path="/faculty/doubts" element={<ProtectedRoute requiredRole="faculty"><FacultyDoubts /></ProtectedRoute>} />
            <Route path="/faculty/timetable" element={<ProtectedRoute requiredRole="faculty"><FacultyTimetable /></ProtectedRoute>} />
            <Route path="/faculty/students/:studentId" element={<ProtectedRoute requiredRole="faculty"><FacultyStudentView /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
