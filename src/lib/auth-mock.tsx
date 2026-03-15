import { createContext, useContext, useEffect, useState, ReactNode } from "react";

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('mock_user');
    const savedProfile = localStorage.getItem('mock_profile');

    if (savedUser && savedProfile) {
      try {
        setUser(JSON.parse(savedUser));
        setProfile(JSON.parse(savedProfile));
        setSession({ user: JSON.parse(savedUser) });
      } catch (e) {
        console.error('Error parsing saved session', e);
      }
    }
    
    // Set loading to false after checking
    setLoading(false);
  }, []);

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    setSession(null);
    localStorage.removeItem('mock_user');
    localStorage.removeItem('mock_profile');
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
