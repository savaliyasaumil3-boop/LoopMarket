import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface Company {
  id: string;
  name: string;
  company_type: string;
  industry?: string;
  city: string;
  trust_score: number;
  verification_tier?: string;
  stats?: any;
}

export interface DemoAccount {
  email: string;
  name: string;
  role: string;
  type: string;
  city: string;
  tag: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "abc@reloop.in",
    name: "ABC Manufacturing Pvt Ltd",
    role: "Seller (FMCG)",
    type: "Manufacturer",
    city: "Ahmedabad",
    tag: "Primary Seller"
  },
  {
    email: "buyer@greenpack.com",
    name: "GreenPack Industries Ltd",
    role: "Buyer (Packaging)",
    type: "Packaging Supplier",
    city: "Vadodara",
    tag: "High Volume Buyer"
  },
  {
    email: "dispatch@relooplogistics.in",
    name: "RELOOP GreenLogistics Fleet",
    role: "Logistics Carrier",
    type: "Logistics Provider",
    city: "Ahmedabad",
    tag: "Green Fleet"
  },
  {
    email: "contact@gujaratpolymers.in",
    name: "Gujarat Circular Polymers & Pulp",
    role: "Recycler / Processor",
    type: "Recycler",
    city: "Surat",
    tag: "Materials Recycler"
  }
];

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  switchDemoCompany: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('reloop_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [company, setCompany] = useState<Company | null>(() => {
    try {
      const saved = localStorage.getItem('reloop_company');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('reloop_token') || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync / refresh profile on startup if user token is stored
  useEffect(() => {
    const currentToken = localStorage.getItem('reloop_token');
    const savedUserStr = localStorage.getItem('reloop_user');
    
    if (currentToken && savedUserStr) {
      try {
        const parsedUser = JSON.parse(savedUserStr);
        if (parsedUser?.email) {
          api.getProfile(parsedUser.email)
            .then(res => {
              if (res?.user && res?.company) {
                setUser(res.user);
                setCompany(res.company);
                localStorage.setItem('reloop_user', JSON.stringify(res.user));
                localStorage.setItem('reloop_company', JSON.stringify(res.company));
              }
            })
            .catch(() => {
              // Maintain saved offline state
            });
        }
      } catch {
        // ignore parse error
      }
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email: email.trim().toLowerCase(), password: pass });
      if (res?.access_token) {
        setToken(res.access_token);
        localStorage.setItem('reloop_token', res.access_token);
        setUser(res.user);
        localStorage.setItem('reloop_user', JSON.stringify(res.user));
        setCompany(res.company);
        localStorage.setItem('reloop_company', JSON.stringify(res.company));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      if (res?.access_token) {
        setToken(res.access_token);
        localStorage.setItem('reloop_token', res.access_token);
        setUser(res.user);
        localStorage.setItem('reloop_user', JSON.stringify(res.user));
        setCompany(res.company);
        localStorage.setItem('reloop_company', JSON.stringify(res.company));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoCompany = async (email: string) => {
    setIsLoading(true);
    try {
      // First try to authenticate cleanly
      try {
        const loginRes = await api.login({ email, password: 'password123' });
        if (loginRes?.access_token) {
          setToken(loginRes.access_token);
          localStorage.setItem('reloop_token', loginRes.access_token);
          setUser(loginRes.user);
          localStorage.setItem('reloop_user', JSON.stringify(loginRes.user));
          setCompany(loginRes.company);
          localStorage.setItem('reloop_company', JSON.stringify(loginRes.company));
          return;
        }
      } catch {
        // Fallback to getProfile
      }

      const res = await api.getProfile(email);
      if (res?.user && res?.company) {
        setUser(res.user);
        localStorage.setItem('reloop_user', JSON.stringify(res.user));
        setCompany(res.company);
        localStorage.setItem('reloop_company', JSON.stringify(res.company));
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
    localStorage.removeItem('reloop_user');
    localStorage.removeItem('reloop_company');
  };

  return (
    <AuthContext.Provider value={{
      user,
      company,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      signup,
      switchDemoCompany,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

