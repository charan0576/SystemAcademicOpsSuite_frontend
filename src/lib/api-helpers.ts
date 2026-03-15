import { api } from "@/lib/auth";

// Students API
export const studentsAPI = {
  async getAll() {
    const response = await api.get("/students");
    return { data: response.data, error: null };
  },
};

// Attendance API
export const attendanceAPI = {
  async create(records: any[]) {
    try {
      const promises = records.map(record => api.post("/attendance", record));
      await Promise.all(promises);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.response?.data?.detail || "Failed to mark attendance" } };
    }
  },

  async getByStudent(studentId: string, subject?: string) {
    const params = subject ? { subject } : {};
    const response = await api.get(`/attendance/student/${studentId}`, { params });
    return { data: response.data, error: null };
  },

  async getPercentage(studentId: string, subject?: string) {
    const params = subject ? { subject } : {};
    const response = await api.get(`/attendance/percentage/${studentId}`, { params });
    return response.data;
  },
};

// Marks API
export const marksAPI = {
  async create(mark: any) {
    try {
      const response = await api.post("/marks", mark);
      return { data: response.data, error: null };
    } catch (error: any) {
      return { error: { message: error.response?.data?.detail || "Failed to insert marks" } };
    }
  },

  async getByStudent(studentId: string, subject?: string) {
    const params = subject ? { subject } : {};
    const response = await api.get(`/marks/student/${studentId}`, { params });
    return { data: response.data, error: null };
  },
};

// Doubts API
export const doubtsAPI = {
  async create(doubt: any) {
    try {
      const response = await api.post("/doubts", doubt);
      return { data: response.data, error: null };
    } catch (error: any) {
      return { error: { message: error.response?.data?.detail || "Failed to create doubt" } };
    }
  },

  async getAll() {
    const response = await api.get("/doubts");
    return { data: response.data, error: null };
  },

  async getByStudent(studentId: string) {
    const response = await api.get(`/doubts/student/${studentId}`);
    return { data: response.data, error: null };
  },

  async reply(doubtId: string, reply: string) {
    try {
      await api.patch(`/doubts/${doubtId}/reply`, { reply });
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.response?.data?.detail || "Failed to send reply" } };
    }
  },
};

// Profile API (for updates)
export const profileAPI = {
  async update(userId: string, updates: any) {
    // This would need a backend endpoint - for now just return success
    return { error: null };
  },
};
