import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: "student" | "faculty";
  department: string;
  year: string | null;
}

interface AuthContextType {
  user: any | null;
  session: any | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  signIn: async () => {},
  signUp: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      if (response.data.profile) {
        setProfile(response.data.profile);
        setUser({ id: response.data.profile.user_id, email: response.data.profile.email });
        setSession({ user: { id: response.data.profile.user_id } });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("access_token");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, profile, access_token } = response.data;
      
      localStorage.setItem("access_token", access_token);
      setUser(user);
      setProfile(profile);
      setSession({ user });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Login failed");
    }
  };

  const signUp = async (data: any) => {
    try {
      const response = await api.post("/auth/register", data);
      const { user, profile, access_token } = response.data;
      
      localStorage.setItem("access_token", access_token);
      setUser(user);
      setProfile(profile);
      setSession({ user });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Registration failed");
    }
  };

  const signOut = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export API instance for use in other components
export { api };
