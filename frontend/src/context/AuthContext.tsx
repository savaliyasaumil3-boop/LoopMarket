import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
  company_type: string;
  industry?: string;
  city: string;
  trust_score: number;
  stats?: any;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  switchDemoCompany: (email: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: "usr-demo-1",
    email: "abc@reloop.in",
    full_name: "Rajesh Sharma",
    role: "SELLER"
  });
  const [company, setCompany] = useState<Company | null>({
    id: "comp-demo-1",
    name: "ABC Manufacturing Pvt Ltd",
    company_type: "Manufacturer",
    city: "Ahmedabad",
    trust_score: 96.0,
    stats: {
      total_sold_kg: 85000,
      total_bought_kg: 120000,
      waste_diverted_kg: 205000,
      co2_saved_kg: 184500,
      completed_transactions: 34,
      on_time_rate: 97.2,
      acceptance_rate: 96.5
    }
  });
  const [token, setToken] = useState<string | null>("demo_token_reloop_2026");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initial fetch to sync with backend
    api.getProfile("abc@reloop.in")
      .then(res => {
        if (res?.user && res?.company) {
          setUser(res.user);
          setCompany(res.company);
        }
      })
      .catch(() => {
        // use default state
      });
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      setToken(res.access_token);
      localStorage.setItem('reloop_token', res.access_token);
      setUser(res.user);
      setCompany(res.company);
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoCompany = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.getProfile(email);
      if (res?.user && res?.company) {
        setUser(res.user);
        setCompany(res.company);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    setToken(null);
    localStorage.removeItem('reloop_token');
  };

  return (
    <AuthContext.Provider value={{ user, company, token, login, switchDemoCompany, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
