import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { loginRequest, registerRequest, type AuthUser } from "../lib/api";
import { ALL_CHARACTER_IDS, DEFAULT_CHARACTER_ID } from "../game/characterPresets";

export interface SessionUser {
  id: string;
  displayName: string;
  isGuest: boolean;
  character: string;
  ownedCharacters: string[];
  coins: number;
  email?: string;
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  continueAsGuest: (displayName: string, character?: string) => void;
  logout: () => void;
  updateDisplayName: (displayName: string) => void;
  updateCharacter: (character: string) => void;
  setCoins: (coins: number) => void;
  syncProfile: (profile: { displayName: string; character: string; ownedCharacters: string[]; coins: number }) => void;
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
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    character: user.character,
    ownedCharacters: user.ownedCharacters,
    coins: user.coins,
    isGuest: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStoredAuth);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginRequest(email, password);
    setState({ token: res.token, user: toSessionUser(res.user) });
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await registerRequest(email, password, displayName);
    setState({ token: res.token, user: toSessionUser(res.user) });
  }, []);

  const continueAsGuest = useCallback((displayName: string, character: string = DEFAULT_CHARACTER_ID) => {
    setState({
      token: null,
      user: {
        id: `local-guest-${Date.now()}`,
        displayName,
        character,
        ownedCharacters: ALL_CHARACTER_IDS,
        coins: 0,
        isGuest: true,
      },
    });
  }, []);

  const logout = useCallback(() => setState({ token: null, user: null }), []);

  const updateDisplayName = useCallback((displayName: string) => {
    setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, displayName } } : prev));
  }, []);

  const updateCharacter = useCallback((character: string) => {
    setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, character } } : prev));
  }, []);

  const setCoins = useCallback((coins: number) => {
    setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, coins } } : prev));
  }, []);

  const syncProfile = useCallback(
    (profile: { displayName: string; character: string; ownedCharacters: string[]; coins: number }) => {
      setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, ...profile } } : prev));
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        continueAsGuest,
        logout,
        updateDisplayName,
        updateCharacter,
        setCoins,
        syncProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
