const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

export function resolveAssetUrl(path: string): string {
  return path.startsWith("http") ? path : `${SERVER_URL}${path}`;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  character: string;
  ownedCharacters: string[];
  coins: number;
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
  ownedCharacters: string[];
  coins: number;
  tasksCompleted: number;
  createdAt: string;
  stats: UserStats;
}

export interface RoomSummary {
  id: string;
  name: string;
  maxCapacity: number;
  currentCount: number;
  hasPassword: boolean;
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

async function getAuthedJson<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<T>(res);
}

async function deleteJson<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
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
  return postJson<{ coins: number }>("/stats/sessions", session, token);
}

export function listRooms() {
  return getJson<RoomSummary[]>("/rooms");
}

export function changeRoomPassword(
  token: string,
  roomId: string,
  oldPassword: string | undefined,
  newPassword: string,
) {
  return patchJson<{ ok: true; hasPassword: boolean }>(
    `/rooms/${roomId}/password`,
    { oldPassword, newPassword },
    token,
  );
}

export function removeRoomPassword(token: string, roomId: string, password?: string) {
  return deleteJson<{ ok: true; hasPassword: boolean }>(`/rooms/${roomId}/password`, { password }, token);
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

export interface Friend {
  id: string;
  displayName: string;
  character: string;
  roomId: string | null;
  roomName: string | null;
}

export interface FriendRequestEntry {
  id: string;
  createdAt: string;
  user: Friend;
}

export type FriendStatus = "self" | "friends" | "outgoing" | "incoming" | "none";

export function listFriends(token: string) {
  return getAuthedJson<Friend[]>("/friends", token);
}

export function listFriendRequests(token: string) {
  return getAuthedJson<{ incoming: FriendRequestEntry[]; outgoing: FriendRequestEntry[] }>(
    "/friends/requests",
    token,
  );
}

export function sendFriendRequest(token: string, target: { receiverId?: string; email?: string }) {
  return postJson<{ status: "pending" | "friends" }>("/friends/requests", target, token);
}

export function acceptFriendRequest(token: string, requestId: string) {
  return postJson<{ status: "friends" }>(`/friends/requests/${requestId}/accept`, {}, token);
}

export function declineFriendRequest(token: string, requestId: string) {
  return deleteJson<{ ok: true }>(`/friends/requests/${requestId}`, {}, token);
}

export function removeFriend(token: string, friendId: string) {
  return deleteJson<{ ok: true }>(`/friends/${friendId}`, {}, token);
}

export function getFriendStatus(token: string, userId: string) {
  return getAuthedJson<{ status: FriendStatus; requestId?: string }>(`/friends/status/${userId}`, token);
}
