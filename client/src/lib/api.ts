const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.formErrors?.[0] ?? data?.error ?? "Request failed";
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  return data as T;
}

export function registerRequest(email: string, password: string, displayName: string) {
  return postJson<AuthResponse>("/auth/register", { email, password, displayName });
}

export function loginRequest(email: string, password: string) {
  return postJson<AuthResponse>("/auth/login", { email, password });
}
