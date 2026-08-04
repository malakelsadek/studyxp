const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

export function resolveAssetUrl(path: string): string {
  return path.startsWith("http") ? path : `${SERVER_URL}${path}`;
}

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
  maxCapacity: number;
  currentCount: number;
}

export const MAX_ROOM_CAPACITY = 20;

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

export async function uploadRoomBackground(token: string, roomId: string, file: File) {
  const formData = new FormData();
  formData.append("background", file);
  const res = await fetch(`${SERVER_URL}/rooms/${roomId}/background`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handleResponse<{ backgroundUrl: string }>(res);
}

export async function resetRoomBackground(token: string, roomId: string) {
  const res = await fetch(`${SERVER_URL}/rooms/${roomId}/background`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ backgroundUrl: null }>(res);
}

export function changeRoomCapacity(token: string, roomId: string, maxCapacity: number) {
  return patchJson<{ maxCapacity: number }>(`/rooms/${roomId}/capacity`, { maxCapacity }, token);
}

export function changeRoomName(token: string, roomId: string, name: string) {
  return patchJson<{ name: string }>(`/rooms/${roomId}/name`, { name }, token);
}
