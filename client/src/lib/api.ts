const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  character: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface UserStats {
  totalTodayMs: number;
  totalWeekMs: number;
  totalAllTimeMs: number;
  streak: number;
  heatmap: Array<{ date: string; durationMs: number }>;
}

export interface UserProfile {
  id: string;
  displayName: string;
  bio: string;
  interests: string[];
  character: string;
  createdAt: string;
  stats: UserStats;
}

export interface RoomSummary {
  id: string;
  name: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.formErrors?.[0] ?? data?.error ?? "Request failed";
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  return data as T;
}

async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

async function patchJson<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`);
  return handleResponse<T>(res);
}

export function registerRequest(email: string, password: string, displayName: string) {
  return postJson<AuthResponse>("/auth/register", { email, password, displayName });
}

export function loginRequest(email: string, password: string) {
  return postJson<AuthResponse>("/auth/login", { email, password });
}

export function getProfile(userId: string) {
  return getJson<UserProfile>(`/users/${userId}/profile`);
}

export function updateProfile(
  token: string,
  updates: { displayName?: string; bio?: string; interests?: string[]; character?: string },
) {
  return patchJson<UserProfile>("/users/me", updates, token);
}

export function postStudySession(
  token: string,
  session: { durationMs: number; mode: "pomodoro" | "stopwatch"; roomId: string },
) {
  return postJson<void>("/stats/sessions", session, token);
}

export function listRooms() {
  return getJson<RoomSummary[]>("/rooms");
}

export function changeRoomPassword(
  token: string,
  roomId: string,
  oldPassword: string,
  newPassword: string,
) {
  return patchJson<{ ok: true }>(`/rooms/${roomId}/password`, { oldPassword, newPassword }, token);
}
