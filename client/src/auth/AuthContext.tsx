import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loginRequest, registerRequest, type AuthUser } from "../lib/api";

export interface SessionUser {
  id: string;
  displayName: string;
  isGuest: boolean;
  email?: string;
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  continueAsGuest: (displayName: string) => void;
  logout: () => void;
}

const STORAGE_KEY = "studyxp.auth";

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    return JSON.parse(raw) as AuthState;
  } catch {
    return { token: null, user: null };
  }
}

function toSessionUser(user: AuthUser): SessionUser {
  return { id: user.id, displayName: user.displayName, email: user.email, isGuest: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStoredAuth);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const login = async (email: string, password: string) => {
    const res = await loginRequest(email, password);
    setState({ token: res.token, user: toSessionUser(res.user) });
  };

  const register = async (email: string, password: string, displayName: string) => {
    const res = await registerRequest(email, password, displayName);
    setState({ token: res.token, user: toSessionUser(res.user) });
  };

  const continueAsGuest = (displayName: string) => {
    setState({
      token: null,
      user: { id: `local-guest-${Date.now()}`, displayName, isGuest: true },
    });
  };

  const logout = () => setState({ token: null, user: null });

  return (
    <AuthContext.Provider value={{ ...state, login, register, continueAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
