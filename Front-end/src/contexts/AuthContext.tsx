import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

export interface UserProfile {
  user_id: number;
  user_name: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null; // Keep profile for compatibility
  loading: boolean;
  login: (user_name: string, password: string) => Promise<void>;
  register: (user_name: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response: any = await api.get("/auth/me");
      setUser(response);
      localStorage.setItem("istock_session", JSON.stringify(response));
    } catch (err) {
      console.error("Profile fetch failed:", err);
      logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("istock_token");
    const session = localStorage.getItem("istock_session");
    if (token && session) {
      setUser(JSON.parse(session));
      fetchProfile();
    }
    setLoading(false);
  }, []);

  const login = async (user_name: string, password: string) => {
    const response: any = await api.post("/auth/login", { user_name, password });
    localStorage.setItem("istock_token", response.token);
    localStorage.setItem("istock_session", JSON.stringify(response.user));
    setUser(response.user);
  };

  const register = async (user_name: string, password: string) => {
    await api.post("/auth/register", { user_name, password });
  };

  const logout = () => {
    localStorage.removeItem("istock_token");
    localStorage.removeItem("istock_session");
    setUser(null);
  };

  // Compatibility flags (all registered users get full access since user_id/user_name/password are the only fields)
  const isAdmin = true;
  const isManager = true;
  const isStaff = true;

  return (
    <AuthContext.Provider value={{ 
        user, 
        profile: user,
        loading, 
        login,
        register,
        logout, 
        refreshProfile: fetchProfile,
        isAdmin,
        isManager,
        isStaff
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
